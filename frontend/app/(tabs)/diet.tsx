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
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Meal {
  meal_type: string;
  items: string[];
  calories: number;
}

interface DietPlan {
  id: string;
  title: string;
  description: string;
  meals: Meal[];
  total_calories: number;
  duration_days: number;
  notes?: string;
  student_name?: string;
}

export default function Diet() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    loadPlans();
    if (user?.role === 'instructor') {
      loadStudents();
    }
  }, []);

  const loadPlans = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/diet-plans/my-plans?user_id=${user?.id}&role=${user?.role}`
      );
      setPlans(response.data);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diet Plans</Text>
        <Text style={styles.subtitle}>
          {user?.role === 'instructor' ? 'Manage student diet plans' : 'Your personalized diet plans'}
        </Text>
      </View>

      {user?.role === 'instructor' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#ffffff" />
          <Text style={styles.createButtonText}>Create Diet Plan</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content}>
        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="nutrition" size={80} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {user?.role === 'instructor'
                ? 'No diet plans created yet'
                : 'No diet plans assigned yet'}
            </Text>
          </View>
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                {user?.role === 'instructor' && (
                  <TouchableOpacity>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              {plan.student_name && (
                <Text style={styles.studentName}>For: {plan.student_name}</Text>
              )}
              <Text style={styles.planDescription}>{plan.description}</Text>
              <View style={styles.planStats}>
                <View style={styles.statItem}>
                  <Ionicons name="flame" size={16} color="#f59e0b" />
                  <Text style={styles.statText}>{plan.total_calories} cal</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={16} color="#6366f1" />
                  <Text style={styles.statText}>{plan.duration_days} days</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="restaurant" size={16} color="#10b981" />
                  <Text style={styles.statText}>{plan.meals.length} meals</Text>
                </View>
              </View>
              {plan.notes && (
                <Text style={styles.planNotes}>Note: {plan.notes}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <CreateDietPlanModal
        visible={showCreateModal}
        students={students}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadPlans();
        }}
        instructorId={user?.id || ''}
      />
    </View>
  );
}

interface CreateDietPlanModalProps {
  visible: boolean;
  students: any[];
  onClose: () => void;
  onSuccess: () => void;
  instructorId: string;
}

function CreateDietPlanModal({
  visible,
  students,
  onClose,
  onSuccess,
  instructorId,
}: CreateDietPlanModalProps) {
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    description: '',
    total_calories: '',
    duration_days: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.student_id || !formData.title || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const meals = [
        { meal_type: 'Breakfast', items: ['Oats', 'Fruits', 'Nuts'], calories: 400 },
        { meal_type: 'Lunch', items: ['Brown Rice', 'Vegetables', 'Lentils'], calories: 500 },
        { meal_type: 'Dinner', items: ['Quinoa', 'Salad', 'Grilled Tofu'], calories: 450 },
      ];

      await axios.post(
        `${BACKEND_URL}/api/diet-plans?instructor_id=${instructorId}`,
        {
          student_id: formData.student_id,
          title: formData.title,
          description: formData.description,
          meals,
          total_calories: parseInt(formData.total_calories) || 1350,
          duration_days: parseInt(formData.duration_days) || 7,
          notes: formData.notes,
        }
      );

      Alert.alert('Success', 'Diet plan created successfully');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create diet plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Diet Plan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.label}>Select Student *</Text>
            <View style={styles.pickerContainer}>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.studentOption,
                    formData.student_id === student.id && styles.studentOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, student_id: student.id })}
                >
                  <Text
                    style={[
                      styles.studentOptionText,
                      formData.student_id === student.id && styles.studentOptionTextSelected,
                    ]}
                  >
                    {student.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Beginner Yoga Diet"
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe the diet plan..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Total Calories</Text>
            <TextInput
              style={styles.input}
              value={formData.total_calories}
              onChangeText={(text) => setFormData({ ...formData, total_calories: text })}
              placeholder="e.g., 1500"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Duration (days)</Text>
            <TextInput
              style={styles.input}
              value={formData.duration_days}
              onChangeText={(text) => setFormData({ ...formData, duration_days: text })}
              placeholder="e.g., 7"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.modalButton, loading && styles.modalButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.modalButtonText}>
              {loading ? 'Creating...' : 'Create Plan'}
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  studentName: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  planNotes: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 12,
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
  pickerContainer: {
    gap: 8,
  },
  studentOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  studentOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  studentOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  studentOptionTextSelected: {
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
