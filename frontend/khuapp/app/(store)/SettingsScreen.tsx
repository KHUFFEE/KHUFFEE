// app/(store)/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../(login)/index';
import SettingsModal from '../../src/components/ui/common/settingModal';

export default function SettingsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Settings'>>();
  const { storeName } = route.params;
  const navigation = useNavigation();

  // 기존 설정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 로그아웃 확인 모달 상태
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // 뒤로 가기 핸들러
  const handleBack = () => {
    navigation.goBack();
  };

  // 설정 모달의 로그아웃 옵션 클릭 시 호출
  const handleLogoutRequest = () => {
    setIsModalOpen(false);
    setShowConfirmLogout(true);
  };

  // 실제 로그아웃 처리 (로그아웃 확인 모달에서 "네" 선택 시)
  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
    setShowConfirmLogout(false);
  };

  // "아니요" 선택 시: 로그아웃 취소 -> 다시 설정 모달 열기
  const cancelLogout = () => {
    setShowConfirmLogout(false);
    setIsModalOpen(true);
  };

  // '설정 및 개인정보' 옵션 선택 핸들러
  const handleSettings = () => {
    console.log('설정 및 개인정보 선택');
    setIsModalOpen(false);
  };

  // 모달 열기/닫기 함수
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Text style={styles.iconText}>{'←'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openModal} style={styles.iconButton}>
          <Text style={styles.iconText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* 화면 제목 */}
      <Text style={styles.title}>설정 - {storeName} 매장</Text>

      {/* 공통 SettingsModal 적용 */}
      <SettingsModal
        visible={isModalOpen}
        onClose={closeModal}
        onLogout={handleLogoutRequest}
        onSettings={handleSettings}
      />

      {/* 로그아웃 확인 모달 */}
      <Modal
        visible={showConfirmLogout}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmLogout(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>로그아웃 확인</Text>
            <Text style={styles.confirmMessage}>정말 로그아웃하시겠습니까?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleLogout}>
                <Text style={styles.confirmButtonText}>네</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={cancelLogout}>
                <Text style={styles.confirmButtonText}>아니요</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  iconButton: {
    padding: 10,
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  // 로그아웃 확인 모달 스타일
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
