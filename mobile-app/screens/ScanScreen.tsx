import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scanCode } from '../api/scan';

const PLACEHOLDER = `# paste your code here
import sqlite3

def get_user(username):
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE name = '{username}'"
    cursor = conn.cursor()
    cursor.execute(query)
    return cursor.fetchone()
`;

export default function ScanScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [scanning, setScanning] = useState(false);

  const LANGUAGES = [
    { label: 'Python', value: 'python', icon: 'logo-python' },
    { label: 'JS/TS', value: 'javascript', icon: 'logo-javascript' },
    { label: 'Go', value: 'go', icon: 'code-slash' },
    { label: 'Java', value: 'java', icon: 'cafe' },
    { label: 'C#', value: 'csharp', icon: 'code-slash' }
  ];

  async function handleScan() {
    if (!code.trim()) {
      Alert.alert('Empty code', 'Please paste some code to analyze.');
      return;
    }
    setScanning(true);
    try {
      const result = await scanCode(code, language);
      setCode(''); // Clear the input for the next scan
      navigation.navigate('Results', { result, code, language });
    } catch (e: any) {
      Alert.alert('Scan failed', e.message ?? 'Unknown error');
    } finally {
      setScanning(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Analysis</Text>
        <Text style={styles.subtitle}>Select language and paste your source code below.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity 
              key={lang.value} 
              style={[styles.pill, language === lang.value && styles.pillActive]}
              onPress={() => setLanguage(lang.value)}
            >
              <Ionicons 
                name={lang.icon as any} 
                size={14} 
                color={language === lang.value ? '#00D1FF' : '#8B949E'} 
              />
              <Text style={[styles.pillText, language === lang.value && styles.pillTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.codeInput}
            multiline
            value={code}
            onChangeText={setCode}
            placeholder={PLACEHOLDER}
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>

        <TouchableOpacity
          style={styles.scanBtnContainer}
          onPress={handleScan}
          disabled={scanning}
        >
          <LinearGradient
            colors={scanning ? ['#003E4D', '#003E4D'] : ['#00D1FF', '#00A3FF']}
            style={styles.scanBtn}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.scanBtnText}>Audit Snippet</Text>
                <Ionicons name="shield-checkmark-outline" size={20} color="#000" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Our AI engine will perform deep static analysis and provide secure fixes for any detected vulnerabilities.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E6EDF3' },
  subtitle: { fontSize: 14, color: '#8B949E', marginBottom: 8 },
  
  langScroll: { gap: 10, paddingBottom: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#161B22', borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#30363D',
  },
  pillActive: {
    borderColor: '#00D1FF',
    backgroundColor: '#0D1117',
  },
  pillText: { fontSize: 13, color: '#8B949E', fontWeight: '600' },
  pillTextActive: { color: '#00D1FF' },

  inputContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
  },
  codeInput: {
    padding: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#E6EDF3',
    minHeight: 350,
    textAlignVertical: 'top',
  },

  scanBtnContainer: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#00D1FF',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  scanBtn: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  hint: { fontSize: 12, color: '#484F58', textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});

