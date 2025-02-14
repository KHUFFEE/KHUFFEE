// app/(store)/SettingsScreen.tsx (react-navigation 방식)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { NavigationProp, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../(login)/index';
import SettingsModal from '../../src/components/ui/common/settingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Settings'>>();
  const { storeName } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleLogoutRequest = () => {
    setIsModalOpen(false);
    setShowConfirmLogout(true);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      console.log('토큰 제거 완료');
      setShowConfirmLogout(false);
      // react-navigation의 reset으로 로그인 화면으로 전환
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('토큰 제거 오류:', error);
    }
  };

  const cancelLogout = () => {
    setShowConfirmLogout(false);
    setIsModalOpen(true);
  };

  const handleSettings = () => {
    console.log('설정 및 개인정보 선택');
    setIsModalOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openModal} style={styles.iconButton}>
          <Text style={styles.iconText}>⋮</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>설정 - {storeName} 매장</Text>
      <SettingsModal
        visible={isModalOpen}
        onClose={closeModal}
        onLogout={handleLogoutRequest}
        onSettings={handleSettings}
      />
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
