import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/authService';
import CustomAlert from '../Components/CustomAlert';

const AVATAR_COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#EC4899','#3B82F6','#8B5CF6','#06B6D4'];

// Recibe onLogout como prop desde ShopNavigator
export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [perfil,   setPerfil]   = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form,     setForm]     = useState({ nombre: '', apellido: '', telefono: '', direccion_envio: '' });
  const [alert,    setAlert]    = useState({ visible: false, title: '', msg: '', type: 'error' });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const session = await authService.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      setPerfil({ ...data, email: session.user.email });
      setForm({
        nombre:          data.nombre          ?? '',
        apellido:        data.apellido        ?? '',
        telefono:        data.telefono        ?? '',
        direccion_envio: data.direccion_envio ?? '',
      });
    } catch {
      setAlert({ visible: true, title: 'ERROR', msg: 'No se pudo cargar el perfil.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setAlert({ visible: true, title: 'CAMPO VACÍO', msg: 'El nombre es obligatorio.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const session = await authService.getSession();
      const { error } = await supabase
        .from('perfiles')
        .update(form)
        .eq('id', session!.user.id);
      if (error) throw error;
      setPerfil((prev: any) => ({ ...prev, ...form }));
      setEditMode(false);
      setAlert({ visible: true, title: '¡GUARDADO!', msg: 'Perfil actualizado con éxito.', type: 'success' });
    } catch {
      setAlert({ visible: true, title: 'ERROR', msg: 'No se pudo guardar.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
  console.log('onLogout prop:', typeof onLogout);
  Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Salir',
      style: 'destructive',
      onPress: () => {
        console.log('Ejecutando onLogout...');
        onLogout();
      },
    },
  ]);
};

  const set = (k: string) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const iniciales = () =>
    `${perfil?.nombre?.charAt(0) ?? '?'}${perfil?.apellido?.charAt(0) ?? ''}`.toUpperCase();

  const avatarColor = () =>
    AVATAR_COLORS[(perfil?.id?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => editMode ? guardar() : setEditMode(true)}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#4F46E5" size="small" />
            : <Text style={s.editBtnText}>{editMode ? '💾 Guardar' : '✏️ Editar'}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: avatarColor() }]}>
            <Text style={s.avatarText}>{iniciales()}</Text>
          </View>
          <Text style={s.avatarName}>{perfil?.nombre} {perfil?.apellido}</Text>
          <Text style={s.avatarEmail}>{perfil?.email}</Text>
          {perfil?.es_admin && (
            <View style={s.adminBadge}>
              <Text style={s.adminBadgeText}>👑 ADMINISTRADOR</Text>
            </View>
          )}
          {perfil?.puntos_lealtad > 0 && (
            <View style={s.puntosBadge}>
              <Text style={s.puntosText}>⭐ {perfil.puntos_lealtad} puntos de lealtad</Text>
            </View>
          )}
        </View>

        {/* Datos */}
        <Text style={s.sectionTitle}>👤 Información Personal</Text>
        <View style={s.card}>
          {[
            { label: 'Nombre',             key: 'nombre',          placeholder: 'Tu nombre' },
            { label: 'Apellido',           key: 'apellido',        placeholder: 'Tu apellido' },
            { label: 'Teléfono',           key: 'telefono',        placeholder: '+57 300...' },
            { label: 'Dirección de envío', key: 'direccion_envio', placeholder: 'Calle, ciudad...' },
          ].map(f => (
            <View key={f.key} style={s.fieldBox}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              {editMode ? (
                <TextInput
                  style={s.fieldInput}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={form[f.key as keyof typeof form]}
                  onChangeText={set(f.key)}
                />
              ) : (
                <Text style={s.fieldValue}>
                  {perfil?.[f.key] || <Text style={{ color: '#9CA3AF' }}>No especificado</Text>}
                </Text>
              )}
            </View>
          ))}

          <View style={s.fieldBox}>
            <Text style={s.fieldLabel}>Correo electrónico</Text>
            <Text style={[s.fieldValue, { color: '#9CA3AF' }]}>{perfil?.email}</Text>
            <Text style={s.fieldHint}>El correo no se puede cambiar desde aquí</Text>
          </View>
        </View>

        {editMode && (
          <TouchableOpacity style={s.cancelBtn} onPress={() => setEditMode(false)}>
            <Text style={s.cancelBtnText}>CANCELAR</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
          <Text style={s.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      <CustomAlert
        visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FB' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle:    { fontSize: 24, fontWeight: '900', color: '#111827' },
  editBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  editBtnText:    { color: '#4F46E5', fontWeight: '800', fontSize: 14 },
  scroll:         { padding: 20, paddingBottom: 120 },
  avatarSection:  { alignItems: 'center', marginBottom: 24 },
  avatar:         { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText:     { color: '#FFF', fontSize: 30, fontWeight: '900' },
  avatarName:     { fontSize: 22, fontWeight: '900', color: '#111827' },
  avatarEmail:    { fontSize: 14, color: '#6B7280', marginTop: 2 },
  adminBadge:     { marginTop: 8, backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10 },
  adminBadgeText: { color: '#D97706', fontWeight: '900', fontSize: 12 },
  puntosBadge:    { marginTop: 6, backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10 },
  puntosText:     { color: '#4F46E5', fontWeight: '800', fontSize: 12 },
  sectionTitle:   { fontSize: 13, fontWeight: '800', color: '#374151', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  card:           { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2 },
  fieldBox:       { marginBottom: 16 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  fieldValue:     { fontSize: 16, color: '#111827', fontWeight: '600' },
  fieldInput:     { backgroundColor: '#F8F9FB', borderRadius: 12, padding: 12, color: '#111827', fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  fieldHint:      { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  cancelBtn:      { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  cancelBtnText:  { color: '#6B7280', fontWeight: '800', letterSpacing: 1 },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 16, borderRadius: 16, marginTop: 8 },
  logoutText:     { color: '#EF4444', fontWeight: '800', fontSize: 15 },
});