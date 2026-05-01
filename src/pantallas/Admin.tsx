import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../lib/authService';
import CustomAlert from '../Components/CustomAlert';

const AdminScreen = ({ navigation }: any) => {
  const [alert, setAlert] = React.useState({ visible: false, title: '', msg: '' });

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigation.replace('Login');
    } catch {
      setAlert({ visible: true, title: 'ERROR', msg: 'No se pudo cerrar la sesión.' });
    }
  };

  const adminOptions = [
    { id: 1, title: 'Productos', emoji: '📦', color: '#EEF2FF', accent: '#4F46E5', screen: 'AdminProducts' },
    { id: 2, title: 'Clientes',  emoji: '👥', color: '#F0FDF4', accent: '#10B981', screen: 'AdminClients'  },
    { id: 3, title: 'Pedidos',   emoji: '📋', color: '#FFF7ED', accent: '#F59E0B', screen: 'AdminOrders' },
    { id: 4, title: 'Reportes',  emoji: '📊', color: '#FEF2F2', accent: '#EF4444', screen: 'AdminReports' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Panel Admin</Text>
            <Text style={s.subtitle}>Gestión del Sistema</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={{ fontSize: 22 }}>🚪</Text>
          </TouchableOpacity>
        </View>

        <View style={s.grid}>
          {adminOptions.map(op => (
            <TouchableOpacity
              key={op.id}
              style={[s.card, { backgroundColor: op.color }]}
              activeOpacity={0.8}
              onPress={() => op.screen ? navigation.navigate(op.screen) : null}
            >
              <View style={[s.iconBox, { backgroundColor: op.accent }]}>
                <Text style={{ fontSize: 28 }}>{op.emoji}</Text>
              </View>
              <Text style={[s.cardText, { color: op.accent }]}>{op.title}</Text>
              {!op.screen && <Text style={s.soon}>Próximamente</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <CustomAlert visible={alert.visible} title={alert.title} message={alert.msg}
        onClose={() => setAlert({ ...alert, visible: false })} />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F3F4F6' },
  scroll:     { padding: 20 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title:      { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  subtitle:   { fontSize: 15, color: '#6B7280' },
  logoutBtn:  { width: 50, height: 50, backgroundColor: '#FEE2E2', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card:       { width: '48%', padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 15, elevation: 2 },
  iconBox:    { padding: 14, borderRadius: 18, marginBottom: 12 },
  cardText:   { fontSize: 14, fontWeight: 'bold' },
  soon:       { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
});

export default AdminScreen;