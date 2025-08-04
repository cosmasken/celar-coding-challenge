import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../context/ToastContext';
import 'nativewind';

export default function ProfileScreen() {
  const { userProfile, signOut } = useAppStore();
  const { showToast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast({
        message: 'You have been signed out',
        type: 'info',
        position: 'top'
      });
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast({
        message: 'Failed to sign out',
        type: 'error',
        position: 'top'
      });
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: handleSignOut, style: 'destructive' }
      ]
    );
  };

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    showToast({
      message: value ? 'Notifications enabled' : 'Notifications disabled',
      type: 'info',
      position: 'bottom',
      duration: 1500
    });
  };

  const handleToggleBiometric = (value: boolean) => {
    setBiometricEnabled(value);
    showToast({
      message: value ? 'Biometric authentication enabled' : 'Biometric authentication disabled',
      type: 'info',
      position: 'bottom',
      duration: 1500
    });
  };

  const handleToggleDarkMode = (value: boolean) => {
    setDarkModeEnabled(value);
    showToast({
      message: value ? 'Dark mode enabled' : 'Dark mode disabled',
      type: 'info',
      position: 'bottom',
      duration: 1500
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333333',
          headerTitleStyle: { fontWeight: 'bold' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="bg-white p-6 mb-4 shadow-sm">
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-blue-500">
                {userProfile?.email.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">{userProfile?.email}</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full mt-2">
              <Text className="text-blue-700 font-medium capitalize">{userProfile?.role}</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View className="bg-white mb-4 shadow-sm">
          <Text className="px-6 pt-4 pb-2 text-sm font-medium text-gray-500 uppercase">
            Account Settings
          </Text>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100"
            onPress={() => {
              showToast({
                message: 'Personal details coming soon',
                type: 'info',
                position: 'bottom'
              });
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Personal Details</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100"
            onPress={() => {
              showToast({
                message: 'Security settings coming soon',
                type: 'info',
                position: 'bottom'
              });
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between px-6 py-4"
            onPress={() => {
              showToast({
                message: 'Payment methods coming soon',
                type: 'info',
                position: 'bottom'
              });
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View className="bg-white mb-4 shadow-sm">
          <Text className="px-6 pt-4 pb-2 text-sm font-medium text-gray-500 uppercase">
            Preferences
          </Text>
          
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#d1d5db', true: '#4a6da7' }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="finger-print-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Biometric Authentication</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#d1d5db', true: '#4a6da7' }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-row items-center">
              <Ionicons name="moon-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: '#d1d5db', true: '#4a6da7' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Support */}
        <View className="bg-white mb-4 shadow-sm">
          <Text className="px-6 pt-4 pb-2 text-sm font-medium text-gray-500 uppercase">
            Support
          </Text>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100"
            onPress={() => {
              showToast({
                message: 'Help center coming soon',
                type: 'info',
                position: 'bottom'
              });
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center justify-between px-6 py-4"
            onPress={() => {
              showToast({
                message: 'Contact support coming soon',
                type: 'info',
                position: 'bottom'
              });
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="chatbox-ellipses-outline" size={22} color="#4a6da7" />
              <Text className="ml-3 text-gray-800 font-medium">Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View className="px-6 py-4 mb-8">
          <TouchableOpacity 
            className="bg-red-50 py-4 rounded-lg items-center"
            onPress={confirmSignOut}
          >
            <Text className="text-red-600 font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
