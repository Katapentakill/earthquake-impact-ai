import MapView, { Marker } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import { SeismicEvent } from '@/lib/types';

interface SeismicMapProps {
  events: SeismicEvent[];
  onMarkerPress?: (event: SeismicEvent) => void;
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 4.5) return '#3498db'; // Blue - Minor
  if (magnitude < 5.5) return '#f1c40f'; // Yellow - Moderate
  if (magnitude < 6.5) return '#e67e22'; // Orange - High
  return '#e74c3c'; // Red - Severe/Catastrophic
};

export const SeismicMap: React.FC<SeismicMapProps> = ({ events, onMarkerPress }) => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 20,
          longitude: -100,
          latitudeDelta: 8,
          longitudeDelta: 8,
        }}
      >
        {events.map((event) => {
          const color = getMagnitudeColor(event.magnitud);

          return (
            <Marker
              key={event.event_id}
              coordinate={{
                latitude: event.latitud,
                longitude: event.longitud,
              }}
              title={event.lugar}
              description={`Magnitud: ${event.magnitud} | Profundidad: ${event.profundidad_km}km`}
              onPress={() => onMarkerPress?.(event)}
              pinColor={color}
            />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
