const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin: withLifePilotNativeConfig
 * 
 * Automatically ensures persistent native configurations across `npx expo prebuild --clean`:
 * 1. Patches Podfile post_install to:
 *    - Fix CocoaPods embedded framework signing on Xcode 15/16 (hermesvm.framework code signing).
 *    - Enable LLVM ThinLTO, Dead Code Stripping, and Release Symbol Stripping on iOS for minimal app size.
 * 2. Injects SENTRY_DISABLE_AUTO_UPLOAD into .xcode.env & .xcode.env.local for seamless local development builds.
 * 3. Patches Android gradle.properties to enable R8 code shrinking and resource shrinking in release builds.
 * 4. Patches Android proguard-rules.pro with keep rules for React Native TurboModules, Reanimated, Sentry, and Expo Modules.
 */
const withLifePilotNativeConfig = (config) => {
  // 1. Patch iOS Podfile & Xcode environment
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let content = fs.readFileSync(podfilePath, 'utf8');
        const patchMarker = '# [LifePilot] Patch CocoaPods frameworks script for framework code signing';

        // Update optimization settings in post_install
        const optimizationSettings = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
        if config.name == 'Release'
          config.build_settings['LLVM_LTO'] = 'YES_THIN'
          config.build_settings['DEAD_CODE_STRIPPING'] = 'YES'
          config.build_settings['STRIP_INSTALLED_PRODUCT'] = 'YES'
        end
      end
    end
    installer.aggregate_targets.each do |target|
      target.user_project.targets.each do |user_target|
        user_target.build_configurations.each do |config|
          config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
          if config.name == 'Release'
            config.build_settings['LLVM_LTO'] = 'YES_THIN'
            config.build_settings['DEAD_CODE_STRIPPING'] = 'YES'
            config.build_settings['STRIP_INSTALLED_PRODUCT'] = 'YES'
          end
        end
      end
    end`;

        if (content.includes('installer.pods_project.targets.each do |target|')) {
          content = content.replace(
            /installer\.pods_project\.targets\.each do \|target\|[\s\S]*?installer\.aggregate_targets\.each do \|target\|[\s\S]*?end\s*\n\s*end/,
            optimizationSettings.trim()
          );
        }

        if (!content.includes(patchMarker)) {
          const patchCode = `
    ${patchMarker}
    frameworks_script = File.join(__dir__, 'Pods/Target Support Files/Pods-LifePilot/Pods-LifePilot-frameworks.sh')
    if File.exist?(frameworks_script)
      script_content = File.read(frameworks_script)
      search_pattern = 'if [ -n "\${EXPANDED_CODE_SIGN_IDENTITY:-}"'
      if script_content.include?(search_pattern)
        script_content.gsub!(search_pattern, 'local identity="\${EXPANDED_CODE_SIGN_IDENTITY:-$CODE_SIGN_IDENTITY}"; if [ -n "\${identity:-}" -a "\${identity}" != "-"')
        script_content.gsub!('codesign --force --sign \${EXPANDED_CODE_SIGN_IDENTITY}', 'codesign --force --sign "\${identity}"')
        File.write(frameworks_script, script_content)
      end
    end`;

          content = content.replace(
            /post_install do \|installer\|[\s\S]*?react_native_post_install[\s\S]*?\n\s*\)/,
            (match) => `${match}\n${patchCode}`
          );
        }

        fs.writeFileSync(podfilePath, content, 'utf8');
      }

      // 2. Patch .xcode.env & create .xcode.env.local
      const xcodeEnvPath = path.join(config.modRequest.platformProjectRoot, '.xcode.env');
      if (fs.existsSync(xcodeEnvPath)) {
        let xcodeEnvContent = fs.readFileSync(xcodeEnvPath, 'utf8');
        if (!xcodeEnvContent.includes('SENTRY_DISABLE_AUTO_UPLOAD')) {
          xcodeEnvContent += `\n# For local development without Sentry auth token, skip automatic sourcemap upload during Xcode compilation\nif [ -z "$SENTRY_AUTH_TOKEN" ]; then\n  export SENTRY_DISABLE_AUTO_UPLOAD=true\nfi\n`;
          fs.writeFileSync(xcodeEnvPath, xcodeEnvContent, 'utf8');
        }
      }

      const xcodeEnvLocalPath = path.join(config.modRequest.platformProjectRoot, '.xcode.env.local');
      const xcodeEnvLocalContent = `export NODE_BINARY=$(command -v node)\nexport SENTRY_DISABLE_AUTO_UPLOAD=true\n`;
      fs.writeFileSync(xcodeEnvLocalPath, xcodeEnvLocalContent, 'utf8');

      return config;
    },
  ]);

  // 2. Patch Android gradle.properties & proguard-rules.pro
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlePropertiesPath = path.join(config.modRequest.platformProjectRoot, 'gradle.properties');
      if (fs.existsSync(gradlePropertiesPath)) {
        let content = fs.readFileSync(gradlePropertiesPath, 'utf8');
        let modified = false;

        if (!content.includes('android.enableMinifyInReleaseBuilds')) {
          content += '\n# Enable R8 code shrinking for release builds\nandroid.enableMinifyInReleaseBuilds=true\n';
          modified = true;
        } else if (content.includes('android.enableMinifyInReleaseBuilds=false')) {
          content = content.replace(/android\.enableMinifyInReleaseBuilds\s*=\s*false/g, 'android.enableMinifyInReleaseBuilds=true');
          modified = true;
        }

        if (!content.includes('android.enableShrinkResourcesInReleaseBuilds')) {
          content += '# Enable resource shrinking for release builds\nandroid.enableShrinkResourcesInReleaseBuilds=true\n';
          modified = true;
        } else if (content.includes('android.enableShrinkResourcesInReleaseBuilds=false')) {
          content = content.replace(/android\.enableShrinkResourcesInReleaseBuilds\s*=\s*false/g, 'android.enableShrinkResourcesInReleaseBuilds=true');
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(gradlePropertiesPath, content, 'utf8');
        }
      }

      // 2a. Patch AndroidManifest.xml for strict data protection & cleartext traffic blocking
      const manifestPath = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
      if (fs.existsSync(manifestPath)) {
        let manifestContent = fs.readFileSync(manifestPath, 'utf8');
        let manifestModified = false;

        if (manifestContent.includes('android:allowBackup="true"')) {
          manifestContent = manifestContent.replace('android:allowBackup="true"', 'android:allowBackup="false"');
          manifestModified = true;
        }

        if (!manifestContent.includes('android:usesCleartextTraffic=')) {
          manifestContent = manifestContent.replace(
            /<application\s+/,
            '<application android:usesCleartextTraffic="false" '
          );
          manifestModified = true;
        } else if (manifestContent.includes('android:usesCleartextTraffic="true"')) {
          manifestContent = manifestContent.replace('android:usesCleartextTraffic="true"', 'android:usesCleartextTraffic="false"');
          manifestModified = true;
        }

        if (manifestModified) {
          fs.writeFileSync(manifestPath, manifestContent, 'utf8');
        }
      }

      const proguardRulesPath = path.join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      if (fs.existsSync(proguardRulesPath)) {
        let rulesContent = fs.readFileSync(proguardRulesPath, 'utf8');
        const marker = '# [LifePilot] R8 Optimization & ProGuard Keep Rules';
        if (!rulesContent.includes(marker)) {
          const customRules = `
${marker}
# React Native TurboModules, NativeModules & JNI
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep public class com.facebook.react.bridge.JavaScriptModule { *; }
-keep public class com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * {
    native <methods>;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# React Native Reanimated, Worklets & Gesture Handler
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.horcrux.svg.** { *; }

# Expo Modules & AsyncStorage
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# Sentry React Native
-keepattributes LineNumberTable,SourceFile
-dontwarn io.sentry.**
-keep class io.sentry.** { *; }

# Anti-Reverse Engineering & Class Obfuscation
-allowaccessmodification
-dontusemixedcaseclassnames
-renamesourcefileattribute 'SourceFile'
`;
          rulesContent += customRules;
          fs.writeFileSync(proguardRulesPath, rulesContent, 'utf8');
        }
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withLifePilotNativeConfig;
