import {
    StyleSheet,
    Text,
    View,
    Image,
    Dimensions,
    Animated,
    FlatList,
  } from "react-native";
  import React, { useRef, useState, useCallback } from "react";
  import { LinearGradient } from 'expo-linear-gradient';
  
  const { width: WINDOW_WIDTH } = Dimensions.get("window");
  
  // Layout constants
  const CARD_WIDTH = WINDOW_WIDTH * 0.90;
  const CARD_HEIGHT = 180;
  const DOT_SIZE = 8;
  const ACTIVE_DOT_WIDTH = 24;
  const AUTO_SCROLL_INTERVAL = 6000;
  
  // Theme colors
  const COLORS = {
    GRADIENT_START: 'rgba(0,0,0,0)',
    GRADIENT_END: 'rgba(0,0,0,0.5)',
    DOT_INACTIVE: 'rgba(224, 53, 70, 0.2)',
    DOT_ACTIVE: '#e03546',
    CARD_BACKGROUND: '#fff',
    SHADOW: '#000',
  };
  
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
  
  const CardSlider = ({ images }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
  
    React.useEffect(() => {
      const autoScroll = setInterval(() => {
        const nextIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }, AUTO_SCROLL_INTERVAL);
  
      return () => clearInterval(autoScroll);
    }, [activeIndex, images.length]);
  
    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
      if (viewableItems[0]) {
        setActiveIndex(viewableItems[0].index);
      }
    }, []);
  
    const viewabilityConfig = {
      viewAreaCoveragePercentThreshold: 50,
      minimumViewTime: 100,
    };
  
    const viewabilityConfigCallbackPairs = useRef([
      { viewabilityConfig, onViewableItemsChanged },
    ]);
  
    const renderCard = ({ item, index }) => {
      const inputRange = [
        (index - 1) * CARD_WIDTH,  // Changed from WINDOW_WIDTH
        index * CARD_WIDTH,        // Changed from WINDOW_WIDTH
        (index + 1) * CARD_WIDTH,  // Changed from WINDOW_WIDTH
      ];
  
      const animatedStyle = {
        transform: [{
          scale: scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          })
        }],
        opacity: scrollX.interpolate({
          inputRange,
          outputRange: [0.6, 1, 0.6],
          extrapolate: 'clamp',
        })
      };
  
      return (
        <View style={styles.cardWrapper}>
          <Animated.View style={[styles.card, animatedStyle]}>
            <Image source={{ uri: item }} style={styles.cardImage} />
            <LinearGradient
              colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
              style={styles.gradient}
            />
          </Animated.View>
        </View>
      );
    };
  
    const Pagination = () => (
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    );
  
    return (
      <View style={styles.container}>
        <AnimatedFlatList
          ref={flatListRef}
          data={images}
          renderItem={renderCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH}  // Changed from WINDOW_WIDTH
          decelerationRate="fast"
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          bounces={false}
          pagingEnabled={false}  // Changed to false since we're using snapToInterval
          contentContainerStyle={styles.listContainer}
        />
        <Pagination />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    listContainer: {
    //   paddingHorizontal: (WINDOW_WIDTH - CARD_WIDTH) / 5,
    paddingInlineEnd: 5,
    },
    cardWrapper: {
      width: CARD_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      marginLeft: 4,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
      backgroundColor: COLORS.CARD_BACKGROUND,
      shadowColor: COLORS.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6.84,
      elevation: 4,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '50%',
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: COLORS.DOT_INACTIVE,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: COLORS.DOT_ACTIVE,
      width: ACTIVE_DOT_WIDTH,
    },
  });
  
  export default CardSlider;