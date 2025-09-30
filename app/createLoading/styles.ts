import { StyleSheet, Platform, StatusBar as RNStatusBar, Dimensions } from 'react-native';

const PRIMARY = '#0052CC';
const BG = '#F8F9FA';
const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;
const { height: screenHeight } = Dimensions.get('window');
const ROW_HEIGHT = 44;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

export const styles = StyleSheet.create({
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
});

export const colors = {
  PRIMARY,
  BG,
  SURFACE,
  TEXT,
  TEXT_SECONDARY,
};

export const constants = {
  STATUS_BAR_HEIGHT,
  ROW_HEIGHT,
  screenHeight,
};
