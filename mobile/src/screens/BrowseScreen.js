import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { supabase } from '../lib/supabase.js'
import { colors, styles } from '../styles/theme.js'

function BrowseScreen({ navigation }) {
  const [booths, setBooths] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadBooths = useCallback(async () => {
    const { data, error: boothsError } = await supabase
      .from('booths')
      .select('id, name, description, owner_name, bio, location, market_type')
      .order('name', { ascending: true })

    if (boothsError) {
      setBooths([])
      setError('We could not load the latest booths right now.')
    } else {
      setBooths(data ?? [])
    }

    setIsLoading(false)
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBooths()
  }, [loadBooths])

  async function refresh() {
    setIsRefreshing(true)
    await loadBooths()
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Walk the market</Text>
        <Text style={styles.title}>Browse open maker booths.</Text>
        <Text style={styles.body}>
          Visit Krafzee booths, read each maker story, and find USA handmade goods as
          sellers add them.
        </Text>
      </View>

      {isLoading && (
        <View style={styles.card}>
          <ActivityIndicator color={colors.blue} />
          <Text style={styles.body}>Gathering the latest maker booths.</Text>
        </View>
      )}

      {!!error && (
        <View style={[styles.notice, styles.errorNotice]}>
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      )}

      {!isLoading && !error && booths.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No booths are open yet</Text>
          <Text style={styles.body}>Check back soon as makers begin setting up their tables.</Text>
        </View>
      )}

      {booths.map((booth) => (
        <Pressable
          key={booth.id}
          style={styles.card}
          onPress={() => navigation.navigate('Booth', { boothId: booth.id })}
        >
          <Text style={styles.cardTitle}>{booth.name}</Text>
          <Text style={styles.body}>{booth.description || 'This booth is getting set up.'}</Text>
          <Text style={styles.eyebrow}>By {booth.owner_name || 'Krafzee seller'}</Text>
          {!!booth.location && <Text style={styles.body}>{booth.location}</Text>}
        </Pressable>
      ))}
    </ScrollView>
  )
}

export default BrowseScreen
