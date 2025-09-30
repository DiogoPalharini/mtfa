import React, { useMemo, useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Platform, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import LoadCard, { LoadItem } from '../../components/LoadCard';
import LoadDetailsModal from '../../components/LoadDetailsModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { homeI18n } from '../../i18n/home';
import { styles, colors } from './styles';
import { useDatabase } from '../../hooks/useDatabase';
import { useTripsContext } from '../../contexts/TripsContext';
import { Trip } from '../../database';

const { SUCCESS, WARNING } = colors;

export default function HomeScreen() {
  const { language } = useLanguage();
  const t = homeI18n[language];

  const { isInitialized, isLoading: dbLoading } = useDatabase();
  const { trips, isLoading: tripsLoading, loadTrips } = useTripsContext();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedLoad, setSelectedLoad] = useState<LoadItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  // Converter trips do banco para LoadItem
  const loadItems: LoadItem[] = useMemo(() => {
    return trips.map((trip: Trip, index: number) => ({
      id: `LD-${trip.id}`,
      date: trip.date,
      time: trip.time,
      truck: trip.truck,
      driver: trip.driver,
      company: trip.company,
      field: trip.field,
      variety: trip.variety,
      deliveryLocation: trip.deliveryLocation,
      status: 'sincronizado' as const, // Por enquanto todas são sincronizadas
    }));
  }, [trips]);

  // Calcular pendências baseado nas viagens
  const pendingCount = useMemo(() => {
    return loadItems.filter(item => item.status === 'pendente').length;
  }, [loadItems]);

  const syncColor = useMemo(() => (pendingCount === 0 ? SUCCESS : WARNING), [pendingCount]);
  const syncText = useMemo(() => (pendingCount === 0 ? t.allSynced : `${pendingCount} ${t.pending}`), [pendingCount, t]);

  // Carregar viagens quando o banco estiver inicializado
  useEffect(() => {
    if (isInitialized) {
      loadTrips();
    }
  }, [isInitialized, loadTrips]);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    // Simular sincronização
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        projectName="MTFA" 
        showSync={true}
        isSyncing={isSyncing}
        onSyncPress={handleSyncNow}
      />

      <View style={styles.content}>
        <Text style={styles.welcome}>{t.welcome}</Text>

        <View style={styles.syncCard}>
          <View style={styles.syncCardHeader}>
            <Text style={styles.syncCardTitle}>{t.syncStatusTitle}</Text>
            <Ionicons name={pendingCount === 0 ? 'checkmark-circle' : 'alert-circle'} size={22} color={syncColor} />
          </View>
          <Text style={[styles.syncMessage, { color: syncColor }]}>{syncText}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/createLoading/create')}
          style={styles.createButton}
        >
          <Ionicons name="add-circle" size={22} color="#FFFFFF" />
          <Text style={styles.createButtonText}>{t.createEntry}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t.recentLoads}</Text>
        {dbLoading || tripsLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.TEXT, fontSize: 16 }}>Carregando viagens...</Text>
          </View>
        ) : loadItems.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.TEXT, fontSize: 16, textAlign: 'center' }}>
              Nenhuma viagem encontrada.{'\n'}Crie uma nova viagem usando o botão acima.
            </Text>
          </View>
        ) : (
          <FlatList
            data={loadItems}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <LoadCard item={item} onPress={(load) => { setSelectedLoad(load); setDetailsVisible(true); }} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 80 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <LoadDetailsModal
        visible={detailsVisible}
        item={selectedLoad}
        onClose={() => setDetailsVisible(false)}
      />
    </View>
  );
}

