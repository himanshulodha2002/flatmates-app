/**
 * Local data service for offline mode
 * Provides CRUD operations for todos, shopping lists, and expenses using AsyncStorage
 */

import { saveData, getData } from '../utils/storage';
import {
  Todo,
  TodoCreateRequest,
  TodoUpdateRequest,
  ShoppingList,
  ShoppingListItem,
  ShoppingListCreateRequest,
  ShoppingListItemCreateRequest,
  Expense,
  ExpenseCreate,
  TodoStatus,
} from '@/types';

const TODOS_KEY = 'offline_todos';
const SHOPPING_LISTS_KEY = 'offline_shopping_lists';
const SHOPPING_ITEMS_KEY = 'offline_shopping_items';
const EXPENSES_KEY = 'offline_expenses';

// ============ TODO OPERATIONS ============

export const getLocalTodos = async (householdId: string): Promise<Todo[]> => {
  try {
    const todos = await getData<Todo[]>(TODOS_KEY);
    if (!todos) return [];
    return todos.filter((todo) => todo.household_id === householdId);
  } catch (error) {
    console.error('Error getting local todos:', error);
    return [];
  }
};

export const createLocalTodo = async (
  request: TodoCreateRequest,
  userId: string
): Promise<Todo> => {
  try {
    const todos = (await getData<Todo[]>(TODOS_KEY)) || [];
    const now = new Date().toISOString();

    const newTodo: Todo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      household_id: request.household_id,
      title: request.title,
      description: request.description,
      status: TodoStatus.PENDING,
      priority: request.priority || 'medium' as any,
      due_date: request.due_date,
      assigned_to_id: request.assigned_to_id,
      created_by: userId,
      recurring_pattern: request.recurring_pattern,
      recurring_until: request.recurring_until,
      created_at: now,
      updated_at: now,
    };

    todos.push(newTodo);
    await saveData(TODOS_KEY, todos);
    return newTodo;
  } catch (error) {
    console.error('Error creating local todo:', error);
    throw error;
  }
};

export const updateLocalTodo = async (
  todoId: string,
  updates: TodoUpdateRequest
): Promise<Todo> => {
  try {
    const todos = (await getData<Todo[]>(TODOS_KEY)) || [];
    const index = todos.findIndex((t) => t.id === todoId);

    if (index === -1) {
      throw new Error('Todo not found');
    }

    const updatedTodo = {
      ...todos[index],
      ...updates,
      updated_at: new Date().toISOString(),
      ...(updates.status === TodoStatus.COMPLETED && !todos[index].completed_at
        ? { completed_at: new Date().toISOString() }
        : {}),
    };

    todos[index] = updatedTodo;
    await saveData(TODOS_KEY, todos);
    return updatedTodo;
  } catch (error) {
    console.error('Error updating local todo:', error);
    throw error;
  }
};

export const deleteLocalTodo = async (todoId: string): Promise<void> => {
  try {
    const todos = (await getData<Todo[]>(TODOS_KEY)) || [];
    const filtered = todos.filter((t) => t.id !== todoId);
    await saveData(TODOS_KEY, filtered);
  } catch (error) {
    console.error('Error deleting local todo:', error);
    throw error;
  }
};

// ============ SHOPPING LIST OPERATIONS ============

export const getLocalShoppingLists = async (householdId: string): Promise<ShoppingList[]> => {
  try {
    const lists = await getData<ShoppingList[]>(SHOPPING_LISTS_KEY);
    if (!lists) return [];
    return lists.filter((list) => list.household_id === householdId);
  } catch (error) {
    console.error('Error getting local shopping lists:', error);
    return [];
  }
};

export const createLocalShoppingList = async (
  request: ShoppingListCreateRequest,
  userId: string
): Promise<ShoppingList> => {
  try {
    const lists = (await getData<ShoppingList[]>(SHOPPING_LISTS_KEY)) || [];
    const now = new Date().toISOString();

    const newList: ShoppingList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      household_id: request.household_id,
      name: request.name,
      description: request.description,
      status: 'active' as any,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    lists.push(newList);
    await saveData(SHOPPING_LISTS_KEY, lists);
    return newList;
  } catch (error) {
    console.error('Error creating local shopping list:', error);
    throw error;
  }
};

