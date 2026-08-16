import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import logo from '../../assets/KrafZeeLogo.png'
import { useAuth } from '../contexts/AuthContext.js'
import { styles } from '../styles/theme.js'

function HomeScreen({ navigation }) {
  const { logout, user } = useAuth()

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.eyebrow}>Modern handmade marketplace</Text>
        <Text style={styles.title}>Discover maker booths with goods worth keeping.</Text>
        <Text style={styles.body}>
          Krafzee is a curated online market for USA hand-crafted products created in the
          USA. Shop booths for clothing, ceramics, textiles, prints, candles,
          woodwork, soaps, jewelry, and original goods made by hand.
        </Text>
        <Pressable style={[styles.button, styles.primaryButton]} onPress={() => navigation.navigate('Browse')}>
          <Text style={styles.buttonText}>Shop handmade booths</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate(user ? 'OpenBooth' : 'Login')}
        >
          <Text style={styles.secondaryButtonText}>Open your booth</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Handmade & Artisan Market</Text>
        <Text style={styles.body}>
          USA hand-crafted products created in the USA. Walk the market, visit maker
          booths, and find original goods with a human touch.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{user ? 'Your account' : 'Join the market'}</Text>
        <Text style={styles.body}>
          {user
            ? 'You are signed in and ready to browse or open your booth.'
            : 'Create an account when you are ready to open a booth and sell your products.'}
        </Text>
        <View style={styles.row}>
          {user ? (
            <Pressable style={[styles.button, styles.dangerButton]} onPress={logout}>
              <Text style={styles.buttonText}>Logout</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={[styles.button, styles.primaryButton]} onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.buttonText}>Create account</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.secondaryButtonText}>Log in</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default HomeScreen
