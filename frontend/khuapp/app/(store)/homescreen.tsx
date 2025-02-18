// 홈 화면 정의 및 구현
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../src/components/ui/common/commonstyler';
import { storename } from '../../src/components/ui/common/types';  // common/types.ts에서 storename 타입 가져오기

  const homescreen: React.FC<storename> = ({ storeName }) => {     // 추 후 storename 말고 다른 것으로 바꾸기 
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{storeName}의 홈 화면</Text>
        <Text>대시보드 콘텐츠가 여기에 표시됩니다.</Text>
      </View>
    );
  };
  
  export default homescreen;