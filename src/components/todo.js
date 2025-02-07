import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '@utils/superbase';
import { useRouter } from 'expo-router';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createProfile = async (userId, userData) => {
    console.log('Creating profile with data:', { userId, userData });
    
    const { error } = await supabase
      .from('users')
      .upsert([
        {
          id: userId,
          full_name: userData.fullName,
          email: userData.email,
          updated_at: new Date().toISOString(),
        },
      ], 
      { onConflict: 'id' });

    if (error) {
      console.error('Profile creation error:', error);
      throw error;
    }

    // Verify the profile was created
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Profile verification error:', fetchError);
      throw fetchError;
    }

    console.log('Created profile:', profile);
    return profile;
  };

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!email || !password || (isSignUp && !fullName)) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (isSignUp) {
        // Step 1: Sign Up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // This goes to auth.users
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('No user data returned');

        console.log('Sign up successful:', signUpData);

        // Step 2: Create Profile
        try {
          await createProfile(signUpData.user.id, {
            fullName,
            email,
          });
          Alert.alert('Success', 'Account created successfully!');
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          Alert.alert(
            'Partial Success',
            'Account created but profile setup failed. Please contact support.'
          );
          // You might want to implement a retry mechanism here
        }
      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }

      router.push('/main-app');
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
        onPress={handleAuth}
        disabled={loading}
      />

      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={() => {
          setIsSignUp(!isSignUp);
          setEmail('');
          setPassword('');
          setFullName('');
        }}
      >
        <Text>{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
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
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  toggleButton: {
    marginTop: 15,
    alignItems: 'center',
  },
});

export default AuthScreen;