import React from 'react';
import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="task-detail" />
      <Stack.Screen name="note-detail" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="live-status" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="about" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
