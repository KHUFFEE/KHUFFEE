import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onLogout, onSettings }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOption} onPress={onSettings}>
            <Text style={styles.modalOptionText}>설정 및 개인정보</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={onLogout}>
            <Text style={styles.modalOptionText}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalOption} onPress={onClose}>
            <Text style={styles.modalOptionText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#333',
  },
});

export default SettingsModal;
