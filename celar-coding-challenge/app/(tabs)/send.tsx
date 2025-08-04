import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import axios, { isAxiosError } from 'axios';
import 'nativewind';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

const API_URL = 'http://localhost:3000'; // Replace with your backend API URL

// Define available currencies
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];

// Custom numeric keypad component
const NumericKeypad = ({ onKeyPress, onDelete, onClear, onDone }: {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onDone: () => void;
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  const keySize = (screenWidth - 48) / 3; // 48 = padding (16*2 + gap 16)
  
  return (
    <View className="bg-gray-100 pt-2 pb-6 rounded-t-3xl">
      <View className="flex-row justify-end px-4 mb-2">
        <TouchableOpacity 
          className="bg-gray-200 px-4 py-2 rounded-lg" 
          onPress={onDone}
        >
          <Text className="font-medium text-primary">Done</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row flex-wrap justify-between px-4">
        {keys.map((key) => (
          <TouchableOpacity
            key={key}
            className={`items-center justify-center mb-4 ${key === '⌫' ? 'bg-gray-200' : 'bg-white'} rounded-xl shadow-sm`}
            style={{ width: keySize - 8, height: 60 }}
            onPress={() => key === '⌫' ? onDelete() : onKeyPress(key)}
            onLongPress={() => key === '⌫' ? onClear() : null}
          >
            {key === '⌫' ? (
              <Ionicons name="backspace-outline" size={24} color="#6b7280" />
            ) : (
              <Text className="text-2xl font-medium text-gray-800">{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function SendScreen() {
  const { userToken, userProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCurrencyIndex, setSelectedCurrencyIndex] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);

  // Handle currency selection
  const handleCurrencySelect = (index: number) => {
    setSelectedCurrencyIndex(index);
    setCurrency(CURRENCIES[index]);
  };
  
  // Handle numeric keypad input
  const handleKeyPress = (key: string) => {
    // Prevent multiple decimal points
    if (key === '.' && amount.includes('.')) return;
    
    // Limit to 2 decimal places
    if (key === '.' && amount.includes('.')) {
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }
    
    // Limit total length
    if (amount.length >= 10 && key !== '.') return;
    
    setAmount(prev => prev + key);
  };
  
  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };
  
  const handleClear = () => {
    setAmount('');
  };
  
  const toggleKeypad = () => {
    setShowKeypad(!showKeypad);
  };
  
  const handleSendPayment = async () => {
    if (!recipient || !amount) {
      showToast({
        message: 'Please enter recipient and amount.',
        type: 'error',
        position: 'top'
      });
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showToast({
        message: 'Please enter a valid amount.',
        type: 'error',
        position: 'top'
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/send`, {
        recipient,
        amount: parseFloat(amount),
        currency,
        memo: memo.trim() || undefined,
      }, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      showToast({
        message: 'Payment sent successfully!',
        type: 'success',
        position: 'top'
      });
      
      // Reset form
      setRecipient('');
      setAmount('');
      setMemo('');
      setCurrency('USD');
      setSelectedCurrencyIndex(0);
      setShowKeypad(false);
    } catch (error) {
      console.error(error);
      
      let errorMessage = 'Failed to send payment. Please try again.';
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast({
        message: errorMessage,
        type: 'error',
        position: 'top'
      });
      
      if (isAxiosError(error) && error.response?.status === 401) {
        signOut(); // Token expired or invalid
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{
          title: 'Send Payment',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333333',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary p-6 rounded-b-3xl shadow-md mb-4">
          <Text className="text-white text-2xl font-bold text-center">Send Money</Text>
          <Text className="text-white/80 text-center mt-1">Send money quickly and securely</Text>
        </View>
        
        <View className="px-6">
          {/* From Account */}
          <View className="mb-6">
            <Text className="text-gray-500 text-sm mb-2">From</Text>
            <View className="bg-white p-4 rounded-lg shadow-sm flex-row justify-between items-center">
              <View>
                <Text className="font-medium text-gray-800">{userProfile?.email || 'Your Account'}</Text>
                <Text className="text-xs text-gray-500">{userProfile?.role || 'User'}</Text>
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium">Balance: $5,280.42</Text>
              </View>
            </View>
          </View>
          
          {/* Recipient */}
          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-2">Recipient</Text>
            <View className="bg-white rounded-lg shadow-sm overflow-hidden">
              <View className="flex-row items-center border-b border-gray-100">
                <View className="p-3">
                  <Ionicons name="person-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="flex-1 py-3 px-2 text-gray-800"
                  placeholder="Email or username"
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
          
          {/* Amount and Currency */}
          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-2">Amount</Text>
            <TouchableOpacity 
              className="bg-white rounded-lg shadow-sm p-4" 
              onPress={toggleKeypad}
              activeOpacity={0.7}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="bg-primary/10 p-2 rounded-full mr-3">
                    <Ionicons name="cash-outline" size={24} color="#4a6da7" />
                  </View>
                  <Text className={`text-3xl font-semibold ${amount ? 'text-gray-800' : 'text-gray-400'}`}>
                    {amount || '0.00'}
                  </Text>
                </View>
                <TouchableOpacity 
                  className="bg-gray-100 px-3 py-2 rounded-lg flex-row items-center"
                  onPress={() => {
                    // We'll keep using Alert for currency selection as it's a better UX for this specific case
                    Alert.alert(
                      "Select Currency",
                      "Choose your preferred currency",
                      CURRENCIES.map((curr, index) => ({
                        text: curr,
                        onPress: () => {
                          handleCurrencySelect(index);
                          showToast({
                            message: `Currency changed to ${curr}`,
                            type: 'info',
                            position: 'bottom',
                            duration: 1500
                          });
                        },
                        style: index === selectedCurrencyIndex ? 'default' : 'default'
                      }))
                    );
                  }}
                >
                  <Text className="font-medium text-gray-800 mr-1">{currency}</Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Memo/Note */}
          <View className="mb-6">
            <Text className="text-gray-500 text-sm mb-2">Memo (Optional)</Text>
            <View className="bg-white rounded-lg shadow-sm overflow-hidden">
              <View className="flex-row items-center">
                <View className="p-3">
                  <Ionicons name="create-outline" size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="flex-1 py-3 px-2 text-gray-800"
                  placeholder="What's this payment for?"
                  value={memo}
                  onChangeText={setMemo}
                  multiline
                />
              </View>
            </View>
          </View>
          
          {/* Send Button */}
          <TouchableOpacity 
            className={`bg-primary rounded-xl py-4 items-center mb-8 ${loading ? 'opacity-70' : ''}`}
            onPress={handleSendPayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="paper-plane" size={18} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-lg">Send Payment</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Security Note */}
          <View className="flex-row items-center justify-center mb-6">
            <Ionicons name="shield-checkmark-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
            <Text className="text-xs text-gray-500">Your transactions are secure and encrypted</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Custom Numeric Keypad */}
      {showKeypad && (
        <View className="absolute bottom-0 left-0 right-0 shadow-lg">
          <NumericKeypad 
            onKeyPress={handleKeyPress} 
            onDelete={handleDelete} 
            onClear={handleClear}
            onDone={toggleKeypad}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// No StyleSheet needed with NativeWind
