import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import 'nativewind';

const API_URL = 'http://localhost:3000'; // Replace with your backend API URL

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, error, clearError } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    clearError();
    
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      const { token } = response.data;
      await signIn(token);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Using className directly with the components

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <Stack.Screen 
        options={{ 
          title: 'Login',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333333',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <View className="flex-1 justify-center p-6 bg-surface mx-4 my-4 rounded-lg shadow">
        <Text className="text-3xl font-bold mb-6 text-center text-text-primary">Welcome Back</Text>
        {error && <Text className="text-secondary text-center mb-4 text-sm">{error}</Text>}
        
        <Text className="text-base font-semibold mb-2 text-text-secondary">Email</Text>
        <TextInput
          className="h-[50px] border border-gray-200 rounded-lg mb-5 px-3 text-base bg-white text-text-primary"
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <Text className="text-base font-semibold mb-2 text-text-secondary">Password</Text>
        <TextInput
          className="h-[50px] border border-gray-200 rounded-lg mb-5 px-3 text-base bg-white text-text-primary"
          placeholder="Enter your password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          className={`bg-primary rounded-lg h-[50px] justify-center items-center mt-2 ${isLoading ? 'opacity-70' : ''}`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-semibold">Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="mt-5 justify-center items-center"
          onPress={() => router.replace('/(auth)/signup')}
        >
          <Text className="text-primary text-base">Don&apos;t have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// No StyleSheet needed with NativeWind
