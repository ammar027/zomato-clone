// app/auth/SignUp.js
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@utils/superbase';
import { decode } from 'base64-arraybuffer';

const SignUp = ({ loading, setLoading, fullName, setFullName, email, setEmail, password, setPassword, profileImage, setProfileImage }) => {
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypes.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
  
      if (!result.canceled) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfileImage = async (userId) => {
    if (!profileImage?.base64) return null;

    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, decode(profileImage.base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });
  
      if (uploadError) throw uploadError;
  
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
  
      return publicUrl;
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile image');
      return null;
    }
  };

  const handleSignUp = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('No user data returned');

      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(signUpData.user.id);
      }

      // Create Profile
      await createProfile(signUpData.user.id, {
        fullName,
        email,
        profileImage: profileImageUrl,
      });

      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="camera" size={30} color="#666" />
            <Text style={styles.uploadText}>Upload Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.authButton}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.authButtonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#666',
    fontSize: 12,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    padding: 10,
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SignUp;
