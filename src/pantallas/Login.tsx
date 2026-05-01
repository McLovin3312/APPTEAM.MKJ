import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../lib/authService';
import { supabase } from '../lib/supabase';
import CustomAlert from '../Components/CustomAlert';

export default function LoginScreen({ navigation }: any) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [alert,    setAlert]    = useState({ visible: false, title: '', msg: '' });

  // Verificar sesión activa al abrir la app
  useEffect(() => {
    const verificar = async () => {
  const session = await authService.getSession();
  if (session) {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('es_admin')
        .eq('id', session.user.id)
        .single();

      if (error) {
        // Si falla RLS, no redirigir — dejar en Login
        console.log('Error verificando sesión:', error);
        setLoading(false);
        return;
      }

      navigation.replace(data?.es_admin ? 'Admin' : 'HomeShop');
    } catch (e) {
      console.log('Error inesperado:', e);
      setLoading(false);
    }
  } else {
    setLoading(false);
  }
};
    verificar();

    // Escucha cambios de sesión en tiempo real
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session === null) setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlert({ visible: true, title: 'CAMPOS VACÍOS', msg: 'Por favor llena todos los campos.' });
      return;
    }
    setLoading(true);
    try {
      const { user } = await authService.signIn(email, password);
      if (user) {
        let perfil = null;
        let intentos = 0;

        // Reintento — espera al trigger de Supabase
        while (intentos < 3 && !perfil) {
          const { data } = await supabase
            .from('perfiles')
            .select('es_admin')
            .eq('id', user.id);
          if (data && data.length > 0) {
            perfil = data[0];
          } else {
            intentos++;
            await new Promise(r => setTimeout(r, 600));
          }
        }
        navigation.replace(perfil?.es_admin ? 'Admin' : 'HomeShop');
      }
    } catch {
      setAlert({ visible: true, title: 'ACCESO DENEGADO', msg: 'Correo o contraseña incorrectos.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={s.loader}>
      <ActivityIndicator color="#007AFF" size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
        <View style={s.header}>
          <Text style={s.logo}>MANY</Text>
          <Text style={[s.logo, { color: '#007AFF' }]}>SHOP</Text>
        </View>
        <View style={s.form}>
          <TextInput
            placeholder="Email" placeholderTextColor="#999" style={s.input}
            onChangeText={setEmail} value={email}
            autoCapitalize="none" keyboardType="email-address"
          />
          <TextInput
            placeholder="Password" placeholderTextColor="#999" style={s.input}
            secureTextEntry onChangeText={setPassword} value={password}
          />
          <TouchableOpacity style={[s.mainBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.mainBtnText}>ENTRAR</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.subText}>
              ¿No tienes cuenta? <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
        <CustomAlert
          visible={alert.visible} title={alert.title} message={alert.msg}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  loader:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  container:   { flex: 1, justifyContent: 'center', padding: 30 },
  header:      { flexDirection: 'row', justifyContent: 'center', marginBottom: 50 },
  logo:        { fontSize: 40, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  form:        { width: '100%' },
  input:       { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 18, color: '#FFF', marginBottom: 15, fontSize: 16 },
  mainBtn:     { backgroundColor: '#FFF', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10, height: 65, justifyContent: 'center' },
  mainBtnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  subText:     { color: '#888', textAlign: 'center', marginTop: 25, fontSize: 14 },
});