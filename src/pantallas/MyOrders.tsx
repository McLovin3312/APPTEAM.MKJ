import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, ScrollView, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/authService';

const ESTADO_STYLE: Record<string, { bg: string; color: string; emoji: string; step: number }> = {
  Pendiente:  { bg: '#FEF3C7', color: '#D97706', emoji: '🕐', step: 1 },
  Confirmado: { bg: '#EEF2FF', color: '#4F46E5', emoji: '✅', step: 2 },
  Enviado:    { bg: '#DBEAFE', color: '#2563EB', emoji: '🚚', step: 3 },
  Entregado:  { bg: '#D1FAE5', color: '#059669', emoji: '📦', step: 4 },
  Cancelado:  { bg: '#FEE2E2', color: '#DC2626', emoji: '❌', step: 0 },
};

const PASOS = ['Pendiente', 'Confirmado', 'Enviado', 'Entregado'];

// Helper: lee monto_total o total, lo que exista
const getMonto = (p: any): number => p.monto_total ?? p.total ?? 0;

export default function MyOrdersScreen({ navigation }: any) {
  const [pedidos,  setPedidos]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [modal,    setModal]    = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const session = await authService.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', session.user.id)
        .order('creado_at', { ascending: false });
      if (error) throw error;
      setPedidos(data ?? []);
    } catch (e) {
      console.log('Error pedidos:', e);
    } finally {
      setLoading(false);
    }
  };

  const fechaCorta = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const abrirDetalle = (p: any) => {
    setSelected(p);
    setModal(true);
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await authService.signOut();
          navigation.getParent()?.replace('Login');
        },
      },
    ]);
  };

  const renderPedido = useCallback(({ item }: any) => {
    const es    = ESTADO_STYLE[item.estado] ?? ESTADO_STYLE['Pendiente'];
    const monto = getMonto(item);
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => abrirDetalle(item)}>
        <View style={[s.estadoStripe, { backgroundColor: es.color }]} />
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <View style={[s.badge, { backgroundColor: es.bg }]}>
              <Text style={[s.badgeText, { color: es.color }]}>{es.emoji} {item.estado}</Text>
            </View>
            <Text style={s.cardTotal}>${monto.toLocaleString()}</Text>
          </View>
          <Text style={s.cardFecha}>📅 {fechaCorta(item.creado_at)}</Text>
          <Text style={s.cardItems} numberOfLines={1}>
            {(item.productos ?? []).map((p: any) => p.nombre).join(', ')}
          </Text>
          <Text style={s.verDetalle}>Ver detalle →</Text>
        </View>
      </TouchableOpacity>
    );
  }, [pedidos]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Mis Pedidos</Text>
        <TouchableOpacity onPress={cargar}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={s.loadingText}>Cargando pedidos...</Text>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 64 }}>📦</Text>
          <Text style={s.emptyTitle}>Sin pedidos aún</Text>
          <Text style={s.emptySubtitle}>Tus pedidos aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={item => item.id}
          renderItem={renderPedido}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onRefresh={cargar}
          refreshing={loading}
        />
      )}

      {/* Modal detalle */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            {selected && (() => {
              const es    = ESTADO_STYLE[selected.estado] ?? ESTADO_STYLE['Pendiente'];
              const step  = es.step;
              const monto = getMonto(selected);
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Estado */}
                  <View style={[s.detEstado, { backgroundColor: es.bg }]}>
                    <Text style={{ fontSize: 32 }}>{es.emoji}</Text>
                    <Text style={[s.detEstadoText, { color: es.color }]}>{selected.estado}</Text>
                  </View>

                  {/* Tracker */}
                  {selected.estado !== 'Cancelado' && (
                    <View style={s.tracker}>
                      {PASOS.map((p, i) => {
                        const done    = step > i + 1;
                        const current = step === i + 1;
                        const es2     = ESTADO_STYLE[p];
                        return (
                          <React.Fragment key={p}>
                            <View style={s.trackerStep}>
                              <View style={[
                                s.trackerDot,
                                done    && { backgroundColor: '#10B981', borderColor: '#10B981' },
                                current && { backgroundColor: es2.color, borderColor: es2.color },
                              ]}>
                                <Text style={s.trackerDotText}>{done ? '✓' : `${i + 1}`}</Text>
                              </View>
                              <Text style={[
                                s.trackerLabel,
                                (done || current) && { color: '#111827', fontWeight: '700' },
                              ]}>{p}</Text>
                            </View>
                            {i < PASOS.length - 1 && (
                              <View style={[s.trackerLine, done && { backgroundColor: '#10B981' }]} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </View>
                  )}

                  <Text style={s.detFecha}>
                    📅 {new Date(selected.creado_at).toLocaleDateString('es-CO', {
                      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </Text>

                  {selected.direccion && (
                    <View style={s.detInfoRow}>
                      <Text style={s.detInfoIcon}>📍</Text>
                      <Text style={s.detInfoText}>{selected.direccion}</Text>
                    </View>
                  )}

                  {/* Productos */}
                  <Text style={s.sectionLabel}>🛒 Productos</Text>
                  <View style={s.detCard}>
                    {(selected.productos ?? []).map((p: any, idx: number) => (
                      <View key={idx} style={[s.prodRow, idx < selected.productos.length - 1 && s.prodBorder]}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.prodNombre}>{p.nombre}</Text>
                          <Text style={s.prodDetalle}>${p.precio} × {p.qty}</Text>
                        </View>
                        <Text style={s.prodSubtotal}>${p.precio * p.qty}</Text>
                      </View>
                    ))}
                    {/* Total */}
                    <View style={[s.prodRow, { borderTopWidth: 1, borderTopColor: '#374151' }]}>
                      <Text style={[s.prodNombre, { flex: 1 }]}>TOTAL</Text>
                      <Text style={[s.prodSubtotal, { color: '#10B981', fontSize: 18 }]}>
                        ${monto.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={s.closeBtn} onPress={() => setModal(false)}>
                    <Text style={s.closeBtnText}>CERRAR</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F8F9FB' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle:   { fontSize: 24, fontWeight: '900', color: '#111827' },
  list:          { padding: 16, paddingBottom: 40 },
  card:          { backgroundColor: '#FFF', borderRadius: 20, flexDirection: 'row', overflow: 'hidden', elevation: 2 },
  estadoStripe:  { width: 6 },
  cardBody:      { flex: 1, padding: 14, gap: 4 },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText:     { fontSize: 12, fontWeight: '800' },
  cardTotal:     { fontSize: 18, fontWeight: '900', color: '#111827' },
  cardFecha:     { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  cardItems:     { fontSize: 13, color: '#6B7280' },
  verDetalle:    { fontSize: 12, color: '#4F46E5', fontWeight: '700', marginTop: 4 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText:   { color: '#6B7280', fontWeight: '600' },
  emptyTitle:    { fontSize: 22, fontWeight: '900', color: '#111827' },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF' },
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet:    { backgroundColor: '#111827', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '92%' },
  modalHandle:   { width: 44, height: 4, backgroundColor: '#374151', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  detEstado:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, marginBottom: 16, alignSelf: 'center', paddingHorizontal: 24 },
  detEstadoText: { fontSize: 18, fontWeight: '900' },
  tracker:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, paddingHorizontal: 8 },
  trackerStep:   { alignItems: 'center', gap: 4 },
  trackerDot:    { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#374151', backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  trackerDotText:{ color: '#FFF', fontSize: 11, fontWeight: '900' },
  trackerLabel:  { color: '#6B7280', fontSize: 9, fontWeight: '600', textAlign: 'center', maxWidth: 52 },
  trackerLine:   { flex: 1, height: 2, backgroundColor: '#374151', marginBottom: 20 },
  detFecha:      { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  detInfoRow:    { flexDirection: 'row', gap: 8, backgroundColor: '#1F2937', borderRadius: 12, padding: 12, marginBottom: 12 },
  detInfoIcon:   { fontSize: 16 },
  detInfoText:   { color: '#D1D5DB', fontSize: 14, flex: 1 },
  sectionLabel:  { color: '#9CA3AF', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  detCard:       { backgroundColor: '#1F2937', borderRadius: 16, padding: 4, marginBottom: 16 },
  prodRow:       { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  prodBorder:    { borderBottomWidth: 1, borderBottomColor: '#374151' },
  prodNombre:    { color: '#FFF', fontSize: 14, fontWeight: '700' },
  prodDetalle:   { color: '#6B7280', fontSize: 12, marginTop: 1 },
  prodSubtotal:  { color: '#10B981', fontSize: 14, fontWeight: '900' },
  closeBtn:      { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  closeBtnText:  { color: '#9CA3AF', fontWeight: '800', letterSpacing: 1 },
});