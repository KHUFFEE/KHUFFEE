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

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    // TODO: 실제 API 연동 후 로그인 처리
    console.log('로그인 시도:', { email, password });
    Alert.alert('성공', '로그인되었습니다.', [
      {
        text: '확인',
        onPress: () => {
          // 로그인 성공 시 대시보드로 이동
          router.replace('/(store)/dashboard');
        },
      },
    ]);
  };

  const handleForgotPassword = () => {
    Alert.alert('알림', '비밀번호 찾기 기능은 준비 중입니다.');
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
            <Image
              source={require('../../assets/logo.png')}
              style={commonStyles.logo}
              resizeMode="contain"
            />
            <Text style={commonStyles.title}>카페쿠피</Text>
          </View>

          <View style={commonStyles.formContainer}>
            <TextInput
              style={commonStyles.input}
              placeholder="이메일을 입력하세요"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChangeText={setPassword}
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

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={commonStyles.forgotPasswordButton}
            >
              <Text style={commonStyles.linkText}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
