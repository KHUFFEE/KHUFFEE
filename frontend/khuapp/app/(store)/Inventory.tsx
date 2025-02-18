// app/(store)/components/Inventory.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { styles} from '../../src/components/ui/common/commonstyler';

const Inventory: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>재고 관리</Text>
      <Text>재고 정보가 여기에 표시됩니다.</Text>
    </View>
  );
};

export default Inventory;