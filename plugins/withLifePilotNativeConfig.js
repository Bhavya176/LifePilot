const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin: withLifePilotNativeConfig
 * 
 * Automatically ensures persistent native configurations across `npx expo prebuild --clean`:
 * 1. Patches Podfile post_install to fix CocoaPods embedded framework signing on Xcode 15/16 (hermesvm.framework code signing).
 * 2. Injects SENTRY_DISABLE_AUTO_UPLOAD into .xcode.env & .xcode.env.local for seamless local development builds without requiring Sentry Auth Token.
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

        if (!content.includes(patchMarker)) {
          const patchCode = `
    ${patchMarker}
    frameworks_script = File.join(__dir__, 'Pods/Target Support Files/Pods-LifePilot/Pods-LifePilot-frameworks.sh')
    if File.exist?(frameworks_script)
      content = File.read(frameworks_script)
      if content.include?('[ -n "#{EXPANDED_CODE_SIGN_IDENTITY:-}"')
        content.gsub!('[ -n "#{EXPANDED_CODE_SIGN_IDENTITY:-}"', 'local identity="#{EXPANDED_CODE_SIGN_IDENTITY:-$CODE_SIGN_IDENTITY}"; if [ -n "#{identity:-}"')
        content.gsub!('codesign --force --sign #{EXPANDED_CODE_SIGN_IDENTITY}', 'codesign --force --sign "#{identity}"')
        File.write(frameworks_script, content)
      end
    end`;

          content = content.replace(
            /post_install do \|installer\|[\s\S]*?react_native_post_install[\s\S]*?\n\s*\)/,
            (match) => `${match}\n${patchCode}`
          );

          fs.writeFileSync(podfilePath, content, 'utf8');
        }
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

  return config;
};

module.exports = withLifePilotNativeConfig;
