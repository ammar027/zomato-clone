import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "@utils/superbase";
import { Feather, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import AddRestaurantModal from "@components/Restaurant/AddRestaurant";

const { width } = Dimensions.get("window");

const Restaurant = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [imageLoading, setImageLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const categories = [
    "All",
    "North Indian",
    "South Indian",
    "Chinese",
    "Fast Food",
    "Beverages",
  ];

  const getRestaurantImage = (imageUrl) => {
    if (!imageUrl) {
      // Return a default restaurant image if none exists
      return "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/restaurant_images/default-restaurant.jpg";
    }
    return imageUrl;
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("restaurants")
        .select("*")
        .order("rating", { ascending: false });
  
      if (activeCategory !== "All") {
        query = query.eq("cuisine", activeCategory);
      }
  
      const { data, error } = await query;
  
      if (error) {
        console.error("Error fetching restaurants:", error.message);
        return;
      }
  
      // Ensure correct image URL
      const restaurantsWithImages = data.map((restaurant) => {
        let imageUrl = restaurant.image;
  
        // If the image stored is just the file name, generate full URL
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = supabase.storage
            .from("restaurant_images")
            .getPublicUrl(imageUrl).data.publicUrl;
        }
  
        return {
          ...restaurant,
          imageUrl: imageUrl || "https://xvhopevvhbdjcpwrlanc.supabase.co/storage/v1/object/public/restaurant_images/default-restaurant.jpg",
        };
      });
  
      setRestaurants(restaurantsWithImages);
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };
  
  

  const renderRatingStars = (rating) => (
    <View style={styles.ratingContainer}>
      <View style={styles.ratingBox}>
        <Text style={styles.ratingText}>{rating?.toFixed(1) || "4.0"}</Text>
        <FontAwesome name="star" size={12} color="#fff" />
      </View>
    </View>
  );

  const renderRestaurantCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        console.log("Selected restaurant:", item.name);
      }}
    >
      {item.promoted && (
        <View style={styles.promotedTag}>
          <Text style={styles.promotedText}>Promoted</Text>
        </View>
      )}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <ActivityIndicator
            style={styles.imageLoader}
            size="large"
            color="#EF4444"
          />
        )}
        <Image
          source={{ uri: item.imageUrl }} // ✅ Fixed: Using `item.imageUrl`
          style={styles.restaurantImage}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={(error) => {
            console.error("Image load error:", error);
            setImageLoading(false);
          }}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {renderRatingStars(item.rating)}
        </View>
        <Text style={styles.cuisine}>{item.cuisine}</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <MaterialIcons name="attach-money" size={16} color="#666" />
            <Text style={styles.price}>₹{item.price} for two</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.infoItem}>
            <Feather name="clock" size={14} color="#666" />
            <Text style={styles.time}>{item.delivery_time}min</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.infoItem}>
            <MaterialIcons name="delivery-dining" size={16} color="#666" />
            <Text style={styles.distance}>{item.distance}km</Text>
          </View>
        </View>
        {item.offers && (
          <View style={styles.offerContainer}>
            <MaterialIcons name="local-offer" size={14} color="#E03546" />
            <Text style={styles.offerText}>{item.offers}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            activeCategory === category && styles.activeCategoryButton,
          ]}
          onPress={() => {
            setActiveCategory(category);
            fetchRestaurants(); // Fetch restaurants when category changes
          }}
        >
          <Text
            style={[
              styles.categoryText,
              activeCategory === category && styles.activeCategoryText,
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E03546" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Popular Restaurants</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Feather name="filter" size={20} color="#333" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
      <AddRestaurantModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchRestaurants}
      />

      {renderCategories()}

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderRestaurantCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#333",
  },
  categoriesContainer: {
    padding: 12,
    backgroundColor: "#fff",
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: "#E03546",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
  },
  activeCategoryText: {
    color: "#fff",
  },
  listContainer: {
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  cardContent: {
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  cuisine: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  promotedTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#1A1A1A80",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  promotedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  ratingContainer: {
    marginLeft: 8,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#48C479",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
    marginHorizontal: 8,
  },
  price: {
    fontSize: 14,
    color: "#666",
  },
  time: {
    fontSize: 14,
    color: "#666",
  },
  distance: {
    fontSize: 14,
    color: "#666",
  },
  offerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 4,
  },
  offerText: {
    fontSize: 14,
    color: "#E03546",
    fontWeight: "500",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#E03546",
    gap: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  restaurantImage: {
    width: "100%",
    height: 200, // or whatever height you want
    borderRadius: 8,
    backgroundColor: "#f3f4f6", // Light gray background while loading
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
});

export default Restaurant;
