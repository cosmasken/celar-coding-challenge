import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabaseAsync } from 'expo-sqlite';

// Define types for SQLite database operations
type SQLQuery = { sql: string; args?: any[] };
type SQLResultSet = { rows: any[]; insertId?: number; rowsAffected?: number };
type SQLExecCallback = (error?: Error | null, resultSet?: SQLResultSet[]) => void;

// Define the shape of the database object returned by openDatabaseAsync
type SQLiteDatabase = {
  exec(queries: SQLQuery[], readOnly: boolean, callback: SQLExecCallback): void;
  closeAsync(): Promise<void>;
};

// Declare module augmentation to add the missing types to expo-sqlite
declare module 'expo-sqlite' {
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}

// Define user profile type
export interface UserProfile {
  id: number;
  email: string;
  role: string;
}

// Define account balance type
export interface AccountBalance {
  currency: string;
  amount: number;
}

// Define recent activity type
export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

// Define app state
interface AppState {
  // Auth state
  userToken: string | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Financial data
  balances: AccountBalance[];
  recentActivity: RecentActivity[];
  
  // Actions
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  updateBalances: (balances: AccountBalance[]) => void;
  updateRecentActivity: (activities: RecentActivity[]) => void;
  
  // Database operations
  initDatabase: () => void;
}

