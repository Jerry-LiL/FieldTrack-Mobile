import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Task, TaskStatus } from '../types/task';
import { TaskCard, TASK_CARD_HEIGHT } from '../components/TaskCard';
import { SyncStatusBar } from '../components/SyncStatusBar';
import { triggerFullSync } from '../store/syncSlice';
import { seedTasksBenchmark, loadTasksFromDisk } from '../store/taskSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TaskListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadTasksFromDisk());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(triggerFullSync());
    setRefreshing(false);
  }, [dispatch]);

  const handleSeedTasks = useCallback(async () => {
    await dispatch(seedTasksBenchmark(1000));
  }, [dispatch]);

  const handlePressTask = useCallback(
    (task: Task) => {
      navigation.navigate('TaskDetail', { task });
    },
    [navigation]
  );

  const handleCreateTask = useCallback(() => {
    navigation.navigate('TaskForm', {});
  }, [navigation]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q)
      );
    });
  }, [tasks, searchQuery, statusFilter]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: TASK_CARD_HEIGHT,
      offset: TASK_CARD_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskCard task={item} onPress={handlePressTask} />
    ),
    [handlePressTask]
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  return (
    <View style={styles.container}>
      <SyncStatusBar />

      {/* Search and Action Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, location..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="task-search-input"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateTask}
          testID="add-task-button"
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips & Seed Tool */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            style={[
              styles.filterChip,
              statusFilter === st && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(st)}
            testID={`filter-chip-${st}`}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === st && styles.filterChipTextActive,
              ]}
            >
              {st === 'all'
                ? 'All'
                : st === 'in_progress'
                ? 'In Progress'
                : st.charAt(0).toUpperCase() + st.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.seedChip}
          onPress={handleSeedTasks}
          testID="seed-tasks-button"
        >
          <Text style={styles.seedChipText}>Seed 1k</Text>
        </TouchableOpacity>
      </View>

      {/* List count indicator */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Showing {filteredTasks.length} of {tasks.length} tasks
        </Text>
      </View>

      {/* Tuned Virtualized FlatList */}
      <FlatList
        data={filteredTasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={15}
        windowSize={7}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer} testID="task-list-empty">
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try matching a different query or clear filters'
                : 'Tap "+ New" or "Seed 1k" to populate tasks'}
            </Text>
          </View>
        }
        testID="task-flat-list"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  seedChip: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  seedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
  },
  countText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
