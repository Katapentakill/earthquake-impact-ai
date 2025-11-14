import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { eventsApi } from '@/lib/api';
import { SeismicEvent } from '@/lib/types';

const EventCard = ({ event }: { event: SeismicEvent }) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getMagnitudeColor = (magnitude: number): string => {
    if (magnitude < 4.5) return '#3498db';
    if (magnitude < 5.5) return '#f1c40f';
    if (magnitude < 6.5) return '#e67e22';
    return '#e74c3c';
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[styles.magnitudeBadge, { backgroundColor: getMagnitudeColor(event.magnitud) }]}
        >
          <Text style={styles.magnitudeText}>{event.magnitud}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.lugar} numberOfLines={1}>
            {event.lugar}
          </Text>
          <Text style={styles.fecha}>{formatDate(event.fecha_utc)}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Profundidad:</Text>
          <Text style={styles.value}>{event.profundidad_km} km</Text>
        </View>
        {event.radio_afectacion_km && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Radio de afectación:</Text>
            <Text style={styles.value}>{event.radio_afectacion_km} km</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Fuente:</Text>
          <Text style={styles.value}>{event.fuente_api}</Text>
        </View>
      </View>
    </View>
  );
};

export default function AlertasScreen() {
  const [events, setEvents] = useState<SeismicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getEvents({ limit: 50 });
      // Sort by date, most recent first
      const sorted = response.events.sort(
        (a, b) => new Date(b.fecha_utc).getTime() - new Date(a.fecha_utc).getTime()
      );
      setEvents(sorted);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.event_id}
        renderItem={({ item }) => <EventCard event={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No hay eventos sísmicos</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  magnitudeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  magnitudeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  lugar: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cardDetails: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
