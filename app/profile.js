import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { supabase } from "@utils/superbase";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { StatusBar } from "expo-status-bar";

const ProfileScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [updatingImage, setUpdatingImage] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const {
        data: { user: userData },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!userData) {
        router.replace("/(auth)/login");
        return;
      }

      setUser(userData);
      await fetchProfile(userData.id);
    } catch (error) {
      console.error("Auth error:", error.message);
      Alert.alert("Error", "Failed to load profile");
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, profile_image, phone_number")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setNewName(data.full_name || "");
        setNewEmail(data.email || "");
        setNewPhone(data.phone_number || "");
      }
    } catch (error) {
      console.error("Profile fetch error:", error.message);
      Alert.alert("Error", "Failed to fetch profile data");
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error.message);
      Alert.alert("Error", "Failed to log out");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });

      if (!result.canceled) {
        await updateProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image pick error:", error.message);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const validatePhoneNumber = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (text) => {
    // Remove any non-digit characters
    const digitsOnly = text.replace(/\D/g, "");
    // Limit to 10 digits
    const truncated = digitsOnly.slice(0, 10);
    // Format as XXX-XXX-XXXX
    let formatted = truncated;
    if (truncated.length > 6) {
      formatted = `${truncated.slice(0, 3)}-${truncated.slice(
        3,
        6
      )}-${truncated.slice(6)}`;
    } else if (truncated.length > 3) {
      formatted = `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    }
    setNewPhone(formatted);
    validatePhoneNumber(truncated);
  };

  const updateProfileImage = async (uri) => {
    try {
      setUpdatingImage(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = reader.result.split(",")[1];
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(fileName, decode(base64Data), {
            contentType: "image/jpeg",
          });

        if (uploadError) throw uploadError;

        const { data: publicURL } = supabase.storage
          .from("profiles")
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from("users")
          .update({ profile_image: publicURL.publicUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;

        setProfile((prev) => ({
          ...prev,
          profile_image: publicURL.publicUrl,
        }));
      };
    } catch (error) {
      console.error("Image update error:", error.message);
      Alert.alert("Error", "Failed to update profile image");
    } finally {
      setUpdatingImage(false);
    }
  };

  // Helper function to get profile image with default fallback
  const getProfileImage = (imageUrl) => {
    if (!imageUrl) {
      return "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/profiles/default-avatar.png";
    }
    return imageUrl;
  };

  const updateField = async (field) => {
    try {
      let value;
      switch (field) {
        case "full_name":
          value = newName;
          break;
        case "email":
          value = newEmail;
          break;
        case "phone_number":
          if (!validatePhoneNumber(newPhone)) {
            return; // Don't proceed if validation fails
          }
          value = newPhone;
          break;
        default:
          value = "";
      }

      const { error } = await supabase
        .from("users")
        .update({ [field]: value })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, [field]: value }));
      setIsEditing(false);
      setEditField(null);
      setPhoneError("");
    } catch (error) {
      console.error("Field update error:", error.message);
      Alert.alert("Error", "Failed to update profile");
    }
  };
  // Check if save button should be disabled
  const isSaveDisabled = () => {
    if (editField === "phone_number") {
      return phoneError !== "" || newPhone.replace(/\D/g, "").length !== 10;
    }
    return false;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  if (!user || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={checkUser}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Feather name="settings" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            <Image
              source={{
                uri: getProfileImage(profile?.profile_image),
              }}
              style={styles.profileImage}
              onError={(error) => {
                console.log("Image load error:", error);
                setProfile((prev) => ({
                  ...prev,
                  profile_image: null,
                }));
              }}
            />
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
        </View>

        {/* Options Section */}
        <View style={styles.optionsSection}>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: "#FEE2E2" }]}>
                <MaterialIcons
                  name="favorite-border"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <Text style={styles.optionText}>Favorite Orders</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: "#FEF3C7" }]}>
                <MaterialIcons name="payment" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.optionText}>Payment Methods</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: "#DBEAFE" }]}>
                <MaterialIcons name="location-on" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.optionText}>Saved Addresses</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: "#E0E7FF" }]}>
                <MaterialIcons name="help-outline" size={20} color="#6366F1" />
              </View>
              <Text style={styles.optionText}>Help Center</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.editField}
            onPress={() => {
              setIsEditing(true);
              setEditField("full_name");
            }}
          >
            <View style={styles.editFieldLeft}>
              <Text style={styles.editFieldLabel}>Name</Text>
              <Text style={styles.editFieldValue}>{profile?.full_name}</Text>
            </View>
            <MaterialIcons name="edit" size={20} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editField}
            onPress={() => {
              setIsEditing(true);
              setEditField("email");
            }}
          >
            <View style={styles.editFieldLeft}>
              <Text style={styles.editFieldLabel}>Email</Text>
              <Text style={styles.editFieldValue}>{profile?.email}</Text>
            </View>
            <MaterialIcons name="edit" size={20} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editField}
            onPress={() => {
              setIsEditing(true);
              setEditField("phone_number");
            }}
          >
            <View style={styles.editFieldLeft}>
              <Text style={styles.editFieldLabel}>Phone Number</Text>
              <Text style={styles.editFieldValue}>
                {profile?.phone_number || "Add phone number"}
              </Text>
            </View>
            <MaterialIcons name="edit" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Edit Modal */}
      {isEditing && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editField === "full_name" ? "Name" : editField === "email" ? "Email" : "Phone Number"}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                phoneError && editField === "phone_number" && styles.inputError
              ]}
              value={
                editField === "full_name"
                  ? newName
                  : editField === "email"
                  ? newEmail
                  : newPhone
              }
              onChangeText={
                editField === "phone_number"
                  ? handlePhoneChange
                  : editField === "full_name"
                  ? setNewName
                  : setNewEmail
              }
              placeholder={`Enter your ${
                editField === "full_name"
                  ? "name"
                  : editField === "email"
                  ? "email"
                  : "phone number"
              }`}
              keyboardType={editField === "phone_number" ? "phone-pad" : "default"}
              maxLength={editField === "phone_number" ? 12 : undefined}
              autoFocus
            />
            {phoneError && editField === "phone_number" && (
              <Text style={styles.errorText}>{phoneError}</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setEditField(null);
                  setPhoneError("");
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalSaveButton,
                  isSaveDisabled() && styles.modalSaveButtonDisabled
                ]}
                onPress={() => updateField(editField)}
                disabled={isSaveDisabled()}
              >
                <Text style={[
                  styles.modalSaveButtonText,
                  isSaveDisabled() && styles.modalSaveButtonTextDisabled
                ]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#EF4444",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#EF4444",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  optionsSection: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderColor: "#F3F4F6",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#1F2937",
  },
  accountSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  editField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  editFieldLeft: {
    flex: 1,
  },
  editFieldLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  editFieldValue: {
    fontSize: 16,
    color: "#1F2937",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 30,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
  },
  modalCancelButtonText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "500",
  },
  modalSaveButton: {
    backgroundColor: "#EF4444",
  },
  modalSaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 4,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  modalSaveButtonTextDisabled: {
    color: "#9CA3AF",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
});

export default ProfileScreen;
