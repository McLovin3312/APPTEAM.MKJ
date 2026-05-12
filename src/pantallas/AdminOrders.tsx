import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert,
  StatusBar, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');
const getMonto = (p: any): number => p.monto_total ?? p.total ?? 0;

interface ProductoLinea { nombre: string; precio: number; qty: number; }
interface Pedido {
  id: string; cliente_id: string | null; cliente_nombre: string;
  cliente_email: string; productos: ProductoLinea[]; total: number;
  estado: string; direccion: string; notas: string; creado_at: string;
}

const ESTADOS = ['Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'];
const ESTADO_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  Pendiente:  { bg: '#FEF3C7', color: '#D97706', emoji: '🕐' },
  Confirmado: { bg: '#EEF2FF', color: '#4F46E5', emoji: '✅' },
  Enviado:    { bg: '#DBEAFE', color: '#2563EB', emoji: '🚚' },
  Entregado:  { bg: '#D1FAE5', color: '#059669', emoji: '📦' },
  Cancelado:  { bg: '#FEE2E2', color: '#DC2626', emoji: '❌' },
};

export default function AdminOrdersScreen({ navigation }: any) {
  const [pedidos,  setPedidos]  = useState<Pedido[]>([]);
  const [filtered, setFiltered] = useState<Pedido[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filtro,   setFiltro]   = useState('Todos');
  const [detModal, setDetModal] = useState(false);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [alert,    setAlert]    = useState({ visible: false, title: '', msg: '', type: 'error' });

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    let lista = [...pedidos];
    if (filtro !== 'Todos') lista = lista.filter(p => p.estado === filtro);
    const q = search.toLowerCase();
    if (q) lista = lista.filter(p =>
      p.cliente_nombre?.toLowerCase().includes(q) ||
      p.cliente_email?.toLowerCase().includes(q)  ||
      p.id.toLowerCase().includes(q)
    );
    setFiltered(lista);
  }, [search, filtro, pedidos]);

  const cargar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('creado_at', { ascending: false });
      
      if (error) throw error;

      let listaPedidos = data ?? [];
      const ahora = new Date().getTime();

      // AUTO-ACTUALIZAR A ENTREGADO DESPUÉS DE 5 MINUTOS (300,000 ms)
      for (let p of listaPedidos) {
        const tiempoPasado = ahora - new Date(p.creado_at).getTime();
        // Si no está cancelado ni entregado, y ya pasaron 5 mins
        if (p.estado !== 'Entregado' && p.estado !== 'Cancelado' && tiempoPasado > 300000) {
          await supabase.from('pedidos').update({ estado: 'Entregado' }).eq('id', p.id);
          p.estado = 'Entregado'; 
        }
      }

      setPedidos(listaPedidos);
    } catch {
      showAlert('ERROR', 'No se pudieron cargar los pedidos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, msg: string, type = 'error') =>
    setAlert({ visible: true, title, msg, type });

  const abrirDetalle = (p: Pedido) => {
    setSelected(p);
    setDetModal(true);
  };

  const confirmarEliminar = (p: Pedido) => {
    Alert.alert('Eliminar pedido', `¿Eliminar el pedido de ${p.cliente_nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(p) },
    ]);
  };

  const eliminar = async (p: Pedido) => {
    try {
      const { error } = await supabase.from('pedidos').delete().eq('id', p.id);
      if (error) throw error;
      setPedidos(prev => prev.filter(x => x.id !== p.id));
      setDetModal(false);
      showAlert('ELIMINADO', 'Pedido eliminado.', 'success');
    } catch {
      showAlert('ERROR', 'No se pudo eliminar.', 'error');
    }
  };

  const fechaCorta = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const contarPorEstado = (e: string) => pedidos.filter(p => p.estado === e).length;

  const renderPedido = useCallback(({ item }: { item: Pedido }) => {
    const es = ESTADO_STYLE[item.estado] ?? ESTADO_STYLE['Pendiente'];
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => abrirDetalle(item)}>
        <View style={s.cardLeft}>
          <View style={[s.estadoBadge, { backgroundColor: es.bg }]}>
            <Text style={s.estadoEmoji}>{es.emoji}</Text>
            <Text style={[s.estadoText, { color: es.color }]}>{item.estado}</Text>
          </View>
          <Text style={s.cardCliente} numberOfLines={1}>{item.cliente_nombre}</Text>
          <Text style={s.cardEmail}   numberOfLines={1}>{item.cliente_email}</Text>
          <Text style={s.cardFecha}>{fechaCorta(item.creado_at)}</Text>
        </View>
        <View style={s.cardRight}>
          <Text style={s.cardTotal}>${getMonto(item).toLocaleString()}</Text>
          <Text style={s.cardItems}>{item.productos?.length ?? 0} item(s)</Text>
          <Text style={s.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }, [pedidos]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerSub}>PANEL ADMIN</Text>
          <Text style={s.headerTitle}>Pedidos</Text>
        </View>
      </View>

      {/* Resumen rápido */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 12 }}>
        {ESTADOS.map(e => {
          const es = ESTADO_STYLE[e];
          return (
            <TouchableOpacity
              key={e}
              style={[s.statCard, { backgroundColor: es.bg }, filtro === e && s.statCardActive]}
              onPress={() => setFiltro(filtro === e ? 'Todos' : e)}
            >
              <Text style={s.statEmoji}>{es.emoji}</Text>
              <Text style={[s.statNum, { color: es.color }]}>{contarPorEstado(e)}</Text>
              <Text style={[s.statLabel, { color: es.color }]}>{e}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Buscador */}
      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar cliente o ID..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#9CA3AF', fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={s.count}>{filtered.length} pedidos</Text>

      {/* Lista */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={s.loadingText}>Cargando pedidos...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={s.emptyText}>
            {search || filtro !== 'Todos' ? 'Sin resultados' : 'Aún no hay pedidos.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderPedido}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* MODAL: Detalle Pedido */}
      <Modal visible={detModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            {selected && (() => {
              const es = ESTADO_STYLE[selected.estado] ?? ESTADO_STYLE['Pendiente'];
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={[s.detEstadoBox, { backgroundColor: es.bg }]}>
                    <Text style={{ fontSize: 32 }}>{es.emoji}</Text>
                    <Text style={[s.detEstadoText, { color: es.color }]}>{selected.estado}</Text>
                  </View>

                  <Text style={s.detCliente}>{selected.cliente_nombre}</Text>
                  <Text style={s.detEmail}>{selected.cliente_email}</Text>
                  <Text style={s.detFecha}>📅 {fechaCorta(selected.creado_at)}</Text>

                  <View style={s.detCard}>
                    {selected.direccion ? (
                      <View style={s.detRow}>
                        <Text style={s.detRowIcon}>📍</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.detRowLabel}>Dirección</Text>
                          <Text style={s.detRowValue}>{selected.direccion}</Text>
                        </View>
                      </View>
                    ) : null}
                    {selected.notas ? (
                      <View style={s.detRow}>
                        <Text style={s.detRowIcon}>📝</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.detRowLabel}>Notas</Text>
                          <Text style={s.detRowValue}>{selected.notas}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  <Text style={s.sectionTitle}>🛒 Productos</Text>
                  <View style={s.detCard}>
                    {(selected.productos ?? []).map((p, idx) => (
                      <View key={idx} style={[s.detRow, { borderBottomWidth: idx < selected.productos.length - 1 ? 1 : 0 }]}>
                        <Text style={s.detRowIcon}>•</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.detRowValue}>{p.nombre}</Text>
                          <Text style={s.detRowLabel}>${p.precio} × {p.qty}</Text>
                        </View>
                        <Text style={[s.detRowValue, { color: '#10B981' }]}>${p.precio * p.qty}</Text>
                      </View>
                    ))}
                    <View style={[s.detRow, { borderBottomWidth: 0 }]}>
                      <Text style={[s.detRowValue, { flex: 1, color: '#FFF' }]}>TOTAL</Text>
                      <Text style={[s.detRowValue, { color: '#10B981', fontSize: 18 }]}>${getMonto(selected).toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={s.detActions}>
                    <TouchableOpacity style={[s.detActionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => confirmarEliminar(selected)}>
                      <Text style={{ fontSize: 20 }}>🗑</Text>
                      <Text style={[s.detActionText, { color: '#EF4444' }]}>Eliminar Pedido</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={s.closeBtn} onPress={() => setDetModal(false)}>
                    <Text style={s.closeBtnText}>CERRAR</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F3F4F6' },
  header:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  backBtn:        { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon:       { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSub:      { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  headerTitle:    { color: '#FFF', fontSize: 24, fontWeight: '900' },
  statsRow:       { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  statCard:       { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, borderWidth: 2, borderColor: 'transparent', minWidth: 80 },
  statCardActive: { borderWidth: 2 },
  statEmoji:      { fontSize: 20, marginBottom: 2 },
  statNum:        { fontSize: 20, fontWeight: '900' },
  statLabel:      { fontSize: 10, fontWeight: '700' },
  searchBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, borderRadius: 16, paddingHorizontal: 14, elevation: 2 },
  searchIcon:     { fontSize: 16, marginRight: 8 },
  searchInput:    { flex: 1, paddingVertical: 14, color: '#111827', fontSize: 15 },
  count:          { paddingHorizontal: 20, color: '#6B7280', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  list:           { paddingHorizontal: 16, paddingBottom: 40 },
  card:           { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 18, elevation: 2 },
  cardLeft:       { flex: 1, gap: 3 },
  cardRight:      { alignItems: 'flex-end', justifyContent: 'space-between' },
  estadoBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 4 },
  estadoEmoji:    { fontSize: 12 },
  estadoText:     { fontSize: 11, fontWeight: '800' },
  cardCliente:    { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardEmail:      { fontSize: 12, color: '#6B7280' },
  cardFecha:      { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  cardTotal:      { fontSize: 18, fontWeight: '900', color: '#111827' },
  cardItems:      { fontSize: 11, color: '#9CA3AF' },
  arrow:          { color: '#D1D5DB', fontSize: 22 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText:    { marginTop: 12, color: '#6B7280', fontWeight: '600' },
  emptyText:      { color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 22 },
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet:     { backgroundColor: '#111827', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '94%' },
  modalHandle:    { width: 44, height: 4, backgroundColor: '#374151', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sectionTitle:   { color: '#9CA3AF', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  detEstadoBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, marginBottom: 12, alignSelf: 'center', paddingHorizontal: 24 },
  detEstadoText:  { fontSize: 18, fontWeight: '900' },
  detCliente:     { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  detEmail:       { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 2 },
  detFecha:       { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  detCard:        { backgroundColor: '#1F2937', borderRadius: 18, padding: 4, marginBottom: 16 },
  detRow:         { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
  detRowIcon:     { fontSize: 18, width: 28, textAlign: 'center' },
  detRowLabel:    { color: '#6B7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detRowValue:    { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 2 },
  detActions:     { flexDirection: 'row', gap: 12, marginBottom: 16 },
  detActionBtn:   { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', gap: 6 },
  detActionText:  { fontSize: 13, fontWeight: '800' },
  closeBtn:       { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  closeBtnText:   { color: '#9CA3AF', fontWeight: '800', letterSpacing: 1 },
});