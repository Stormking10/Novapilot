import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking,
} from 'react-native';

interface Topic {
  id: string;
  owasp: string;
  title: string;
  description: string;
  progress: number; // 0–100
  color: string;
  bgColor: string;
  link: string;
}

const TOPICS: Topic[] = [
  { id: 'a03', owasp: 'A03:2021', title: 'SQL injection', description: 'Parameterised queries, ORMs, input validation', progress: 100, color: '#A32D2D', bgColor: '#FCEBEB', link: 'https://owasp.org/Top10/A03_2021-Injection/' },
  { id: 'a07', owasp: 'A07:2021', title: 'Broken authentication', description: 'Session management, JWT pitfalls, MFA', progress: 60, color: '#854F0B', bgColor: '#FAEEDA', link: 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/' },
  { id: 'a08', owasp: 'A08:2021', title: 'Insecure deserialization', description: 'pickle risks, JSON alternatives, type validation', progress: 0, color: '#185FA5', bgColor: '#E6F1FB', link: 'https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/' },
  { id: 'a02', owasp: 'A02:2021', title: 'Cryptographic failures', description: 'Secrets management, env vars, key rotation', progress: 0, color: '#185FA5', bgColor: '#E6F1FB', link: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/' },
  { id: 'a10', owasp: 'A10:2021', title: 'SSRF', description: 'URL validation, allow-listing, network segmentation', progress: 0, color: '#0F6E56', bgColor: '#E1F5EE', link: 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/' },
  { id: 'a01', owasp: 'A01:2021', title: 'Broken access control', description: 'RBAC, resource ownership checks, deny by default', progress: 0, color: '#185FA5', bgColor: '#E6F1FB', link: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/' },
];

function TopicRow({ topic, onComplete }: { topic: Topic; onComplete: () => void }) {
  return (
    <TouchableOpacity style={styles.topicRow} onPress={() => Linking.openURL(topic.link)} activeOpacity={0.7}>
      <View style={[styles.topicIcon, { backgroundColor: topic.bgColor }]}>
        <Text style={{ color: topic.color, fontSize: 13, fontWeight: '600' }}>
          {topic.owasp.slice(0, 3)}
        </Text>
      </View>
      <View style={styles.topicBody}>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.topicDesc}>{topic.description}</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${topic.progress}%` }]} />
        </View>
      </View>
      <View style={[styles.topicBadge, { backgroundColor: topic.bgColor }]}>
        <Text style={[styles.topicBadgeText, { color: topic.color }]}>
          {topic.progress === 100 ? 'Done' : topic.progress > 0 ? `${topic.progress}%` : 'Start →'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const [topics] = useState(TOPICS);
  const done = topics.filter(t => t.progress === 100).length;
  const pct = Math.round((done / topics.length) * 100);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{done} of {topics.length} topics complete</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>OWASP Top 10 · Python</Text>
      <View style={styles.topicList}>
        {topics.map(t => <TopicRow key={t.id} topic={t} onComplete={() => {}} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 14 },
  progressCard: {
    backgroundColor: '#F5F5F2', borderRadius: 12, padding: 16, gap: 10,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: 13, fontWeight: '500' },
  progressPct: { fontSize: 13, fontWeight: '500' },
  progressBg: { height: 4, backgroundColor: '#E0E0E0', borderRadius: 99 },
  progressFill: { height: 4, backgroundColor: '#111', borderRadius: 99 },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: '#888', letterSpacing: 0.4 },
  topicList: {
    borderWidth: 0.5, borderColor: '#E5E5E5',
    borderRadius: 12, overflow: 'hidden',
  },
  topicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  topicIcon: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  topicBody: { flex: 1, gap: 3 },
  topicTitle: { fontSize: 13, fontWeight: '500' },
  topicDesc: { fontSize: 11, color: '#888', lineHeight: 16 },
  topicBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  topicBadgeText: { fontSize: 11, fontWeight: '500' },
});
