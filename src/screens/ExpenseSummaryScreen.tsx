import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { calculateExpenseSummary } from '../store/expenseSlice';
import { StatCard } from '../components/StatCard';
import { CategoryProgressBar } from '../components/CategoryProgressBar';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { SyncStatusBar } from '../components/SyncStatusBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DateFilter = 'all' | 'this_month' | 'this_week';

export const ExpenseSummaryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const expenses = useAppSelector((state) => state.expenses.expenses);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredExpenses = useMemo(() => {
    if (dateFilter === 'all') return expenses;
    const now = new Date();

    if (dateFilter === 'this_month') {
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
      return expenses.filter((e) => (e.date || '').startsWith(currentMonth));
    }

    if (dateFilter === 'this_week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      return expenses.filter((e) => (e.date || '') >= sevenDaysAgo);
    }

    return expenses;
  }, [expenses, dateFilter]);

  const summary = useMemo(
    () => calculateExpenseSummary(filteredExpenses),
    [filteredExpenses]
  );

  const averageExpense = useMemo(() => {
    if (summary.totalCount === 0) return 0;
    return Math.round((summary.totalAmount / summary.totalCount) * 100) / 100;
  }, [summary]);

  const recentExpenses = useMemo(() => {
    return [...filteredExpenses]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [filteredExpenses]);

  return (
    <ScrollView style={styles.container}>
      <SyncStatusBar />

      {/* Date Filter Bar */}
      <View style={styles.filterRow}>
        {(['all', 'this_month', 'this_week'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              dateFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setDateFilter(filter)}
            testID={`summary-filter-${filter}`}
          >
            <Text
              style={[
                styles.filterTabText,
                dateFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter === 'all'
                ? 'All Time'
                : filter === 'this_month'
                ? 'This Month'
                : 'Last 7 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {/* KPI Summary Cards */}
        <View style={styles.statsRow}>
          <StatCard
            title="Total Spending"
            value={formatCurrency(summary.totalAmount)}
            subtitle={`${summary.totalCount} logged expenses`}
          />
          <StatCard
            title="Avg per Expense"
            value={formatCurrency(averageExpense)}
            subtitle="Across categories"
          />
        </View>

        {/* Category Breakdown Card */}
        <View style={styles.card} testID="expense-category-breakdown-card">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>
            <Text style={styles.cardSubtitle}>Share of field expenses</Text>
          </View>

          {summary.totalCount === 0 ? (
            <Text style={styles.noDataText}>No expenses recorded for this period.</Text>
          ) : (
            summary.categories.map((catSummary) => (
              <CategoryProgressBar
                key={catSummary.category}
                summary={catSummary}
              />
            ))
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ExpenseForm', {})}
              testID="summary-add-expense-button"
            >
              <Text style={styles.addLink}>+ Log Expense</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length === 0 ? (
            <Text style={styles.noDataText}>No recent expense transactions.</Text>
          ) : (
            recentExpenses.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.recentItem}
                onPress={() => navigation.navigate('ExpenseForm', { expense: e })}
              >
                <View style={styles.recentItemLeft}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={styles.recentDate}>
                    {e.category.toUpperCase()} • {formatDate(e.date)}
                  </Text>
                </View>
                <Text style={styles.recentAmount}>
                  {formatCurrency(e.amount, e.currency)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#0F172A',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  addLink: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 13,
    color: '#94A3B8',
    paddingVertical: 12,
    textAlign: 'center',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recentItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  recentDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
});
