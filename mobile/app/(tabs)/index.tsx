import { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { SeismicMap } from '@/components/SeismicMap';
import { eventsApi } from '@/lib/api';
import { SeismicEvent } from '@/lib/types';

export default function MapScreen() {
  const [events, setEvents] = useState<SeismicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsApi.getEvents({ limit: 100 });
      setEvents(response.events);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load seismic events');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (event: SeismicEvent) => {
    console.log('Marker pressed:', event);
    // TODO: Navigate to event details
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          {/* Error state - can be enhanced with retry button */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SeismicMap events={events} onMarkerPress={handleMarkerPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
