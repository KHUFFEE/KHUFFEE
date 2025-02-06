import React from 'react';
import StoreEmployeeDashboard from '../../src/Store/StoreEmployeeDashboard';
import { View } from 'react-native';
import { commonStyles } from '../../src/styles/common';

export default function StoreDashboardScreen() {
  return (
    <View style={commonStyles.container}>
      <StoreEmployeeDashboard />
    </View>
  );
}
