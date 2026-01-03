import { NotificationType } from '@/types/notification';
import * as Notifications from 'expo-notifications';

class NotificationService {
  /**
   * Send a local notification
   */
  async sendNotification(
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    // Get channel ID for notification type
    this.getChannelIdForType(type);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type, ...data },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Notification helpers for specific events
   */
  async notifyExpenseAdded(expenseName: string, amount: number, createdBy: string) {
    await this.sendNotification(
      'expense_added',
      'New Expense Added',
      `${createdBy} added "${expenseName}" for $${amount.toFixed(2)}`,
      { expenseName, amount, createdBy }
    );
  }

  async notifyExpenseSettled(expenseName: string, settledBy: string) {
    await this.sendNotification(
      'expense_settled',
      'Expense Settled',
      `${settledBy} settled "${expenseName}"`,
      { expenseName, settledBy }
    );
  }

  async notifyShoppingItemAdded(itemName: string, listName: string, addedBy: string) {
    await this.sendNotification(
      'shopping_item_added',
      'Shopping Item Added',
      `${addedBy} added "${itemName}" to ${listName}`,
      { itemName, listName, addedBy }
    );
  }

  async notifyShoppingItemPurchased(itemName: string, purchasedBy: string) {
    await this.sendNotification(
      'shopping_item_purchased',
      'Item Purchased',
      `${purchasedBy} purchased "${itemName}"`,
      { itemName, purchasedBy }
    );
  }

  async notifyTodoAssigned(todoTitle: string, assignedBy: string) {
    await this.sendNotification(
      'todo_assigned',
      'New Task Assigned',
      `${assignedBy} assigned you "${todoTitle}"`,
      { todoTitle, assignedBy }
    );
  }

  async notifyTodoCompleted(todoTitle: string, completedBy: string) {
    await this.sendNotification(
      'todo_completed',
      'Task Completed',
      `${completedBy} completed "${todoTitle}"`,
      { todoTitle, completedBy }
    );
  }

  async notifyHouseholdInvitation(householdName: string, invitedBy: string) {
    await this.sendNotification(
      'household_invitation',
      'Household Invitation',
      `${invitedBy} invited you to join "${householdName}"`,
      { householdName, invitedBy }
    );
  }

  async notifyMemberJoined(memberName: string, householdName: string) {
    await this.sendNotification(
      'member_joined',
      'New Member Joined',
      `${memberName} joined "${householdName}"`,
      { memberName, householdName }
    );
  }

  /**
   * Get the appropriate notification channel for a notification type
   */
  private getChannelIdForType(type: NotificationType): string {
    if (type.startsWith('expense')) return 'expenses';
    if (type.startsWith('shopping')) return 'shopping';
    if (type.startsWith('todo')) return 'todos';
    return 'household';
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Set badge count (iOS mainly, also works on some Android launchers)
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge count
   */
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }
}

export const notificationService = new NotificationService();
