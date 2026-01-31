import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import {
  List,
  Button,
  Text,
  ActivityIndicator,
  Divider,
  Dialog,
  Portal,
  TextInput,
  Snackbar,
  Menu,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  useGetHouseholdDetailsQuery,
  useCreateInviteMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from '@/store/services/householdApi';
import { useSelector } from 'react-redux';
import { selectActiveHouseholdId } from '@/store/slices/householdSlice';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { MemberRole } from '@/types';

export default function MembersScreen() {
  const router = useRouter();
  const activeHouseholdId = useSelector(selectActiveHouseholdId);
  const currentUser = useSelector(selectCurrentUser);
  const { data: household, isLoading } = useGetHouseholdDetailsQuery(activeHouseholdId || '', {
    skip: !activeHouseholdId,
  });

  const [createInvite, { isLoading: isCreatingInvite }] = useCreateInviteMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();

  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const isOwner = household?.members.find(
    (m) => m.user_id === currentUser?.id && m.role === MemberRole.OWNER
  );

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim() || !activeHouseholdId) return;

    try {
      const result = await createInvite({
        householdId: activeHouseholdId,
        data: { email: inviteEmail.trim() },
      }).unwrap();

      setInviteDialogVisible(false);
      setInviteEmail('');

      // Share the invite token
      Share.share({
        message: `Join our household on Flatmates App!\n\nInvite Token: ${result.token}\n\nThis invite expires on ${new Date(
          result.expires_at
        ).toLocaleDateString()}`,
        title: 'Household Invite',
      });
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to create invite');
      setSnackbarVisible(true);
    }
  };

  const handlePromoteMember = async (memberId: string) => {
    if (!activeHouseholdId) return;

    try {
      await updateMemberRole({
        householdId: activeHouseholdId,
        memberId,
        data: { role: MemberRole.OWNER },
      }).unwrap();
      setSnackbarMessage('Member promoted to owner');
      setSnackbarVisible(true);
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to promote member');
      setSnackbarVisible(true);
    }
    setMenuVisible(null);
  };

  const handleDemoteMember = async (memberId: string) => {
    if (!activeHouseholdId) return;

    try {
      await updateMemberRole({
        householdId: activeHouseholdId,
        memberId,
        data: { role: MemberRole.MEMBER },
      }).unwrap();
      setSnackbarMessage('Member demoted to regular member');
      setSnackbarVisible(true);
    } catch (error: any) {
      setSnackbarMessage(error?.data?.detail || 'Failed to demote member');
      setSnackbarVisible(true);
    }
    setMenuVisible(null);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!activeHouseholdId) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember({
                householdId: activeHouseholdId,
                memberId,
              }).unwrap();
              setSnackbarMessage('Member removed');
              setSnackbarVisible(true);
            } catch (error: any) {
              setSnackbarMessage(error?.data?.detail || 'Failed to remove member');
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
    setMenuVisible(null);
  };

  if (!activeHouseholdId) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          No household selected
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/household-switcher')}
          style={styles.button}
        >
          Select Household
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {household?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {household?.members.length} member{household?.members.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {household?.members.map((member) => (
          <React.Fragment key={member.id}>
            <List.Item
              title={member.full_name}
              description={`${member.email} • ${
                member.role === MemberRole.OWNER ? 'Owner' : 'Member'
              }`}
              left={(props) =>
                member.profile_picture_url ? (
                  <Avatar.Image {...props} source={{ uri: member.profile_picture_url }} size={40} />
                ) : (
                  <Avatar.Text
                    {...props}
                    label={member.full_name.substring(0, 2).toUpperCase()}
                    size={40}
                  />
                )
              }
              right={() =>
                isOwner && member.user_id !== currentUser?.id ? (
                  <Menu
                    visible={menuVisible === member.id}
                    onDismiss={() => setMenuVisible(null)}
                    anchor={
                      <IconButton icon="dots-vertical" onPress={() => setMenuVisible(member.id)} />
                    }
                  >
                    {member.role === MemberRole.MEMBER ? (
                      <Menu.Item
                        onPress={() => handlePromoteMember(member.id)}
                        title="Promote to Owner"
                        leadingIcon="crown"
                      />
                    ) : (
                      <Menu.Item
                        onPress={() => handleDemoteMember(member.id)}
                        title="Demote to Member"
                        leadingIcon="account-arrow-down"
                      />
                    )}
                    <Menu.Item
                      onPress={() => handleRemoveMember(member.id, member.full_name)}
                      title="Remove Member"
                      leadingIcon="account-remove"
                    />
                  </Menu>
                ) : null
              }
              style={styles.item}
            />
            <Divider />
          </React.Fragment>
        ))}
      </ScrollView>

      {isOwner && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => setInviteDialogVisible(true)}
            style={styles.button}
            icon="account-plus"
          >
            Invite Member
          </Button>
        </View>
      )}

      <Portal>
        <Dialog visible={inviteDialogVisible} onDismiss={() => setInviteDialogVisible(false)}>
          <Dialog.Title>Invite Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInviteDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleCreateInvite}
              loading={isCreatingInvite}
              disabled={isCreatingInvite || !inviteEmail.trim()}
            >
              Create Invite
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    marginBottom: 5,
    color: '#ffffff',
  },
  subtitle: {
    color: '#b0b0b0',
  },
  list: {
    flex: 1,
  },
  item: {
    backgroundColor: '#1E1E1E',
  },
  emptyText: {
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  actions: {
    padding: 20,
  },
  button: {
    marginVertical: 5,
  },
});
