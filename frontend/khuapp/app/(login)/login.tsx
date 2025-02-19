// app/(login)/login.tsx
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './index';
import { commonStyles } from '../../src/styles/common';
import { styles} from '../../src/components/ui/common/commonstyler'
import { RN_API_URL } from '@env';

//  console.log(RN_API_URL); 

const LoginScreen: React.FC = () => {
  // react-navigation 사용: 로그인 스크린에 맞는 네비게이션 타입 지정
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Login'>>();
  const [매장명, set매장명] = useState('');
  const [매장_비밀번호, set매장_비밀번호] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // 포커스 상태를 관리하는 state 추가
  const [isStoreNameFocused, setIsStoreNameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const handleLogin = async () => {
    // 이전 에러 메시지 초기화
    setErrorMessage('');

    if (!매장명 || !매장_비밀번호) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.');
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
        // 서버에서 반환하는 error 값을 기반으로 메시지 설정
        if (errorData.error === 'username_invalid') {
          setErrorMessage('아이디가 틀립니다.');
        } else if (errorData.error === 'password_invalid') {
          setErrorMessage('비밀번호가 틀립니다.');
        } else {
          setErrorMessage(errorData.message || '아이디 또는 비밀번호가 잘못되었습니다.');
        }
        return;
      }

      const data = await response.json();
      console.log('로그인 성공:', data);

      // 조건에 따라 메인 화면으로 이동
      // 필요에 따라 매장명이 'admin' 또는 '창고'인 경우의 분기를 추가할 수 있습니다.
      navigation.replace('Main', { storeName: 매장명 });
    } catch (error) {
      console.error('로그인 에러:', error);
      setErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <View style={styles.dashboardContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.dashboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/img/logo2.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logo_name}>cafeKHUFFEE</Text>
            
          </View>

          <View style={styles.form_Container}>
             {/* 매장명 입력창을 감싸는 컨테이너 */}
             <View style={styles.textboxContainer}>
            <TextInput
              style={[styles.form_input_box,매장명 ? { color: '#000000' } : { color: '#B3B3B3' }]}
              placeholder="매장명을 입력하세요"
              value={매장명}
              onChangeText={set매장명}
              autoCapitalize="none"
              autoCorrect={false}
            />
            </View>

            {/* 비밀번호 입력창을 감싸는 컨테이너 */}
            <View style={styles.textboxContainer}>
            <TextInput
              style={[styles.form_input_box,매장_비밀번호 ? { color: '#000000' } : { color: '#B3B3B3' }]}
              placeholder="비밀번호를 입력하세요"
              value={매장_비밀번호}
              onChangeText={set매장_비밀번호}
              secureTextEntry
              autoCapitalize="none"
            />
            </View>

            {errorMessage ? <Text style={styles.login_errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
              style={styles.login_button}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.login_buttonText}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
