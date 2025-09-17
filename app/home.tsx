import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, StatusBar as RNStatusBar, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import LoadCard, { LoadItem } from '../components/LoadCard';
import LoadDetailsModal from '../components/LoadDetailsModal';
import { useLanguage } from '../contexts/LanguageContext';
import { homeI18n } from '../i18n/home';

const PRIMARY = '#0052CC';
const BG = '#F8F9FA';
const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const SUCCESS = '#28A745';
const WARNING = '#FFC107';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;

const SAMPLE_LOADS: LoadItem[] = [
  { id: 'LD-2024-0001', date: '2024-11-01', time: '08:40', truck: 'Caminhão 001', driver: 'João Silva', company: 'Empresa A', field: 'Campo Norte', variety: 'Soja', deliveryLocation: 'Porto Santos', status: 'sincronizado' },
  { id: 'LD-2024-0002', date: '2024-11-01', time: '10:05', truck: 'Caminhão 002', driver: 'Maria Santos', company: 'Empresa B', field: 'Campo Sul', variety: 'Milho', deliveryLocation: 'Silo Central', status: 'pendente' },
  { id: 'LD-2024-0003', date: '2024-11-02', time: '07:20', truck: 'Caminhão 003', driver: 'Pedro Costa', company: 'Empresa C', field: 'Campo Leste', variety: 'Trigo', deliveryLocation: 'Fábrica ABC', status: 'sincronizado' },
];

export default function HomeScreen() {
  const { language } = useLanguage();
  const t = homeI18n[language];

  const [pending, setPending] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedLoad, setSelectedLoad] = useState<LoadItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const syncColor = useMemo(() => (pending === 0 ? SUCCESS : WARNING), [pending]);
  const syncText = useMemo(() => (pending === 0 ? t.allSynced : `${pending} ${t.pending}`), [pending, t]);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setPending(0);
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
            <Ionicons name={pending === 0 ? 'checkmark-circle' : 'alert-circle'} size={22} color={syncColor} />
          </View>
          <Text style={[styles.syncMessage, { color: syncColor }]}>{syncText}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/create')}
          style={styles.createButton}
        >
          <Ionicons name="add-circle" size={22} color="#FFFFFF" />
          <Text style={styles.createButtonText}>{t.createEntry}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t.recentLoads}</Text>
        <FlatList
          data={SAMPLE_LOADS}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <LoadCard item={item} onPress={(load) => { setSelectedLoad(load); setDetailsVisible(true); }} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 80 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <LoadDetailsModal
        visible={detailsVisible}
        item={selectedLoad}
        onClose={() => setDetailsVisible(false)}
      />
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  welcome: { color: TEXT, fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  syncCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 16, ...CARD_SHADOW },
  syncCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  syncCardTitle: { color: TEXT, fontSize: 16, fontWeight: 'bold' },
  syncMessage: { fontSize: 14, marginBottom: 12 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  createButton: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, ...CARD_SHADOW },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
