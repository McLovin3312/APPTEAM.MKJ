import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onCancel?: () => void; // Nueva propiedad opcional
}

export default function CustomAlert({ visible, title, message, onClose, onCancel }: CustomAlertProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.alertBox}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          
          <View style={s.buttonContainer}>
            {/* Si existe onCancel, mostramos el botón de cancelar */}
            {onCancel && (
              <TouchableOpacity style={[s.button, s.cancelButton]} onPress={onCancel}>
                <Text style={s.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={s.button} onPress={onClose}>
              <Text style={s.buttonText}>{onCancel ? 'Continuar' : 'Entendido'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 25, alignItems: 'center', elevation: 10 },
  title: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 25, lineHeight: 22 },
  buttonContainer: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' },
  button: { flex: 1, backgroundColor: '#1A1A1A', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  cancelButton: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelButtonText: { color: '#6B7280', fontWeight: '800', fontSize: 16 }
});