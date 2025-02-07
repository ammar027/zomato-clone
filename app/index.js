import { supabase } from "@utils/superbase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";

NavigationBar.setPositionAsync("absolute");
NavigationBar.setBackgroundColorAsync("#ffffff01");
<StatusBar translucent/>

export default function IndexPage() {


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(tabs)/home");
      }
    })

    supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            router.replace("/(tabs)/home");
        }
        else {
            router.replace("/(auth)/login");
        }
    })
  }, [])

}