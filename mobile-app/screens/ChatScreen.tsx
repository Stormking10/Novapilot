import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatWithAI } from '../api/scan';

interface Message {
  id: string;
  text: string;
  isAi: boolean;
}

export default function ChatScreen({ route, navigation }: any) {
  const { code, vulnerability, language } = route.params;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm Novapilot AI. I noticed a security concern regarding "${vulnerability.title}". How can I help you understand this finding?`,
      isAi: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, isAi: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const vulnContext = `Title: ${vulnerability.title}\nSeverity: ${vulnerability.severity}\nExplanation: ${vulnerability.explanation}`;
      const response = await chatWithAI(code, vulnContext, input, language);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response.answer, isAi: true };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: `Error: ${e.message || 'Could not reach AI engine.'}`, 
        isAi: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#00D1FF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Security Mentor</Text>
          <Text style={styles.headerSub}>Discussing: {vulnerability.title}</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map(msg => (
          <View 
            key={msg.id} 
            style={[styles.msgWrapper, msg.isAi ? styles.aiWrapper : styles.userWrapper]}
          >
            <View style={[styles.bubble, msg.isAi ? styles.aiBubble : styles.userBubble]}>
              <Text style={[styles.msgText, msg.isAi ? styles.aiText : styles.userText]}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.msgWrapper, styles.aiWrapper]}>
            <View style={[styles.bubble, styles.aiBubble, { paddingVertical: 12 }]}>
              <ActivityIndicator size="small" color="#00D1FF" />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a security question..."
          placeholderTextColor="#484F58"
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} 
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color={input.trim() && !loading ? "#000" : "#484F58"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
    backgroundColor: '#161B22',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#E6EDF3' },
  headerSub: { fontSize: 12, color: '#8B949E' },

  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 16 },
  
  msgWrapper: { maxWidth: '85%', flexDirection: 'row' },
  aiWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end' },
  
  bubble: { borderRadius: 16, padding: 12 },
  aiBubble: { backgroundColor: '#161B22', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#30363D' },
  userBubble: { backgroundColor: '#00D1FF', borderBottomRightRadius: 4 },
  
  msgText: { fontSize: 15, lineHeight: 22 },
  aiText: { color: '#E6EDF3' },
  userText: { color: '#000', fontWeight: '500' },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#161B22',
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    color: '#E6EDF3',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  sendBtn: {
    backgroundColor: '#00D1FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#30363D',
  }
});
