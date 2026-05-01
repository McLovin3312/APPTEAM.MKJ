import React, { useEffect, useState, useCallback } from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet,TextInput, Modal, ActivityIndicator, Alert,
  StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import CustomAlert from '../Components/CustomAlert';

const { width } = Dimensions.get('window');

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion_envio: string;
  es_admin: boolean;
  puntos_lealtad: number;
  avatar_url: string;
  creado_at: string;  // ojo: tu columna es creado_at sin 'e' al final
}

const FILTROS = ['Todos', 'Clientes', 'Admins'];

export default function AdminClientsScreen({ navigation }: any) {
  const [clientes,  setClientes]  = useState<Cliente[]>([]);
  const [filtered,  setFiltered]  = useState<Cliente[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filtro,    setFiltro]    = useState('Todos');
  const [selected,  setSelected]  = useState<Cliente | null>(null);
  const [detModal,  setDetModal]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [alert,     setAlert]     = useState({ visible: false, title: '', msg: '', type: 'error' });

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    let lista = [...clientes];
    if (filtro === 'Clientes') lista = lista.filter(c => !c.es_admin);
    if (filtro === 'Admins')   lista = lista.filter(c => c.es_admin);
    const q = search.toLowerCase();
    if (q) lista = lista.filter(c =>
      c.nombre?.toLowerCase().includes(q)    ||
      c.apellido?.toLowerCase().includes(q)  ||
      c.email?.toLowerCase().includes(q)     ||
      c.telefono?.includes(q)
    );
    setFiltered(lista);
  }, [search, filtro, clientes]);

  const cargar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('creado_at', { ascending: false });
      if (error) throw error;
      setClientes(data ?? []);
    } catch {
      showAlert('ERROR', 'No se pudieron cargar los clientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, msg: string, type = 'error') =>
    setAlert({ visible: true, title, msg, type });

  const toggleAdmin = async (cliente: Cliente) => {
    const accion = cliente.es_admin ? 'quitar permisos de admin a' : 'dar permisos de admin a';
    Alert.alert(
      cliente.es_admin ? 'Quitar Admin' : 'Hacer Admin',
      `¿Seguro que deseas ${accion} ${cliente.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => aplicarToggleAdmin(cliente) },
      ]
    );
  };

  const aplicarToggleAdmin = async (cliente: Cliente) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ es_admin: !cliente.es_admin })
        .eq('id', cliente.id);
      if (error) throw error;
      const actualizado = { ...cliente, es_admin: !cliente.es_admin };
      setClientes(prev => prev.map(c => c.id === cliente.id ? actualizado : c));
      if (selected?.id === cliente.id) setSelected(actualizado);
      showAlert(
        cliente.es_admin ? 'ADMIN REMOVIDO' : '¡ADMIN ASIGNADO!',
        `${cliente.nombre} ahora es ${cliente.es_admin ? 'cliente regular' : 'administrador'}.`,
        'success'
      );
    } catch {
      showAlert('ERROR', 'No se pudo actualizar el rol.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = (cliente: Cliente) => {
    Alert.alert(
      'Eliminar cliente',
      `¿Eliminar la cuenta de ${cliente.nombre} ${cliente.apellido}?\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(cliente) },
      ]
    );
  };

  const eliminar = async (cliente: Cliente) => {
    try {
      const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', cliente.id);
      if (error) throw error;
      setClientes(prev => prev.filter(c => c.id !== cliente.id));
      setDetModal(false);
      showAlert('ELIMINADO', `Cuenta de ${cliente.nombre} eliminada.`, 'success');
    } catch {
      showAlert('ERROR', 'No se pudo eliminar el cliente.', 'error');
    }
  };

  const abrirDetalle = (c: Cliente) => {
    setSelected(c);
    setDetModal(true);
  };

  const iniciales = (c: Cliente) =>
    `${c.nombre?.charAt(0) ?? '?'}${c.apellido?.charAt(0) ?? ''}`.toUpperCase();

  const fechaCorta = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const AVATAR_COLORS = [
    '#4F46E5','#10B981','#F59E0B','#EF4444',
    '#EC4899','#3B82F6','#8B5CF6','#06B6D4',
  ];
  const avatarColor = (id: string) =>
    AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

  const renderCliente = useCallback(({ item }: { item: Cliente }) => (
    <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => abrirDetalle(item)}>
      {/* Avatar */}
      <View style={[s.avatar, { backgroundColor: avatarColor(item.id) }]}>
        <Text style={s.avatarText}>{iniciales(item)}</Text>
      </View>

      {/* Info */}
      <View style={s.cardInfo}>
        <View style={s.cardNameRow}>
          <Text style={s.cardName} numberOfLines={1}>
            {item.nombre} {item.apellido}
          </Text>
          {item.es_admin && (
            <View style={s.adminBadge}>
              <Text style={s.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>
        <Text style={s.cardEmail} numberOfLines={1}>{item.email}</Text>
        <Text style={s.cardDate}>Desde {fechaCorta(item.creado_at)}</Text>
      </View>

      {/* Flecha */}
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  ), [clientes]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerSub}>PANEL ADMIN</Text>
          <Text style={s.headerTitle}>Clientes</Text>
        </View>
        <View style={s.statBadge}>
          <Text style={s.statNum}>{clientes.length}</Text>
          <Text style={s.statLabel}>total</Text>
        </View>
      </View>

      {/* ─── Buscador ─── */}
      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar por nombre, email o teléfono..."
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

      {/* ─── Filtros ─── */}
      <View style={s.filterRow}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filtro === f && s.chipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[s.chipText, filtro === f && s.chipTextActive]}>{f}</Text>
            <View style={[s.chipCount, filtro === f && s.chipCountActive]}>
              <Text style={[s.chipCountText, filtro === f && { color: '#4F46E5' }]}>
                {f === 'Todos'    ? clientes.length
                  : f === 'Admins'  ? clientes.filter(c => c.es_admin).length
                  : clientes.filter(c => !c.es_admin).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Lista ─── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={s.loadingText}>Cargando clientes...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>👥</Text>
          <Text style={s.emptyText}>
            {search || filtro !== 'Todos'
              ? 'Sin resultados para tu búsqueda'
              : 'Aún no hay clientes registrados.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderCliente}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: Detalle del cliente
      ══════════════════════════════════════════════════ */}
      <Modal visible={detModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar grande */}
                <View style={s.detAvatarRow}>
                  <View style={[s.detAvatar, { backgroundColor: avatarColor(selected.id) }]}>
                    <Text style={s.detAvatarText}>{iniciales(selected)}</Text>
                  </View>
                  {selected.es_admin && (
                    <View style={s.detAdminBadge}>
                      <Text style={s.detAdminText}>👑 ADMINISTRADOR</Text>
                    </View>
                  )}
                </View>

                <Text style={s.detName}>{selected.nombre} {selected.apellido}</Text>
                <Text style={s.detEmail}>{selected.email}</Text>

                {/* Datos */}
                <View style={s.detCard}>
                  {[
                    { icon: '📧', label: 'Correo electrónico', value: selected.email },
                    { icon: '📞', label: 'Teléfono',           value: selected.telefono || '—' },
                    { icon: '📅', label: 'Registrado el',      value: fechaCorta(selected.creado_at) },
                    { icon: '🆔', label: 'ID de usuario',      value: selected.id.slice(0, 18) + '...' },
                  ].map(row => (
                    <View key={row.label} style={s.detRow}>
                      <Text style={s.detRowIcon}>{row.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.detRowLabel}>{row.label}</Text>
                        <Text style={s.detRowValue} numberOfLines={1}>{row.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Acciones */}
                <View style={s.detActions}>
                  <TouchableOpacity
                    style={[s.detActionBtn, { backgroundColor: selected.es_admin ? '#FEF3C7' : '#EEF2FF' }]}
                    onPress={() => toggleAdmin(selected)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#4F46E5" size="small" />
                    ) : (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 20 }}>{selected.es_admin ? '👤' : '👑'}</Text>
                        <Text style={[s.detActionText, { color: selected.es_admin ? '#D97706' : '#4F46E5' }]}>
                          {selected.es_admin ? 'Quitar Admin' : 'Hacer Admin'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.detActionBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => confirmarEliminar(selected)}
                  >
                    <Text style={{ fontSize: 20 }}>🗑</Text>
                    <Text style={[s.detActionText, { color: '#EF4444' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.closeBtn} onPress={() => setDetModal(false)}>
                  <Text style={s.closeBtnText}>CERRAR</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
  container:       { flex: 1, backgroundColor: '#F3F4F6' },
  header:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  backBtn:         { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon:        { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSub:       { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  headerTitle:     { color: '#FFF', fontSize: 24, fontWeight: '900' },
  statBadge:       { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  statNum:         { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statLabel:       { color: '#6B7280', fontSize: 10, fontWeight: '600' },
  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, borderRadius: 16, paddingHorizontal: 14, elevation: 2 },
  searchIcon:      { fontSize: 16, marginRight: 8 },
  searchInput:     { flex: 1, paddingVertical: 14, color: '#111827', fontSize: 15 },
  filterRow:       { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  chip:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', gap: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive:      { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  chipText:        { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  chipTextActive:  { color: '#4F46E5' },
  chipCount:       { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  chipCountActive: { backgroundColor: '#C7D2FE' },
  chipCountText:   { fontSize: 11, color: '#9CA3AF', fontWeight: '800' },
  list:            { paddingHorizontal: 16, paddingBottom: 40 },
  separator:       { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  // Card cliente
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 18, gap: 12 },
  avatar:          { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText:      { color: '#FFF', fontSize: 16, fontWeight: '900' },
  cardInfo:        { flex: 1 },
  cardNameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardName:        { fontSize: 15, fontWeight: '800', color: '#111827', flexShrink: 1 },
  adminBadge:      { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  adminBadgeText:  { fontSize: 9, fontWeight: '900', color: '#D97706' },
  cardEmail:       { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  cardDate:        { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  arrow:           { color: '#D1D5DB', fontSize: 22, fontWeight: '300' },
  // Estados
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText:     { marginTop: 12, color: '#6B7280', fontWeight: '600' },
  emptyText:       { color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 22 },
  // Modal detalle
  modalOverlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet:      { backgroundColor: '#111827', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '88%' },
  modalHandle:     { width: 44, height: 4, backgroundColor: '#374151', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  detAvatarRow:    { alignItems: 'center', marginBottom: 12, gap: 10 },
  detAvatar:       { width: 80, height: 80, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  detAvatarText:   { color: '#FFF', fontSize: 28, fontWeight: '900' },
  detAdminBadge:   { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  detAdminText:    { color: '#D97706', fontSize: 12, fontWeight: '900' },
  detName:         { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  detEmail:        { color: '#6B7280', fontSize: 14, textAlign: 'center', marginBottom: 20, marginTop: 2 },
  detCard:         { backgroundColor: '#1F2937', borderRadius: 18, padding: 4, marginBottom: 20 },
  detRow:          { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
  detRowIcon:      { fontSize: 20, width: 28, textAlign: 'center' },
  detRowLabel:     { color: '#6B7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detRowValue:     { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 2 },
  detActions:      { flexDirection: 'row', gap: 12, marginBottom: 16 },
  detActionBtn:    { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', gap: 6 },
  detActionText:   { fontSize: 13, fontWeight: '800' },
  closeBtn:        { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  closeBtnText:    { color: '#9CA3AF', fontWeight: '800', letterSpacing: 1 },
});