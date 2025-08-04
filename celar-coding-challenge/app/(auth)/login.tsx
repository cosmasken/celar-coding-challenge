import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useToast } from '../../context/ToastContext';
import 'nativewind';

const API_URL = 'http://localhost:3000'; // Replace with your backend API URL

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, error, clearError } = useAuth();
  const { showToast } = useToast();
  
  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Clear validation errors when inputs change
  useEffect(() => {
    if (email) setEmailError('');
  }, [email]);
  
  useEffect(() => {
    if (password) setPasswordError('');
  }, [password]);

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    let hasError = false;
    
    // Validate inputs
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }
    
    if (hasError) return;
    
    setIsLoading(true);
    clearError();
    
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      const { token, refreshToken } = response.data;
      await signIn({ token, refreshToken });
    } catch (err: any) {
      console.error(err);
      showToast({
        message: err.response?.data?.message || 'Failed to log in. Please check your credentials.',
        type: 'error',
        position: 'top'
      });
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
          className={`h-[50px] border ${emailError ? 'border-red-500' : 'border-gray-200'} rounded-lg mb-1 px-3 text-base bg-white text-text-primary`}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailError ? <Text className="text-red-500 text-xs mb-3">{emailError}</Text> : <View className="mb-4" />}
        
        <Text className="text-base font-semibold mb-2 text-text-secondary">Password</Text>
        <TextInput
          className={`h-[50px] border ${passwordError ? 'border-red-500' : 'border-gray-200'} rounded-lg mb-1 px-3 text-base bg-white text-text-primary`}
          placeholder="Enter your password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {passwordError ? <Text className="text-red-500 text-xs mb-3">{passwordError}</Text> : <View className="mb-4" />}
        
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