export const getLocalShoppingItems = async (listId: string): Promise<ShoppingListItem[]> => {
  try {
    const items = await getData<ShoppingListItem[]>(SHOPPING_ITEMS_KEY);
    if (!items) return [];
    return items.filter((item) => item.shopping_list_id === listId);
  } catch (error) {
    console.error('Error getting local shopping items:', error);
    return [];
  }
};

export const createLocalShoppingItem = async (
  listId: string,
  request: ShoppingListItemCreateRequest,
  userId: string
): Promise<ShoppingListItem> => {
  try {
    const items = (await getData<ShoppingListItem[]>(SHOPPING_ITEMS_KEY)) || [];
    const now = new Date().toISOString();

    const newItem: ShoppingListItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shopping_list_id: listId,
      name: request.name,
      quantity: request.quantity || 1,
      unit: request.unit,
      category: request.category,
      is_purchased: false,
      assigned_to_id: request.assigned_to_id,
      price: request.price,
      notes: request.notes,
      is_recurring: request.is_recurring || false,
      recurring_pattern: request.recurring_pattern,
      recurring_until: request.recurring_until,
      position: request.position || items.length,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    items.push(newItem);
    await saveData(SHOPPING_ITEMS_KEY, items);
    return newItem;
  } catch (error) {
    console.error('Error creating local shopping item:', error);
    throw error;
  }
};

export const updateLocalShoppingItem = async (
  itemId: string,
  updates: Partial<ShoppingListItem>
): Promise<ShoppingListItem> => {
  try {
    const items = (await getData<ShoppingListItem[]>(SHOPPING_ITEMS_KEY)) || [];
    const index = items.findIndex((i) => i.id === itemId);

    if (index === -1) {
      throw new Error('Shopping item not found');
    }

    const updatedItem = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    items[index] = updatedItem;
    await saveData(SHOPPING_ITEMS_KEY, items);
    return updatedItem;
  } catch (error) {
    console.error('Error updating local shopping item:', error);
    throw error;
  }
};

export const deleteLocalShoppingItem = async (itemId: string): Promise<void> => {
  try {
    const items = (await getData<ShoppingListItem[]>(SHOPPING_ITEMS_KEY)) || [];
    const filtered = items.filter((i) => i.id !== itemId);
    await saveData(SHOPPING_ITEMS_KEY, filtered);
  } catch (error) {
    console.error('Error deleting local shopping item:', error);
    throw error;
  }
};

// ============ EXPENSE OPERATIONS ============

export const getLocalExpenses = async (householdId: string): Promise<Expense[]> => {
  try {
    const expenses = await getData<Expense[]>(EXPENSES_KEY);
    if (!expenses) return [];
    return expenses.filter((expense) => expense.household_id === householdId);
  } catch (error) {
    console.error('Error getting local expenses:', error);
    return [];
  }
};

export const createLocalExpense = async (
  request: ExpenseCreate,
  userId: string,
  userName: string,
  userEmail: string
): Promise<Expense> => {
  try {
    const expenses = (await getData<Expense[]>(EXPENSES_KEY)) || [];
    const now = new Date().toISOString();

    const newExpense: Expense = {
      id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      household_id: request.household_id,
      created_by: userId,
      amount: request.amount,
      description: request.description,
      category: request.category || 'other' as any,
      payment_method: request.payment_method || 'cash' as any,
      date: request.date || now,
      split_type: request.split_type || 'equal' as any,
      is_personal: request.is_personal || false,
      created_at: now,
      updated_at: now,
      creator_name: userName,
      creator_email: userEmail,
    };

    expenses.push(newExpense);
    await saveData(EXPENSES_KEY, expenses);
    return newExpense;
  } catch (error) {
    console.error('Error creating local expense:', error);
    throw error;
  }
};

export const deleteLocalExpense = async (expenseId: string): Promise<void> => {
  try {
    const expenses = (await getData<Expense[]>(EXPENSES_KEY)) || [];
    const filtered = expenses.filter((e) => e.id !== expenseId);
    await saveData(EXPENSES_KEY, filtered);
  } catch (error) {
    console.error('Error deleting local expense:', error);
    throw error;
  }
};
