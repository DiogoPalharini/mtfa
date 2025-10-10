import React, { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar as RNStatusBar, Animated, Dimensions, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ProtectedRoute from '../components/ProtectedRoute';
import AddNewItemCard from '../components/AddNewItemCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { createI18n } from '../i18n/create';
import { commonI18n } from '../i18n/common';
import { syncService } from '../services/syncService';
import { TruckLoadFormData } from '../services/addTruckService';

const PRIMARY = '#0052CC';
const BG = '#F8F9FA';
const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;
const { height: screenHeight } = Dimensions.get('window');
const ROW_HEIGHT = 44;

interface FormData {
  reg_date: string;
  reg_time: string;
  truck: string;
  othertruck: string;
  farm: string;
  otherfarm: string;
  field: string;
  otherfield: string;
  variety: string;
  othervariety: string;
  driver: string;
  otherdriver: string;
  destination: string;
  otherdestination: string;
  dnote: string;
  agreement: string;
  otheragreement: string;
}

// Interface para os dados dos dropdowns
interface DropdownData {
  trucks: string[];
  farms: string[];
  fields: string[];
  varieties: string[];
  drivers: string[];
  destinations: string[];
  agreements: string[];
}

// Função para carregar dados dos dropdowns do banco local
  const fetchDropdownData = async (): Promise<DropdownData> => {
    try {
      // Buscar dados do banco local
      const localData = await syncService.getAllDropdownData();
      
      // Garantir que todos os campos existam (mapeando tipos singulares para plurais)
      const dropdownData: DropdownData = {
        trucks: localData.truck || [],
        farms: localData.farm || [],
        fields: localData.field || [],
        varieties: localData.variety || [],
        drivers: localData.driver || [],
        destinations: localData.destination || [],
        agreements: localData.agreement || [],
      };
      
      
      return dropdownData;
    } catch (error) {
      console.error('❌ Erro ao carregar dados de dropdown:', error);
      // Retornar arrays vazios em caso de erro
      return {
        trucks: [],
        farms: [],
        fields: [],
        varieties: [],
        drivers: [],
        destinations: [],
        agreements: [],
      };
    }
  };

export default function CreateTripScreen() {
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const t = createI18n[language];
  const commonT = commonI18n[language];
  
  const now = useMemo(() => new Date(), []);
  const [formData, setFormData] = useState<FormData>({
    reg_date: now.toLocaleDateString('pt-BR'),
    reg_time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    truck: '',
    othertruck: '',
    farm: '',
    otherfarm: '',
    field: '',
    otherfield: '',
    variety: '',
    othervariety: '',
    driver: '',
    otherdriver: '',
    destination: '',
    otherdestination: '',
    dnote: '',
    agreement: '',
    otheragreement: '',
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modais de seleção de Data e Hora
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);


  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [selectedHour, setSelectedHour] = useState<number>(now.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(now.getMinutes());
  const [selectedSecond, setSelectedSecond] = useState<number>(now.getSeconds());

  // Refs para scroll programático nos modais
  const dayRef = useRef<ScrollView | null>(null);
  const monthRef = useRef<ScrollView | null>(null);
  const yearRef = useRef<ScrollView | null>(null);
  const hourRef = useRef<ScrollView | null>(null);
  const minuteRef = useRef<ScrollView | null>(null);
  const secondRef = useRef<ScrollView | null>(null);

  const scrollToCenter = (ref: React.RefObject<ScrollView | null>, index: number, listLength: number) => {
    const visibleCount = 5; // aproximadamente
    const offset = Math.max(0, index * ROW_HEIGHT - ((visibleCount - 1) / 2) * ROW_HEIGHT);
    ref.current?.scrollTo({ y: offset, animated: false });
  };

  useEffect(() => {
    if (dateModalVisible) {
      // Centralizar dia/mês/ano atuais
      setTimeout(() => {
        scrollToCenter(dayRef, selectedDay - 1, 31);
        scrollToCenter(monthRef, selectedMonth - 1, 12);
        const baseYear = now.getFullYear() - 3;
        scrollToCenter(yearRef, selectedYear - baseYear, 7);
      }, 0);
    }
  }, [dateModalVisible]);

  useEffect(() => {
    if (timeModalVisible) {
      setTimeout(() => {
        scrollToCenter(hourRef, selectedHour, 24);
        scrollToCenter(minuteRef, selectedMinute, 60);
        scrollToCenter(secondRef, selectedSecond, 60);
      }, 0);
    }
  }, [timeModalVisible]);

  // Carregar dados dos dropdowns e atualizar data/hora ao abrir a tela
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchDropdownData();
        setDropdownData(data);
        
        // Atualizar data e hora com valores atuais
        const currentDate = new Date();
        setFormData(prev => ({
          ...prev,
          reg_date: currentDate.toLocaleDateString('pt-BR'),
          reg_time: currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
      } catch (error) {
        // Erro ao carregar dados
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatTwo = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const applyDate = () => {
    const dateString = `${formatTwo(selectedDay)}/${formatTwo(selectedMonth)}/${selectedYear}`;
    setFormData(prev => ({ ...prev, reg_date: dateString }));
    setDateModalVisible(false);
  };
  const applyTime = () => {
    const timeString = `${formatTwo(selectedHour)}:${formatTwo(selectedMinute)}:${formatTwo(selectedSecond)}`;
    setFormData(prev => ({ ...prev, reg_time: timeString }));
    setTimeModalVisible(false);
  };
  const useNowDate = () => {
    const d = new Date();
    setSelectedDay(d.getDate());
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(d.getFullYear());
    setFormData(prev => ({ ...prev, reg_date: d.toLocaleDateString('pt-BR') }));
  };
  const useNowTime = () => {
    const d = new Date();
    setSelectedHour(d.getHours());
    setSelectedMinute(d.getMinutes());
    setSelectedSecond(d.getSeconds());
    setFormData(prev => ({ ...prev, reg_time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }));
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
  };

  // Função para converter data do formato DD/MM/AAAA para AAAA-MM-DD
  const formatDateForBackend = (dateString: string): string => {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Função para converter hora do formato HH:MM:SS para HH:mm:ss (garantir formato correto)
  const formatTimeForBackend = (timeString: string): string => {
    // Remove espaços e garante formato HH:mm:ss
    return timeString.replace(/\s/g, '').replace(/:/g, ':');
  };

  // Função para processar campos dropdown com lógica "other"
  const processDropdownField = (
    selectedValue: string,
    otherValue: string,
    dropdownOptions: string[]
  ): { mainField: string; otherField: string } => {
    // Garantir que dropdownOptions seja um array válido
    const options = Array.isArray(dropdownOptions) ? dropdownOptions : [];
    
    // Se o valor selecionado existe na lista de opções do dropdown
    if (options.includes(selectedValue)) {
      return {
        mainField: selectedValue,
        otherField: ''
      };
    } else {
      // Se é um valor customizado (não existe na lista)
      return {
        mainField: 'other',
        otherField: selectedValue
      };
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      closeAllDropdowns();

      // Verificar se dropdownData está disponível
      if (!dropdownData) {
        Alert.alert(commonT.error, commonT.dataLoadError);
        return;
      }


      // Processar campos dropdown com lógica "other"
      const truckData = processDropdownField(formData.truck, formData.othertruck, dropdownData.trucks);
      const farmData = processDropdownField(formData.farm, formData.otherfarm, dropdownData.farms);
      const fieldData = processDropdownField(formData.field, formData.otherfield, dropdownData.fields);
      const varietyData = processDropdownField(formData.variety, formData.othervariety, dropdownData.varieties);
      const driverData = processDropdownField(formData.driver, formData.otherdriver, dropdownData.drivers);
      const destinationData = processDropdownField(formData.destination, formData.otherdestination, dropdownData.destinations);
      const agreementData = processDropdownField(formData.agreement, formData.otheragreement, dropdownData.agreements);


      // SALVAR AUTOMATICAMENTE TODOS OS ITENS DOS SELECTS USADOS
      
      const itemsToSave = [
        // Salvar valores principais se não forem "other" (usando tipos singulares)
        { type: 'truck', value: truckData.mainField !== 'other' ? truckData.mainField : null },
        { type: 'farm', value: farmData.mainField !== 'other' ? farmData.mainField : null },
        { type: 'field', value: fieldData.mainField !== 'other' ? fieldData.mainField : null },
        { type: 'variety', value: varietyData.mainField !== 'other' ? varietyData.mainField : null },
        { type: 'driver', value: driverData.mainField !== 'other' ? driverData.mainField : null },
        { type: 'destination', value: destinationData.mainField !== 'other' ? destinationData.mainField : null },
        { type: 'agreement', value: agreementData.mainField !== 'other' ? agreementData.mainField : null },
        
        // Salvar valores "other" (customizados) - usando tipos singulares
        { type: 'truck', value: truckData.otherField || null },
        { type: 'farm', value: farmData.otherField || null },
        { type: 'field', value: fieldData.otherField || null },
        { type: 'variety', value: varietyData.otherField || null },
        { type: 'driver', value: driverData.otherField || null },
        { type: 'destination', value: destinationData.otherField || null },
        { type: 'agreement', value: agreementData.otherField || null },
      ];

      // Filtrar apenas valores válidos e salvar
      
      for (const item of itemsToSave) {
        if (item.value && item.value.trim()) {
          const saved = await syncService.saveDropdownData(item.type, item.value.trim());
        } else {
        }
      }
      

      // ATUALIZAR ESTADO LOCAL DOS DROPDOWNS COM OS NOVOS ITENS
      const updatedDropdownData = { ...dropdownData };
      
      // Adicionar novos itens aos arrays locais se não existirem
      const addToArray = (type: keyof DropdownData, value: string) => {
        if (value && updatedDropdownData[type] && Array.isArray(updatedDropdownData[type])) {
          if (!updatedDropdownData[type].includes(value)) {
            updatedDropdownData[type].push(value);
          }
        }
      };

      // Adicionar todos os itens salvos ao estado local
      for (const item of itemsToSave) {
        if (item.value && item.value.trim()) {
          addToArray(item.type as keyof DropdownData, item.value.trim());
        }
      }
      
      setDropdownData(updatedDropdownData);

      // Converter dados do formulário para o formato esperado pelo serviço
      const truckLoadData: TruckLoadFormData = {
        reg_date: formatDateForBackend(formData.reg_date), // Converter para AAAA-MM-DD
        reg_time: formatTimeForBackend(formData.reg_time), // Garantir formato HH:mm:ss
        truck: truckData.mainField,
        othertruck: truckData.otherField,
        farm: farmData.mainField,
        otherfarm: farmData.otherField,
        field: fieldData.mainField,
        otherfield: fieldData.otherField,
        variety: varietyData.mainField,
        othervariety: varietyData.otherField,
        driver: driverData.mainField,
        otherdriver: driverData.otherField,
        destination: destinationData.mainField,
        otherdestination: destinationData.otherField,
        dnote: formData.dnote,
        agreement: agreementData.mainField,
        otheragreement: agreementData.otherField,
      };

      // Salvar novos valores de dropdown no banco local
      if (truckData.otherField) await syncService.saveDropdownData('truck', truckData.otherField);
      if (farmData.otherField) await syncService.saveDropdownData('farm', farmData.otherField);
      if (fieldData.otherField) await syncService.saveDropdownData('field', fieldData.otherField);
      if (varietyData.otherField) await syncService.saveDropdownData('variety', varietyData.otherField);
      if (driverData.otherField) await syncService.saveDropdownData('driver', driverData.otherField);
      if (destinationData.otherField) await syncService.saveDropdownData('destination', destinationData.otherField);
      if (agreementData.otherField) await syncService.saveDropdownData('agreement', agreementData.otherField);

      // Usar o serviço de sincronização para salvar localmente e tentar sincronizar
      const result = await syncService.saveTruckLoad(truckLoadData);

      if (result.success) {
        Alert.alert(
          commonT.success,
          result.message,
          [
            {
              text: commonT.ok,
              onPress: () => {
                // Redirecionar para home após sucesso
                router.push('/home');
              }
            }
          ]
        );
      } else {
        Alert.alert(commonT.error, result.message);
      }
    } catch (error) {
      // Erro ao salvar carregamento
      Alert.alert(
        commonT.error,
        error instanceof Error ? error.message : commonT.unexpectedError,
        [{ text: commonT.ok }]
      );
    } finally {
      setSaving(false);
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

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    field: keyof FormData,
    icon: keyof typeof Ionicons.glyphMap,
    dropdownField: keyof DropdownData
  ) => {
    const isActive = activeDropdown === field;
    const scale = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
      setActiveDropdown(isActive ? null : field);
    };

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[styles.dropdownButton, isActive && styles.dropdownButtonActive]}
            onPress={onPressIn}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownContent}>
              <Ionicons name={icon} size={20} color={TEXT_SECONDARY} />
              <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
                {value || (field === 'truck' ? t.selectTruck :
                  field === 'farm' ? t.selectFarm :
                  field === 'field' ? t.selectField :
                  field === 'variety' ? t.selectVariety :
                  field === 'driver' ? t.selectDriver :
                  field === 'destination' ? t.selectDestination :
                  field === 'agreement' ? t.selectContract :
                  `Selecione ${label.toLowerCase()}`)}
              </Text>
            </View>
            <Ionicons
              name={isActive ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={TEXT_SECONDARY}
            />
          </TouchableOpacity>
        </Animated.View>
        
        {isActive && (
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownOptions}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownHeaderText}>{t.selectOption}</Text>
                <TouchableOpacity onPress={closeAllDropdowns} style={styles.cancelButton}>
                  <Ionicons name="close" size={20} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator nestedScrollEnabled keyboardShouldPersistTaps="handled">
                <AddNewItemCard
                  fieldType={field as 'truck' | 'farm' | 'field' | 'variety' | 'driver' | 'destination' | 'agreement'}
                  onItemAdded={async (newItem: string) => {
                    
                    // Recarregar dados do banco para garantir persistência
                    try {
                      const freshData = await fetchDropdownData();
                      setDropdownData(freshData as DropdownData);
                    } catch (error) {
                      console.error('❌ Erro ao recarregar dados:', error);
                      // Fallback: atualizar estado local
                      if (dropdownData) {
                        const currentArray = dropdownData[dropdownField] || [];
                        const updatedData = {
                          ...dropdownData,
                          [dropdownField]: [...currentArray, newItem]
                        };
                        setDropdownData(updatedData);
                      }
                    }
                    
                    // Selecionar o novo item automaticamente
                    setFormData(prev => ({ ...prev, [field]: newItem }));
                    setActiveDropdown(null);
                  }}
                  onClose={() => setActiveDropdown(null)}
                />
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, [field]: option }));
                      setActiveDropdown(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderDateTimeField = (
    label: string,
    value: string,
    field: 'reg_date' | 'reg_time',
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string
  ) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.dateTimeInput}
          onPress={() => (field === 'reg_date' ? setDateModalVisible(true) : setTimeModalVisible(true))}
          activeOpacity={0.8}
        >
          <Ionicons name={icon} size={20} color={TEXT_SECONDARY} />
          <Text style={styles.dateTimeText}>{value || placeholder}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <AppHeader projectName="MTFA" showBack onLogoutPress={handleLogout} />

      {/* Conteúdo */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.carregando}</Text>
          </View>
        ) : (
          <>
            {/* Campos de entrada */}
            {renderDateTimeField(t.date, formData.reg_date, 'reg_date', 'calendar', t.datePlaceholder)}
            {renderDateTimeField(t.time, formData.reg_time, 'reg_time', 'time', t.timePlaceholder)}
            
            {dropdownData && (
              <>
                {/* Caminhão */}
                {renderDropdown(t.truck, formData.truck, dropdownData.trucks, 'truck', 'car', 'trucks')}
                
                {/* Fazenda */}
                {renderDropdown(t.farm, formData.farm, dropdownData.farms, 'farm', 'business', 'farms')}
                
                {/* Campo/Talhão */}
                {renderDropdown(t.field, formData.field, dropdownData.fields, 'field', 'leaf', 'fields')}
                
                {/* Variedade */}
                {renderDropdown(t.variety, formData.variety, dropdownData.varieties, 'variety', 'nutrition', 'varieties')}
                
                {/* Motorista */}
                {renderDropdown(t.driver, formData.driver, dropdownData.drivers, 'driver', 'person', 'drivers')}
                
                {/* Destino */}
                {renderDropdown(t.destination, formData.destination, dropdownData.destinations, 'destination', 'location', 'destinations')}
                
                {/* Contrato */}
                {renderDropdown(t.contract, formData.agreement, dropdownData.agreements, 'agreement', 'document-text', 'agreements')}
              </>
            )}

            {/* Campo de anotações */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t.notes}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.dnote}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dnote: text }))}
                placeholder={t.notesPlaceholder}
                placeholderTextColor={TEXT_SECONDARY}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.disabledButton]} 
              onPress={handleSave} 
              activeOpacity={0.8}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? t.saving : t.save}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal de Data */}
      <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectDate}</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>{t.day}</Text>
                <ScrollView ref={dayRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <TouchableOpacity key={d} style={[styles.modalOption, selectedDay === d && styles.modalOptionActive]} onPress={() => setSelectedDay(d)}>
                      <Text style={[styles.modalOptionText, selectedDay === d && styles.modalOptionTextActive]}>{formatTwo(d)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>{t.month}</Text>
                <ScrollView ref={monthRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <TouchableOpacity key={m} style={[styles.modalOption, selectedMonth === m && styles.modalOptionActive]} onPress={() => setSelectedMonth(m)}>
                      <Text style={[styles.modalOptionText, selectedMonth === m && styles.modalOptionTextActive]}>{formatTwo(m)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>{t.year}</Text>
                <ScrollView ref={yearRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map(y => (
                    <TouchableOpacity key={y} style={[styles.modalOption, selectedYear === y && styles.modalOptionActive]} onPress={() => setSelectedYear(y)}>
                      <Text style={[styles.modalOptionText, selectedYear === y && styles.modalOptionTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={useNowDate}>
                <Text style={styles.secondaryButtonText}>{t.useNow}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={applyDate}>
                <Text style={styles.primaryButtonText}>{t.apply}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Hora */}
      <Modal visible={timeModalVisible} transparent animationType="fade" onRequestClose={() => setTimeModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectTime}</Text>
              <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                <Ionicons name="close" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>{t.hour}</Text>
                <ScrollView ref={hourRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <TouchableOpacity key={h} style={[styles.modalOption, selectedHour === h && styles.modalOptionActive]} onPress={() => setSelectedHour(h)}>
                      <Text style={[styles.modalOptionText, selectedHour === h && styles.modalOptionTextActive]}>{formatTwo(h)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>{t.minute}</Text>
                <ScrollView ref={minuteRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 60 }, (_, i) => i).map(m => (
                    <TouchableOpacity key={m} style={[styles.modalOption, selectedMinute === m && styles.modalOptionActive]} onPress={() => setSelectedMinute(m)}>
                      <Text style={[styles.modalOptionText, selectedMinute === m && styles.modalOptionTextActive]}>{formatTwo(m)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>{t.second}</Text>
                <ScrollView ref={secondRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 60 }, (_, i) => i).map(s => (
                    <TouchableOpacity key={s} style={[styles.modalOption, selectedSecond === s && styles.modalOptionActive]} onPress={() => setSelectedSecond(s)}>
                      <Text style={[styles.modalOptionText, selectedSecond === s && styles.modalOptionTextActive]}>{formatTwo(s)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={useNowTime}>
                <Text style={styles.secondaryButtonText}>{t.useNow}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={applyTime}>
                <Text style={styles.primaryButtonText}>{t.apply}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 120 : 80,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...CARD_SHADOW,
  },
  dropdownButtonActive: {
    borderColor: PRIMARY,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownText: {
    color: TEXT,
    fontSize: 16,
  },
  placeholderText: {
    color: TEXT_SECONDARY,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
  },
  dropdownOptions: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    ...CARD_SHADOW,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownHeaderText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 4,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    color: TEXT,
    fontSize: 16,
  },
  dateTimeInput: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...CARD_SHADOW,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: TEXT,
  },
  textInput: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: TEXT,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...CARD_SHADOW,
  },
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 32,
    ...CARD_SHADOW,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modais
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalColumn: {
    flex: 1,
  },
  modalLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginBottom: 6,
  },
  modalList: {
    maxHeight: 220,
  },
  modalOption: {
    height: ROW_HEIGHT,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalOptionActive: {
    backgroundColor: '#F2F4F5',
  },
  modalOptionText: {
    color: TEXT,
    fontSize: 16,
  },
  modalOptionTextActive: {
    fontWeight: 'bold',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: TEXT,
    fontWeight: '600',
    fontSize: 16,
  },
  // Novos estilos
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: TEXT_SECONDARY,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addNewOption: {
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addNewText: {
    color: PRIMARY,
    fontWeight: '600',
  },
  emptyOptionsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyOptionsText: {
    color: TEXT_SECONDARY,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyOptionsSubtext: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
  },
  modalContent: {
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
});