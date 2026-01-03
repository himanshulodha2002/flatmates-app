import { useGetShoppingListStatsQuery } from '@/store/services/shoppingApi';
import { ShoppingList } from '@/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, ProgressBar, Text, useTheme } from 'react-native-paper';

interface ShoppingListCardProps {
  list: ShoppingList;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
  list,
  onPress,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const { data: stats } = useGetShoppingListStatsQuery(list.id);

  const progress = stats ? stats.purchased_items / stats.total_items : 0;
  const progressColor = progress === 1 ? theme.colors.primary : theme.colors.secondary;

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      mode="elevated"
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.title}>
              {list.name}
            </Text>
            {list.status === 'archived' && (
              <Chip mode="flat" textStyle={{ fontSize: 10 }} style={styles.archivedChip}>
                Archived
              </Chip>
            )}
          </View>
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete"
                size={20}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              />
            )}
          </View>
        </View>

        {list.description && (
          <Text
            variant="bodySmall"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {list.description}
          </Text>
        )}

        {stats && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Total Items
                </Text>
                <Text variant="titleSmall">{stats.total_items}</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Purchased
                </Text>
                <Text variant="titleSmall" style={{ color: progressColor }}>
                  {stats.purchased_items}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Pending
                </Text>
                <Text variant="titleSmall" style={{ color: theme.colors.error }}>
                  {stats.pending_items}
                </Text>
              </View>
              {stats.total_price && (
                <View style={styles.stat}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Total
                  </Text>
                  <Text variant="titleSmall">${stats.total_price.toFixed(2)}</Text>
                </View>
              )}
            </View>

            <ProgressBar progress={progress} color={progressColor} style={styles.progressBar} />
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  archivedChip: {
    height: 24,
  },
  description: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
  },
  stat: {
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
