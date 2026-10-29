import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpenseCategory, ExpenseSummaryCategory } from '../types/expense';
import { formatCurrency } from '../utils/currency';

interface Props {
  summary: ExpenseSummaryCategory;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  travel: '#3B82F6',
  meals: '#F59E0B',
  lodging: '#8B5CF6',
  equipment: '#10B981',
  supplies: '#EC4899',
  other: '#64748B',
};

export const CategoryProgressBar: React.FC<Props> = ({ summary }) => {
  const color = CATEGORY_COLORS[summary.category] || '#64748B';
  const categoryLabel = summary.category.charAt(0).toUpperCase() + summary.category.slice(1);

  return (
    <View style={styles.container} testID={`category-summary-${summary.category}`}>
      <View style={styles.labelRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.categoryName}>{categoryLabel}</Text>
          <Text style={styles.countText}>({summary.count})</Text>
        </View>
        <View style={styles.amountGroup}>
          <Text style={styles.amountText}>{formatCurrency(summary.total)}</Text>
          <Text style={styles.percentText}>{summary.percentage.toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(0, summary.percentage))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 6,
  },
  countText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  amountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  percentText: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 42,
    textAlign: 'right',
  },
  track: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
