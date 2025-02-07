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

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // Format phone number while typing
  const handlePhoneChange = (text) => {
    // Remove any non-digit characters
    const digitsOnly = text.replace(/\D/g, '');
    // Limit to 10 digits
    const truncated = digitsOnly.slice(0, 10);
    // Format as XXX-XXX-XXXX
    let formatted = truncated;
    if (truncated.length > 6) {
      formatted = `${truncated.slice(0, 3)}-${truncated.slice(3, 6)}-${truncated.slice(6)}`;
    } else if (truncated.length > 3) {
      formatted = `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    }
    setNewPhone(formatted);
    validatePhoneNumber(truncated);
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
      return phoneError !== "" || newPhone.replace(/\D/g, '').length !== 10;
    }
    return false;
  };

  // ... (keep all other existing functions) ...

  return (
    <SafeAreaView style={styles.container}>
      {/* ... (keep existing code until Edit Modal) ... */}

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
  // ... (keep existing styles) ...
  
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