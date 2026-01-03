import { HouseholdMember, HouseholdWithMembers, MemberRole, User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getData, saveData } from './storage';

const OFFLINE_MODE_KEY = 'offline_mode_enabled';
const OFFLINE_USER_KEY = 'offline_user';
const OFFLINE_HOUSEHOLD_KEY = 'offline_household';

/**
 * Check if offline mode is enabled
 */
export const isOfflineModeEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking offline mode:', error);
    return false;
  }
};

/**
 * Enable offline mode and create default user and household
 */
export const enableOfflineMode = async (): Promise<{
  user: User;
  household: HouseholdWithMembers;
}> => {
  try {
    const now = new Date().toISOString();
    const userId = 'offline-user-' + Date.now();
    const householdId = 'offline-household-' + Date.now();

    // Create default offline user
    const offlineUser: User = {
      id: userId,
      email: 'offline@flatmates.local',
      full_name: 'Offline User',
      google_id: 'offline',
      profile_picture_url: undefined,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    // Create default household member
    const member: HouseholdMember = {
      id: `member-${userId}`,
      user_id: userId,
      role: MemberRole.OWNER,
      joined_at: now,
      email: offlineUser.email,
      full_name: offlineUser.full_name,
      profile_picture_url: offlineUser.profile_picture_url,
    };

    // Create default offline household
    const offlineHousehold: HouseholdWithMembers = {
      id: householdId,
      name: 'My Flat',
      created_by: userId,
      created_at: now,
      members: [member],
    };

    // Save to AsyncStorage
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, 'true');
    await saveData(OFFLINE_USER_KEY, offlineUser);
    await saveData(OFFLINE_HOUSEHOLD_KEY, offlineHousehold);

    console.log('Offline mode enabled with default user and household');

    return {
      user: offlineUser,
      household: offlineHousehold,
    };
  } catch (error) {
    console.error('Error enabling offline mode:', error);
    throw error;
  }
};

/**
 * Disable offline mode and clear offline data
 */
export const disableOfflineMode = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, 'false');
    await AsyncStorage.removeItem(OFFLINE_USER_KEY);
    await AsyncStorage.removeItem(OFFLINE_HOUSEHOLD_KEY);
    console.log('Offline mode disabled');
  } catch (error) {
    console.error('Error disabling offline mode:', error);
    throw error;
  }
};

/**
 * Get offline user
 */
export const getOfflineUser = async (): Promise<User | null> => {
  try {
    return await getData<User>(OFFLINE_USER_KEY);
  } catch (error) {
    console.error('Error getting offline user:', error);
    return null;
  }
};

/**
 * Get offline household
 */
export const getOfflineHousehold = async (): Promise<HouseholdWithMembers | null> => {
  try {
    return await getData<HouseholdWithMembers>(OFFLINE_HOUSEHOLD_KEY);
  } catch (error) {
    console.error('Error getting offline household:', error);
    return null;
  }
};

/**
 * Update offline user
 */
export const updateOfflineUser = async (updates: Partial<User>): Promise<User> => {
  try {
    const currentUser = await getOfflineUser();
    if (!currentUser) {
      throw new Error('No offline user found');
    }

    const updatedUser: User = {
      ...currentUser,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await saveData(OFFLINE_USER_KEY, updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating offline user:', error);
    throw error;
  }
};

/**
 * Update offline household
 */
export const updateOfflineHousehold = async (
  updates: Partial<HouseholdWithMembers>
): Promise<HouseholdWithMembers> => {
  try {
    const currentHousehold = await getOfflineHousehold();
    if (!currentHousehold) {
      throw new Error('No offline household found');
    }

    const updatedHousehold: HouseholdWithMembers = {
      ...currentHousehold,
      ...updates,
    };

    await saveData(OFFLINE_HOUSEHOLD_KEY, updatedHousehold);
    return updatedHousehold;
  } catch (error) {
    console.error('Error updating offline household:', error);
    throw error;
  }
};
