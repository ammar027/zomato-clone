// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   Alert,
//   StyleSheet
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { supabase } from '@utils/superbase';

// const CreateRestaurant = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     cuisine_type: '',
//     price_range: '',
//     delivery_time: '',
//     delivery_fee: '',
//     description: '',
//     address: '',
//     phone: '',
//     tags: '',
//     offers: ''
//   });
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [16, 9],
//       quality: 0.8,
//     });

//     if (!result.canceled) {
//       setImage(result.assets[0]);
//     }
//   };

//   const handleSubmit = async () => {
//     if (!image) {
//       Alert.alert('Error', 'Please select an image');
//       return;
//     }

//     setLoading(true);
//     try {
//       // Upload image to Supabase Storage
//       const fileExt = image.uri.split('.').pop();
//       const fileName = `${Date.now()}.${fileExt}`;
//       const filePath = `${fileName}`;

//       const response = await fetch(image.uri);
//       const blob = await response.blob();

//       const { error: uploadError } = await supabase
//         .storage
//         .from('restaurant_images')
//         .upload(filePath, blob);

//       if (uploadError) throw uploadError;

//       // Create restaurant record in database
//       const { data, error } = await supabase
//         .from('restaurants')
//         .insert([
//           {
//             ...formData,
//             image_path: filePath,
//             tags: formData.tags.split(',').map(tag => tag.trim()),
//             created_at: new Date()
//           }
//         ]);

//       if (error) throw error;

//       Alert.alert('Success', 'Restaurant created successfully!');
//       // Reset form
//       setFormData({
//         name: '',
//         cuisine_type: '',
//         price_range: '',
//         delivery_time: '',
//         delivery_fee: '',
//         description: '',
//         address: '',
//         phone: '',
//         tags: '',
//         offers: ''
//       });
//       setImage(null);
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView style={styles.formContainer}>
//       <Text style={styles.formTitle}>Add New Restaurant</Text>

//       <TouchableOpacity 
//         style={styles.imageUploadContainer} 
//         onPress={pickImage}
//       >
//         {image ? (
//           <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
//         ) : (
//           <View style={styles.uploadPlaceholder}>
//             <Feather name="image" size={40} color="#666" />
//             <Text style={styles.uploadText}>Upload Restaurant Image</Text>
//           </View>
//         )}
//       </TouchableOpacity>

//       {Object.keys(formData).map((key) => (
//         <View key={key} style={styles.inputContainer}>
//           <Text style={styles.label}>
//             {key.split('_').map(word => 
//               word.charAt(0).toUpperCase() + word.slice(1)
//             ).join(' ')}
//           </Text>
//           <TextInput
//             style={styles.input}
//             value={formData[key]}
//             onChangeText={(text) => setFormData(prev => ({...prev, [key]: text}))}
//             placeholder={`Enter ${key.split('_').join(' ')}`}
//             multiline={key === 'description'}
//             keyboardType={
//               key.includes('time') || key.includes('fee') 
//                 ? 'numeric' 
//                 : 'default'
//             }
//           />
//         </View>
//       ))}

//       <TouchableOpacity 
//         style={[
//           styles.submitButton,
//           loading && styles.submitButtonDisabled
//         ]}
//         onPress={handleSubmit}
//         disabled={loading}
//       >
//         <Text style={styles.submitButtonText}>
//           {loading ? 'Creating...' : 'Create Restaurant'}
//         </Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',
//     paddingVertical: 16,
//   },
//   headerContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     marginBottom: 16,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1A1A1A',
//   },
//   viewAllButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   viewAllText: {
//     color: '#E03546',
//     fontSize: 14,
//     marginRight: 4,
//   },
//   listContainer: {
//     paddingHorizontal: 10,
//   },
//   card: {
//     width: CARD_WIDTH,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     marginHorizontal: 10,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     overflow: 'hidden',
//   },
//   imageContainer: {
//     height: 200,
//     width: '100%',
//     position: 'relative',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//   },
//   overlay: {
//     position: 'absolute',
//     top: 12,
//     left: 12,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   badge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   discountBanner: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#E03546CC',
//     padding: 8,
//   },
//   discountText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   cardContent: {
//     padding: 12,
//   },
//   headerRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     flex: 1,
//     marginRight: 8,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#48C479',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     gap: 4,
//   },
//   rating: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   cuisine: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 8,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   infoItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   infoText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   dot: {
//     width: 3,
//     height: 3,
//     borderRadius: 1.5,
//     backgroundColor: '#666',
//     marginHorizontal: 8,
//   },
//   offersContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     marginBottom: 8,
//   },
//   offerText: {
//     fontSize: 14,
//     color: '#E03546',
//     fontWeight: '500',
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   tag: {
//     backgroundColor: '#F0F0F0',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   tagText: {
//     fontSize: 12,
//     color: '#666',
//   },
//   // Form Styles
//   formContainer: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 16,
//   },
//   formTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginBottom: 24,
//   },
//   imageUploadContainer: {
//     width: '100%',
//     height: 200,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 12,
//     marginBottom: 24,
//     overflow: 'hidden',
//   },
//   uploadedImage: {
//     width: '100%',
//     height: '100%',
//   },
//   uploadPlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   uploadText: {
//     color: '#666',
//     fontSize: 16,
//     marginTop: 8,
//   },
//   inputContainer: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1A1A1A',
//     marginBottom: 8,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     color: '#333',
//     backgroundColor: '#fff',
//     minHeight: 48,
//   },
//   submitButton: {
//     backgroundColor: '#E03546',
//     padding: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 24,
//     marginBottom: 40,
//   },
//   submitButtonDisabled: {
//     backgroundColor: '#ffacb5',
//   },
//   submitButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export {CreateRestaurant };