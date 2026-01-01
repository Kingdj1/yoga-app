import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Posture() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Posture Check</Text>
        <Text style={styles.subtitle}>AI-powered yoga pose analysis</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="body" size={100} color="#6366f1" />
        <Text style={styles.comingSoon}>Coming Soon</Text>
        <Text style={styles.description}>
          This feature will use your camera to analyze your yoga poses and provide real-time feedback on your posture and flexibility.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
});
