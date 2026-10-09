import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BillsScreen } from '../screens/bills/BillsScreen';
import { PendingBillsScreen } from '../screens/pendingBills/PendingBillsScreen';
import { OperatorsScreen } from '../screens/operators/OperatorsScreen';
import { BunkDetailsScreen } from '../screens/bunkDetails/BunkDetailsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  const bottomPadding = Math.max(insets.bottom, 6);
  const tabHeight = 56 + bottomPadding;

  const initials = (user?.name || 'A')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Text style={{ fontSize: 18 }}>📊</Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="BillsTab"
        component={BillsScreen}
        options={{
          tabBarLabel: 'Bills',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Text style={{ fontSize: 18 }}>📄</Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="PendingBillsTab"
        component={PendingBillsScreen}
        options={{
          tabBarLabel: 'Pending',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Text style={{ fontSize: 18 }}>💳</Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="OperatorsTab"
        component={OperatorsScreen}
        options={{
          tabBarLabel: 'Operators',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Text style={{ fontSize: 18 }}>👥</Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="BunkDetailsTab"
        component={BunkDetailsScreen}
        options={{
          tabBarLabel: 'Bunk',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Text style={{ fontSize: 18 }}>⛽</Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'You',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.avatarTabBox,
                {
                  borderColor: focused ? colors.primary : 'transparent',
                  backgroundColor: colors.primary,
                },
              ]}>
              <Text style={styles.avatarTabText}>{initials}</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  tabIconBoxActive: {
    transform: [{ scale: 1.15 }],
  },
  avatarTabBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarTabText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default MainTabs;