// Parse JWT token to extract user profile information
const parseUserProfile = (token: string): UserProfile | null => {
  try {
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

// Initialize SQLite database
const initDb = () => {
  const db = openDatabaseAsync('celar.db');
  
  return db.then(database => {
    database.exec([
      { 
        sql: 'CREATE TABLE IF NOT EXISTS balances (id INTEGER PRIMARY KEY AUTOINCREMENT, currency TEXT, amount REAL, userId INTEGER)',
        args: []
      },
      {
        sql: 'CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, description TEXT, amount REAL, currency TEXT, date TEXT, status TEXT, userId INTEGER)',
        args: []
      }
    ], false, (error: Error | null | undefined) => {
      if (error) {
        console.error('Error creating tables:', error);
      }
    });
    
    return database;
  });

};

// Create Zustand store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      userToken: null,
      userProfile: null,
      isLoading: true,
      error: null,
      balances: [],
      recentActivity: [],
      
      // Initialize database
      initDatabase: async () => {
        await initDb();
        console.log('Database initialized');
      },
      
      // Sign in function
      signIn: async (token: string) => {
        try {
          const profile = parseUserProfile(token);
          
          // Save token to AsyncStorage
          await AsyncStorage.setItem('userToken', token);
          
          // Update state
          set({ 
            userToken: token,
            userProfile: profile,
            error: null,
            isLoading: false
          });
          
          // Initialize database and load user data
          initDb().then(db => {
            // Load balances from SQLite if available, otherwise use defaults
            db.exec([
              { 
                sql: 'SELECT * FROM balances WHERE userId = ?',
                args: [profile?.id]
              }
            ], true, (error: Error | null | undefined, resultSet?: SQLResultSet[]) => {
              if (error) {
                console.error('Error loading balances:', error);
                return;
              }
              
              if (resultSet && resultSet[0] && resultSet[0].rows && resultSet[0].rows.length > 0) {
                const dbBalances = resultSet[0].rows as AccountBalance[];
                set({ balances: dbBalances });
              } else {
                // Default balances if none found
                const defaultBalances = [
                  { currency: 'USD', amount: 5280.42 },
                  { currency: 'EUR', amount: 1250.00 },
                  { currency: 'BTC', amount: 0.0345 }
                ];
                
                // Save default balances to SQLite
                defaultBalances.forEach(balance => {
                  db.exec([
                    { 
                      sql: 'INSERT INTO balances (currency, amount, userId) VALUES (?, ?, ?)',
                      args: [balance.currency, balance.amount, profile?.id]
                    }
                  ], false, (error: Error | null | undefined) => {
                    if (error) {
                      console.error('Error inserting balance:', error);
                    }
                  });
                });
                
                set({ balances: defaultBalances });
              }
            });
            
            // Load recent activities
            db.exec([
              { 
                sql: 'SELECT * FROM activities WHERE userId = ? ORDER BY date DESC LIMIT 10',
                args: [profile?.id]
              }
            ], true, (error: Error | null | undefined, resultSet?: SQLResultSet[]) => {
              if (error) {
                console.error('Error loading activities:', error);
                return;
              }
              
              if (resultSet && resultSet[0] && resultSet[0].rows && resultSet[0].rows.length > 0) {
                const activities = resultSet[0].rows as RecentActivity[];
                set({ recentActivity: activities });
              }
            });
          });
          
        } catch (e) {
          console.error('Error during sign in:', e);
          set({ error: 'Failed to complete sign in', isLoading: false });
          throw e;
        }
      },
      
      // Sign out function
      signOut: async () => {
        try {
          await AsyncStorage.removeItem('userToken');
          set({ 
            userToken: null,
            userProfile: null,
            error: null,
            balances: [],
            recentActivity: []
          });
        } catch (e) {
          console.error('Error during sign out:', e);
          set({ error: 'Failed to sign out' });
          throw e;
        }
      },
      
      // Token refresh function
      refreshToken: async () => {
        const { userToken, userProfile } = get();
        if (!userToken || !userProfile) return false;
        
        try {
          set({ isLoading: true });
          
          // In a real app, this would call a refresh token endpoint
          // For now, we're simulating a successful refresh
          const newToken = userToken; // Replace with actual token refresh logic
          
          await AsyncStorage.setItem('userToken', newToken);
          set({
            userToken: newToken,
            error: null,
            isLoading: false
          });
          
          return true;
        } catch (e) {
          console.error('Error refreshing token:', e);
          set({ 
            error: 'Session expired. Please log in again.',
            isLoading: false
          });
          
          // Sign out on token refresh failure
          await get().signOut();
          return false;
        }
      },
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Update balances
      updateBalances: (balances: AccountBalance[]) => {
        const { userProfile } = get();
        set({ balances });
        
        // Update SQLite database
        if (userProfile) {
          openDatabaseAsync('celar.db').then(db => {
            // Clear existing balances for this user
            db.exec([
              { 
                sql: 'DELETE FROM balances WHERE userId = ?',
                args: [userProfile.id]
              }
            ], false, (error: Error | null | undefined) => {
              if (error) {
                console.error('Error deleting balances:', error);
                return;
              }
              
              // Insert new balances
              balances.forEach(balance => {
                db.exec([
                  { 
                    sql: 'INSERT INTO balances (currency, amount, userId) VALUES (?, ?, ?)',
                    args: [balance.currency, balance.amount, userProfile.id]
                  }
                ], false, (error: Error | null | undefined) => {
                  if (error) {
                    console.error('Error inserting balance:', error);
                  }
                });
              });
            });
          });
        }
      },
      
      // Update recent activity
      updateRecentActivity: (activities: RecentActivity[]) => {
        const { userProfile } = get();
        set({ recentActivity: activities });
        
        // Update SQLite database
        if (userProfile) {
          openDatabaseAsync('celar.db').then(db => {
            // Clear existing activities for this user
            db.exec([
              { 
                sql: 'DELETE FROM activities WHERE userId = ?',
                args: [userProfile.id]
              }
            ], false, (error: Error | null | undefined) => {
              if (error) {
                console.error('Error deleting activities:', error);
                return;
              }
              
              // Insert new activities
              activities.forEach(activity => {
                db.exec([
                  { 
                    sql: 'INSERT INTO activities (type, description, amount, currency, date, status, userId) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    args: [
                      activity.type,
                      activity.description,
                      activity.amount,
                      activity.currency,
                      activity.date,
                      activity.status,
                      userProfile.id
                    ]
                  }
                ], false, (error: Error | null | undefined) => {
                  if (error) {
                    console.error('Error inserting activity:', error);
                  }
                });
              });
            });
          });
        }
      }
    }),
    {
      name: 'celar-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userToken: state.userToken,
        userProfile: state.userProfile
      })
    }
  )
);
