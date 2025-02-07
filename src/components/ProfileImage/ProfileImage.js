import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";

const ProfileImage = ({ userId, imageUrl }) => {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState(getDefaultImage());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (imageUrl) setImageSrc(imageUrl);
  }, [imageUrl]);

  const handlePress = () => {
    router.push("/profile"); // Navigate to profile screen
  };

  return (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => router.push("/profile")}
    >
      {loading && (
        <ActivityIndicator size="small" color="#EF4444" style={styles.loader} />
      )}
      <Image
        source={{ uri: imageSrc }}
        style={styles.profileImage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setImageSrc(getDefaultImage())}
      />
    </TouchableOpacity>
  );
};

// Helper function to return default avatar
const getDefaultImage = () =>
  "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/profiles/default-avatar.png";

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
    alignSelf: "center",
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  loader: { position: "absolute", alignSelf: "center", top: "50%" },
  loaderContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});

export default ProfileImage;
