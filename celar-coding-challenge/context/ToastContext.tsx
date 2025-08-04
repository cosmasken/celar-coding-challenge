import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Text, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast configuration
interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
}

// Toast context interface
interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider props
interface ToastProviderProps {
  children: ReactNode;
}

// Toast component
const Toast = ({
  message,
  type,
  onHide,
  position = 'top',
}: {
  message: string;
  type: ToastType;
  onHide: () => void;
  position: 'top' | 'bottom';
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useState(new Animated.Value(position === 'top' ? -100 : 100))[0];
  const opacity = useState(new Animated.Value(0))[0];

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [opacity, translateY, position, onHide]);

  React.useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, 3000);

    return () => clearTimeout(timer);
  }, [hideToast, opacity, translateY]);

  // Get icon and background color based on type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          bgColor: 'bg-green-500',
          textColor: 'text-white',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
        };
      case 'warning':
        return {
          icon: 'warning',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
        };
    }
  };

  const { icon, bgColor, textColor } = getToastStyles();

  return (
    <Animated.View
      className={`absolute left-4 right-4 ${bgColor} rounded-xl shadow-lg z-50`}
      style={[
        {
          transform: [{ translateY }],
          opacity,
          maxWidth: 500,
          alignSelf: 'center',
          width: '92%',
        },
        position === 'top' 
          ? { top: insets.top + 10 } 
          : { bottom: insets.bottom + 10 },
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={hideToast}
        className="flex-row items-center py-3 px-4"
      >
        <Ionicons name={icon as any} size={24} color="white" />
        <Text className={`${textColor} flex-1 ml-3 font-medium`}>{message}</Text>
        <TouchableOpacity onPress={hideToast}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast provider component
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    position: 'top' | 'bottom';
  }>({
    visible: false,
    message: '',
    type: 'info',
    position: 'top',
  });

  const showToast = useCallback(({ message, type, duration = 3000, position = 'top' }: ToastConfig) => {
    setToast({
      visible: true,
      message,
      type,
      position,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          position={toast.position}
        />
      )}
    </ToastContext.Provider>
  );
};

// Custom hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
