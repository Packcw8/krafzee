import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '../lib/supabase.js'
import { colors, styles } from '../styles/theme.js'

function friendlyError(message) {
  if (message?.toLowerCase().includes('rate limit')) {
    return 'Krafzee has sent too many signup emails in a short time. Please wait a few minutes, then try again.'
  }

  return 'Could not create your account. Please check the details and try again.'
}

function SignupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')

  async function signup() {
    setError('')
    setIsSubmitting(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (signupError) {
      setError(friendlyError(signupError.message))
      setIsSubmitting(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName.trim(),
        role: 'buyer',
      })

      if (profileError) {
        setError('Your account was created, but we could not finish your profile yet.')
        setIsSubmitting(false)
        return
      }
    }

    setIsSubmitting(false)
    navigation.navigate('Browse')
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Join the market</Text>
        <Text style={styles.title}>Create a Krafzee account.</Text>
        <Text style={styles.body}>
          Create an account so you can browse the market and open a booth to sell your products.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Display name</Text>
        <TextInput onChangeText={setDisplayName} style={styles.input} value={displayName} />
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

      <Pressable style={[styles.button, styles.primaryButton]} onPress={signup} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Sign up</Text>}
      </Pressable>
    </ScrollView>
  )
}

export default SignupScreen
