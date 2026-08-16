import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { AuthProvider, useAuth } from './src/contexts/AuthContext.js'
import BoothScreen from './src/screens/BoothScreen.js'
import BrowseScreen from './src/screens/BrowseScreen.js'
import HomeScreen from './src/screens/HomeScreen.js'
import LoginScreen from './src/screens/LoginScreen.js'
import OpenBoothScreen from './src/screens/OpenBoothScreen.js'
import SignupScreen from './src/screens/SignupScreen.js'
import { colors, styles } from './src/styles/theme.js'

const Stack = createNativeStackNavigator()

function AppNavigator() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: colors.canvas },
          headerStyle: { backgroundColor: colors.white },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '800' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Krafzee' }} />
        <Stack.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse Booths' }} />
        <Stack.Screen name="Booth" component={BoothScreen} options={{ title: 'Booth' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen
          name="OpenBooth"
          component={OpenBoothScreen}
          options={{ title: 'Open Your Booth' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  )
}
