import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../lib/supabase.js'
import { colors, styles } from '../styles/theme.js'

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')

  async function login() {
    setError('')
    setIsSubmitting(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setIsSubmitting(false)

    if (loginError) {
      setError('We could not log you in. Please check your email and password.')
      return
    }

    navigation.navigate('Home')
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Welcome back</Text>
        <Text style={styles.title}>Log in to Krafzee.</Text>
        <Text style={styles.body}>Use your account to browse the market and manage your booth.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          style={styles.input}
          value={email}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput onChangeText={setPassword} secureTextEntry style={styles.input} value={password} />
      </View>

      {!!error && (
        <View style={[styles.notice, styles.errorNotice]}>
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      )}

      <Pressable style={[styles.button, styles.primaryButton]} onPress={login} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Log in</Text>}
      </Pressable>

      <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.secondaryButtonText}>Create account</Text>
      </Pressable>
    </ScrollView>
  )
}

export default LoginScreen
