import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createTaskOffline, updateTaskOffline } from '../store/taskSlice';
import { TaskPriority, TaskStatus } from '../types/task';

type RouteProps = RouteProp<RootStackParamList, 'TaskForm'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export const TaskFormScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const existingTask = route.params?.task;
  const isEditing = Boolean(existingTask);

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [location, setLocation] = useState(existingTask?.location || '');
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(existingTask?.status || 'pending');
  const [dueDate, setDueDate] = useState(
    existingTask?.dueDate || new Date().toISOString().slice(0, 10)
  );
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage('Task title is required');
      return;
    }

    if (isEditing && existingTask) {
      await dispatch(
        updateTaskOffline({
          id: existingTask.id,
          updates: {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            priority,
            status,
            dueDate: dueDate.trim() || null,
          },
        })
      );
    } else {
      await dispatch(
        createTaskOffline({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          priority,
          status,
          dueDate: dueDate.trim() || null,
          userId: currentUser?.id || 'usr_vineet',
        })
      );
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.screenHeading}>
            {isEditing ? 'Edit Task' : 'New Field Task'}
          </Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. Inspect compressor 4B"
              placeholderTextColor="#94A3B8"
              testID="task-form-title-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Sector 7, Pump Station B"
              placeholderTextColor="#94A3B8"
              testID="task-form-location-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.choiceRow}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.choiceButton,
                    priority === p && styles.choiceButtonActive,
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      priority === p && styles.choiceButtonTextActive,
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.choiceRow}>
              {(['pending', 'in_progress', 'completed'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.choiceButton,
                    status === st && styles.choiceButtonActive,
                  ]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      status === st && styles.choiceButtonTextActive,
                    ]}
                  >
                    {st === 'in_progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-11-01"
              placeholderTextColor="#94A3B8"
              testID="task-form-date-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task details, instructions or inspection steps..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              testID="task-form-description-input"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            testID="task-form-save-button"
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Save Changes' : 'Create Task'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 10,
    marginBottom: 14,
    borderRadius: 4,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  choiceButtonActive: {
    backgroundColor: '#0F172A',
  },
  choiceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  choiceButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
