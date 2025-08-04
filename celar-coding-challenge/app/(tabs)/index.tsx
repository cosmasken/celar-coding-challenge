import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import 'nativewind';

// Define types for our dashboard data
interface AccountBalance {
  currency: string;
  amount: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

type IconName = 'paper-plane' | 'download' | 'repeat' | 'card';

interface QuickAction {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  action: () => void;
}

export default function HomeScreen() {
  const { userToken, userProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const [balances] = useState<AccountBalance[]>([
    { currency: 'USD', amount: 5280.42 },
    { currency: 'EUR', amount: 1250.00 },
    { currency: 'BTC', amount: 0.0345 }
  ]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();

  // Quick action buttons
  const quickActions: QuickAction[] = [
    { 
      id: 'send', 
      name: 'Send', 
      icon: 'paper-plane', 
      color: 'bg-blue-500', 
      action: () => showToast({ message: 'Navigating to send', type: 'info', position: 'bottom' }) 
    },
    { 
      id: 'receive', 
      name: 'Receive', 
      icon: 'download', 
      color: 'bg-green-500', 
      action: () => showToast({ message: 'Receive feature coming soon', type: 'info', position: 'bottom' }) 
    },
    { 
      id: 'exchange', 
      name: 'Exchange', 
      icon: 'repeat', 
      color: 'bg-purple-500', 
      action: () => showToast({ message: 'Exchange feature coming soon', type: 'info', position: 'bottom' }) 
    },
    { 
      id: 'pay', 
      name: 'Pay', 
      icon: 'card', 
      color: 'bg-orange-500', 
      action: () => showToast({ message: 'Pay feature coming soon', type: 'info', position: 'bottom' }) 
    }
  ];

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    if (!userToken) {
      setLoading(false);
      return;
    }
    
    try {
      // In a real app, we would fetch from the API
      // const response = await fetch(`http://localhost:3000/recent-activity`, {
      //   headers: { Authorization: `Bearer ${userToken}` },
      // });
      // const data = await response.json();
      
      // For now, we'll use mock data
      const mockData: RecentActivity[] = [
        {
          id: 1,
          type: 'payment',
          description: 'Payment to John Doe',
          amount: 125.50,
          currency: 'USD',
          date: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed'
        },
        {
          id: 2,
          type: 'deposit',
          description: 'Deposit from Bank Transfer',
          amount: 500.00,
          currency: 'USD',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
        },
        {
          id: 3,
          type: 'withdrawal',
          description: 'ATM Withdrawal',
          amount: 200.00,
          currency: 'USD',
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed'
        },
        {
          id: 4,
          type: 'exchange',
          description: 'USD to EUR Exchange',
          amount: 300.00,
          currency: 'USD',
          date: new Date(Date.now() - 259200000).toISOString(),
          status: 'pending'
        }
      ];
      
      setRecentActivity(mockData);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchRecentActivity();
  }, [userToken, fetchRecentActivity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecentActivity();
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'payment': return <Ionicons name="arrow-up-circle" size={24} color="#ef4444" />;
      case 'deposit': return <Ionicons name="arrow-down-circle" size={24} color="#10b981" />;
      case 'withdrawal': return <Ionicons name="cash-outline" size={24} color="#f59e0b" />;
      case 'exchange': return <Ionicons name="repeat" size={24} color="#8b5cf6" />;
      default: return <Ionicons name="ellipsis-horizontal-circle" size={24} color="#6b7280" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BTC') {
      return `${amount} BTC`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{ 
          title: 'Dashboard',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333333',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4a6da7']} />
        }
      >
        {/* Header with greeting and profile */}
        <View className="bg-primary p-6 rounded-b-3xl shadow-md">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white text-lg">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold">{userProfile?.email?.split('@')[0] || 'User'}</Text>
            </View>
            <TouchableOpacity 
              className="bg-white/20 p-2 rounded-full"
              onPress={signOut}
            >
              <Ionicons name="person" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Balance card */}
          <View className="bg-white rounded-xl p-4 shadow-sm mb-2">
            <Text className="text-gray-500 text-sm mb-1">Total Balance</Text>
            <Text className="text-3xl font-bold text-gray-800">
              {formatCurrency(balances[0].amount, balances[0].currency)}
            </Text>
            <View className="flex-row mt-2">
              {balances.slice(1).map((balance, index) => (
                <View key={balance.currency} className="mr-4">
                  <Text className="text-xs text-gray-500">{balance.currency}</Text>
                  <Text className="text-base font-medium">{formatCurrency(balance.amount, balance.currency)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        {/* Quick Actions */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</Text>
          <View className="flex-row justify-between">
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id}
                className={`${action.color} p-3 rounded-xl items-center`}
                style={{ width: '22%' }}
                onPress={action.action}
              >
                <Ionicons name={action.icon} size={24} color="white" />
                <Text className="text-white text-xs mt-1">{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Recent Activity */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-800">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-primary">See All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4a6da7" style={{ marginTop: 20 }} />
          ) : recentActivity.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No recent activity</Text>
            </View>
          ) : (
            recentActivity.map((activity) => (
              <TouchableOpacity 
                key={activity.id}
                className="bg-white rounded-lg p-4 mb-3 shadow-sm"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    {getActivityIcon(activity.type)}
                    <View className="ml-3">
                      <Text className="font-medium text-gray-800">{activity.description}</Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()} • {activity.status}
                      </Text>
                    </View>
                  </View>
                  <Text className={`font-bold ${activity.type === 'deposit' ? 'text-green-600' : 'text-gray-800'}`}>
                    {activity.type === 'deposit' ? '+' : ''}{formatCurrency(activity.amount, activity.currency)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        
        {/* Financial Insights */}
        <View className="px-6 py-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Financial Insights</Text>
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-medium">Monthly Spending</Text>
              <Text className="text-primary">View Report</Text>
            </View>
            
            {/* Placeholder for chart - in a real app, you'd use a charting library */}
            <View className="h-32 bg-gray-100 rounded-lg items-center justify-center mb-2">
              <Text className="text-gray-500">Spending Chart</Text>
            </View>
            
            <View className="flex-row justify-between mt-2">
              <View>
                <Text className="text-xs text-gray-500">This Month</Text>
                <Text className="font-medium">{formatCurrency(1250.75, 'USD')}</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">Last Month</Text>
                <Text className="font-medium">{formatCurrency(1120.50, 'USD')}</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">Difference</Text>
                <Text className="font-medium text-red-500">+11.6%</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// No StyleSheet needed with NativeWind
