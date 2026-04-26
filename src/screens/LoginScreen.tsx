import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../api/authService';
import { supabase } from '../api/supabaseClient';
import CustomAlert from '../components/CustomAlert';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '' });

  const handleLogin = async () => {
    if (!email || !password) {
      setAlert({ 
        visible: true, 
        title: 'CAMPOS VACÍOS', 
        msg: 'Por favor, llena todos los datos para entrar.' 
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Intentar inicio de sesión
      const { user } = await authService.signIn(email, password);

      if (user) {
        let perfilEncontrado = null;
        let intentos = 0;

        // 2. Bucle de reintento: Espera a que el Trigger cree el perfil en la tabla
        // Esto soluciona el error de "Perfil no encontrado" al loguear muy rápido
        while (intentos < 3 && !perfilEncontrado) {
          const { data: perfiles } = await supabase
            .from('perfiles')
            .select('es_admin')
            .eq('id', user.id);

          if (perfiles && perfiles.length > 0) {
            perfilEncontrado = perfiles[0];
          } else {
            intentos++;
            // Esperar 600ms entre intentos para dar respiro al servidor
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }

        // 3. Redirección basada en el campo es_admin de tu diagrama
        if (perfilEncontrado) {
          if (perfilEncontrado.es_admin === true) {
            navigation.replace('Admin'); // Pantalla de administrador
          } else {
            navigation.replace('Home');  // Pantalla de tienda normal
          }
        } else {
          // Si tras 3 intentos no existe el perfil, enviamos a Home por seguridad
          console.warn("Advertencia: Perfil no sincronizado a tiempo.");
          navigation.replace('Home');
        }
      }
    } catch (error: any) {
      console.error("Error en login:", error.message);
      setAlert({ 
        visible: true, 
        title: 'ACCESO DENEGADO', 
        msg: 'Correo o contraseña incorrectos.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>MANY</Text>
          <Text style={[styles.logo, { color: '#007AFF' }]}>SHOP</Text>
        </View>

        <View style={styles.form}>
          <TextInput 
            placeholder="Email" 
            placeholderTextColor="#999" 
            style={styles.input}
            onChangeText={setEmail} 
            value={email} 
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput 
            placeholder="Password" 
            placeholderTextColor="#999" 
            style={styles.input}
            secureTextEntry 
            onChangeText={setPassword} 
            value={password}
          />

          <TouchableOpacity 
            style={[styles.mainBtn, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.mainBtnText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.subText}>
              ¿No tienes cuenta? <Text style={{color: '#007AFF', fontWeight: 'bold'}}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <CustomAlert 
          visible={alert.visible} 
          title={alert.title} 
          message={alert.msg} 
          onClose={() => setAlert({...alert, visible: false})} 
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30 },
  header: { flexDirection: 'row', justifyContent: 'center', marginBottom: 50 },
  logo: { fontSize: 40, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  form: { width: '100%' },
  input: { 
    backgroundColor: '#1C1C1E', 
    padding: 20, 
    borderRadius: 18, 
    color: '#FFF', 
    marginBottom: 15, 
    fontSize: 16 
  },
  mainBtn: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 18, 
    alignItems: 'center', 
    marginTop: 10,
    height: 65,
    justifyContent: 'center'
  },
  mainBtnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  subText: { color: '#888', textAlign: 'center', marginTop: 25, fontSize: 14 }
});