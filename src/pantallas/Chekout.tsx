import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../Context/CartContext';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/authService';
import CustomAlert from '../components/CustomAlert';

export default function CheckoutScreen({ navigation }: any) {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '', email: '', direccion: '', ciudad: '', notas: '',
  });
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'error' });

  const set = (k: string) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const showAlert = (title: string, msg: string, type = 'error') =>
    setAlert({ visible: true, title, msg, type });

const confirmarPedido = async () => {
  if (!form.nombre.trim() || !form.direccion.trim() || !form.ciudad.trim()) {
    showAlert('CAMPOS VACÍOS', 'Nombre, dirección y ciudad son obligatorios.', 'error');
    return;
  }
  if (items.length === 0) {
    showAlert('CARRITO VACÍO', 'Agrega productos antes de confirmar.', 'error');
    return;
  }
  setLoading(true);
  try {
    const session = await authService.getSession();
    const productos = items.map(i => ({
      nombre: i.title,
      precio: i.price,
      qty:    i.quantity,
    }));

    const payload = {
      cliente_id:     session?.user?.id ?? null,
      cliente_nombre: form.nombre,
      cliente_email:  form.email || session?.user?.email || '',
      direccion:      `${form.direccion}, ${form.ciudad}`,
      notas:          form.notas,
      productos,
      monto_total:   total,
      estado:         'Pendiente',
    };

    console.log('Insertando pedido:', JSON.stringify(payload));

    const { data, error } = await supabase
      .from('pedidos')
      .insert([payload])
      .select();

    console.log('Respuesta:', JSON.stringify(data), JSON.stringify(error));

    if (error) throw error;

    clearCart();
    showAlert(
      '¡PEDIDO CONFIRMADO! 🎉',
      `Tu pedido por $${total.toFixed(2)} fue registrado exitosamente.`,
      'success'
    );
  } catch (e: any) {
    console.log('Error completo:', JSON.stringify(e));
    showAlert('ERROR', e.message ?? 'No se pudo procesar el pedido.', 'error');
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Finalizar Compra</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Resumen del pedido */}
          <Text style={s.sectionTitle}>🛒 Resumen del pedido</Text>
          <View style={s.card}>
            {items.map((item, i) => (
              <View key={item.id} style={[s.itemRow, i < items.length - 1 && s.itemBorder]}>
                <Text style={s.itemName} numberOfLines={1}>{item.title}</Text>
                <Text style={s.itemQty}>×{item.quantity}</Text>
                <Text style={s.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={s.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Datos de envío */}
          <Text style={s.sectionTitle}>📍 Datos de envío</Text>
          {[
            { label: 'Nombre completo *',    key: 'nombre',    placeholder: 'Ej. Juan Pérez',      keyboard: 'default' },
            { label: 'Correo electrónico',   key: 'email',     placeholder: 'tu@email.com',         keyboard: 'email-address' },
            { label: 'Dirección *',          key: 'direccion', placeholder: 'Calle 123 # 45-67',    keyboard: 'default' },
            { label: 'Ciudad *',             key: 'ciudad',    placeholder: 'Medellín',              keyboard: 'default' },
            { label: 'Notas para el pedido', key: 'notas',     placeholder: 'Instrucciones extras...', keyboard: 'default' },
          ].map(f => (
            <View key={f.key} style={s.fieldBox}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <TextInput
                style={s.fieldInput}
                placeholder={f.placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={f.keyboard as any}
                autoCapitalize="none"
                value={form[f.key as keyof typeof form]}
                onChangeText={set(f.key)}
              />
            </View>
          ))}

          {/* Método de pago (decorativo) */}
          <Text style={s.sectionTitle}>💳 Método de pago</Text>
          <View style={s.payCard}>
            <Text style={{ fontSize: 24 }}>💵</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.payTitle}>Pago contra entrega</Text>
              <Text style={s.paySubtitle}>Paga en efectivo al recibir tu pedido</Text>
            </View>
            <View style={s.payCheck}><Text style={{ color: '#10B981', fontWeight: '900' }}>✓</Text></View>
          </View>

          {/* Botón confirmar */}
          <TouchableOpacity
            style={[s.confirmBtn, loading && { opacity: 0.7 }]}
            onPress={confirmarPedido}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={s.confirmBtnText}>CONFIRMAR PEDIDO · ${total.toFixed(2)}</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
  visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type}
  onClose={() => {
    setAlert({ ...alert, visible: false });
    if (alert.type === 'success') {
      // Navega al tab de Pedidos dentro del ShopNavigator
      navigation.navigate('HomeShop', { screen: 'MisPedidos' });
    }
  }}
/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8F9FB' },
  header:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  backIcon:     { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerTitle:  { fontSize: 20, fontWeight: '900', color: '#111827' },
  scroll:       { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#374151', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },
  card:         { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2 },
  itemRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  itemBorder:   { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemName:     { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  itemQty:      { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  itemPrice:    { fontSize: 14, fontWeight: '900', color: '#111827', minWidth: 60, textAlign: 'right' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel:   { fontSize: 16, fontWeight: '900', color: '#111827' },
  totalValue:   { fontSize: 20, fontWeight: '900', color: '#4F46E5' },
  fieldBox:     { marginBottom: 14 },
  fieldLabel:   { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput:   { backgroundColor: '#FFF', borderRadius: 14, padding: 14, color: '#111827', fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1 },
  payCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 16, gap: 12, marginBottom: 20, borderWidth: 2, borderColor: '#D1FAE5', elevation: 1 },
  payTitle:     { fontSize: 15, fontWeight: '800', color: '#111827' },
  paySubtitle:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  payCheck:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  confirmBtn:   { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
});