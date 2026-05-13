import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

const COLORS: Record<Severity, { bg: string; text: string }> = {
  CRITICAL: { bg: '#3D1B1B', text: '#FF7B72' },
  HIGH:     { bg: '#3D1B1B', text: '#FF7B72' },
  MEDIUM:   { bg: '#382A10', text: '#D29922' },
  LOW:      { bg: '#1A2E4B', text: '#58A6FF' },
  INFO:     { bg: '#1A2E4B', text: '#58A6FF' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { bg, text } = COLORS[severity] ?? COLORS.INFO;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{severity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  label: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
});
