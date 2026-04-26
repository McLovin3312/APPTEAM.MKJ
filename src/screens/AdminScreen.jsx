import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../api/authService';

const AdminScreen = ({ navigation }) => {
  
  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Deseas salir del panel administrativo?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive",
          onPress: async () => {
            try {
              await authService.signOut();
              navigation.replace('Login'); 
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          }
        }
      ]
    );
  };

  const adminOptions = [
    { id: 1, title: 'Productos', icon: 'package-variant-closed', color: '#4F46E5' },
    { id: 2, title: 'Clientes', icon: 'account-group', color: '#10B981' },
    { id: 3, title: 'Pedidos', icon: 'clipboard-text-clock', color: '#F59E0B' },
    { id: 4, title: 'Reportes', icon: 'chart-bar', color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Panel Admin</Text>
            <Text style={styles.subtitle}>Gestión del Sistema</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout-variant" size={26} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {adminOptions.map((option) => (
            <TouchableOpacity key={option.id} style={styles.card} activeOpacity={0.8}>
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <MaterialCommunityIcons name={option.icon} size={32} color="white" />
              </View>
              <Text style={styles.cardText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280' },
  logoutBtn: { width: 50, height: 50, backgroundColor: '#FEE2E2', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: 'white',
    width: '48%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  iconContainer: { padding: 14, borderRadius: 18, marginBottom: 12 },
  cardText: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
});

export default AdminScreen;