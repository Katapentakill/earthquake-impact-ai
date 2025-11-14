import { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ScrollView, ActivityIndicator } from 'react-native';
import { eventsApi } from '@/lib/api';

interface SystemStatus {
  apiConnected: boolean;
  lastUpdate: Date | null;
  totalEvents: number;
  appVersion: string;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const StatusCard = ({ title, items }: { title: string; items: { label: string; value: string }[] }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={styles.cardContent}>
      {items.map((item, index) => (
        <View key={index}>
          <InfoRow label={item.label} value={item.value} />
          {index < items.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  </View>
);

export default function SistemaScreen() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiConnected: false,
    lastUpdate: null,
    totalEvents: 0,
    appVersion: '1.0.0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getEvents({ limit: 1 });

      setSystemStatus({
        apiConnected: true,
        lastUpdate: new Date(),
        totalEvents: response.total,
        appVersion: '1.0.0',
      });
    } catch (err) {
      console.error('Error checking system status:', err);
      setSystemStatus((prev) => ({
        ...prev,
        apiConnected: false,
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No disponible';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* API Status Card */}
        <StatusCard
          title="Estado de API"
          items={[
            {
              label: 'Conexión',
              value: systemStatus.apiConnected ? '🟢 Conectado' : '🔴 Desconectado',
            },
            {
              label: 'Última actualización',
              value: formatDate(systemStatus.lastUpdate),
            },
            {
              label: 'Total de eventos',
              value: systemStatus.totalEvents.toString(),
            },
          ]}
        />

        {/* App Info Card */}
        <StatusCard
          title="Información de la Aplicación"
          items={[
            {
              label: 'Versión',
              value: systemStatus.appVersion,
            },
            {
              label: 'Nombre',
              value: 'Seismic Monitor',
            },
            {
              label: 'Plataforma',
              value: 'React Native / Expo',
            },
          ]}
        />

        {/* Features Card */}
        <StatusCard
          title="Características"
          items={[
            {
              label: '📍 Mapa Interactivo',
              value: 'Visualización en tiempo real',
            },
            {
              label: '🔔 Alertas',
              value: 'Lista de eventos sísmicos',
            },
            {
              label: '📊 Sistema',
              value: 'Estado de la aplicación',
            },
          ]}
        />

        {/* Data Sources Card */}
        <StatusCard
          title="Fuentes de Datos"
          items={[
            {
              label: 'API Backend',
              value: process.env.EXPO_PUBLIC_API_URL || 'http://backend:8000/api',
            },
          ]}
        />
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
});
