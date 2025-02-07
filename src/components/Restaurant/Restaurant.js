import { StyleSheet, Text, View, Image, FlatList } from "react-native";
import React from "react";
import restaurantData from "src/data/RestaurantData";


const Restaurant = () => {
  return (
    <FlatList
      horizontal
      data={restaurantData}
      keyExtractor={(item, index) => index.toString()}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <View style={styles.foodCtn}>
          <Image source={{ uri: item.image }} style={styles.foodImg} />
          <View style={styles.foodRest}>
            <Text style={styles.foodRestName}>{item.Name}</Text>
            <Text style={styles.foodCat}>{item.category || "Indian"}</Text>
          </View>
        </View>
      )}
    />
  );
};

export default Restaurant;

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 15, // Adds spacing on both sides
  },
  foodCtn: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    width: 200,
    height: 100,
    marginRight: 12,
    elevation: 4, // Adds shadow (Android)
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginVertical: 10,
  },
  foodImg: {
    width: 90,
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  foodRest: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  foodRestName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  foodCat: {
    color: "gray",
    fontSize: 14,
    marginTop: 4,
  },
});
