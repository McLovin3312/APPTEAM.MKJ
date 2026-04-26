import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { authService } from '../api/authService';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: ''
  });

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validación básica
    if (!form.email || !form.password || !form.nombre) {
      Alert.alert("Campos incompletos", "Por favor llena los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.signUp(form.email, form.password, form);
      
      if (result) {
        Alert.alert(
          "¡Cuenta Creada!", 
          "Tu cuenta ha sido registrada exitosamente. Ya puedes iniciar sesión.",
          [{ text: "Ir al Login", onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error de registro", error.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad de MANYSHOP</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Juan"
                  placeholderTextColor="#666"
                  value={form.nombre}
                  onChangeText={(txt) => setForm({...form, nombre: txt})}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Pérez"
                  placeholderTextColor="#666"
                  value={form.apellido}
                  onChangeText={(txt) => setForm({...form, apellido: txt})}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(txt) => setForm({...form, email: txt})}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="+57 300..."
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                value={form.telefono}
                onChangeText={(txt) => setForm({...form, telefono: txt})}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#666"
                secureTextEntry
                value={form.password}
                onChangeText={(txt) => setForm({...form, password: txt})}
              />
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, loading && { opacity: 0.7 }]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'REGISTRANDO...' : 'REGISTRAR ME AHORA'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnSecondary} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.btnSecondaryText}>
                ¿Ya tienes cuenta? <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115', // El mismo negro profundo del login
  },
  scrollContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1A1D23',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2E37',
  },
  btnPrimary: {
    backgroundColor: '#FFFFFF', // Botón blanco para resaltar en fondo negro
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  btnSecondary: {
    marginTop: 25,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#AAA',
    fontSize: 14,
  },
});