// app/(store)/dashboard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../(login)/index';
import { Settings } from 'lucide-react-native';
import StoreEmployeeDashboard from './StoreEmployeeDashboard';
import {commonStyles} from '../../src/styles/common';



export default function StoreDashboardScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { storeName } = route.params as { storeName: string };

  const goToSettings = () => {
    navigation.navigate('Settings', { storeName });
  };

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.storeNameContainer}>
        <Text style={styles.storeNameText}>{storeName}매장</Text>
        <TouchableOpacity onPress={goToSettings} style={styles.settingsIconContainer}>
          <Settings size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      <StoreEmployeeDashboard storeName={storeName} />
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
