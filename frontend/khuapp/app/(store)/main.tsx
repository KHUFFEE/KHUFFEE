import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../(login)/index';
import { Settings } from 'lucide-react-native';
import StoreEmployeeDashboard from './StoreEmployeeDashboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles} from '../../src/components/ui/common/commonstyler'
export default function StoreDashboardScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { storeName } = route.params as { storeName: string };

  // 설정 모달 상태
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // 로그아웃 확인 모달 상태
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // 설정 모달 열기/닫기
  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  // "설정 및 개인정보" 버튼 동작
  const handleSettings = () => {
    // 필요하다면 다른 로직을 수행하거나,
    // 별도 모달을 열어 더 자세한 설정을 보여줄 수도 있습니다.
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
      await AsyncStorage.removeItem('token'); // 인증 토큰 삭제
      setShowConfirmLogout(false);

      // 로그인 화면으로 이동 (네비게이션 스택 리셋)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <SafeAreaView  style={styles.dashboardContainer}>
      {/* 상단 헤더 */}
      <View style={styles.head_Container}>
        <Text style={styles.head_storeNameText}>{storeName} </Text>
        <TouchableOpacity onPress={openSettingsModal}>
          <Settings size={24} color="  #0D326F" />
        </TouchableOpacity>
      </View>

      {/* 매장 직원 대시보드 영역 */}
      <StoreEmployeeDashboard storeName={storeName} />

      {/* 설정 모달 */}
      <Modal
        visible={isSettingsModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSettingsModal}
      >
        <View style={styles.bottom_Overlay}>
          <View style={styles.bottom_Container}>
            <TouchableOpacity style={styles.bottom_modal_Option} onPress={handleSettings}>
              <Text style={styles.bottom_modalOptionText}>설정 및 개인정보</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottom_modal_Option} onPress={handleLogoutRequest}>
              <Text style={styles.bottom_modalOptionText}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottom_modal_Option} onPress={closeSettingsModal}>
              <Text style={styles.bottom_modalOptionText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 로그아웃 확인 모달 */}  
      <Modal
        visible={showConfirmLogout}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmLogout(false)}
      >
        <View style={Commonstyle.confirmOverlay}>
          <View style={Commonstyle.confirmContainer}>
            <Text style={Commonstyle.confirmTitle}>로그아웃</Text>
            <Text style={Commonstyle.confirmMessage}>정말 로그아웃할까요?</Text>

            {/* 로그아웃 버튼 */}
            <TouchableOpacity style={Commonstyle.logoutButton} onPress={handleLogout}>
              <Text style={Commonstyle.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>

            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={Commonstyle.closeButton}
              onPress={() => setShowConfirmLogout(false)}
            >
              <Text style={Commonstyle.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Commonstyle = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  storeNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  storeNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsIconContainer: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#333',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    elevation: 5,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 15,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
