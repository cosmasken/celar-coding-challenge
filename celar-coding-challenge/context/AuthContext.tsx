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

interface TokenData {
  token: string;
  refreshToken: string;
}

interface AuthContextType {
  userToken: string | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (tokenData: TokenData) => Promise<void>;
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
  const parseUserProfile = useCallback((token: string): UserProfile | null => {
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
  }, []);
  
  // Check if token is expired or will expire soon (within 5 minutes)
  const isTokenExpiringSoon = useCallback((token: string): boolean => {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      
      // Get expiration time from token
      const expTime = decodedPayload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      // Return true if token expires within 5 minutes
      return expTime - currentTime < fiveMinutes;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true; // Assume token needs refresh if we can't check
    }
  }, []);
  
  // Clear any authentication errors
  const clearError = useCallback(() => setError(null), []);

  // Sign out function - defined early to avoid reference issues
  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
      setUserToken(null);
      setUserProfile(null);
      setError(null);
    } catch (e) {
      console.error('Error during sign out:', e);
      setError('Failed to sign out');
      throw e;
    }
  }, []);
  
  // Internal token refresh function using refresh token - defined early to avoid reference issues
  const refreshTokenInternal = useCallback(async (refreshToken: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Call the token refresh endpoint
      const response = await axios.post(`${API_URL}/refresh-token`, {
        refreshToken
      });
      
      const { token, refreshToken: newRefreshToken } = response.data;
      
      // Save the new tokens
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      
      // Update state
      setUserToken(token);
      setUserProfile(parseUserProfile(token));
      setError(null);
      
      return true;
    } catch (e) {
      console.error('Error refreshing token:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [parseUserProfile]);
  
  // Public token refresh function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!userToken) return false;
    
    // Check if token is expired or will expire soon
    if (isTokenExpiringSoon(userToken)) {
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (storedRefreshToken) {
        return refreshTokenInternal(storedRefreshToken);
      } else {
        setError('Session expired. Please log in again.');
        await signOut();
        return false;
      }
    }
    
    // Token is still valid
    return true;
  }, [userToken, refreshTokenInternal, signOut, isTokenExpiringSoon]);

  // Sign in function
  const signIn = useCallback(async (tokenData: TokenData) => {
    try {
      await AsyncStorage.setItem('userToken', tokenData.token);
      await AsyncStorage.setItem('refreshToken', tokenData.refreshToken);
      setUserToken(tokenData.token);
      setUserProfile(parseUserProfile(tokenData.token));
      setError(null);
    } catch (e) {
      console.error('Error during sign in:', e);
      setError('Failed to complete sign in');
      throw e;
    }
  }, [parseUserProfile]);

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
  
  // Load token and user profile from storage on app start
  // This effect needs to be defined after all the functions it depends on
  useEffect(() => {
    const loadToken = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('userToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (token) {
          // Check if token is expired or will expire soon
          if (isTokenExpiringSoon(token) && refreshToken) {
            // Try to refresh the token
            const refreshed = await refreshTokenInternal(refreshToken);
            if (!refreshed) {
              // If refresh failed, clear tokens and redirect to login
              await signOut();
            }
          } else {
            // Token is still valid
            setUserToken(token);
            setUserProfile(parseUserProfile(token));
          }
        }
      } catch (e) {
        console.error('Error loading auth token:', e);
        setError('Failed to load authentication data');
        await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, [signOut, refreshTokenInternal, parseUserProfile, isTokenExpiringSoon]);

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
