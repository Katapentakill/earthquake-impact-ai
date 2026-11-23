// Mapa nativo (Android e iOS) con react-native-maps. En la web se usa SeismicMap.web.tsx, porque esa librería no existe allí.
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { ESCALA_MAGNITUD } from '@/constants/paleta';
import { useTema } from '@/lib/ajustes';
import { nivelMagnitud } from '@/lib/seismic';
import type { SeismicEvent } from '@/lib/types';

export interface PropsMapa {
  eventos: SeismicEvent[];
  elegido: string | null;
  onElegir: (id: string) => void;
}

const MUNDO: Region = { latitude: 10, longitude: 0, latitudeDelta: 110, longitudeDelta: 110 };

export function SeismicMap({ eventos, elegido, onElegir }: PropsMapa) {
  const p = useTema();
  const mapa = useRef<MapView>(null);
  // Los más grandes se dibujan al final para que queden encima de los pequeños.
  const ordenados = useMemo(() => [...eventos].sort((a, b) => a.magnitud - b.magnitud), [eventos]);

  useEffect(() => {
    const e = eventos.find((x) => x.event_id === elegido);
    if (e) mapa.current?.animateToRegion({ latitude: e.latitud, longitude: e.longitud, latitudeDelta: 14, longitudeDelta: 14 }, 600);
    // Solo debe moverse cuando cambia el sismo elegido, no cada vez que llegan datos nuevos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elegido]);

  return (
    <MapView ref={mapa} style={StyleSheet.absoluteFill} initialRegion={MUNDO} userInterfaceStyle={p.nombre === 'oscuro' ? 'dark' : 'light'} toolbarEnabled={false} rotateEnabled={false}>
      {ordenados.map((e) => (
        <Marker
          key={e.event_id}
          coordinate={{ latitude: e.latitud, longitude: e.longitud }}
          pinColor={ESCALA_MAGNITUD[nivelMagnitud(e.magnitud)].fondo}
          tracksViewChanges={false}
          zIndex={e.event_id === elegido ? 10000 : Math.round(e.magnitud * 10)}
          onPress={() => onElegir(e.event_id)}
        />
      ))}
    </MapView>
  );
}
