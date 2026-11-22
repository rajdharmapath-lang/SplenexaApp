import MainTabs from './MainTabs';
import AuthStack from './AuthStack';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import { useAuth } from '../hooks/useAuth';

export default function AppNavigator({ onNotificationPress }) {
  const { session, profile, isInitializing, completeProfile, signOut } = useAuth();

  if (isInitializing) {
    return <SplashScreen />;
  }

  if (!session) {
    return <AuthStack />;
  }

  if (!profile?.profile_completed) {
    return (
      <ProfileSetupScreen
        onBack={signOut}
        onComplete={completeProfile}
      />
    );
  }

  return (
    <MainTabs
      userName={profile.name || ''}
      phoneNumber={profile.dialCode && profile.phone ? `+${profile.dialCode}${profile.phone}` : ''}
      userState={profile.state || ''}
      batchYear={profile.batchYear ? String(profile.batchYear) : ''}
      onNotificationPress={onNotificationPress}
      onSignOut={signOut}
    />
  );
}
