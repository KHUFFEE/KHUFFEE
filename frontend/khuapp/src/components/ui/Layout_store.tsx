import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import {
  Settings,
  Home,
  ShoppingCart,
  Receipt,
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
import { RN_API_URL } from "@env";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";

// 테이블 상태 인터페이스 정의
interface TableStatus {
  테이블: string;
  상태: number;
}

interface LayoutProps {
  children: React.ReactNode;
  storeName: string;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

interface BottomNavContentProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  renderIcon: (IconComponent: any, isActive: boolean) => React.ReactNode;
  fetchTableStatuses: () => Promise<void>;
}

const Layout_store: React.FC<LayoutProps> = ({
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
  // 테이블 상태 관리
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // fetchTableStatuses 함수를 useEffect 밖으로 분리
  const fetchTableStatuses = async () => {
    try {
      const response = await fetch(
        `${RN_API_URL}/api/management/table_status_list/`
      );
      if (!response.ok) {
        throw new Error("테이블 상태를 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      setTableStatuses(data);
      setIsInitialized(true);

      // 테이블 상태를 AsyncStorage에도 저장
      await AsyncStorage.setItem("tableStatuses", JSON.stringify(data));
    } catch (error) {
      console.error("테이블 상태 불러오기 오류:", error);
    }
  };

  // 최초 1회 API 호출
  useEffect(() => {
    // 초기화 되지 않은 경우에만 API 호출
    if (!isInitialized) {
      fetchTableStatuses();
    }
  }, [isInitialized]);

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
      await AsyncStorage.removeItem("tableStatuses"); // 테이블 상태 삭제
      setIsInitialized(false); // 초기화 상태 리셋
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
            tableStatuses={tableStatuses}
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
            tableStatuses={tableStatuses}
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
            fetchTableStatuses={fetchTableStatuses}
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
            fetchTableStatuses={fetchTableStatuses}
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
  tableStatuses,
}: {
  storeName: string;
  openSettingsModal: () => void;
  tableStatuses: TableStatus[];
}) => {
  // 테이블 상태 확인 함수
  const getTableStatus = (tableName: string): number => {
    const table = tableStatuses.find((status) => status.테이블 === tableName);
    return table ? table.상태 : 1; // 기본값은 1(파란색)
  };

  // 매장_발주 상태
  const orderStatus = getTableStatus("매장_발주");
  // 매장_월말재고 상태
  const inventoryStatus = getTableStatus("매장_월말재고");

  return (
    <View
      style={{
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 4,
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

      {/* 발주 아이콘 */}
      <ShoppingCart
        size={22}
        color={orderStatus === 0 ? "#e53e3e" : "#0D326F"}
        strokeWidth={2}
        style={{ marginRight: moderateScale(4) }}
      />

      {/* 재고 아이콘 */}
      <Clipboard
        size={22}
        color={inventoryStatus === 0 ? "#e53e3e" : "#0D326F"}
        strokeWidth={2}
        style={{ marginRight: 4 }}
      />

      {/* 설정 버튼 */}
      <TouchableOpacity
        testID="settingsButton"
        onPress={openSettingsModal}
        style={[modernStyles.settingsButton, { marginLeft: "auto" }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Settings size={24} color="#0D326F" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

// 하단 네비게이션 컨텐츠 컴포넌트
const BottomNavContent = ({
  activeView,
  setActiveView,
  renderIcon,
  fetchTableStatuses,
}: BottomNavContentProps) => {
  // 화면 전환 시 테이블 상태 업데이트 함수
  const handleViewChange = (view: ViewType) => {
    // 먼저 API를 호출하여 테이블 상태를 업데이트
    fetchTableStatuses();
    // 화면 전환
    setActiveView(view);
  };

  return (
    <>
      <TouchableOpacity
        testID="homeButton"
        style={[
          modernStyles.navButton,
          activeView === "home" && modernStyles.activeNavButton,
        ]}
        onPress={() => handleViewChange("home")}
      >
        {renderIcon(Home, activeView === "home")}
        <Text
          testID={activeView === "home" ? "activeNavText" : "navText"}
          style={
            activeView === "home"
              ? modernStyles.activeNavText
              : modernStyles.navText
          }
        >
          홈
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="orderRequestButton"
        style={[
          modernStyles.navButton,
          activeView === "order-request" && modernStyles.activeNavButton,
        ]}
        onPress={() => handleViewChange("order-request")}
      >
        {renderIcon(ShoppingCart, activeView === "order-request")}
        <Text
          testID={activeView === "order-request" ? "activeNavText" : "navText"}
          style={
            activeView === "order-request"
              ? modernStyles.activeNavText
              : modernStyles.navText
          }
        >
          발주 요청
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="orderStatusButton"
        style={[
          modernStyles.navButton,
          activeView === "order-status" && modernStyles.activeNavButton,
        ]}
        onPress={() => handleViewChange("order-status")}
      >
        {renderIcon(Receipt, activeView === "order-status")}
        <Text
          testID={activeView === "order-status" ? "activeNavText" : "navText"}
          style={
            activeView === "order-status"
              ? modernStyles.activeNavText
              : modernStyles.navText
          }
        >
          발주 내역
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="inventoryButton"
        style={[
          modernStyles.navButton,
          activeView === "inventory" && modernStyles.activeNavButton,
        ]}
        onPress={() => handleViewChange("inventory")}
      >
        {renderIcon(Clipboard, activeView === "inventory")}
        <Text
          testID={activeView === "inventory" ? "activeNavText" : "navText"}
          style={
            activeView === "inventory"
              ? modernStyles.activeNavText
              : modernStyles.navText
          }
        >
          재고 관리
        </Text>
      </TouchableOpacity>
    </>
  );
};

export default Layout_store;
