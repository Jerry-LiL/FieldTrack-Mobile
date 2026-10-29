import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

export const EXPENSE_CARD_HEIGHT = 88;

interface Props {
  expense: Expense;
  onPress: (expense: Expense) => void;
}

export const ExpenseCard: React.FC<Props> = React.memo(({ expense, onPress }) => {
  const getCategoryColor = (category: Expense['category']) => {
    switch (category) {
      case 'travel':
        return '#3B82F6';
      case 'meals':
        return '#F59E0B';
      case 'lodging':
        return '#8B5CF6';
      case 'equipment':
        return '#10B981';
      case 'supplies':
        return '#EC4899';
      case 'other':
      default:
        return '#64748B';
    }
  };

  const catColor = getCategoryColor(expense.category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(expense)}
      activeOpacity={0.7}
      testID={`expense-card-${expense.id}`}
    >
      <View style={styles.topRow}>
        <View style={styles.leftTitleGroup}>
          <View style={[styles.categoryIndicator, { backgroundColor: catColor }]} />
          <Text style={styles.title} numberOfLines={1}>
            {expense.title}
          </Text>
        </View>
        <Text style={styles.amount}>
          {formatCurrency(expense.amount, expense.currency)}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.tagsRow}>
          <Text style={[styles.categoryTag, { color: catColor }]}>
            {expense.category.toUpperCase()}
          </Text>
          {expense.receiptNote && (
            <Text style={styles.receiptNote} numberOfLines={1}>
              {expense.receiptNote}
            </Text>
          )}
        </View>

        <Text style={styles.date}>{formatDate(expense.date)}</Text>
      </View>
    </TouchableOpacity>
  );
});

ExpenseCard.displayName = 'ExpenseCard';

const styles = StyleSheet.create({
  card: {
    height: EXPENSE_CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryIndicator: {
    width: 6,
    height: 18,
    borderRadius: 3,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 8,
  },
  receiptNote: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
