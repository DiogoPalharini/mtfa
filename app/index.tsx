import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { loginI18n } from '../i18n/login';
import { commonI18n } from '../i18n/common';
import LanguageSelector from '../components/LanguageSelector';

const { width } = Dimensions.get('window');

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginScreen() {
  const { language } = useLanguage();
  const { login, isLoading } = useAuth();
  const t = loginI18n[language];
  const commonT = commonI18n[language];
  
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Animações para os campos de input
  const usernameFocusAnim = useState(new Animated.Value(0))[0];
  const passwordFocusAnim = useState(new Animated.Value(0))[0];
  const buttonScaleAnim = useState(new Animated.Value(1))[0];
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const handleFieldFocus = (fieldName: string, animValue: Animated.Value) => {
    setFocusedField(fieldName);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFieldBlur = (fieldName: string, animValue: Animated.Value) => {
    setFocusedField(null);
    Animated.timing(animValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data.username, data.password);
      
      if (result.success) {
        // Navegar para a tela home após login bem-sucedido
        router.push('/home');
      } else {
        // Mostrar erro de login
        Alert.alert(commonT.loginError, result.message);
      }
    } catch (error) {
      // Erro no login
      Alert.alert(commonT.error, commonT.connectionError);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loginCard}>
          {/* Logo/Título */}
          <View style={styles.logoContainer}>
            <Text style={styles.appTitle}>{t.appTitle}</Text>
          </View>

          {/* Seletor de Idioma */}
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector />
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            {/* Campo Usuário/Email */}
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="username"
                rules={{ required: t.usernameRequired }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Animated.View style={[
                    styles.inputWrapper,
                    {
                      borderColor: focusedField === 'username' ? '#0052CC' : '#E0E0E0',
                      transform: [{
                        scale: usernameFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02],
                        })
                      }]
                    }
                  ]}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.username && styles.inputError
                      ]}
                      placeholder={t.usernamePlaceholder}
                      placeholderTextColor="#6C757D"
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => handleFieldFocus('username', usernameFocusAnim)}
                      onBlur={() => {
                        onBlur();
                        handleFieldBlur('username', usernameFocusAnim);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />
                  </Animated.View>
                )}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username.message}</Text>
              )}
            </View>

            {/* Campo Senha */}
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="password"
                rules={{ required: t.passwordRequired }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Animated.View style={[
                    styles.inputWrapper,
                    {
                      borderColor: focusedField === 'password' ? '#0052CC' : '#E0E0E0',
                      transform: [{
                        scale: passwordFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02],
                        })
                      }]
                    }
                  ]}>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[
                          styles.passwordInput,
                          errors.password && styles.inputError
                        ]}
                        placeholder={t.passwordPlaceholder}
                        placeholderTextColor="#6C757D"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => handleFieldFocus('password', passwordFocusAnim)}
                        onBlur={() => {
                          onBlur();
                          handleFieldBlur('password', passwordFocusAnim);
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={24}
                          color="#6C757D"
                        />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Botão de Login */}
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={() => {
                  handleButtonPress();
                  handleSubmit(onSubmit)();
                }}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? t.loggingIn : t.loginButton}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  languageSelectorContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
