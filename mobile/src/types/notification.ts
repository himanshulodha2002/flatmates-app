export type NotificationType =
  | 'expense_added'
  | 'expense_settled'
  | 'shopping_item_added'
  | 'shopping_item_purchased'
  | 'todo_assigned'
  | 'todo_completed'
  | 'household_invitation'
  | 'member_joined';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationChannelConfig {
  id: string;
  name: string;
  importance: number;
  sound?: boolean;
  vibrate?: boolean;
}
