import React, { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar as RNStatusBar, Animated, Dimensions, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { useLanguage } from '../contexts/LanguageContext';
import { createI18n } from '../i18n/create';
import { commonI18n } from '../i18n/common';

const PRIMARY = '#0052CC';
const BG = '#F8F9FA';
const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;
const { height: screenHeight } = Dimensions.get('window');
const ROW_HEIGHT = 44;

interface FormData {
  date: string;
  time: string;
  company: string;
  field: string;
  variety: string;
  truck: string;
  driver: string;
  deliveryLocation: string;
  pesoEstimado: string;
  precoFrete: string;
  anotacoes: string;
}

// Interface para os dados dos dropdowns
interface DropdownData {
  trucks: string[];
  companies: string[];
  fields: string[];
  varieties: string[];
  drivers: string[];
  deliveryLocations: string[];
}

// Função para simular carregamento dinâmico do banco
const fetchDropdownData = async (): Promise<DropdownData> => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    trucks: ['Caminhão 001', 'Caminhão 002', 'Caminhão 003', 'Caminhão 004', 'Caminhão 005', 'Caminhão 006'],
    companies: ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D', 'Empresa E'],
    fields: ['Campo Norte', 'Campo Sul', 'Campo Leste', 'Campo Oeste', 'Campo Central'],
    varieties: ['Soja', 'Milho', 'Trigo', 'Arroz', 'Algodão'],
    drivers: ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Souza', 'Carlos Lima'],
    deliveryLocations: ['Porto Santos', 'Silo Central', 'Fábrica ABC', 'Terminal XYZ', 'Armazém 12'],
  };
};

