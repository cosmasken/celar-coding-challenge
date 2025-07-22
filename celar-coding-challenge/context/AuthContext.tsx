import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments } from 'expo-router';
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Should be moved to environment config in production

interface UserProfile {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  userToken: string | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const segments = useSegments();
  const inAuthGroup = segments[0] === '(auth)';

  // Parse JWT token to extract user profile information
  const parseUserProfile = (token: string): UserProfile | null => {
    try {
      // JWT tokens are base64 encoded with format: header.payload.signature
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return {
        id: decodedPayload.userId,
        email: decodedPayload.email,
        role: decodedPayload.role
      };
    } catch (e) {
      console.error('Error parsing JWT token:', e);
      return null;
    }
  };

  // Load token and user profile from storage on app start
  useEffect(() => {
    const loadToken = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setUserToken(token);
          setUserProfile(parseUserProfile(token));
        }
      } catch (e) {
        console.error('Error loading auth token:', e);
        setError('Failed to load authentication data');
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (userToken && inAuthGroup) {
        router.replace('/(tabs)');
      } else if (!userToken && !inAuthGroup) {
        router.replace('/(auth)/login');
      }
    }
  }, [userToken, inAuthGroup, isLoading]);

  // Sign in function
  const signIn = async (token: string) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setUserProfile(parseUserProfile(token));
      setError(null);
    } catch (e) {
      console.error('Error during sign in:', e);
      setError('Failed to complete sign in');
      throw e;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
      setUserProfile(null);
      setError(null);
    } catch (e) {
      console.error('Error during sign out:', e);
      setError('Failed to sign out');
      throw e;
    }
  };
  
  // Token refresh function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!userToken || !userProfile) return false;
    
    try {
      setIsLoading(true);
      // This would be a real token refresh endpoint in production
      // For now, we're just simulating by re-using the login endpoint
      const response = await axios.post(`${API_URL}/login`, {
        email: userProfile.email,
        // In a real app, you would use a refresh token instead of re-authenticating
        // This is just a placeholder implementation
        password: '' // This won't work in practice, just a placeholder
      });
      
      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setUserProfile(parseUserProfile(token));
      setError(null);
      return true;
    } catch (e) {
      console.error('Error refreshing token:', e);
      setError('Session expired. Please log in again.');
      await signOut();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userToken, userProfile]);
  
  // Clear any authentication errors
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      userToken,
      userProfile,
      isLoading,
      error,
      signIn,
      signOut,
      refreshToken,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}
