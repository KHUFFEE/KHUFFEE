import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../(login)/index';

export default function SettingsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Settings'>>();
  const { storeName } = route.params;
  const navigation = useNavigation();

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 뒤로 가기 핸들러
  const handleBack = () => {
    navigation.goBack();
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' as never }],
          });
        },
      },
    ]);
  };

  // 모달 열기/닫기
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // 설정 모달 옵션
  const modalOptions = [
    { label: '설정 및 개인정보', onPress: () => console.log('설정 및 개인정보 선택') },
    { label: '로그아웃', onPress: handleLogout },
  ];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Text style={styles.iconText}>{'←'}</Text> {/* 뒤로가기 아이콘 대체 */}
        </TouchableOpacity>
        <TouchableOpacity onPress={openModal} style={styles.iconButton}>
          <Text style={styles.iconText}>⋮</Text> {/* 모달 버튼 대체 */}
        </TouchableOpacity>
      </View>

      {/* 화면 제목 */}
      <Text style={styles.title}>설정 - {storeName} 매장</Text>

      {/* 모달 */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {modalOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalOption}
                onPress={() => {
                  option.onPress();
                  closeModal(); // 옵션 선택 후 모달 닫기
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
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
