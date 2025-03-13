import React, { useState } from "react";
import { StatusBar } from "react-native";
import { useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../(login)/index";
import StoreEmployeeDashboard_store from "./StoreEmployeeDashboard_store";
import { styles } from "../../src/components/ui/common/commonstyler";
import Layout_store from "../../src/components/ui/Layout_store";
import { ViewType } from "../../src/components/ui/common/types";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

export default function StoreDashboardScreen() {
  const route = useRoute();
  const { storeName } = route.params as { storeName: string };

  // 현재 활성화된 뷰 상태
  const [activeView, setActiveView] = useState<ViewType>("home");

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView
        testID="dashboardContainer"
        style={styles.dashboardContainer}
        edges={["right", "left"]} // top과 bottom은 Layout에서 처리하도록 제외
      >
        <Layout_store
          storeName={storeName}
          activeView={activeView}
          setActiveView={setActiveView}
        >
          <StoreEmployeeDashboard_store
            storeName={storeName}
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </Layout_store>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
