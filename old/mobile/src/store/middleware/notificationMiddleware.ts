import { notificationService } from '@/services/notificationService';
import { Middleware } from '@reduxjs/toolkit';
import { expenseApi } from '../services/expenseApi';
import { householdApi } from '../services/householdApi';
import { shoppingApi } from '../services/shoppingApi';
import { todoApi } from '../services/todoApi';

/**
 * Redux middleware that triggers notifications based on successful API mutations
 */
export const notificationMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  // Check if this is a fulfilled RTK Query mutation
  if (action.type?.endsWith('/fulfilled')) {
    const state = store.getState();
    const currentUser = state.auth.user;

    // Don't notify for actions by the current user (they already know!)
    // Only notify when other household members perform actions

    try {
      // Expense notifications
      if (expenseApi.endpoints.createExpense.matchFulfilled(action)) {
        const expense = action.payload;
        if (expense.created_by !== currentUser?.id) {
          notificationService.notifyExpenseAdded(
            expense.description,
            expense.amount,
            expense.creator_name || expense.creator_email || 'Someone'
          );
        }
      }

      if (expenseApi.endpoints.settleExpense.matchFulfilled(action)) {
        // SettlementResponse doesn't need user_id check for now
        notificationService.notifyExpenseSettled(
          'Expense',
          currentUser?.full_name || currentUser?.email || 'Someone'
        );
      }

      // Shopping list notifications
      if (shoppingApi.endpoints.createShoppingListItem.matchFulfilled(action)) {
        const item = action.payload;
        if (item.created_by !== currentUser?.id) {
          notificationService.notifyShoppingItemAdded(item.name, 'Shopping List', 'Someone');
        }
      }

      if (shoppingApi.endpoints.updateShoppingListItem.matchFulfilled(action)) {
        const item = action.payload;
        // Notify if item was marked as purchased by someone else
        if (item.is_purchased && item.created_by !== currentUser?.id) {
          notificationService.notifyShoppingItemPurchased(
            item.name,
            currentUser?.full_name || currentUser?.email || 'Someone'
          );
        }
      }

      // Todo notifications
      if (todoApi.endpoints.createTodo.matchFulfilled(action)) {
        const todo = action.payload;
        // Notify the assigned person
        if (todo.assigned_to_id && todo.assigned_to_id !== currentUser?.id) {
          notificationService.notifyTodoAssigned(
            todo.title,
            currentUser?.full_name || currentUser?.email || 'Someone'
          );
        }
      }

      if (todoApi.endpoints.updateTodo.matchFulfilled(action)) {
        const todo = action.payload;
        // Notify when someone completes a todo
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
