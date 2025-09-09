import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <StatusBar style="dark" backgroundColor="#F8F9FA" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8F9FA' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Login' }} />
        <Stack.Screen name="home" options={{ title: 'Home' }} />
        <Stack.Screen name="create" options={{ title: 'Registrar Viagem' }} />
      </Stack>
    </LanguageProvider>
  );
}
