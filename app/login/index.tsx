import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { loginI18n } from '../../i18n/login';
import { styles, colors, constants } from './styles';
import { useDatabase, useAuth } from '../../hooks/useDatabase';

const { PRIMARY, TEXT_SECONDARY, ERROR, WHITE, BORDER, DISABLED } = colors;

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginScreen() {
  const { language } = useLanguage();
  const t = loginI18n[language];
  
  const { isInitialized, isLoading: dbLoading, error: dbError } = useDatabase();
  const { login, isLoading: authLoading } = useAuth();
  
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
    if (!isInitialized) {
      Alert.alert('Erro', 'Banco de dados não inicializado');
      return;
    }

    const success = await login(data.username, data.password);
    
    if (success) {
      router.push('/home');
    } else {
      Alert.alert('Erro', 'Usuário ou senha incorretos');
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
                      borderColor: focusedField === 'username' ? PRIMARY : BORDER,
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
                      placeholderTextColor={TEXT_SECONDARY}
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
                      borderColor: focusedField === 'password' ? PRIMARY : BORDER,
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
                        placeholderTextColor={TEXT_SECONDARY}
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
                          color={TEXT_SECONDARY}
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
                style={[styles.loginButton, (authLoading || dbLoading) && styles.loginButtonDisabled]}
                onPress={() => {
                  handleButtonPress();
                  handleSubmit(onSubmit)();
                }}
                disabled={authLoading || dbLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {authLoading || dbLoading ? t.loggingIn : t.loginButton}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

