import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../Context/CartContext';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/authService';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function CheckoutScreen({ navigation }: any) {
  const { items, total, clearCart } = useCart();

  // Estados del flujo
  const [step, setStep] = useState(1); // 1: Envío, 2: Pago/Facturación, 3: Recibo (Éxito)
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Datos del formulario
  const [form, setForm] = useState({
    nombre: '', email: '', direccion: '', ciudad: '', notas: '',
  });
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'error' });

  // Pre-cargar datos del usuario si está logueado
  useEffect(() => {
    const cargarUsuario = async () => {
      const session = await authService.getSession();
      if (session) {
        const { data } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
        if (data) {
          setForm(prev => ({
            ...prev,
            nombre: `${data.nombre ?? ''} ${data.apellido ?? ''}`.trim(),
            email: session.user.email ?? '',
            direccion: data.direccion_envio ?? '',
          }));
        }
      }
    };
    cargarUsuario();
  }, []);

  const set = (k: string) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const showAlert = (title: string, msg: string, type = 'error') => setAlert({ visible: true, title, msg, type });

  // Validar el primer paso
  const avanzarAPago = () => {
    if (!form.nombre.trim() || !form.direccion.trim() || !form.ciudad.trim()) {
      showAlert('FALTAN DATOS', 'Por favor, completa tu nombre, dirección y ciudad para el envío.', 'error');
      return;
    }
    setStep(2);
  };

  // Procesar la compra en la base de datos
  const confirmarPedido = async () => {
    if (items.length === 0) {
      showAlert('CARRITO VACÍO', 'No hay productos para facturar.', 'error');
      return;
    }

    setLoading(true);
    try {
      const session = await authService.getSession();
      const productosFormateados = items.map(i => ({
        nombre: i.title,
        precio: i.price,
        qty: i.quantity,
      }));

      const payload = {
        cliente_id: session?.user?.id ?? null,
        cliente_nombre: form.nombre,
        cliente_email: form.email || session?.user?.email || '',
        direccion: `${form.direccion}, ${form.ciudad}`,
        notas: form.notas,
        productos: productosFormateados,
        monto_total: total,
        estado: 'Pendiente',
      };

      const { data, error } = await supabase.from('pedidos').insert([payload]).select().single();

      if (error) throw error;

      setOrderId(data.id.substring(0, 8).toUpperCase()); // Tomamos un fragmento del ID como número de factura
      clearCart();
      setStep(3); // Mostramos el recibo

    } catch (e: any) {
      showAlert('ERROR', 'No se pudo procesar la facturación. Intenta de nuevo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const finalizar = () => {
    navigation.navigate('HomeShop', { screen: 'MisPedidos' });
  };

  // ==========================================
  // RENDER: PASO 3 - RECIBO DE FACTURACIÓN
  // ==========================================
  if (step === 3) {
    return (
        <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <StatusBar barStyle="dark-content" />
          <View style={s.receiptCard}>
            <View style={s.receiptHeader}>
              <Text style={{ fontSize: 50 }}>🎉</Text>
              <Text style={s.receiptTitle}>¡Facturación Exitosa!</Text>
              <Text style={s.receiptDesc}>Tu pedido ha sido procesado</Text>
            </View>

            <View style={s.receiptDottedLine} />

            <View style={s.receiptBody}>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>No. de Orden:</Text>
                <Text style={s.receiptValue}>#{orderId}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Cliente:</Text>
                <Text style={s.receiptValue}>{form.nombre}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Total Pagado:</Text>
                <Text style={[s.receiptValue, { color: '#10B981', fontSize: 18 }]}>${total.toLocaleString()}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Método:</Text>
                <Text style={s.receiptValue}>Contra Entrega</Text>
              </View>
            </View>

            <TouchableOpacity style={s.receiptBtn} onPress={finalizar}>
              <Text style={s.receiptBtnText}>VER MIS PEDIDOS</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER: PASOS 1 Y 2
  // ==========================================
  return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* Header con Stepper */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
              <Text style={s.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Facturación</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Barra de progreso */}
          <View style={s.progressContainer}>
            <View style={[s.progressLine, step === 2 && s.progressLineActive]} />
            <View style={s.stepNodes}>
              <View style={[s.stepNode, s.stepNodeActive]}><Text style={s.stepTextAct}>1</Text></View>
              <View style={[s.stepNode, step === 2 && s.stepNodeActive]}>
                <Text style={step === 2 ? s.stepTextAct : s.stepTextInc}>2</Text>
              </View>
            </View>
            <View style={s.stepLabels}>
              <Text style={s.stepLabelText}>Envío</Text>
              <Text style={s.stepLabelText}>Pago</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {step === 1 && (
                <View style={s.fadeContainer}>
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
                            autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                            value={form[f.key as keyof typeof form]}
                            onChangeText={set(f.key)}
                        />
                      </View>
                  ))}

                  <TouchableOpacity style={s.primaryBtn} onPress={avanzarAPago}>
                    <Text style={s.primaryBtnText}>CONTINUAR AL PAGO →</Text>
                  </TouchableOpacity>
                </View>
            )}

            {step === 2 && (
                <View style={s.fadeContainer}>
                  {/* Resumen del pedido */}
                  <Text style={s.sectionTitle}>🛒 Resumen de Facturación</Text>
                  <View style={s.card}>
                    {items.map((item, i) => (
                        <View key={item.id} style={[s.itemRow, i < items.length - 1 && s.itemBorder]}>
                          <Text style={s.itemName} numberOfLines={1}>{item.title}</Text>
                          <Text style={s.itemQty}>×{item.quantity}</Text>
                          <Text style={s.itemPrice}>${(item.price * item.quantity).toLocaleString()}</Text>
                        </View>
                    ))}

                    <View style={s.billSummary}>
                      <View style={s.billRow}>
                        <Text style={s.billLabel}>Subtotal</Text>
                        <Text style={s.billValue}>${total.toLocaleString()}</Text>
                      </View>
                      <View style={s.billRow}>
                        <Text style={s.billLabel}>Envío</Text>
                        <Text style={[s.billValue, { color: '#10B981' }]}>Gratis</Text>
                      </View>
                    </View>

                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>TOTAL A PAGAR</Text>
                      <Text style={s.totalValue}>${total.toLocaleString()}</Text>
                    </View>
                  </View>

                  {/* Método de pago */}
                  <Text style={s.sectionTitle}>💳 Método de pago</Text>
                  <View style={s.payCard}>
                    <Text style={{ fontSize: 26 }}>💵</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.payTitle}>Pago contra entrega</Text>
                      <Text style={s.paySubtitle}>Paga en efectivo al recibir tu pedido</Text>
                    </View>
                    <View style={s.payCheck}><Text style={{ color: '#10B981', fontWeight: '900' }}>✓</Text></View>
                  </View>

                  <TouchableOpacity
                      style={[s.primaryBtn, loading && { opacity: 0.7 }]}
                      onPress={confirmarPedido}
                      disabled={loading}
                  >
                    {loading
                        ? <ActivityIndicator color="#FFF" />
                        : <Text style={s.primaryBtnText}>CONFIRMAR Y FACTURAR</Text>
                    }
                  </TouchableOpacity>
                </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>

        <CustomAlert
            visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type}
            onClose={() => setAlert({ ...alert, visible: false })}
        />
      </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8F9FB' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  backIcon:     { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerTitle:  { fontSize: 18, fontWeight: '900', color: '#111827' },

  // Progress Bar
  progressContainer: { backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 50, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  progressLine: { position: 'absolute', top: 25, left: 60, right: 60, height: 2, backgroundColor: '#E5E7EB', zIndex: 0 },
  progressLineActive: { backgroundColor: '#4F46E5' },
  stepNodes:    { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  stepNode:     { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  stepNodeActive: { backgroundColor: '#4F46E5' },
  stepTextAct:  { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  stepTextInc:  { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold' },
  stepLabels:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stepLabelText:{ fontSize: 11, fontWeight: '700', color: '#6B7280' },

  scroll:       { padding: 16, paddingBottom: 40 },
  fadeContainer:{ flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#374151', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },

  // Formulario
  fieldBox:     { marginBottom: 14 },
  fieldLabel:   { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput:   { backgroundColor: '#FFF', borderRadius: 14, padding: 16, color: '#111827', fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1 },

  // Resumen
  card:         { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2 },
  itemRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  itemBorder:   { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemName:     { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  itemQty:      { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  itemPrice:    { fontSize: 14, fontWeight: '900', color: '#111827', minWidth: 60, textAlign: 'right' },
  billSummary:  { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 8 },
  billRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billLabel:    { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  billValue:    { fontSize: 13, color: '#111827', fontWeight: '700' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel:   { fontSize: 15, fontWeight: '900', color: '#111827' },
  totalValue:   { fontSize: 20, fontWeight: '900', color: '#4F46E5' },

  payCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 16, gap: 12, marginBottom: 20, borderWidth: 2, borderColor: '#10B981', elevation: 1 },
  payTitle:     { fontSize: 15, fontWeight: '800', color: '#111827' },
  paySubtitle:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  payCheck:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },

  primaryBtn:   { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },

  // Pantalla de Recibo
  receiptCard:  { backgroundColor: '#FFF', borderRadius: 24, padding: 30, width: '100%', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  receiptHeader:{ alignItems: 'center', marginBottom: 20 },
  receiptTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 10 },
  receiptDesc:  { fontSize: 14, color: '#6B7280', marginTop: 4 },
  receiptDottedLine: { width: '100%', height: 1, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', marginBottom: 20 },
  receiptBody:  { width: '100%', marginBottom: 30 },
  receiptRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  receiptLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  receiptValue: { fontSize: 14, color: '#111827', fontWeight: '800' },
  receiptBtn:   { backgroundColor: '#4F46E5', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 14, width: '100%', alignItems: 'center' },
  receiptBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});