import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../(login)/index';
import SettingsModal from '@/components/ui/common/settingModal'; // 공통 모달 컴포넌트 임포트 // Updated

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
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ]
    );
    setIsModalOpen(false);
  };

  // '설정 및 개인정보' 옵션 선택 핸들러 // Updated
  const handleSettings = () => {
    console.log('설정 및 개인정보 선택'); // 추가 동작이나 네비게이션 처리 가능
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

      {/* 공통 SettingsModal 적용 (inline 모달 제거) */}
      <SettingsModal
        visible={isModalOpen}
        onClose={closeModal}
        onLogout={handleLogout}
        onSettings={handleSettings}
      />
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
});