export default function CreateTripScreen() {
  const { language } = useLanguage();
  const t = createI18n[language];
  const common = commonI18n[language];
  
  const now = useMemo(() => new Date(), []);
  const [formData, setFormData] = useState<FormData>({
    date: now.toLocaleDateString('pt-BR'),
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    company: '',
    field: '',
    variety: '',
    truck: '',
    driver: '',
    deliveryLocation: '',
    pesoEstimado: '',
    precoFrete: '',
    anotacoes: '',
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modais de seleção de Data e Hora
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);

  // Modal para adicionar novo item
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [currentDropdownField, setCurrentDropdownField] = useState<keyof DropdownData | null>(null);

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
          date: currentDate.toLocaleDateString('pt-BR'),
          time: currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatTwo = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const applyDate = () => {
    const dateString = `${formatTwo(selectedDay)}/${formatTwo(selectedMonth)}/${selectedYear}`;
    setFormData(prev => ({ ...prev, date: dateString }));
    setDateModalVisible(false);
  };
  const applyTime = () => {
    const timeString = `${formatTwo(selectedHour)}:${formatTwo(selectedMinute)}:${formatTwo(selectedSecond)}`;
    setFormData(prev => ({ ...prev, time: timeString }));
    setTimeModalVisible(false);
  };
  const useNowDate = () => {
    const d = new Date();
    setSelectedDay(d.getDate());
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(d.getFullYear());
    setFormData(prev => ({ ...prev, date: d.toLocaleDateString('pt-BR') }));
  };
  const useNowTime = () => {
    const d = new Date();
    setSelectedHour(d.getHours());
    setSelectedMinute(d.getMinutes());
    setSelectedSecond(d.getSeconds());
    setFormData(prev => ({ ...prev, time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }));
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
  };

  const openAddItemModal = (field: keyof DropdownData) => {
    setCurrentDropdownField(field);
    setNewItemText('');
    setAddItemModalVisible(true);
    setActiveDropdown(null);
  };

  const addNewItem = () => {
    if (newItemText.trim() && currentDropdownField && dropdownData) {
      const updatedData = {
        ...dropdownData,
        [currentDropdownField]: [...dropdownData[currentDropdownField], newItemText.trim()]
      };
      setDropdownData(updatedData);
      setFormData(prev => ({ ...prev, [currentDropdownField]: newItemText.trim() }));
      setAddItemModalVisible(false);
      setNewItemText('');
      setCurrentDropdownField(null);
    }
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
                  field === 'company' ? t.selectCompany :
                  field === 'field' ? t.selectField :
                  field === 'variety' ? t.selectVariety :
                  field === 'driver' ? t.selectDriver :
                  field === 'deliveryLocation' ? t.selectDeliveryLocation :
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
                <TouchableOpacity
                  style={[styles.dropdownOption, styles.addNewOption]}
                  onPress={() => openAddItemModal(dropdownField)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={PRIMARY} />
                  <Text style={[styles.dropdownOptionText, styles.addNewText]}>{t.adicionarNovo}</Text>
                </TouchableOpacity>
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
    field: 'date' | 'time',
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string
  ) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.dateTimeInput}
          onPress={() => (field === 'date' ? setDateModalVisible(true) : setTimeModalVisible(true))}
          activeOpacity={0.8}
        >
          <Ionicons name={icon} size={20} color={TEXT_SECONDARY} />
          <Text style={styles.dateTimeText}>{value || placeholder}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader projectName="MTFA" showBack />

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
            {renderDateTimeField(t.date, formData.date, 'date', 'calendar', t.datePlaceholder)}
            {renderDateTimeField(t.time, formData.time, 'time', 'time', t.timePlaceholder)}
            
            {dropdownData && (
              <>
                {/* Fazenda/Empresa */}
                {renderDropdown(t.company, formData.company, dropdownData.companies, 'company', 'business', 'companies')}
                
                {/* Talhão/Lugar do Carregamento */}
                {renderDropdown(t.field, formData.field, dropdownData.fields, 'field', 'leaf', 'fields')}
                
                {/* Variedade/Produto */}
                {renderDropdown(t.variety, formData.variety, dropdownData.varieties, 'variety', 'nutrition', 'varieties')}
                
                {/* Caminhão */}
                {renderDropdown(t.truck, formData.truck, dropdownData.trucks, 'truck', 'car', 'trucks')}
                
                {/* Motorista */}
                {renderDropdown(t.driver, formData.driver, dropdownData.drivers, 'driver', 'person', 'drivers')}
                
                {/* Destinatário */}
                {renderDropdown(t.deliveryLocation, formData.deliveryLocation, dropdownData.deliveryLocations, 'deliveryLocation', 'location', 'deliveryLocations')}
              </>
            )}

            {/* Peso Estimado */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t.pesoEstimado}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.pesoEstimado}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pesoEstimado: text }))}
                placeholder={t.pesoEstimadoPlaceholder}
                placeholderTextColor={TEXT_SECONDARY}
                keyboardType="numeric"
              />
            </View>

            {/* Preço do Frete */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t.precoFrete}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.precoFrete}
                onChangeText={(text) => setFormData(prev => ({ ...prev, precoFrete: text }))}
                placeholder={t.precoFretePlaceholder}
                placeholderTextColor={TEXT_SECONDARY}
                keyboardType="numeric"
              />
            </View>

            {/* Campo de anotações */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t.anotacoes}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.anotacoes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, anotacoes: text }))}
                placeholder={t.anotacoesPlaceholder}
                placeholderTextColor={TEXT_SECONDARY}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity style={styles.saveButton} onPress={() => { closeAllDropdowns(); }} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>{t.save}</Text>
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

      {/* Modal para Adicionar Novo Item */}
      <Modal visible={addItemModalVisible} transparent animationType="fade" onRequestClose={() => setAddItemModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.adicionarNovoItem}</Text>
              <TouchableOpacity onPress={() => setAddItemModalVisible(false)}>
                <Ionicons name="close" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.textInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder={t.novoItemPlaceholder}
                placeholderTextColor={TEXT_SECONDARY}
                autoFocus
              />
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => setAddItemModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>{common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryButton, !newItemText.trim() && styles.disabledButton]} 
                onPress={addNewItem}
                disabled={!newItemText.trim()}
              >
                <Text style={styles.primaryButtonText}>{t.adicionar}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalContent: {
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
});