import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import HomeScreen from './home';
import RestaurantScreen from './restaurant';
import { Stack } from 'expo-router';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const TAB_WIDTH = 54.5;
  const INDICATOR_SIZE = 45;
  
  const indicatorPosition = useSharedValue(state.index * TAB_WIDTH);

  useEffect(() => {
    indicatorPosition.value = withTiming(state.index * TAB_WIDTH, { duration: 100 });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value + (TAB_WIDTH - INDICATOR_SIZE) / 1.38 }],
      width: INDICATOR_SIZE,
      height: INDICATOR_SIZE,
      borderRadius: INDICATOR_SIZE / 2,
    };
  });

  return (
    <View style={{ position: 'absolute', bottom: 0, width: '100%', alignItems: 'center' }}>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.06)',
          'rgba(255, 255, 255, 0.4)',
          'rgba(255, 255, 255, 0.76)',
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 130,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          position: 'absolute',
          bottom: 20,
          backgroundColor: '#fff',
          borderRadius: 40,
          borderColor: 'grey',
          height: 65,
          justifyContent: 'space-around',
          alignItems: 'center',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          width: 120,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.1)',
          overflow: 'hidden', // This ensures icons don't overflow
        }}
      >
        {/* Move the Animated.View before the tabs to ensure it's below */}
        <Animated.View
          style={[{
            position: 'absolute',
            bottom: 9,
            width: INDICATOR_SIZE,
            height: INDICATOR_SIZE,
            borderRadius: INDICATOR_SIZE / 2,
            backgroundColor: '#e03546',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#e03546',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 1, // Ensure indicator is below the icons
          }, indicatorStyle]}
        >
          {state.routes[state.index].name === 'Home' ? (
            <Feather name="home" size={24} color={'white'} />
          ) : (
            <Ionicons name="restaurant-outline" size={24} color={'white'} />
          )}
        </Animated.View>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={{ 
                alignItems: 'center', 
                width: TAB_WIDTH,
                height: '100%',
                justifyContent: 'center',
                zIndex: 2, // Ensure icons are above the indicator
                backgroundColor: 'transparent', // Make sure background is transparent
              }}
            >
              <View 
                style={{ 
                  height: 24,
                  opacity: isFocused ? 0 : 1, // Fade out the icon when focused
                  position: 'relative', // Ensure proper layering
                  zIndex: 2, // Keep icons above indicator
                }}
              >
                {route.name === 'Home' ? (
                  <Feather name="home" size={24} color={isFocused ? 'transparent' : 'gray'} />
                ) : (
                  <Ionicons name="restaurant-outline" size={24} color={isFocused ? 'transparent' : 'gray'} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function Layout() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Restaurant" component={RestaurantScreen} />

    </Tab.Navigator>
    
  );
}