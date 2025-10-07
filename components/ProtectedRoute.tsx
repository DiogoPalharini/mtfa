import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { commonI18n } from '../i18n/common';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkSession } = useAuth();
  const { language } = useLanguage();
  const t = commonI18n[language];

  useEffect(() => {
    const validateAuth = async () => {
      if (!isLoading) {
        if (!isAuthenticated) {
          // Se não está autenticado, redirecionar para login
          router.replace('/');
        } else {
          // Se está autenticado, verificar se a sessão ainda é válida
          const isValid = await checkSession();
          if (!isValid) {
            // Sessão expirada, redirecionar para login
            router.replace('/');
          }
        }
      }
    };

    validateAuth();
  }, [isAuthenticated, isLoading, checkSession]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0052CC" />
        <Text style={styles.loadingText}>{t.checkingAuth}</Text>
      </View>
    );
  }

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Se está autenticado, renderizar o conteúdo protegido
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
});
