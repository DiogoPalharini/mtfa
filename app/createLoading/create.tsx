import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Animated, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import AddItemModal from '../../components/AddItemModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { createI18n } from '../../i18n/create';
import { commonI18n } from '../../i18n/common';
import { styles, colors, constants } from './styles';
import { useDatabase, useDropdownItems } from '../../hooks/useDatabase';
import { useTripsContext } from '../../contexts/TripsContext';

const { PRIMARY, TEXT_SECONDARY, TEXT } = colors;
const { ROW_HEIGHT } = constants;

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


export default function CreateTripScreen() {
  const { language } = useLanguage();
  const t = createI18n[language];
  const common = commonI18n[language];
  
  const { isInitialized, isLoading: dbLoading, error: dbError } = useDatabase();
  const { createTrip, isLoading: tripLoading } = useTripsContext();
  
  // Hooks para cada categoria de dropdown
  const trucksHook = useDropdownItems('trucks');
  const companiesHook = useDropdownItems('companies');
  const fieldsHook = useDropdownItems('fields');
  const varietiesHook = useDropdownItems('varieties');
  const driversHook = useDropdownItems('drivers');
  const deliveryLocationsHook = useDropdownItems('deliveryLocations');
  
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

  // Modais de seleção de Data e Hora
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);

  // Modal para adicionar novo item
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [currentDropdownField, setCurrentDropdownField] = useState<string | null>(null);

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
    if (isInitialized) {
      // Carregar todos os dropdowns
      trucksHook.loadItems();
      companiesHook.loadItems();
      fieldsHook.loadItems();
      varietiesHook.loadItems();
      driversHook.loadItems();
      deliveryLocationsHook.loadItems();
      
      // Atualizar data e hora com valores atuais
      const currentDate = new Date();
      setFormData(prev => ({
        ...prev,
        date: currentDate.toLocaleDateString('pt-BR'),
        time: currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }));
    }
  }, [isInitialized]);

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

  const openAddItemModal = (field: string) => {
    setCurrentDropdownField(field);
    setAddItemModalVisible(true);
    setActiveDropdown(null);
  };

  const handleAddNewItem = async (itemName: string) => {
    if (!currentDropdownField) return;

    let hook;
    switch (currentDropdownField) {
      case 'trucks':
        hook = trucksHook;
        break;
      case 'companies':
        hook = companiesHook;
        break;
      case 'fields':
        hook = fieldsHook;
        break;
      case 'varieties':
        hook = varietiesHook;
        break;
      case 'drivers':
        hook = driversHook;
        break;
      case 'deliveryLocations':
        hook = deliveryLocationsHook;
        break;
      default:
        return;
    }

    const success = await hook.addItem(itemName);
    if (success) {
      setFormData(prev => ({ ...prev, [currentDropdownField]: itemName }));
      setCurrentDropdownField(null);
    } else {
      Alert.alert('Erro', 'Não foi possível adicionar o item');
    }
  };

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    field: keyof FormData,
    icon: keyof typeof Ionicons.glyphMap,
    dropdownField: string
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
        {dbLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.carregando}</Text>
          </View>
        ) : (
          <>
            {/* Campos de entrada */}
            {renderDateTimeField(t.date, formData.date, 'date', 'calendar', t.datePlaceholder)}
            {renderDateTimeField(t.time, formData.time, 'time', 'time', t.timePlaceholder)}
            
            {isInitialized && (
              <>
                {/* Fazenda/Empresa */}
                {renderDropdown(t.company, formData.company, companiesHook.items.map(item => item.name), 'company', 'business', 'companies')}
                
                {/* Talhão/Lugar do Carregamento */}
                {renderDropdown(t.field, formData.field, fieldsHook.items.map(item => item.name), 'field', 'leaf', 'fields')}
                
                {/* Variedade/Produto */}
                {renderDropdown(t.variety, formData.variety, varietiesHook.items.map(item => item.name), 'variety', 'nutrition', 'varieties')}
                
                {/* Caminhão */}
                {renderDropdown(t.truck, formData.truck, trucksHook.items.map(item => item.name), 'truck', 'car', 'trucks')}
                
                {/* Motorista */}
                {renderDropdown(t.driver, formData.driver, driversHook.items.map(item => item.name), 'driver', 'person', 'drivers')}
                
                {/* Destinatário */}
                {renderDropdown(t.deliveryLocation, formData.deliveryLocation, deliveryLocationsHook.items.map(item => item.name), 'deliveryLocation', 'location', 'deliveryLocations')}
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
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={async () => { 
                closeAllDropdowns();
                
                if (!isInitialized) {
                  Alert.alert('Erro', 'Banco de dados não inicializado');
                  return;
                }

                const success = await createTrip(formData);
                if (success) {
                  Alert.alert('Sucesso', 'Viagem salva com sucesso!');
                  // Limpar formulário
                  setFormData({
                    date: new Date().toLocaleDateString('pt-BR'),
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
                } else {
                  Alert.alert('Erro', 'Não foi possível salvar a viagem');
                }
              }} 
              activeOpacity={0.8}
              disabled={tripLoading}
            >
              <Text style={styles.saveButtonText}>
                {tripLoading ? 'Salvando...' : t.save}
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

      {/* Modal para Adicionar Novo Item */}
      <AddItemModal
        visible={addItemModalVisible}
        onClose={() => setAddItemModalVisible(false)}
        onAdd={handleAddNewItem}
      />
    </View>
  );
}
