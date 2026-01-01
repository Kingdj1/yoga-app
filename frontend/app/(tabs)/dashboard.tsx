import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [workoutStatsRes, flexScoresRes, healthMetricRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/workouts/stats?user_id=${user?.id}`),
        axios.get(`${BACKEND_URL}/api/flexibility-scores/average?user_id=${user?.id}`),
        axios.get(`${BACKEND_URL}/api/health-metrics/latest?user_id=${user?.id}`),
      ]);

      setStats({
        workouts: workoutStatsRes.data,
        flexibility: flexScoresRes.data,
        health: healthMetricRes.data,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.role}>
            {user?.role === 'instructor' ? 'Yoga Instructor' : 'Yoga Student'}
          </Text>
        </View>
        <Ionicons name="fitness" size={40} color="#6366f1" />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="flame" size={28} color="#ef4444" />
          </View>
          <Text style={styles.statValue}>{stats?.workouts?.current_streak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="barbell" size={28} color="#10b981" />
          </View>
          <Text style={styles.statValue}>{stats?.workouts?.total_workouts || 0}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={28} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{stats?.workouts?.total_minutes || 0}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="body" size={28} color="#8b5cf6" />
          </View>
          <Text style={styles.statValue}>{stats?.flexibility?.average_score?.toFixed(0) || 0}</Text>
          <Text style={styles.statLabel}>Flex Score</Text>
        </View>
      </View>

      {stats?.health && (
        <View style={styles.healthCard}>
          <Text style={styles.sectionTitle}>Latest Health Metrics</Text>
          <View style={styles.healthRow}>
            {stats.health.weight && (
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Weight</Text>
                <Text style={styles.healthValue}>{stats.health.weight} kg</Text>
              </View>
            )}
            {stats.health.bmi && (
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>BMI</Text>
                <Text style={styles.healthValue}>{stats.health.bmi}</Text>
              </View>
            )}
            {stats.health.height && (
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Height</Text>
                <Text style={styles.healthValue}>{stats.health.height} cm</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam" size={24} color="#6366f1" />
          <Text style={styles.actionButtonText}>Start Video Session</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="body" size={24} color="#6366f1" />
          <Text style={styles.actionButtonText}>Check Posture</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle" size={24} color="#6366f1" />
          <Text style={styles.actionButtonText}>Log Workout</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  role: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  healthCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  healthItem: {
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  healthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  quickActions: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 16,
  },
});
