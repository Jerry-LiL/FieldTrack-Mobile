import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../types/task';
import { formatDate } from '../utils/date';

export const TASK_CARD_HEIGHT = 92;

interface Props {
  task: Task;
  onPress: (task: Task) => void;
}

export const TaskCard: React.FC<Props> = React.memo(({ task, onPress }) => {
  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'medium':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'low':
      default:
        return { bg: '#E0E7FF', text: '#3730A3' };
    }
  };

  const getStatusStyle = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46', label: 'Completed' };
      case 'in_progress':
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'In Progress' };
      case 'pending':
      default:
        return { bg: '#F3F4F6', text: '#374151', label: 'Pending' };
    }
  };

  const priorityStyle = getPriorityStyle(task.priority);
  const statusStyle = getStatusStyle(task.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
      testID={`task-card-${task.id}`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {task.title}
        </Text>
        {task.isDirty && (
          <View style={styles.dirtyBadge}>
            <Text style={styles.dirtyText}>Offline edit</Text>
          </View>
        )}
      </View>

      <Text style={styles.location} numberOfLines={1}>
        {task.location || 'No location set'}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: priorityStyle.bg }]}>
            <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
              {task.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.dueDate}>
          {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

TaskCard.displayName = 'TaskCard';

const styles = StyleSheet.create({
  card: {
    height: TASK_CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  dirtyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dirtyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  location: {
    fontSize: 13,
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
