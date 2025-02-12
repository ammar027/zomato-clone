import { useFonts } from "expo-font";
import { Slot, Stack } from "expo-router";
import { useCallback } from "react";

export default function AuthScreen() {
  const [fontsLoaded] = useFonts({
    "Poppins-Bold": require("@assets/fonts/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("@assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Medium": require("@assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("@assets/fonts/Poppins-Regular.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      // Set navigation bar
      await NavigationBar.setPositionAsync("absolute");
      await NavigationBar.setBackgroundColorAsync("#ffffff01");

      // Hide splash screen
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
