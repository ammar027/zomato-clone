import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Link, usePathname } from "expo-router";
import { BlurView } from "expo-blur";
import HomeScreen from "./home";
import RestaurantScreen from "./restaurant";

const Tab = createBottomTabNavigator();

const WebTabBar = () => {
  const pathname = usePathname(); // Get current route

  const tabs = [
    { name: "Home", icon: "home", path: "/" },
    { name: "Restaurant", icon: "restaurant-outline", path: "/restaurant" },
  ];

  return (
    <BlurView intensity={80} tint="extraLight" style={styles.tabBarContainer}>
      {tabs.map((tab) => {
        const isFocused = pathname === tab.path; // Check active tab

        return (
          <Link key={tab.name} href={tab.path} asChild>
            <TouchableOpacity style={styles.tabButton}>
              {tab.name === "Home" ? (
                <Feather
                  name={tab.icon}
                  size={24}
                  color={isFocused ? "#e03546" : "gray"} // Active Tint Color
                />
              ) : (
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={isFocused ? "#e03546" : "gray"} // Active Tint Color
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? "#e03546" : "gray" },
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          </Link>
        );
      })}
    </BlurView>
  );
};

export default function Layout() {
  return (
    <Tab.Navigator
      tabBar={() => <WebTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="index" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="restaurant" component={RestaurantScreen} options={{ title: "Restaurant" }} />
    </Tab.Navigator>
  );
}

const styles = {
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: "rgb(255, 255, 255)", // Transparent Background
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backdropFilter: "blur(60px)", // Web Blur Effect
  },
  tabButton: {
    alignItems: "center",
    flex: 1,
    padding: 10,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 5,
  },
};
