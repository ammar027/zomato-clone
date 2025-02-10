import { View, Text, StyleSheet, FlatList, Platform } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@components/Header/Header";
import Restaurant from "@components/Restaurant/Restaurant";
import Featured from "@components/Featured/Featured";
import featuredData from "src/data/featuredData";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

const Home = () => {
  const insets = useSafeAreaInsets(); 

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        ListHeaderComponent={
          <>
            <Header />
            <Restaurant />
            <View style={styles.forYou}>
              <Text style={styles.forYouText}>FEATURED tttttttt</Text>
            </View>
          </>
        }
        data={featuredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Featured
            itemName={item.itemName}
            price={item.price}
            image={item.image}
            dist={item.dist}
            restName={item.restName}
            category={item.category}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    backgroundColor: "#fff", // Light background
    paddingTop:8,
  },
  forYou: {
    alignItems: "center",
  },
  forYouText: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "grey",
    letterSpacing: 2,
    fontWeight: "100",
  },
  listContent: {
    paddingBottom: Platform.OS === "web" ? 50 : 20,
  },
});

export default Home;