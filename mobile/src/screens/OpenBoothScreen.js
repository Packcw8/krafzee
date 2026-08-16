import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useAuth } from '../contexts/AuthContext.js'
import { supabase } from '../lib/supabase.js'
import { colors, styles } from '../styles/theme.js'

function OpenBoothScreen({ navigation }) {
  const { refreshProfile, user } = useAuth()
  const [agreement, setAgreement] = useState(false)
  const [bio, setBio] = useState('')
  const [boothDescription, setBoothDescription] = useState('')
  const [boothName, setBoothName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState('')
  const [success, setSuccess] = useState('')

  async function openBooth() {
    if (!user) {
      navigation.navigate('Login')
      return
    }

    if (!agreement) {
      setError('Please agree to the Krafzee marketplace rules before opening your booth.')
      return
    }

    setError('')
    setSuccess('')
    setIsSubmitting(true)

    const location = [city.trim(), state.trim()].filter(Boolean).join(', ')
    const ownerName = user.email?.split('@')[0] || 'Krafzee seller'

    const { error: boothError } = await supabase.from('booths').upsert(
      {
        owner_id: user.id,
        name: boothName.trim(),
        description: boothDescription.trim(),
        owner_name: ownerName,
        bio: bio.trim(),
        location,
        market_type: 'handmade',
      },
      { onConflict: 'owner_id' },
    )

    if (boothError) {
      setError('We could not save your booth yet. Please check the details and try again.')
      setIsSubmitting(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', user.id)

    if (profileError) {
      setError('Your booth was saved, but we could not finish updating your seller access.')
      setIsSubmitting(false)
      return
    }

    await refreshProfile()
    setSuccess('Your booth is open. Add products and projects from the web dashboard next.')
    setIsSubmitting(false)
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Open your booth</Text>
        <Text style={styles.title}>Start with a simple booth.</Text>
        <Text style={styles.body}>Add products, projects, and payment setup later.</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Booth name</Text>
        <TextInput onChangeText={setBoothName} style={styles.input} value={boothName} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Booth description</Text>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setBoothDescription}
          style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]}
          value={boothDescription}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Seller bio</Text>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setBio}
          style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]}
          value={bio}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, minWidth: 140 }]}>
          <Text style={styles.label}>City</Text>
          <TextInput onChangeText={setCity} style={styles.input} value={city} />
        </View>
        <View style={[styles.field, { flex: 1, minWidth: 100 }]}>
          <Text style={styles.label}>State</Text>
          <TextInput autoCapitalize="characters" onChangeText={setState} style={styles.input} value={state} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Handmade & Artisan Market</Text>
        <Text style={styles.body}>USA hand-crafted products created in the USA.</Text>
      </View>

      <Pressable
        style={[styles.card, agreement && styles.successNotice]}
        onPress={() => setAgreement((current) => !current)}
      >
        <Text style={styles.cardTitle}>{agreement ? 'Agreed' : 'Tap to agree'}</Text>
        <Text style={styles.body}>
          I agree to list items honestly, follow Krafzee marketplace rules, and only sell
          items I am legally allowed to sell.
        </Text>
      </Pressable>

      {!!error && (
        <View style={[styles.notice, styles.errorNotice]}>
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      )}

      {!!success && (
        <View style={[styles.notice, styles.successNotice]}>
          <Text style={styles.noticeText}>{success}</Text>
        </View>
      )}

      <Pressable style={[styles.button, styles.primaryButton]} onPress={openBooth} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Open my booth</Text>
        )}
      </Pressable>

      {!!success && (
        <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('Browse')}>
          <Text style={styles.secondaryButtonText}>Browse booths</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

export default OpenBoothScreen
