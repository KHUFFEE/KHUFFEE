import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../(login)/index';
import { Settings } from 'lucide-react-native';
import StoreEmployeeDashboard from './StoreEmployeeDashboard';
import { commonStyles } from '../../src/styles/common';

export default function StoreDashboardScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { storeName } = route.params as { storeName: string };

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달 열기/닫기
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // 설정 옵션 핸들러
  const handleSettings = () => {
    navigation.navigate('Settings', { storeName });
    closeModal(); // 모달 닫기
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

      {/* 대시보드 */}
      <StoreEmployeeDashboard storeName={storeName} />

      {/* 설정 모달 */}
      <Modal visible={isModalOpen} transparent={true} animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={handleSettings} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeModal} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
});
