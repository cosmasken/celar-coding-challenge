import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import axios, { isAxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Stack } from 'expo-router';
import 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:3000'; // Replace with your backend API URL

interface Transaction {
  id?: number;
  recipient: string;
  amount: number;
  currency: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'failed';
  type?: 'incoming' | 'outgoing';
}

export default function TransactionsScreen() {
  const { userToken, userProfile, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const { width } = useWindowDimensions();
  
  // Determine if we're on a large screen (tablet/web)
  const isLargeScreen = width > 768;

  const fetchTransactions = useCallback(async () => {
    if (!userToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/transactions`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      // Add some mock data for demo purposes with transaction types
      const enhancedData = response.data.map((tx: any, index: number) => ({
        ...tx,
        id: index + 1,
        status: Math.random() > 0.2 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'failed',
        type: Math.random() > 0.5 ? 'outgoing' : 'incoming'
      }));
      
      setTransactions(enhancedData);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch transactions.');
      if (isAxiosError(error) && error.response?.status === 401) {
        signOut(); // Token expired or invalid
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, signOut]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions based on selected filter
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);
    
  // Get status color based on transaction status
  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  // Get transaction icon based on type
  const getTransactionIcon = (type?: string) => {
    if (type === 'incoming') {
      return <Ionicons name="arrow-down-circle" size={24} color="#10b981" />;
    } else {
      return <Ionicons name="arrow-up-circle" size={24} color="#ef4444" />;
    }
  };
  
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{ 
          title: 'Transactions',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333333',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      {/* Header Section */}
      <View className="bg-white px-4 py-5 shadow-sm">
        <Text className="text-2xl font-bold text-gray-800">Your Transactions</Text>
        {userProfile && (
          <Text className="text-sm text-gray-500 mt-1">{userProfile.email} • {userProfile.role.toUpperCase()}</Text>
        )}
        
        {/* Filter Tabs */}
        <View className="flex-row mt-4 border-b border-gray-200">
          <TouchableOpacity 
            className={`px-4 py-2 ${filter === 'all' ? 'border-b-2 border-primary' : ''}`}
            onPress={() => setFilter('all')}
          >
            <Text className={`${filter === 'all' ? 'text-primary font-medium' : 'text-gray-600'}`}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`px-4 py-2 ${filter === 'incoming' ? 'border-b-2 border-primary' : ''}`}
            onPress={() => setFilter('incoming')}
          >
            <Text className={`${filter === 'incoming' ? 'text-primary font-medium' : 'text-gray-600'}`}>Incoming</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`px-4 py-2 ${filter === 'outgoing' ? 'border-b-2 border-primary' : ''}`}
            onPress={() => setFilter('outgoing')}
          >
            <Text className={`${filter === 'outgoing' ? 'text-primary font-medium' : 'text-gray-600'}`}>Outgoing</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-500 text-lg mt-4">No transactions found</Text>
          <TouchableOpacity 
            className="mt-4 bg-primary px-4 py-2 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-white font-medium">Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item, index) => (item.id?.toString() || index.toString())}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4a6da7']} />
          }
          contentContainerClassName={`${isLargeScreen ? 'px-6' : 'px-4'} py-4`}
          renderItem={({ item }) => (
            <View className={`bg-white rounded-lg shadow mb-3 overflow-hidden ${isLargeScreen ? 'mx-4' : ''}`}>
              <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                <View className="flex-row items-center">
                  {getTransactionIcon(item.type)}
                  <View className="ml-3">
                    <Text className="font-medium text-gray-800">{item.recipient}</Text>
                    <Text className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</Text>
                  </View>
                </View>
                <View>
                  <Text className={`font-bold ${item.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'incoming' ? '+' : '-'}{item.amount} {item.currency}
                  </Text>
                  <Text className={`text-xs ${getStatusColor(item.status)}`}>{item.status}</Text>
                </View>
              </View>
              
              {/* Transaction Details (expandable on web) */}
              {isLargeScreen && (
                <View className="p-4 bg-gray-50">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Transaction ID</Text>
                    <Text className="text-gray-800 font-medium">#{item.id}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600">Status</Text>
                    <Text className={getStatusColor(item.status)}>{item.status}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Type</Text>
                    <Text className="text-gray-800 font-medium">{item.type}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

// No StyleSheet needed with NativeWind
