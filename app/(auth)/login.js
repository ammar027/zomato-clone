import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Image, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LoginManager, AccessToken, Profile } from 'react-native-fbsdk-next';
import { initializeFacebookSDK } from 'fbsdk.config';
import { supabase } from '@utils/superbase';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';


const { height: SCREEN_HEIGHT } = Dimensions.get('window'); 
const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initializeFacebookSDK();
  }, []);

  // Previous image picker functions remain the same
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypes,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
  
      if (!result.canceled) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const uploadProfileImage = async (userId) => {
    if (!profileImage?.base64) return null;
  
    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
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
      console.error('Upload error:', error);
      return null;
    }
  };

  const createProfile = async (userId, userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert([
          {
            id: userId,
            full_name: userData.fullName,
            email: userData.email,
            phone_number: userData.phoneNumber,
            profile_image: userData.profileImage,
            updated_at: new Date().toISOString(),
          },
        ], 
        { onConflict: 'id' });
  
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Profile creation error:', error);
      throw error;
    }
  };


  const handleFacebookLogin = async () => {
    try {
      setFbLoading(true);
  
      // 1. Request permissions including email explicitly
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email'
      ]);
      
      if (result.isCancelled) {
        throw new Error('User cancelled the login process');
      }
  
      const tokenData = await AccessToken.getCurrentAccessToken();
      if (!tokenData) {
        throw new Error('Failed to get access token');
      }
  
      // 2. Get Facebook profile data including email
      const response = await fetch(
        `https://graph.facebook.com/v13.0/me?fields=id,name,email,picture&access_token=${tokenData.accessToken}`
      );
      const fbData = await response.json();
      
      if (!fbData) {
        throw new Error('Failed to get Facebook profile data');
      }
  
      // Check if we got the profile data
      console.log('Facebook Profile Data:', fbData);
  
      // 3. Rest of your existing flow with email from fbData
      let user;
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('facebook_id', fbData.id)
        .single();
  
      if (!existingUser) {
        // Create new user with email from Facebook
        const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
          email: fbData.email || `${fbData.id}@facebook.com`, // Fallback email if none provided
          password: `fb_${fbData.id}_${Date.now()}`,
        });
  
        if (signUpError) throw signUpError;
        user = newUser;
      } else {
        // Sign in existing user
        const { data: { user: existingAuthUser }, error: signInError } = await supabase.auth.signInWithPassword({
          email: existingUser.email,
          password: `fb_${fbData.id}_${Date.now()}`,
        });
  
        if (signInError) throw signInError;
        user = existingAuthUser;
      }
  
      if (!user) throw new Error('Failed to authenticate user');
  
      // 4. Process profile image from Facebook data
      let profileImageUrl = null;
      if (fbData.picture?.data?.url) {
        try {
          const response = await fetch(fbData.picture.data.url);
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
          });
  
          const fileName = `${user.id}-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(fileName, decode(base64), {
              contentType: 'image/jpeg',
              upsert: true,
            });
  
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('profiles')
              .getPublicUrl(fileName);
            profileImageUrl = publicUrl;
          }
        } catch (error) {
          console.error('Profile image upload error:', error);
        }
      }
  
      // 5. Upsert user profile with email
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: fbData.name || '',
          email: fbData.email || `${fbData.id}@facebook.com`, // Use email from Facebook data
          profile_image: profileImageUrl,
          facebook_id: fbData.id,
          auth_provider: 'facebook',
          facebook_access_token: tokenData.accessToken,
          facebook_token_expires_at: new Date(tokenData.expirationTime).toISOString(),
          updated_at: new Date().toISOString(),
        });
  
      if (upsertError) throw upsertError;
  
      Alert.alert('Success', 'Successfully logged in!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/home')
        }
      ]);
  
    } catch (error) {
      console.error('Facebook login error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setFbLoading(false);
    }
  };

// Helper function to process profile image
const processProfileImage = async (imageURL, userId) => {
  try {
    const response = await fetch(imageURL);
    const blob = await response.blob();
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });

    const fileName = `${userId}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Profile image processing error:', error);
    return null;
  }
};

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        console.log('No active session found.');
      } else {
        console.log('Session found:', data.session);
      }
    };
  
    checkSession();
  }, []);
  
  

  

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Validate required fields
      if (!email || !password || (isSignUp && (!fullName || !phoneNumber))) {
        Alert.alert('Error', 'Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate phone number format
      if (isSignUp && !phoneNumber.match(/^\d{10}$/)) {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Sign Up Flow
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber,
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('No user data returned');

        // Handle profile image upload
        let profileImageUrl = null;
        if (profileImage) {
          profileImageUrl = await uploadProfileImage(signUpData.user.id);
        }

        // Create user profile
        await createProfile(signUpData.user.id, {
          fullName,
          email,
          phoneNumber,
          profileImage: profileImageUrl,
        });

        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]);
      } else {
        // Sign In Flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <LinearGradient
            colors={['#E23744', '#E23744', '#fff']}
            style={styles.gradientHeader}
          >
            <View style={styles.headerSection}>
              <Image 
                source={{ uri: 'https://b.zmtcdn.com/web_assets/b40b97e677bc7b2ca77c58c61db266fe1603954218.png' }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.title}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp 
                  ? 'Sign up to start your food journey' 
                  : 'Sign in to continue'
                }
              </Text>

              {isSignUp && (
                <>
                  <TouchableOpacity 
                    onPress={pickImage} 
                    style={styles.imageContainer}
                    activeOpacity={0.8}
                  >
                    {profileImage ? (
                      <Image 
                        source={{ uri: profileImage.uri }} 
                        style={styles.profileImage} 
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Feather name="camera" size={30} color="#E23744" />
                        <Text style={styles.uploadText}>Add photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={styles.inputContainer}>
                      <Feather name="user" size={20} color="#8A8A8A" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        placeholderTextColor="#8A8A8A"
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>+91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="10-digit mobile number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholderTextColor="#8A8A8A"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={20} color="#8A8A8A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#8A8A8A"
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#8A8A8A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#8A8A8A"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.authButton}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isSignUp ? 'Create Account' : 'Login'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity 
                  style={styles.socialButton}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="google" size={20} color="#E23744" />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
                
  <TouchableOpacity 
    style={[styles.socialButton, { backgroundColor: '#4267B2' }]}
    onPress={handleFacebookLogin}
    disabled={fbLoading}
    activeOpacity={0.8}
  >
    <MaterialCommunityIcons name="facebook" size={20} color="#fff" />
    {fbLoading ? (
      <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />
    ) : (
      <Text style={[styles.socialButtonText, { color: '#fff' }]}>
        Continue with Facebook
      </Text>
    )}
  </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.toggleButton} 
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setPhoneNumber('');
                  setProfileImage(null);
                }}
              >
                <Text style={styles.toggleButtonText}>
                  {isSignUp 
                    ? 'Already have an account? Login' 
                    : "New to Zomato? Create account"
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E23744',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  gradientHeader: {
    height: SCREEN_HEIGHT * 0.25,
  },
  headerSection: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 50,
    tintColor: '#fff',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    minHeight: SCREEN_HEIGHT * 0.8,
  },
  cardContent: {
    padding: 25,
    paddingBottom: Platform.OS === 'ios' ? 50 : 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8A8A',
    marginBottom: 30,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 25,
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E23744',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#E23744',
    marginTop: 5,
    fontSize: 12,
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1C',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginRight: 10,
    width: 70,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1C1C1C',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#1C1C1C',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1C',
  },
  authButton: {
    backgroundColor: '#E23744',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#E23744',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    color: '#8A8A8A',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  socialButtonsContainer: {
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 15,
  },
  socialButtonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  toggleButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#E23744',
    fontSize: 14,
    fontWeight: '500',
  },
    fbButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 55,
      marginBottom: 15,
    },
    fbButton: {
      height: 55,
      width: '100%',
    },
});

export default AuthScreen;