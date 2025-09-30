import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: Math.min(width - 40, 400),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212529',
    backgroundColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212529',
    backgroundColor: 'transparent',
    paddingRight: 50,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4,
  },
  inputError: {
    borderColor: '#DC3545',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: '#0052CC',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0052CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#6C757D',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: 'rgb(255, 255, 255)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: '#6C757D',
    fontSize: 16,
    textDecorationLine: 'none',
  },
});

export const colors = {
  PRIMARY: '#0052CC',
  BACKGROUND: '#F8F9FA',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#212529',
  TEXT_SECONDARY: '#6C757D',
  ERROR: '#DC3545',
  WHITE: 'rgb(255, 255, 255)',
  BORDER: '#E0E0E0',
  DISABLED: '#6C757D',
};

export const constants = {
  width,
  INPUT_HEIGHT: 56,
  CARD_MAX_WIDTH: 400,
};
