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
import {
  createExpenseOffline,
  updateExpenseOffline,
  deleteExpenseOffline,
} from '../store/expenseSlice';
import { ExpenseCategory } from '../types/expense';

type RouteProps = RouteProp<RootStackParamList, 'ExpenseForm'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export const ExpenseFormScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const existingExpense = route.params?.expense;
  const initialTaskId = route.params?.initialTaskId || existingExpense?.taskId || null;
  const isEditing = Boolean(existingExpense);

  const [title, setTitle] = useState(existingExpense?.title || '');
  const [amount, setAmount] = useState(
    existingExpense ? String(existingExpense.amount) : ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    existingExpense?.category || 'supplies'
  );
  const [date, setDate] = useState(
    existingExpense?.date || new Date().toISOString().slice(0, 10)
  );
  const [receiptNote, setReceiptNote] = useState(
    existingExpense?.receiptNote || ''
  );
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage('Expense title is required');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount');
      return;
    }

    if (isEditing && existingExpense) {
      await dispatch(
        updateExpenseOffline({
          id: existingExpense.id,
          updates: {
            title: title.trim(),
            amount: Math.round(parsedAmount * 100) / 100,
            category,
            date: date.trim(),
            receiptNote: receiptNote.trim() || null,
          },
        })
      );
    } else {
      await dispatch(
        createExpenseOffline({
          taskId: initialTaskId,
          title: title.trim(),
          amount: Math.round(parsedAmount * 100) / 100,
          currency: 'USD',
          category,
          date: date.trim(),
          receiptNote: receiptNote.trim() || null,
          userId: currentUser?.id || 'usr_vineet',
        })
      );
    }

    navigation.goBack();
  };

  const handleDelete = async () => {
    if (existingExpense) {
      await dispatch(deleteExpenseOffline(existingExpense.id));
      navigation.goBack();
    }
  };

  const categories: ExpenseCategory[] = [
    'travel',
    'meals',
    'lodging',
    'equipment',
    'supplies',
    'other',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.screenHeading}>
            {isEditing ? 'Edit Expense' : 'Log Field Expense'}
          </Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {initialTaskId ? (
            <View style={styles.linkedTaskNotice}>
              <Text style={styles.linkedTaskText}>
                Linked to Task ID: {initialTaskId}
              </Text>
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
              placeholder="e.g. Flange gasket kit"
              placeholderTextColor="#94A3B8"
              testID="expense-form-title-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Amount (USD) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={(a) => {
                setAmount(a);
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              testID="expense-form-amount-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.catButton,
                    category === c && styles.catButtonActive,
                  ]}
                  onPress={() => setCategory(c)}
                  testID={`category-select-${c}`}
                >
                  <Text
                    style={[
                      styles.catButtonText,
                      category === c && styles.catButtonTextActive,
                    ]}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-10-29"
              placeholderTextColor="#94A3B8"
              testID="expense-form-date-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Receipt Note / Reference #</Text>
            <TextInput
              style={styles.input}
              value={receiptNote}
              onChangeText={setReceiptNote}
              placeholder="e.g. Home Depot receipt #98234"
              placeholderTextColor="#94A3B8"
              testID="expense-form-receipt-input"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            testID="expense-form-save-button"
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Save Changes' : 'Log Expense'}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              testID="expense-form-delete-button"
            >
              <Text style={styles.deleteButtonText}>Delete Expense</Text>
            </TouchableOpacity>
          )}
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
  linkedTaskNotice: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 14,
  },
  linkedTaskText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  catButtonActive: {
    backgroundColor: '#0F172A',
  },
  catButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catButtonTextActive: {
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
  deleteButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
});
