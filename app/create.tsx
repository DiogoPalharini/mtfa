import React, { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar as RNStatusBar, Animated, Dimensions, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';

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
  truck: string;
  company: string;
  field: string;
  variety: string;
  driver: string;
  deliveryLocation: string;
  shippingGuide: string;
  contract: string;
}

// Dados mockados para os dropdowns
const MOCK_DATA = {
  trucks: ['Caminhão 001', 'Caminhão 002', 'Caminhão 003', 'Caminhão 004', 'Caminhão 005', 'Caminhão 006'],
  companies: ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D', 'Empresa E'],
  fields: ['Campo Norte', 'Campo Sul', 'Campo Leste', 'Campo Oeste', 'Campo Central'],
  varieties: ['Soja', 'Milho', 'Trigo', 'Arroz', 'Algodão'],
  drivers: ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Souza', 'Carlos Lima'],
  deliveryLocations: ['Porto Santos', 'Silo Central', 'Fábrica ABC', 'Terminal XYZ', 'Armazém 12'],
  contracts: ['Contrato 2024-001', 'Contrato 2024-002', 'Contrato 2024-003', 'Contrato 2024-004'],
};

export default function CreateTripScreen() {
  const now = useMemo(() => new Date(), []);
  const [formData, setFormData] = useState<FormData>({
    date: now.toLocaleDateString('pt-BR'),
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    truck: '',
    company: '',
    field: '',
    variety: '',
    driver: '',
    deliveryLocation: '',
    shippingGuide: '',
    contract: '',
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  const scrollToCenter = (ref: React.RefObject<ScrollView>, index: number, listLength: number) => {
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

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    field: keyof FormData,
    icon: keyof typeof Ionicons.glyphMap
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
                {value || `Selecione ${label.toLowerCase()}`}
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
                <Text style={styles.dropdownHeaderText}>Selecione uma opção</Text>
                <TouchableOpacity onPress={closeAllDropdowns} style={styles.cancelButton}>
                  <Ionicons name="close" size={20} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator nestedScrollEnabled keyboardShouldPersistTaps="handled">
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
        {/* Campos de entrada */}
        {renderDateTimeField('Data', formData.date, 'date', 'calendar', 'DD/MM/AAAA')}
        {renderDateTimeField('Hora', formData.time, 'time', 'time', 'HH:MM:SS')}
        
        {renderDropdown('Caminhão', formData.truck, MOCK_DATA.trucks, 'truck', 'car')}
        {renderDropdown('Empresa', formData.company, MOCK_DATA.companies, 'company', 'business')}
        {renderDropdown('Campo', formData.field, MOCK_DATA.fields, 'field', 'leaf')}
        {renderDropdown('Tipo/Variedade', formData.variety, MOCK_DATA.varieties, 'variety', 'nutrition')}
        {renderDropdown('Motorista', formData.driver, MOCK_DATA.drivers, 'driver', 'person')}
        {renderDropdown('Local de Entrega', formData.deliveryLocation, MOCK_DATA.deliveryLocations, 'deliveryLocation', 'location')}
        {renderDropdown('Contrato', formData.contract, MOCK_DATA.contracts, 'contract', 'document-text')}

        {/* Campo de texto para Guia de Remessa */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Guia de Remessa</Text>
          <TextInput
            style={styles.textInput}
            value={formData.shippingGuide}
            onChangeText={(text) => setFormData(prev => ({ ...prev, shippingGuide: text }))}
            placeholder="Digite o número da guia"
            placeholderTextColor={TEXT_SECONDARY}
          />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.saveButton} onPress={() => { closeAllDropdowns(); }} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Data */}
      <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Data</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Dia</Text>
                <ScrollView ref={dayRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <TouchableOpacity key={d} style={[styles.modalOption, selectedDay === d && styles.modalOptionActive]} onPress={() => setSelectedDay(d)}>
                      <Text style={[styles.modalOptionText, selectedDay === d && styles.modalOptionTextActive]}>{formatTwo(d)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Mês</Text>
                <ScrollView ref={monthRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <TouchableOpacity key={m} style={[styles.modalOption, selectedMonth === m && styles.modalOptionActive]} onPress={() => setSelectedMonth(m)}>
                      <Text style={[styles.modalOptionText, selectedMonth === m && styles.modalOptionTextActive]}>{formatTwo(m)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Ano</Text>
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
                <Text style={styles.secondaryButtonText}>Usar Agora</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={applyDate}>
                <Text style={styles.primaryButtonText}>Aplicar</Text>
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
              <Text style={styles.modalTitle}>Selecionar Hora</Text>
              <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                <Ionicons name="close" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Hora</Text>
                <ScrollView ref={hourRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <TouchableOpacity key={h} style={[styles.modalOption, selectedHour === h && styles.modalOptionActive]} onPress={() => setSelectedHour(h)}>
                      <Text style={[styles.modalOptionText, selectedHour === h && styles.modalOptionTextActive]}>{formatTwo(h)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Minuto</Text>
                <ScrollView ref={minuteRef} style={styles.modalList} showsVerticalScrollIndicator>
                  {Array.from({ length: 60 }, (_, i) => i).map(m => (
                    <TouchableOpacity key={m} style={[styles.modalOption, selectedMinute === m && styles.modalOptionActive]} onPress={() => setSelectedMinute(m)}>
                      <Text style={[styles.modalOptionText, selectedMinute === m && styles.modalOptionTextActive]}>{formatTwo(m)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Segundo</Text>
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
                <Text style={styles.secondaryButtonText}>Usar Agora</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={applyTime}>
                <Text style={styles.primaryButtonText}>Aplicar</Text>
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
});