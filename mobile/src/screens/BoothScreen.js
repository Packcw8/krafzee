import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { supabase } from '../lib/supabase.js'
import { colors, styles } from '../styles/theme.js'

function money(value) {
  if (value === null || value === undefined || value === '') {
    return 'Price not posted'
  }

  return `$${Number(value).toFixed(2)}`
}

function BoothScreen({ route }) {
  const { boothId } = route.params
  const [booth, setBooth] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState([])
  const [projects, setProjects] = useState([])

  const loadBooth = useCallback(async () => {
    const { data: boothData, error: boothError } = await supabase
      .from('booths')
      .select('id, name, description, owner_name, bio, location, market_type')
      .eq('id', boothId)
      .single()

    if (boothError) {
      setError('We could not open this booth right now.')
      setIsLoading(false)
      return
    }

    const [{ data: listingRows }, { data: projectRows }] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, description, price, image_url, category, item_type, attributes, variants, quantity, processing_time, materials')
        .eq('booth_id', boothId)
        .order('title', { ascending: true }),
      supabase
        .from('projects')
        .select('id, title, description, progress_percent, image_url')
        .eq('booth_id', boothId)
        .order('title', { ascending: true }),
    ])

    setBooth(boothData)
    setListings(listingRows ?? [])
    setProjects(projectRows ?? [])
    setIsLoading(false)
  }, [boothId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBooth()
  }, [loadBooth])

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.blue} />
        <Text style={styles.body}>Opening the booth table.</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Could not open this booth</Text>
        <Text style={styles.body}>{error}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Maker booth</Text>
        <Text style={styles.title}>{booth.name}</Text>
        <Text style={styles.body}>{booth.description || 'This booth is getting set up.'}</Text>
        <Text style={styles.eyebrow}>By {booth.owner_name || 'Krafzee seller'}</Text>
        {!!booth.location && <Text style={styles.body}>{booth.location}</Text>}
      </View>

      {!!booth.bio && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Seller bio</Text>
          <Text style={styles.body}>{booth.bio}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Listings</Text>
        {listings.length === 0 ? (
          <Text style={styles.body}>No products are on this table yet.</Text>
        ) : (
          listings.map((listing) => (
            <View key={listing.id} style={styles.card}>
              <Text style={styles.cardTitle}>{listing.title}</Text>
              <Text style={styles.body}>{listing.description}</Text>
              <Text style={styles.eyebrow}>{money(listing.price)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Project board</Text>
        {projects.length === 0 ? (
          <Text style={styles.body}>No project notes are posted yet.</Text>
        ) : (
          projects.map((project) => (
            <View key={project.id} style={styles.card}>
              <Text style={styles.cardTitle}>{project.title}</Text>
              <Text style={styles.body}>{project.description}</Text>
              <Text style={styles.eyebrow}>{project.progress_percent ?? 0}% complete</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

export default BoothScreen
