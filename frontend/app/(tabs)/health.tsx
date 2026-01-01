import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Health() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const [metricsRes, workoutsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/health-metrics?user_id=${user?.id}`),
        axios.get(`${BACKEND_URL}/api/workouts?user_id=${user?.id}&limit=20`),
      ]);
      setMetrics(metricsRes.data);
      setWorkouts(workoutsRes.data);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestMetric = metrics[0];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Tracking</Text>
        <Text style={styles.subtitle}>Monitor your progress</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Metrics</Text>
            <TouchableOpacity onPress={() => setShowMetricModal(true)}>
              <Ionicons name="add-circle" size={28} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {latestMetric ? (
            <View style={styles.metricsGrid}>
              {latestMetric.weight && (
                <View style={styles.metricCard}>
                  <Ionicons name="scale" size={24} color="#6366f1" />
                  <Text style={styles.metricValue}>{latestMetric.weight} kg</Text>
                  <Text style={styles.metricLabel}>Weight</Text>
                </View>
              )}
              {latestMetric.bmi && (
                <View style={styles.metricCard}>
                  <Ionicons name="analytics" size={24} color="#10b981" />
                  <Text style={styles.metricValue}>{latestMetric.bmi}</Text>
                  <Text style={styles.metricLabel}>BMI</Text>
                </View>
              )}
              {latestMetric.height && (
                <View style={styles.metricCard}>
                  <Ionicons name="resize" size={24} color="#f59e0b" />
                  <Text style={styles.metricValue}>{latestMetric.height} cm</Text>
                  <Text style={styles.metricLabel}>Height</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No health metrics recorded yet</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workout History</Text>
            <TouchableOpacity onPress={() => setShowWorkoutModal(true)}>
              <Ionicons name="add-circle" size={28} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {workouts.length > 0 ? (
            <View style={styles.workoutList}>
              {workouts.slice(0, 5).map((workout) => (
                <View key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutIcon}>
                    <Ionicons
                      name={workout.workout_type === 'yoga' ? 'body' : 'barbell'}
                      size={24}
                      color="#6366f1"
                    />
                  </View>
                  <View style={styles.workoutDetails}>
                    <Text style={styles.workoutType}>{workout.workout_type}</Text>
                    <Text style={styles.workoutDuration}>{workout.duration_minutes} minutes</Text>
                  </View>
                  <Text style={styles.workoutDate}>
                    {new Date(workout.completed_at).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No workouts logged yet</Text>
            </View>
          )}
        </View>

        {metrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {metrics
                .filter((m) => m.progress_photo)
                .map((metric) => (
                  <View key={metric.id} style={styles.photoCard}>
                    <Image
                      source={{ uri: metric.progress_photo }}
                      style={styles.progressPhoto}
                    />
                    <Text style={styles.photoDate}>
                      {new Date(metric.recorded_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <AddMetricModal
        visible={showMetricModal}
        onClose={() => setShowMetricModal(false)}
        onSuccess={() => {
          setShowMetricModal(false);
          loadHealthData();
        }}
        userId={user?.id || ''}
      />

      <AddWorkoutModal
        visible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSuccess={() => {
          setShowWorkoutModal(false);
          loadHealthData();
        }}
        userId={user?.id || ''}
      />
    </View>
  );
}

interface AddMetricModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

function AddMetricModal({ visible, onClose, onSuccess, userId }: AddMetricModalProps) {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    chest: '',
    waist: '',
    hips: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!formData.weight && !formData.height && !photo) {
      Alert.alert('Error', 'Please enter at least one metric or add a photo');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/health-metrics?user_id=${userId}`, {
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        progress_photo: photo,
      });

      Alert.alert('Success', 'Health metric added successfully');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add metric');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Health Metric</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: text })}
              placeholder="e.g., 70"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(text) => setFormData({ ...formData, height: text })}
              placeholder="e.g., 170"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Chest (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.chest}
              onChangeText={(text) => setFormData({ ...formData, chest: text })}
              placeholder="e.g., 95"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Waist (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.waist}
              onChangeText={(text) => setFormData({ ...formData, waist: text })}
              placeholder="e.g., 80"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Hips (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.hips}
              onChangeText={(text) => setFormData({ ...formData, hips: text })}
              placeholder="e.g., 100"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Progress Photo</Text>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoPreview} />
              ) : (
                <>
                  <Ionicons name="camera" size={32} color="#6366f1" />
                  <Text style={styles.photoButtonText}>Take/Upload Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.modalButton, loading && styles.modalButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.modalButtonText}>
              {loading ? 'Saving...' : 'Save Metric'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface AddWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

function AddWorkoutModal({ visible, onClose, onSuccess, userId }: AddWorkoutModalProps) {
  const [formData, setFormData] = useState({
    workout_type: 'yoga',
    duration_minutes: '',
    calories_burned: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const workoutTypes = ['yoga', 'flexibility', 'strength', 'cardio'];

  const handleSubmit = async () => {
    if (!formData.duration_minutes) {
      Alert.alert('Error', 'Please enter workout duration');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/workouts?user_id=${userId}`, {
        workout_type: formData.workout_type,
        duration_minutes: parseInt(formData.duration_minutes),
        calories_burned: formData.calories_burned ? parseInt(formData.calories_burned) : null,
        notes: formData.notes || null,
      });

      Alert.alert('Success', 'Workout logged successfully');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to log workout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.label}>Workout Type</Text>
            <View style={styles.typeButtons}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.workout_type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, workout_type: type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.workout_type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Duration (minutes) *</Text>
            <TextInput
              style={styles.input}
              value={formData.duration_minutes}
              onChangeText={(text) => setFormData({ ...formData, duration_minutes: text })}
              placeholder="e.g., 45"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Calories Burned</Text>
            <TextInput
              style={styles.input}
              value={formData.calories_burned}
              onChangeText={(text) => setFormData({ ...formData, calories_burned: text })}
              placeholder="e.g., 300"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="How did you feel?"
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.modalButton, loading && styles.modalButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.modalButtonText}>
              {loading ? 'Logging...' : 'Log Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
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
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  workoutList: {
    gap: 12,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDetails: {
    flex: 1,
    marginLeft: 16,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  workoutDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  photoScroll: {
    marginTop: 12,
  },
  photoCard: {
    marginRight: 12,
  },
  progressPhoto: {
    width: 120,
    height: 160,
    borderRadius: 12,
  },
  photoDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalForm: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },
  typeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  modalButton: {
    backgroundColor: '#6366f1',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
