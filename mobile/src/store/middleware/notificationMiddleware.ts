import { Middleware } from '@reduxjs/toolkit';
import { notificationService } from '@/services/notificationService';
import { expenseApi } from '../services/expenseApi';
import { shoppingApi } from '../services/shoppingApi';
import { todoApi } from '../services/todoApi';
import { householdApi } from '../services/householdApi';

/**
 * Redux middleware that triggers notifications based on successful API mutations
 */
export const notificationMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  // Check if this is a fulfilled RTK Query mutation
  if (typeof action.type === 'string' && action.type.endsWith('/fulfilled')) {
    const state = store.getState();
    const currentUser = state.auth.user;

    // Don't notify for actions by the current user (they already know!)
    // Only notify when other household members perform actions

    try {
      // Expense notifications
      if (expenseApi.endpoints.createExpense.matchFulfilled(action)) {
        const expense = action.payload;
        // created_by is a string ID, not an object
        if (expense.created_by !== currentUser?.id) {
          notificationService.notifyExpenseAdded(
            expense.description,
            expense.amount,
            'A household member'
          );
        }
      }

      if (expenseApi.endpoints.settleExpense.matchFulfilled(action)) {
        const response = action.payload;
        // Notify about settled expenses
        notificationService.notifyExpenseSettled(
          'Expense',
          currentUser?.full_name || currentUser?.email || 'Someone'
        );
      }

      // Shopping list notifications
      if (shoppingApi.endpoints.createShoppingListItem.matchFulfilled(action)) {
        const item = action.payload;
        // created_by might be a string ID, handle both cases
        const createdById = typeof item.created_by === 'string' ? item.created_by : (item.created_by as any)?.id;
        if (createdById && createdById !== currentUser?.id) {
          notificationService.notifyShoppingItemAdded(
            item.name,
            'Shopping List',
            'A household member'
          );
        }
      }

      if (shoppingApi.endpoints.updateShoppingListItem.matchFulfilled(action)) {
        const item = action.payload;
        // Notify if item was marked as purchased by someone else
        const createdById = typeof item.created_by === 'string' ? item.created_by : (item.created_by as any)?.id;
        if (item.is_purchased && createdById && createdById !== currentUser?.id) {
          notificationService.notifyShoppingItemPurchased(
            item.name,
            currentUser?.full_name || currentUser?.email || 'Someone'
          );
        }
      }

      // Todo notifications
      if (todoApi.endpoints.createTodo.matchFulfilled(action)) {
        const todo = action.payload;
        // Notify the assigned person (assigned_to_id is a string ID)
        if (todo.assigned_to_id && todo.assigned_to_id !== currentUser?.id) {
          notificationService.notifyTodoAssigned(
            todo.title,
            currentUser?.full_name || currentUser?.email || 'Someone'
          );
        }
      }

      if (todoApi.endpoints.updateTodo.matchFulfilled(action)) {
        const todo = action.payload;
        // Notify when someone completes a todo (created_by is a string ID)
        if (todo.status === 'completed' && todo.created_by !== currentUser?.id) {
          notificationService.notifyTodoCompleted(
            todo.title,
            currentUser?.full_name || currentUser?.email || 'Someone'
          );
        }
      }

      // Household notifications
      if (householdApi.endpoints.createInvite.matchFulfilled(action)) {
        // The invitation email itself will notify the invitee
        // This could be extended to notify current household members
        console.log('Member invited to household');
      }

      if (householdApi.endpoints.joinHousehold.matchFulfilled(action)) {
        const household = action.payload;
        if (currentUser) {
          notificationService.notifyMemberJoined(
            currentUser.full_name || currentUser.email,
            household.name
          );
        }
      }
    } catch (error) {
      // Silently fail - notifications shouldn't break app functionality
      console.error('Notification error:', error);
    }
  }

  return result;
};
