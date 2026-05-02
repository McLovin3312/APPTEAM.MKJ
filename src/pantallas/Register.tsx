import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../lib/authService';
import CustomAlert from '../components/CustomAlert';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', telefono: '' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'error' });

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.nombre) {
      setAlert({ visible: true, title: 'CAMPOS INCOMPLETOS', msg: 'Nombre, correo y contraseña son obligatorios.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await authService.signUp(form.email, form.password, form);
      setAlert({ visible: true, title: '¡CUENTA CREADA!', msg: 'Ya puedes iniciar sesión.', type: 'success' });
    } catch (error: any) {
      setAlert({ visible: true, title: 'ERROR', msg: error.message || 'No se pudo crear la cuenta.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.title}>Crear Cuenta</Text>
          <Text style={s.subtitle}>Únete a la comunidad de MANYSHOP</Text>

          <View style={s.row}>
            <View style={[s.inputBox, { flex: 1, marginRight: 10 }]}>
              <Text style={s.label}>Nombre</Text>
              <TextInput style={s.input} placeholder="Ej. Juan" placeholderTextColor="#666"
                value={form.nombre} onChangeText={set('nombre')} />
            </View>
            <View style={[s.inputBox, { flex: 1 }]}>
              <Text style={s.label}>Apellido</Text>
              <TextInput style={s.input} placeholder="Ej. Pérez" placeholderTextColor="#666"
                value={form.apellido} onChangeText={set('apellido')} />
            </View>
          </View>

          <View style={s.inputBox}>
            <Text style={s.label}>Correo Electrónico</Text>
            <TextInput style={s.input} placeholder="tu@email.com" placeholderTextColor="#666"
              keyboardType="email-address" autoCapitalize="none"
              value={form.email} onChangeText={set('email')} />
          </View>

          <View style={s.inputBox}>
            <Text style={s.label}>Teléfono</Text>
            <TextInput style={s.input} placeholder="+57 300..." placeholderTextColor="#666"
              keyboardType="phone-pad" value={form.telefono} onChangeText={set('telefono')} />
          </View>

          <View style={s.inputBox}>
            <Text style={s.label}>Contraseña</Text>
            <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#666"
              secureTextEntry value={form.password} onChangeText={set('password')} />
          </View>

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'REGISTRANDO...' : 'REGISTRARME AHORA'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.subText}>¿Ya tienes cuenta? <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type}
        onClose={() => {
          setAlert({ ...alert, visible: false });
          if (alert.type === 'success') navigation.navigate('Login');
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  scroll:    { paddingHorizontal: 30, paddingVertical: 40 },
  title:     { fontSize: 34, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  subtitle:  { fontSize: 16, color: '#888', marginTop: 5, marginBottom: 40 },
  row:       { flexDirection: 'row' },
  inputBox:  { marginBottom: 20 },
  label:     { color: '#AAA', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input:     { backgroundColor: '#1A1D23', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 15, color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: '#2A2E37' },
  btn:       { backgroundColor: '#FFF', borderRadius: 15, paddingVertical: 18, alignItems: 'center', marginTop: 20, elevation: 8 },
  btnText:   { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  subText:   { color: '#AAA', fontSize: 14, textAlign: 'center', marginTop: 25 },
});