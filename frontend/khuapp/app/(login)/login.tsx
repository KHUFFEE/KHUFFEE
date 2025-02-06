import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles } from '../../src/styles/common';
import { RN_API_URL } from '@env';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [매장명, set매장명] = useState('');
  const [매장_비밀번호, set매장_비밀번호] = useState('');

  const handleLogin = async () => {
    if (!매장명 || !매장_비밀번호) {
      Alert.alert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${RN_API_URL}/api/accounts/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 매장명, 매장_비밀번호 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('로그인 실패', errorData.message || '아이디 또는 비밀번호가 잘못되었습니다.');
        return;
      }

      const data = await response.json();
      console.log('로그인 성공:', data);

      // 매장명이 'admin'인 경우
      if (매장명 === 'admin') {
        router.replace('/(admin)/dashboard');
      } 
      // 매장명이 '창고'인 경우
      else if (매장명 === '창고') {
        router.replace('/(warehouse)/dashboard');
      } 
      // 일반 매장인 경우
      else {
        router.replace('/(store)/dashboard');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <View style={commonStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={commonStyles.container}
      >
        <ScrollView
          contentContainerStyle={commonStyles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={commonStyles.logoContainer}>
            <Text style={commonStyles.title}>카페쿠피 물류 관리</Text>
            <Image
              source={require('../../assets/img/logo.png')}
              style={commonStyles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={commonStyles.formContainer}>
            <TextInput
              style={commonStyles.input}
              placeholder="매장명을 입력하세요"
              value={매장명}
              onChangeText={set매장명}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="비밀번호를 입력하세요"
              value={매장_비밀번호}
              onChangeText={set매장_비밀번호}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={commonStyles.buttonText}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
