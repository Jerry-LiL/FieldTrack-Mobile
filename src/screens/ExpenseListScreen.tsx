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
import { Expense, ExpenseCategory } from '../types/expense';
import { ExpenseCard, EXPENSE_CARD_HEIGHT } from '../components/ExpenseCard';
import { SyncStatusBar } from '../components/SyncStatusBar';
import { triggerFullSync } from '../store/syncSlice';
import {
  loadExpensesFromDisk,
  seedExpensesBenchmark,
} from '../store/expenseSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ExpenseListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { expenses, isLoading } = useAppSelector((state) => state.expenses);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadExpensesFromDisk());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(triggerFullSync());
    setRefreshing(false);
  }, [dispatch]);

  const handleSeedExpenses = useCallback(async () => {
    await dispatch(seedExpensesBenchmark(500));
  }, [dispatch]);

  const handlePressExpense = useCallback(
    (expense: Expense) => {
      navigation.navigate('ExpenseForm', { expense });
    },
    [navigation]
  );

  const handleCreateExpense = useCallback(() => {
    navigation.navigate('ExpenseForm', {});
  }, [navigation]);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        (e.receiptNote && e.receiptNote.toLowerCase().includes(q))
      );
    });
  }, [expenses, searchQuery, categoryFilter]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: EXPENSE_CARD_HEIGHT,
      offset: EXPENSE_CARD_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseCard expense={item} onPress={handlePressExpense} />
    ),
    [handlePressExpense]
  );

  const keyExtractor = useCallback((item: Expense) => item.id, []);

  return (
    <View style={styles.container}>
      <SyncStatusBar />

      {/* Search and Action Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses or receipts..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="expense-search-input"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateExpense}
          testID="add-expense-button"
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'travel', 'meals', 'equipment', 'supplies'] as const).map(
          (cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                categoryFilter === cat && styles.filterChipActive,
              ]}
              onPress={() => setCategoryFilter(cat)}
              testID={`filter-chip-${cat}`}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === cat && styles.filterChipTextActive,
                ]}
              >
                {cat === 'all'
                  ? 'All'
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={styles.seedChip}
          onPress={handleSeedExpenses}
          testID="seed-expenses-button"
        >
          <Text style={styles.seedChipText}>Seed 500</Text>
        </TouchableOpacity>
      </View>

      {/* Count Bar */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Showing {filteredExpenses.length} of {expenses.length} records
        </Text>
      </View>

      {/* Tuned Virtualized FlatList */}
      <FlatList
        data={filteredExpenses}
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
          <View style={styles.emptyContainer} testID="expense-list-empty">
            <Text style={styles.emptyTitle}>No expenses recorded</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ New" to log an expense or "Seed 500" for test data
            </Text>
          </View>
        }
        testID="expense-flat-list"
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
