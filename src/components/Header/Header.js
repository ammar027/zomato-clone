import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";
import React, { useRef, useEffect, useState } from "react";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import CardSlider from "@components/CardSlider";
import ProfileImage from "@components/ProfileImage/ProfileImage";
import { supabase } from "@utils/superbase"; // Import Supabase client

const { width } = Dimensions.get("window");

const Header = () => {
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Define user state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { user: userData }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!userData) return;

      setUser(userData);
      await fetchProfile(userData.id);
    } catch (error) {
      console.error("Auth error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, profile_image")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Profile fetch error:", error.message);
    }
  };

  return (
    <View style={styles.mainWrap}>
      {/* Header Section */}
      <View style={styles.headingWrap}>
        <View style={styles.headingCtn}>
          <View style={styles.locationIconContainer}>
            <Feather name="map-pin" size={24} color="#e03546" />
          </View>
          <View style={styles.headingLocation}>
            <Text style={styles.headingTitle}>Work</Text>
            <Text style={styles.headingDesc}>
              Luxuria Business Hub, Enacton Technologies 604
            </Text>
          </View>
        </View>

        {user && profile && (
          <Pressable onPress={() => router.push("/profile")} style={styles.profileButton}>
            <ProfileImage userId={user.id} imageUrl={profile?.profile_image} />
          </Pressable>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={18} color="#e03546" />
        <Text style={styles.searchText}>Restaurant name or a dish...</Text>
        <View style={styles.micIconContainer}>
          <Feather name="mic" size={18} color="#e03546" />
        </View>
      </View>
      <CardSlider images={promoImages} />

      <View style={styles.forYou}>
        <Text style={styles.forYouText}>For You</Text>
      </View>
    </View>
  );
};


const promoImages = [
  "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/myassets//zomato-banner-change_74B641A1E3AE1100D7015078982A3409.jpg",
  "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/myassets//3074bcb35ab6b33f3ad3222a0a33d7bc%20(1).jpg",
  "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/myassets//zomato-banner-change_74B641A1E3AE1100D7015078982A3409.jpg",
  "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/myassets//3074bcb35ab6b33f3ad3222a0a33d7bc%20(1).jpg",
];

export default Header;

const styles = StyleSheet.create({
  mainWrap: {
    marginHorizontal: 10,
    marginTop: 2,
  },
  headingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headingCtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "75%",
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(224, 53, 70, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#cccccc',
  },
  headingTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: '#1A1A1A',
  },
  headingLocation: {
    marginLeft: 12,
    flex: 1,
  },
  profileButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headingProfileImg: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  headingDesc: {
    color: "#666",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  searchWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#ededed',
    padding: 11,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal:5,
  },
  searchText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 14,
    letterSpacing: 0.3,
    flex: 1,
    marginLeft: 12,
  },
  micIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(224, 53, 70, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  forYou: {
    alignItems: "center",
  },
  forYouText: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "grey",
    letterSpacing: 2,
    fontWeight: "400",
  },
});