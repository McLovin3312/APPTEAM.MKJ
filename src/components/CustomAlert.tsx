import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function CustomAlert({ visible, title, message, type = 'error', onClose }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={[styles.statusLine, { backgroundColor: type === 'error' ? '#FF4B4B' : '#4BB543' }]} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>CONTINUAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 25, padding: 25, alignItems: 'center', overflow: 'hidden' },
  statusLine: { width: '120%', height: 6, position: 'absolute', top: 0 },
  title: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', marginBottom: 10, letterSpacing: 1 },
  message: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 25, lineHeight: 22 },
  button: { backgroundColor: '#1A1A1A', width: '100%', padding: 15, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 }
});