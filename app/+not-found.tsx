import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { commonI18n } from '../i18n/common';

export default function NotFoundScreen() {
  const { language } = useLanguage();
  const t = commonI18n[language];
  
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="alert-circle" size={64} color="#DC3545" />
          <Text style={styles.title}>{t.notFound}</Text>
          <Text style={styles.subtitle}>
            {t.notFoundDescription}
          </Text>
        </View>
        
        <Link href="/" asChild>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="home" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t.backToLogin}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#0052CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
