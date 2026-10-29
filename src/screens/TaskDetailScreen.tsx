import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateTaskOffline, deleteTaskOffline } from '../store/taskSlice';
import { TaskStatus } from '../types/task';
import { formatDate } from '../utils/date';

type RouteProps = RouteProp<RootStackParamList, 'TaskDetail'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export const TaskDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const dispatch = useAppDispatch();

  const { task: initialTask } = route.params;
  const currentTask = useAppSelector((state) =>
    state.tasks.tasks.find((t) => t.id === initialTask.id) || initialTask
  );

  const handleStatusChange = (newStatus: TaskStatus) => {
    dispatch(
      updateTaskOffline({
        id: currentTask.id,
        updates: { status: newStatus },
      })
    );
  };

  const handleEdit = () => {
    navigation.navigate('TaskForm', { task: currentTask });
  };

  const handleAddExpense = () => {
    navigation.navigate('ExpenseForm', { initialTaskId: currentTask.id });
  };

  const handleDelete = () => {
    const confirmDelete = () => {
      dispatch(deleteTaskOffline(currentTask.id));
      navigation.goBack();
    };

    if (Alert && Alert.alert) {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    } else {
      confirmDelete();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentTask.title}</Text>
          {currentTask.isDirty && (
            <View style={styles.dirtyBadge}>
              <Text style={styles.dirtyText}>Unsynced changes</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Priority</Text>
            <Text style={styles.metaValue}>{currentTask.priority.toUpperCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{currentTask.location || 'None'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{formatDate(currentTask.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusButtons}>
            {(['pending', 'in_progress', 'completed'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusButton,
                  currentTask.status === st && styles.statusButtonActive,
                ]}
                onPress={() => handleStatusChange(st)}
                testID={`status-select-${st}`}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    currentTask.status === st && styles.statusButtonTextActive,
                  ]}
                >
                  {st === 'in_progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {currentTask.description || 'No description provided.'}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={handleAddExpense}
            testID="task-add-expense-button"
          >
            <Text style={styles.actionButtonSecondaryText}>+ Log Expense for Task</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              testID="task-edit-button"
            >
              <Text style={styles.editButtonText}>Edit Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              testID="task-delete-button"
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  dirtyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dirtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#0F172A',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  actionsContainer: {
    marginTop: 12,
    gap: 10,
  },
  actionButtonSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
});
