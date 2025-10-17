import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, StatusBar as RNStatusBar, FlatList, Alert, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import LoadCard, { LoadItem } from '../components/LoadCard';
import LoadDetailsModal from '../components/LoadDetailsModal';
import ProtectedRoute from '../components/ProtectedRoute';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { homeI18n } from '../i18n/home';
import { commonI18n } from '../i18n/common';
import { syncService } from '../services/syncService';
import { LocalTruckLoad } from '../services/localDatabaseService';

const PRIMARY = '#0052CC';
const BG = '#F8F9FA';
const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const SUCCESS = '#28A745';
const WARNING = '#FFC107';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;

export default function HomeScreen() {
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const t = homeI18n[language];
  const commonT = commonI18n[language];

  const [truckLoads, setTruckLoads] = useState<LoadItem[]>([]);
  const [pending, setPending] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedLoad, setSelectedLoad] = useState<LoadItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Função para converter LocalTruckLoad para LoadItem
  const convertToLoadItem = (localLoad: LocalTruckLoad): LoadItem => {
    console.log('🔍 Convertendo dados:', {
      id: localLoad.id,
      reg_date: localLoad.reg_date,
      reg_time: localLoad.reg_time,
      truck: localLoad.truck
    });

    // Converter data de YYYY-MM-DD para DD/MM/YYYY
    const formatDateForDisplay = (dateString: string): string => {
      if (!dateString || dateString === 'undefined' || dateString === 'null') {
        console.log('⚠️ Data inválida:', dateString);
        return 'Data não informada';
      }
      try {
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) {
          console.log('⚠️ Formato de data inválido:', dateString);
          return 'Data inválida';
        }
        return `${day}/${month}/${year}`;
      } catch (error) {
        console.log('❌ Erro ao formatar data:', error, 'Data original:', dateString);
        return dateString;
      }
    };

    // Converter hora de HH:mm:ss para HH:mm
    const formatTimeForDisplay = (timeString: string): string => {
      if (!timeString || timeString === 'undefined' || timeString === 'null') {
        console.log('⚠️ Hora inválida:', timeString);
        return 'Hora não informada';
      }
      try {
        return timeString.substring(0, 5); // Remove os segundos
      } catch (error) {
        console.log('❌ Erro ao formatar hora:', error, 'Hora original:', timeString);
        return timeString;
      }
    };

    const convertedItem = {
      id: localLoad.id,
      date: formatDateForDisplay(localLoad.reg_date),
      time: formatTimeForDisplay(localLoad.reg_time),
      truck: localLoad.othertruck || localLoad.truck,
      othertruck: localLoad.othertruck || undefined,
      driver: localLoad.otherdriver || localLoad.driver,
      otherdriver: localLoad.otherdriver || undefined,
      company: localLoad.otherfarm || localLoad.farm,
      otherfarm: localLoad.otherfarm || undefined,
      field: localLoad.otherfield || localLoad.field,
      otherfield: localLoad.otherfield || undefined,
      variety: localLoad.othervariety || localLoad.variety,
      othervariety: localLoad.othervariety || undefined,
      deliveryLocation: localLoad.otherdestination || localLoad.destination,
      otherdestination: localLoad.otherdestination || undefined,
      agreement: localLoad.otheragreement || localLoad.agreement,
      otheragreement: localLoad.otheragreement || undefined,
      notes: localLoad.dnote || undefined,
      status: localLoad.status === 'synced' ? 'sincronizado' : 'pendente',
      created_at: localLoad.created_at,
      synced_at: localLoad.synced_at
    };

    console.log('✅ Item convertido:', {
      id: convertedItem.id,
      date: convertedItem.date,
      time: convertedItem.time,
      truck: convertedItem.truck
    });

    return convertedItem;
  };

  const syncColor = useMemo(() => (pending === 0 ? SUCCESS : WARNING), [pending]);
  const syncText = useMemo(() => (pending === 0 ? t.allSynced : `${pending} ${t.pending}`), [pending, t]);

  // Carregar dados do banco local
  const loadTruckLoads = async () => {
    try {
      setIsLoading(true);
      const localLoads = await syncService.getAllTruckLoads();
      const convertedLoads = localLoads.map(convertToLoadItem);
      setTruckLoads(convertedLoads);
      
      // Atualizar contador de pendentes
      const stats = await syncService.getStats();
      setPending(stats.pending);
    } catch (error) {
      // Erro ao carregar carregamentos
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados quando a tela é montada
  useEffect(() => {
    loadTruckLoads();
  }, []);

  // Interceptar botão físico de voltar do Android
  useEffect(() => {
    const backAction = () => {
      // Mostrar confirmação de logout
      Alert.alert(
        commonT.confirmLogout,
        commonT.confirmLogoutMessage,
        [
          {
            text: commonT.cancel,
            style: 'cancel',
          },
          {
            text: commonT.logout,
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/');
            },
          },
        ]
      );
      return true; // Previne o comportamento padrão de voltar
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [commonT, logout]);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncService.syncAllPendingLoads();
      
      console.log(`🔍 DEBUG - Resultado da sincronização:`, result);
      console.log(`🔍 DEBUG - Mensagem que será exibida: "${result.message}"`);
      
      if (result.success) {
        Alert.alert(commonT.success, result.message);
        // Recarregar dados após sincronização
        await loadTruckLoads();
      } else {
        Alert.alert(commonT.error, result.message);
      }
    } catch (error) {
      // Erro na sincronização
      Alert.alert(commonT.error, commonT.syncError);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      commonT.confirmLogout,
      commonT.confirmLogoutMessage,
      [
        {
          text: commonT.cancel,
          style: 'cancel',
        },
        {
          text: commonT.logout,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleBackPress = () => {
    Alert.alert(
      commonT.confirmLogout,
      commonT.confirmLogoutMessage,
      [
        {
          text: commonT.cancel,
          style: 'cancel',
        },
        {
          text: commonT.logout,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <AppHeader 
          projectName="MTFA" 
          showBack={true}
          showSync={true}
          isSyncing={isSyncing}
          onSyncPress={handleSyncNow}
          onLogoutPress={handleLogout}
          onBackPress={handleBackPress}
        />

        <View style={styles.content}>
          <Text style={styles.welcome}>
            {t.welcome.replace('{user}', user?.name || user?.email || 'Usuário')}
          </Text>

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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.loadingLoads}</Text>
          </View>
        ) : truckLoads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color={TEXT_SECONDARY} />
            <Text style={styles.emptyText}>{t.noLoadsFound}</Text>
            <Text style={styles.emptySubtext}>{t.createFirstLoad}</Text>
          </View>
        ) : (
          <FlatList
            data={truckLoads}
            keyExtractor={(item) => item.id}
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
    </ProtectedRoute>
  );
}

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const TEXT_SECONDARY = '#6C757D';

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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: TEXT_SECONDARY, fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: TEXT, fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtext: { color: TEXT_SECONDARY, fontSize: 14, textAlign: 'center' },
});
