import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../(login)/index';
import { Settings } from 'lucide-react-native';
import StoreEmployeeDashboard from './StoreEmployeeDashboard';
import { commonStyles } from '../../src/styles/common';
import SettingsModal from '../../src/components/ui/common/settingModal'; // 공통 모달 컴포넌트 임포트 // Updated

export default function StoreDashboardScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { storeName } = route.params as { storeName: string };

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달 열기/닫기 함수
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // '설정 및 개인정보' 옵션 선택 핸들러 // Updated
  const handleSettings = () => {
    navigation.navigate('Settings', { storeName });
    closeModal();
  };

  // 로그아웃 핸들러 (로그아웃 확인 Alert 적용) // Updated
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: () => {
            // 필요한 경우 저장된 인증 토큰 제거(예: AsyncStorage.removeItem('token');)
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ],
      { cancelable: true }
    );
    closeModal();
  };

  return (
    <View style={styles.dashboardContainer}>
      {/* 상단 헤더 */}
      <View style={styles.storeNameContainer}>
        <Text style={styles.storeNameText}>{storeName} 매장</Text>
        <TouchableOpacity onPress={openModal} style={styles.settingsIconContainer}>
          <Settings size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* 대시보드 콘텐츠 */}
      <StoreEmployeeDashboard storeName={storeName} />

      {/* 공통 SettingsModal 적용 (inline 모달 제거) */} 
      <SettingsModal
        visible={isModalOpen}
        onClose={closeModal}
        onLogout={handleLogout}
        onSettings={handleSettings} // '설정 및 개인정보' 선택 시 핸들러 // Updated
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
