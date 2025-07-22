import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Stack } from 'expo-router';

const API_URL = 'http://localhost:3000'; // Replace with your backend API URL

export default function SendScreen() {
  const { userToken, signOut } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [loading, setLoading] = useState(false);

  const handleSendPayment = async () => {
    if (!recipient || !amount || !currency) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/send`, {
        recipient,
        amount: parseFloat(amount),
        currency,
      }, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      Alert.alert('Success', response.data.message);
      setRecipient('');
      setAmount('');
      setCurrency('USD');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send payment. Please try again.');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        signOut(); // Token expired or invalid
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Send Payment' }} />
      <Text style={styles.title}>Send Payment</Text>
      <TextInput
        style={styles.input}
        placeholder="Recipient"
        value={recipient}
        onChangeText={setRecipient}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Currency (e.g., USD, EUR)"
        value={currency}
        onChangeText={setCurrency}
        autoCapitalize="characters"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Send Payment" onPress={handleSendPayment} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
