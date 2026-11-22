import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/auth/SplashScreen';
import AppBackground from './src/components/AppBackground';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./src/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
  });

  if (fontError) {
    throw fontError;
  }

  return (
    <SafeAreaProvider>
      <AppBackground>
        {fontsLoaded ? (
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        ) : <SplashScreen />}
      </AppBackground>
    </SafeAreaProvider>
  );
}