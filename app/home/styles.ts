import { StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';

const PRIMARY = '#0052CC';
const BG = '#F8F9FA';
const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const SUCCESS = '#28A745';
const WARNING = '#FFC107';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;

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
    backgroundColor: BG 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 16 
  },
  welcome: { 
    color: TEXT, 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  syncCard: { 
    backgroundColor: SURFACE, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    ...CARD_SHADOW 
  },
  syncCardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  syncCardTitle: { 
    color: TEXT, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  syncMessage: { 
    fontSize: 14, 
    marginBottom: 12 
  },
  sectionTitle: { 
    color: TEXT, 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    marginTop: 8 
  },
  createButton: { 
    backgroundColor: PRIMARY, 
    borderRadius: 14, 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    marginBottom: 16, 
    ...CARD_SHADOW 
  },
  createButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});

export const colors = {
  PRIMARY,
  BG,
  SURFACE,
  TEXT,
  SUCCESS,
  WARNING,
};

export const constants = {
  STATUS_BAR_HEIGHT,
};
