import { StyleSheet, Text, View, Image, ScrollView, Dimensions, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const Header = () => {
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Auto-scroll effect
  useEffect(() => {
    let position = 0;
    const interval = setInterval(() => {
      position = (position + 1) % promoImages.length;
      scrollRef.current?.scrollTo({ x: position * (width * 0.8 + 15), animated: true });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.mainWrap}>
      {/* Header Section */}
      <View style={styles.headingWrap}>
        <View style={styles.headingCtn}>
          <Ionicons name="location" size={32} color="#e03546" />
          <View style={styles.headingLocation}>
            <Text style={styles.headingTitle}>Work</Text>
            <Text style={styles.headingDesc}>Luxuria Business Hub, Enacton Technologies 604</Text>
          </View>
        </View>
        <View style={styles.headingProfile}>
          <Image source={require("@assets/images/profile.png")} style={styles.headingProfileImg} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={20} color="#e03546" />
        <Text style={styles.searchText}>Restaurant name or a dish..</Text>
        <Feather name="mic" size={20} color="#e03546" />
      </View>

      {/* Card Slider - ScrollView-Based */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.swipeable}
        contentContainerStyle={styles.carouselContainer}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
      >
        {promoImages.map((uri, index) => (
          <View key={index} style={styles.card}>
            <Image source={{ uri }} style={styles.promoImage} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.forYou}>
        <Text style={styles.forYouText}>For You</Text>
      </View>
    </View>
  );
};

// Promo Image Data
const promoImages = [
  "https://s3-ap-southeast-1.amazonaws.com/bsy/iportal/images/zomato-banner-change_74B641A1E3AE1100D7015078982A3409.jpg",
  "https://i.pinimg.com/736x/30/74/bc/3074bcb35ab6b33f3ad3222a0a33d7bc.jpg",
  "https://i.pinimg.com/736x/30/74/bc/3074bcb35ab6b33f3ad3222a0a33d7bc.jpg",
];

export default Header;

const styles = StyleSheet.create({
  mainWrap: {
    marginHorizontal: 8,
  },
  headingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headingCtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
  },
  headingTitle: {
    marginTop: 15,
    fontSize: 26,
    fontWeight: "800",
  },
  headingLocation: {
    marginLeft: 5,
  },
  headingProfile: {
    borderWidth: 1,
    borderColor: "black",
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    marginLeft: 10,
  },
  headingProfileImg: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  headingDesc: {
    color: "gray",
    fontSize: 14,
    letterSpacing: 0.8,
  },
  searchWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    elevation: 10,
  },
  searchText: {
    color: "gray",
    fontWeight: "500",
    fontSize: 14,
    letterSpacing: 0.8,
    width: "70%",
  },
  forYou: {
    flexDirection: "row",
    justifyContent: "center",
    
  },
  forYouText: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "gray",
    letterSpacing: 2,
  },
  swipeable: {
    height: 180,
    overflow: "hidden",
    marginVertical: 10,
  },
  carouselContainer: {
    paddingHorizontal: 10,
  },
  card: {
    width: width * 0.8, // Each card takes 80% of screen width
    height: 160,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginHorizontal: 7.5, // Ensures proper spacing between cards
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  promoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    resizeMode: "cover",
  },
});
