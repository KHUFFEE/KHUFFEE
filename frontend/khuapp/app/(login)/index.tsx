import { Text } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './login';
import StoreDashboardScreen from '../(store)/main';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';

if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.style = { fontFamily: 'PretendardVariable' };

export type RootStackParamList = {
  Login: undefined;
  Main: { storeName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Variable': require('../../assets/fonts/PretendardVariable.ttf'),




  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={StoreDashboardScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
