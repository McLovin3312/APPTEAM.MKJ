import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface ResumenEstado {
  estado: string;
  cantidad: number;
  total: number;
}

const ESTADO_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  Pendiente:  { bg: '#FEF3C7', color: '#D97706', emoji: '🕐' },
  Confirmado: { bg: '#EEF2FF', color: '#4F46E5', emoji: '✅' },
  Enviado:    { bg: '#DBEAFE', color: '#2563EB', emoji: '🚚' },
  Entregado:  { bg: '#D1FAE5', color: '#059669', emoji: '📦' },
  Cancelado:  { bg: '#FEE2E2', color: '#DC2626', emoji: '❌' },
};

export default function AdminReportsScreen({ navigation }: any) {
  const [loading,       setLoading]       = useState(true);
  const [totalVentas,   setTotalVentas]   = useState(0);
  const [totalPedidos,  setTotalPedidos]  = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProductos,setTotalProductos]= useState(0);
  const [porEstado,     setPorEstado]     = useState<ResumenEstado[]>([]);
  const [topProductos,  setTopProductos]  = useState<{ nombre: string; qty: number; total: number }[]>([]);
  const [ultimosPedidos,setUltimosPedidos]= useState<any[]>([]);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [pedidosRes, clientesRes, productosRes] = await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('perfiles').select('id', { count: 'exact' }),
        supabase.from('productos').select('id', { count: 'exact' }),
      ]);

      const pedidos = pedidosRes.data ?? [];

      // KPIs
      const entregados = pedidos.filter((p: any) => p.estado === 'Entregado');
      setTotalVentas(entregados.reduce((acc: number, p: any) => acc + (p.total ?? 0), 0));
      setTotalPedidos(pedidos.length);
      setTotalClientes(clientesRes.count ?? 0);
      setTotalProductos(productosRes.count ?? 0);

      // Por estado
      const estadoMap: Record<string, ResumenEstado> = {};
      pedidos.forEach((p: any) => {
        if (!estadoMap[p.estado]) estadoMap[p.estado] = { estado: p.estado, cantidad: 0, total: 0 };
        estadoMap[p.estado].cantidad++;
        estadoMap[p.estado].total += p.total ?? 0;
      });
      setPorEstado(Object.values(estadoMap));

      // Top productos
      const prodMap: Record<string, { qty: number; total: number }> = {};
      pedidos.forEach((p: any) => {
        (p.productos ?? []).forEach((item: any) => {
          if (!prodMap[item.nombre]) prodMap[item.nombre] = { qty: 0, total: 0 };
          prodMap[item.nombre].qty   += item.qty ?? 1;
          prodMap[item.nombre].total += (item.precio ?? 0) * (item.qty ?? 1);
        });
      });
      const top = Object.entries(prodMap)
        .map(([nombre, v]) => ({ nombre, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopProductos(top);

      // Últimos 5 pedidos
      setUltimosPedidos(
        [...pedidos]
          .sort((a: any, b: any) => new Date(b.creado_at).getTime() - new Date(a.creado_at).getTime())
          .slice(0, 5)
      );

    } catch (e) {
      console.log('Error reportes:', e);
    } finally {
      setLoading(false);
    }
  };

  const fechaCorta = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  const maxTotal = Math.max(...porEstado.map(e => e.total), 1);

  if (loading) return (
    <View style={s.loaderBox}>
      <ActivityIndicator size="large" color="#EF4444" />
      <Text style={s.loaderText}>Calculando reportes...</Text>
    </View>
  );

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
          <Text style={s.headerTitle}>Reportes</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={cargarDatos}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── KPIs ── */}
        <Text style={s.sectionTitle}>📊 Resumen General</Text>
        <View style={s.kpiGrid}>
          {[
            { label: 'Ventas\nEntregadas', value: `$${totalVentas.toLocaleString()}`, emoji: '💰', bg: '#D1FAE5', color: '#059669' },
            { label: 'Total\nPedidos',     value: totalPedidos,                       emoji: '📋', bg: '#DBEAFE', color: '#2563EB' },
            { label: 'Clientes\nRegistrados', value: totalClientes,                   emoji: '👥', bg: '#EEF2FF', color: '#4F46E5' },
            { label: 'Productos\nen Catálogo', value: totalProductos,                 emoji: '📦', bg: '#FEF3C7', color: '#D97706' },
          ].map((kpi, i) => (
            <View key={i} style={[s.kpiCard, { backgroundColor: kpi.bg }]}>
              <Text style={s.kpiEmoji}>{kpi.emoji}</Text>
              <Text style={[s.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
              <Text style={[s.kpiLabel, { color: kpi.color }]}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Pedidos por estado ── */}
        <Text style={s.sectionTitle}>🔄 Pedidos por Estado</Text>
        <View style={s.card}>
          {porEstado.length === 0 ? (
            <Text style={s.emptyText}>Sin datos aún</Text>
          ) : porEstado.map((e, i) => {
            const es = ESTADO_STYLE[e.estado] ?? { bg: '#F3F4F6', color: '#6B7280', emoji: '•' };
            const pct = (e.total / maxTotal) * 100;
            return (
              <View key={i} style={s.estadoRow}>
                <View style={s.estadoRowTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text>{es.emoji}</Text>
                    <Text style={s.estadoNombre}>{e.estado}</Text>
                    <View style={[s.countBadge, { backgroundColor: es.bg }]}>
                      <Text style={[s.countBadgeText, { color: es.color }]}>{e.cantidad}</Text>
                    </View>
                  </View>
                  <Text style={[s.estadoMonto, { color: es.color }]}>${e.total.toLocaleString()}</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: es.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Top productos ── */}
        <Text style={s.sectionTitle}>🏆 Top 5 Productos Vendidos</Text>
        <View style={s.card}>
          {topProductos.length === 0 ? (
            <Text style={s.emptyText}>Sin datos aún</Text>
          ) : topProductos.map((p, i) => (
            <View key={i} style={[s.topRow, i < topProductos.length - 1 && s.topRowBorder]}>
              <View style={[s.topRankBadge, i === 0 && { backgroundColor: '#FEF3C7' }]}>
                <Text style={[s.topRank, i === 0 && { color: '#D97706' }]}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.topNombre} numberOfLines={1}>{p.nombre}</Text>
                <Text style={s.topQty}>{p.qty} unidades vendidas</Text>
              </View>
              <Text style={s.topTotal}>${p.total.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* ── Últimos pedidos ── */}
        <Text style={s.sectionTitle}>🕐 Últimos Pedidos</Text>
        <View style={s.card}>
          {ultimosPedidos.length === 0 ? (
            <Text style={s.emptyText}>Sin pedidos aún</Text>
          ) : ultimosPedidos.map((p, i) => {
            const es = ESTADO_STYLE[p.estado] ?? ESTADO_STYLE['Pendiente'];
            return (
              <View key={i} style={[s.ultimoRow, i < ultimosPedidos.length - 1 && s.topRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.ultimoCliente} numberOfLines={1}>{p.cliente_nombre}</Text>
                  <Text style={s.ultimoFecha}>{fechaCorta(p.creado_at)}</Text>
                </View>
                <View style={[s.estadoBadge, { backgroundColor: es.bg }]}>
                  <Text style={[s.estadoBadgeText, { color: es.color }]}>{es.emoji} {p.estado}</Text>
                </View>
                <Text style={s.ultimoTotal}>${p.total?.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F3F4F6' },
  loaderBox:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loaderText:      { marginTop: 12, color: '#6B7280', fontWeight: '600' },
  header:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  backBtn:         { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon:        { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSub:       { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  headerTitle:     { color: '#FFF', fontSize: 24, fontWeight: '900' },
  refreshBtn:      { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  scroll:          { padding: 16, paddingBottom: 40 },
  sectionTitle:    { fontSize: 13, fontWeight: '800', color: '#374151', letterSpacing: 0.5, marginBottom: 10, marginTop: 8, textTransform: 'uppercase' },
  // KPIs
  kpiGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  kpiCard:         { width: (width - 44) / 2, padding: 18, borderRadius: 20, alignItems: 'center' },
  kpiEmoji:        { fontSize: 28, marginBottom: 6 },
  kpiValue:        { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  kpiLabel:        { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2, lineHeight: 15 },
  // Cards
  card:            { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 8, elevation: 2 },
  emptyText:       { color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  // Por estado
  estadoRow:       { marginBottom: 14 },
  estadoRowTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  estadoNombre:    { fontSize: 14, fontWeight: '700', color: '#111827' },
  countBadge:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  countBadgeText:  { fontSize: 11, fontWeight: '800' },
  estadoMonto:     { fontSize: 14, fontWeight: '900' },
  barBg:           { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill:         { height: '100%', borderRadius: 4 },
  // Top productos
  topRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  topRowBorder:    { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  topRankBadge:    { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  topRank:         { fontSize: 16, fontWeight: '800', color: '#6B7280' },
  topNombre:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  topQty:          { fontSize: 12, color: '#6B7280', marginTop: 1 },
  topTotal:        { fontSize: 15, fontWeight: '900', color: '#059669' },
  // Últimos pedidos
  ultimoRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  ultimoCliente:   { fontSize: 14, fontWeight: '700', color: '#111827' },
  ultimoFecha:     { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  estadoBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  estadoBadgeText: { fontSize: 11, fontWeight: '700' },
  ultimoTotal:     { fontSize: 14, fontWeight: '900', color: '#111827', minWidth: 60, textAlign: 'right' },
});