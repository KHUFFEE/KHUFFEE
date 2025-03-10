import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import {
  Settings,
  Home,
  Package,
  Calendar,
  Clipboard,
  LogOut,
  User,
  X,
} from "lucide-react-native";
import { styles, modernStyles } from "./common/commonstyler";
import { ViewType } from "./common/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../app/(login)/index";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface LayoutProps {
  children: React.ReactNode;
  storeName: string;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const Layout_warehouse: React.FC<LayoutProps> = ({
  children,
  storeName,
  activeView,
  setActiveView,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Main">>();

  // 설정 모달 상태
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // 로그아웃 확인 모달 상태
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // 설정 모달 열기/닫기
  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  // "설정 및 개인정보" 버튼 동작
  const handleSettings = () => {
    closeSettingsModal();
  };

  // 로그아웃 요청
  const handleLogoutRequest = () => {
    closeSettingsModal();
    setShowConfirmLogout(true);
  };

  // 실제 로그아웃 실행
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token"); // 인증 토큰 삭제
      setShowConfirmLogout(false);

      // 로그인 화면으로 이동 (네비게이션 스택 리셋)
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  // 아이콘 렌더링 함수
  const renderIcon = (IconComponent: any, isActive: boolean) => (
    <IconComponent
      size={22}
      color={isActive ? "#8B0000" : "#64748b"}
      strokeWidth={isActive ? 2.5 : 1.5}
    />
  );

  return (
    <View style={styles.dashboardContainer}>
      {/* 상단 헤더 - 블러 효과와 그라데이션 적용 */}
      {Platform.OS === "ios" ? (
        <View
          testID="headerContainer"
          style={[
            modernStyles.headerContainer,
            { backgroundColor: "rgba(255, 255, 255, 0.9)" },
          ]}
        >
          <BlurView
            testID="blurView"
            intensity={80}
            tint="light"
            style={[StyleSheet.absoluteFill]}
          >
            <View style={{ opacity: 0 }} />
          </BlurView>
          <HeaderContent
            storeName={storeName}
            openSettingsModal={openSettingsModal}
          />
        </View>
      ) : (
        <LinearGradient
          colors={["#ffffff", "#f8f9fa"]}
          style={modernStyles.headerContainer}
        >
          <HeaderContent
            storeName={storeName}
            openSettingsModal={openSettingsModal}
          />
        </LinearGradient>
      )}

      {/* 메인 콘텐츠 영역 */}
      <View style={styles.mainContent}>{children}</View>

      {/* 하단 네비게이션 바 - 모던한 디자인 적용 */}
      {Platform.OS === "ios" ? (
        <View
          style={[
            modernStyles.bottomNavContainer,
            { backgroundColor: "rgba(255, 255, 255, 0.9)" },
          ]}
        >
          <BlurView
            intensity={80}
            tint="light"
            style={[StyleSheet.absoluteFill]}
          >
            <View style={{ opacity: 0 }} />
          </BlurView>
          <BottomNavContent
            activeView={activeView}
            setActiveView={setActiveView}
            renderIcon={renderIcon}
          />
        </View>
      ) : (
        <LinearGradient
          colors={["#f8f9fa", "#ffffff"]}
          style={modernStyles.bottomNavContainer}
        >
          <BottomNavContent
            activeView={activeView}
            setActiveView={setActiveView}
            renderIcon={renderIcon}
          />
        </LinearGradient>
      )}

      {/* 설정 모달 */}
      <Modal
        visible={isSettingsModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSettingsModal}
      >
        <View style={modernStyles.modalOverlay}>
          <View style={modernStyles.modalContainer}>
            <View style={modernStyles.modalHeader}>
              <Text testID="modalTitle" style={modernStyles.modalTitle}>
                설정
              </Text>
              <TouchableOpacity
                onPress={closeSettingsModal}
                style={modernStyles.closeButton}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={modernStyles.modalOption}
              onPress={handleSettings}
            >
              <User size={20} color="#0D326F" />
              <Text
                testID="modalOptionText"
                style={modernStyles.modalOptionText}
              >
                설정 및 개인정보
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modernStyles.modalOption}
              onPress={handleLogoutRequest}
            >
              <LogOut size={20} color="#8B0000" />
              <Text
                testID="modalOptionText"
                style={modernStyles.modalOptionText}
              >
                로그아웃
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 로그아웃 확인 모달 */}
      <Modal
        visible={showConfirmLogout}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmLogout(false)}
      >
        <View style={modernStyles.modalOverlay}>
          <View style={modernStyles.confirmContainer}>
            <Text testID="confirmTitle" style={modernStyles.confirmTitle}>
              로그아웃
            </Text>
            <Text testID="confirmMessage" style={modernStyles.confirmMessage}>
              정말 로그아웃할까요?
            </Text>

            <View style={modernStyles.confirmButtonsContainer}>
              {/* 닫기 버튼 */}
              <TouchableOpacity
                style={modernStyles.cancelButton}
                onPress={() => setShowConfirmLogout(false)}
              >
                <Text
                  testID="cancelButtonText"
                  style={modernStyles.cancelButtonText}
                >
                  취소
                </Text>
              </TouchableOpacity>

              {/* 로그아웃 버튼 */}
              <TouchableOpacity
                style={modernStyles.logoutButton}
                onPress={handleLogout}
              >
                <Text
                  testID="logoutButtonText"
                  style={modernStyles.logoutButtonText}
                >
                  로그아웃
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 헤더 컨텐츠 컴포넌트
const HeaderContent = ({
  storeName,
  openSettingsModal,
}: {
  storeName: string;
  openSettingsModal: () => void;
}) => (
  <View
    style={{
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Text
      testID="storeNameText"
      style={modernStyles.storeNameText}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {storeName}
    </Text>
    <TouchableOpacity
      testID="settingsButton"
      onPress={openSettingsModal}
      style={modernStyles.settingsButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Settings size={24} color="#0D326F" strokeWidth={2} />
    </TouchableOpacity>
  </View>
);

// 하단 네비게이션 컨텐츠 컴포넌트
const BottomNavContent = ({
  activeView,
  setActiveView,
  renderIcon,
}: {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  renderIcon: (IconComponent: any, isActive: boolean) => React.ReactNode;
}) => (
  <>
    <TouchableOpacity
      testID="stockButton"
      style={[
        modernStyles.navButton,
        activeView === "stock" && modernStyles.activeNavButton,
      ]}
      onPress={() => setActiveView("stock")}
    >
      {renderIcon(Clipboard, activeView === "stock")}
      <Text
        testID={activeView === "stock" ? "activeNavText" : "navText"}
        style={
          activeView === "stock"
            ? modernStyles.activeNavText
            : modernStyles.navText
        }
      >
        재고관리
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      testID="expirationButton"
      style={[
        modernStyles.navButton,
        activeView === "expiration" && modernStyles.activeNavButton,
      ]}
      onPress={() => setActiveView("expiration")}
    >
      {renderIcon(Calendar, activeView === "expiration")}
      <Text
        testID={activeView === "expiration" ? "activeNavText" : "navText"}
        style={
          activeView === "expiration"
            ? modernStyles.activeNavText
            : modernStyles.navText
        }
      >
        유통기한관리
      </Text>
    </TouchableOpacity>
  </>
);

export default Layout_warehouse;
