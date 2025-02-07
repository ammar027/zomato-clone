// AddRestaurantModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from "@utils/superbase";
import { Feather } from "@expo/vector-icons";
import { decode } from 'base64-arraybuffer';

const AddRestaurantModal = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    price: '',
    delivery_time: '',
    distance: '',
    offers: '',
  });

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypes,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8, // Reduced quality for better performance
      });
  
      if (!result.canceled && result.assets[0].uri) {
        console.log('Selected image:', result.assets[0].uri);
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const uploadImage = async (uri) => {
    try {
      // First check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Authentication required');
      }
  
      // Convert image to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            // Get base64 data
            const base64Data = reader.result.split(',')[1];
            
            // Generate filename
            const fileName = `restaurant-${Date.now()}.jpg`;
            
            // Upload to Supabase storage
            const { error: uploadError } = await supabase.storage
              .from('restaurant_images')
              .upload(fileName, decode(base64Data), {
                contentType: 'image/jpeg',
              });
  
            if (uploadError) throw uploadError;
  
            // Get public URL
            const { data: publicURL } = supabase.storage
              .from('restaurant_images')
              .getPublicUrl(fileName);
  
            resolve(publicURL.publicUrl);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = (error) => reject(error);
      });
    } catch (error) {
      console.error('Detailed upload error:', error);
      throw new Error('Error uploading image: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
  
      // Validate form
      if (!formData.name || !formData.cuisine || !image) {
        Alert.alert('Error', 'Please fill in all required fields and add an image');
        return;
      }
  
      // Upload image and get URL
      const imageUrl = await uploadImage(image);
      console.log('Image uploaded successfully:', imageUrl);
  
      // Add restaurant to database
      const { data, error } = await supabase
        .from('restaurants')
        .insert([
          {
            name: formData.name,
            cuisine: formData.cuisine,
            price: parseInt(formData.price) || 0,
            delivery_time: parseInt(formData.delivery_time) || 30,
            distance: parseFloat(formData.distance) || 0,
            offers: formData.offers,
            image: imageUrl,
            rating: 4.0,
            created_by: (await supabase.auth.getUser()).data.user.id
          }
        ])
        .select()
        .single();
  
      if (error) throw error;
  
      Alert.alert('Success', 'Restaurant added successfully!');
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Restaurant</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <TouchableOpacity 
            style={styles.imageUpload} 
            onPress={pickImage}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="image" size={40} color="#666" />
                <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Restaurant Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            placeholder="Enter restaurant name"
          />

          <Text style={styles.label}>Cuisine Type *</Text>
          <TextInput
            style={styles.input}
            value={formData.cuisine}
            onChangeText={(text) => setFormData({...formData, cuisine: text})}
            placeholder="e.g. North Indian, Chinese"
          />

          <Text style={styles.label}>Price for Two</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({...formData, price: text})}
            placeholder="Enter price in ₹"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Delivery Time (minutes)</Text>
          <TextInput
            style={styles.input}
            value={formData.delivery_time}
            onChangeText={(text) => setFormData({...formData, delivery_time: text})}
            placeholder="e.g. 30"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Distance (km)</Text>
          <TextInput
            style={styles.input}
            value={formData.distance}
            onChangeText={(text) => setFormData({...formData, distance: text})}
            placeholder="e.g. 2.5"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Offers</Text>
          <TextInput
            style={styles.input}
            value={formData.offers}
            onChangeText={(text) => setFormData({...formData, offers: text})}
            placeholder="e.g. 50% OFF up to ₹100"
          />

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Restaurant</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  form: {
    padding: 16,
  },
  imageUpload: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#E03546',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddRestaurantModal;