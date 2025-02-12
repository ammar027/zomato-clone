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
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from "@utils/superbase";
import { Feather } from "@expo/vector-icons";
import { decode } from 'base64-arraybuffer';

// Validation Schema
const RestaurantSchema = Yup.object().shape({
  name: Yup.string()
    .required('Restaurant name is required')
    .min(2, 'Name is too short'),
  cuisine: Yup.string()
    .required('Cuisine type is required')
    .min(2, 'Cuisine type is too short'),
  price: Yup.number()
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative'),
  delivery_time: Yup.number()
    .typeError('Delivery time must be a number')
    .min(1, 'Delivery time must be at least 1 minute')
    .max(180, 'Delivery time cannot exceed 180 minutes'),
  distance: Yup.number()
    .typeError('Distance must be a number')
    .min(0, 'Distance cannot be negative')
    .max(50, 'Distance cannot exceed 50km'),
  offers: Yup.string(),
});

const AddRestaurantModal = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const initialValues = {
    name: '',
    cuisine: '',
    price: '',
    delivery_time: '',
    distance: '',
    offers: '',
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypes,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
  
      if (!result.canceled && result.assets[0].uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Authentication required');
      }
  
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result.split(',')[1];
            const fileName = `restaurant-${Date.now()}.jpg`;
            
            const { error: uploadError } = await supabase.storage
              .from('restaurant_images')
              .upload(fileName, decode(base64Data), {
                contentType: 'image/jpeg',
              });
  
            if (uploadError) throw uploadError;
  
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

  const handleSubmit = async (values, { resetForm }) => {
    try {
      setLoading(true);
  
      if (!image) {
        Alert.alert('Error', 'Please add an image');
        return;
      }
  
      const imageUrl = await uploadImage(image);
      
      const { data, error } = await supabase
        .from('restaurants')
        .insert([
          {
            name: values.name,
            cuisine: values.cuisine,
            price: parseInt(values.price) || 0,
            delivery_time: parseInt(values.delivery_time) || 30,
            distance: parseFloat(values.distance) || 0,
            offers: values.offers,
            image: imageUrl,
            rating: 4.0,
            created_by: (await supabase.auth.getUser()).data.user.id
          }
        ])
        .select()
        .single();
  
      if (error) throw error;
  
      Alert.alert('Success', 'Restaurant added successfully!');
      resetForm();
      setImage(null);
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

        <Formik
          initialValues={initialValues}
          validationSchema={RestaurantSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
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
                style={[styles.input, touched.name && errors.name && styles.inputError]}
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                placeholder="Enter restaurant name"
              />
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <Text style={styles.label}>Cuisine Type *</Text>
              <TextInput
                style={[styles.input, touched.cuisine && errors.cuisine && styles.inputError]}
                value={values.cuisine}
                onChangeText={handleChange('cuisine')}
                onBlur={handleBlur('cuisine')}
                placeholder="e.g. North Indian, Chinese"
              />
              {touched.cuisine && errors.cuisine && (
                <Text style={styles.errorText}>{errors.cuisine}</Text>
              )}

              <Text style={styles.label}>Price for Two</Text>
              <TextInput
                style={[styles.input, touched.price && errors.price && styles.inputError]}
                value={values.price}
                onChangeText={handleChange('price')}
                onBlur={handleBlur('price')}
                placeholder="Enter price in ₹"
                keyboardType="numeric"
              />
              {touched.price && errors.price && (
                <Text style={styles.errorText}>{errors.price}</Text>
              )}

              <Text style={styles.label}>Delivery Time (minutes)</Text>
              <TextInput
                style={[styles.input, touched.delivery_time && errors.delivery_time && styles.inputError]}
                value={values.delivery_time}
                onChangeText={handleChange('delivery_time')}
                onBlur={handleBlur('delivery_time')}
                placeholder="e.g. 30"
                keyboardType="numeric"
              />
              {touched.delivery_time && errors.delivery_time && (
                <Text style={styles.errorText}>{errors.delivery_time}</Text>
              )}

              <Text style={styles.label}>Distance (km)</Text>
              <TextInput
                style={[styles.input, touched.distance && errors.distance && styles.inputError]}
                value={values.distance}
                onChangeText={handleChange('distance')}
                onBlur={handleBlur('distance')}
                placeholder="e.g. 2.5"
                keyboardType="numeric"
              />
              {touched.distance && errors.distance && (
                <Text style={styles.errorText}>{errors.distance}</Text>
              )}

              <Text style={styles.label}>Offers</Text>
              <TextInput
                style={[styles.input, touched.offers && errors.offers && styles.inputError]}
                value={values.offers}
                onChangeText={handleChange('offers')}
                onBlur={handleBlur('offers')}
                placeholder="e.g. 50% OFF up to ₹100"
              />
              {touched.offers && errors.offers && (
                <Text style={styles.errorText}>{errors.offers}</Text>
              )}

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
          )}
        </Formik>
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
    marginBottom: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#E03546',
  },
  errorText: {
    color: '#E03546',
    fontSize: 12,
    marginBottom: 16,
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