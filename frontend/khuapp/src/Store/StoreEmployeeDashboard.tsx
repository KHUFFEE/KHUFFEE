import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { 
  Home, 
  ShoppingCart, 
  List, 
  Clipboard, 
  Book, 
  LogOut 
} from 'lucide-react-native';

type ViewType = 'dashboard' | 'order-request' | 'order-status' | 'inventory' | 'notices' | 'logout';

const StoreEmployeeDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard'); // Default: 홈 화면

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>홈 화면</Text>
            <Text>대시보드 콘텐츠가 여기에 표시됩니다.</Text>
          </View>
        );
      case 'order-request':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>발주 요청</Text>
            <Text>발주 요청 화면 콘텐츠</Text>
          </View>
        );
      case 'order-status':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>발주 상태</Text>
            <Text>발주 상태 화면 콘텐츠</Text>
          </View>
        );
      case 'inventory':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>재고 조회</Text>
            <Text>재고 정보가 여기에 표시됩니다.</Text>
          </View>
        );
      case 'notices':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>공지사항</Text>
            <Text>공지사항 및 교육 자료</Text>
          </View>
        );
      case 'logout':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>로그아웃</Text>
            <Text>로그아웃 페이지</Text>
          </View>
        );
      default:
        return <Text>페이지를 선택해주세요</Text>;
    }
  };

  return (
    <View style={styles.dashboardContainer}>
      {/* 메인 콘텐츠 */}
      <View style={styles.mainContent}>
        {renderView()}
      </View>

      {/* 하단 네비게이션 바 */}
      <View style={styles.navbar}>
      <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setActiveView('dashboard')}
        >
          <Home color={activeView === 'dashboard' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'dashboard' && styles.activeNavText}>홈</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setActiveView('order-request')}
        >
          <ShoppingCart color={activeView === 'order-request' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-request' && styles.activeNavText}>발주 요청</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setActiveView('order-status')}
        >
          <List color={activeView === 'order-status' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-status' && styles.activeNavText}>발주 상태</Text>
        </TouchableOpacity>


        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setActiveView('inventory')}
        >
          <Clipboard color={activeView === 'inventory' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'inventory' && styles.activeNavText}>재고 조회</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    alignItems: 'center',
  },
  activeNavText: {
    color: '#3b82f6',  // 활성화된 메뉴의 텍스트 색상
    fontWeight: 'bold',
  },
});

export default StoreEmployeeDashboard;
