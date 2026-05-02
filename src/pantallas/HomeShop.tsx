import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  ActivityIndicator, TouchableOpacity, StatusBar,
  Dimensions, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useCart } from '../Context/CartContext';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function HomeShopScreen() {
  const { addItem, count } = useCart();
  const [products,   setProducts]   = useState<any[]>([]);
  const [filtered,   setFiltered]   = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catActiva,  setCatActiva]  = useState('Todos');
  const [addedId,    setAddedId]    = useState<string | null>(null);
  const [alert,      setAlert]      = useState({ visible: false, title: '', msg: '' });

  useEffect(() => { cargarProductos(); }, []);

  useEffect(() => {
    let lista = [...products];
    if (catActiva !== 'Todos') lista = lista.filter(p => p.categoria === catActiva);
    const q = search.toLowerCase();
    if (q) lista = lista.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q)
    );
    setFiltered(lista);
  }, [search, catActiva, products]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const lista = data ?? [];
      setProducts(lista);
      const cats = ['Todos', ...new Set<string>(lista.map((p: any) => p.categoria))];
      setCategories(cats);
    } catch {
      setAlert({ visible: true, title: 'ERROR', msg: 'No se pudieron cargar los productos.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item: any) => {
    addItem({
      id:        item.id,
      title:     item.nombre,
      price:     item.precio,
      thumbnail: item.imagen_url ?? '',
      category:  item.categoria,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
  };

  const renderProducto = ({ item }: any) => {
    const added = addedId === item.id;
    return (
      <View style={s.card}>
        <View style={s.imgBox}>
          {item.imagen_url ? (
            <Image source={{ uri: item.imagen_url }} style={s.img} />
          ) : (
            <View style={s.imgPlaceholder}>
              <Text style={{ fontSize: 36 }}>📦</Text>
            </View>
          )}
          {item.stock !== null && item.stock <= 5 && item.stock > 0 && (
            <View style={s.stockTag}>
              <Text style={s.stockTagText}>¡Últimas {item.stock}!</Text>
            </View>
          )}
          {item.stock === 0 && (
            <View style={[s.stockTag, { backgroundColor: '#EF4444' }]}>
              <Text style={s.stockTagText}>Agotado</Text>
            </View>
          )}
        </View>
        <View style={s.info}>
          <Text style={s.category}>{item.categoria.toUpperCase()}</Text>
          <Text style={s.name} numberOfLines={1}>{item.nombre}</Text>
          {item.descripcion ? (
            <Text style={s.desc} numberOfLines={1}>{item.descripcion}</Text>
          ) : null}
          <View style={s.priceRow}>
            <Text style={s.price}>${item.precio}</Text>
            <TouchableOpacity
              style={[s.addBtn, added && s.addBtnDone, item.stock === 0 && s.addBtnDisabled]}
              onPress={() => item.stock !== 0 && handleAdd(item)}
              activeOpacity={0.8}
              disabled={item.stock === 0}
            >
              <Text style={s.addBtnText}>{added ? '✓' : '+'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={s.loader}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={s.loaderText}>Cargando MANYSHOP...</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.welcome}>¡Hola de nuevo!</Text>
          <Text style={s.title}>Explorar</Text>
        </View>
        <View style={s.cartBadgeBox}>
          <Text style={{ fontSize: 28 }}>🛍</Text>
          {count > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{count}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Buscador */}
      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar productos..."
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

      {/* Categorías dinámicas desde Supabase */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {categories.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            style={[s.chip, catActiva === cat && s.chipActivo]}
            onPress={() => setCatActiva(cat)}
          >
            <Text style={[s.chipText, catActiva === cat && s.chipTextActivo]}>
              {cat === 'Todos' ? '✨ Todos' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 && !loading ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={s.emptyTitle}>
            {search ? 'Sin resultados' : 'No hay productos aún'}
          </Text>
          <Text style={s.emptySubtitle}>
            {search ? 'Intenta con otro término' : 'El administrador aún no ha agregado productos'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={s.count}>{filtered.length} productos</Text>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={renderProducto}
            numColumns={2}
            contentContainerStyle={s.lista}
            showsVerticalScrollIndicator={false}
            onRefresh={cargarProductos}
            refreshing={loading}
          />
        </>
      )}

      <CustomAlert
        visible={alert.visible} title={alert.title} message={alert.msg}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FB' },
  loader:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loaderText:     { marginTop: 15, color: '#666', fontWeight: '500' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF' },
  welcome:        { fontSize: 14, color: '#AAA', fontWeight: '600' },
  title:          { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  cartBadgeBox:   { position: 'relative' },
  cartBadge:      { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  cartBadgeText:  { color: '#FFF', fontSize: 9, fontWeight: '900' },
  searchBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 10, borderRadius: 16, paddingHorizontal: 14, elevation: 2 },
  searchIcon:     { fontSize: 16, marginRight: 8 },
  searchInput:    { flex: 1, paddingVertical: 12, color: '#111827', fontSize: 15 },
  filterBar:      { backgroundColor: '#FFF', paddingVertical: 10 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActivo:     { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  chipText:       { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  chipTextActivo: { color: '#FFF' },
  count:          { paddingHorizontal: 20, color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  lista:          { paddingHorizontal: 10, paddingBottom: 30 },
  card:           { backgroundColor: '#FFF', width: (width / 2) - 20, margin: 8, borderRadius: 24, padding: 12, elevation: 3 },
  imgBox:         { width: '100%', height: 130, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 12 },
  img:            { width: '100%', height: '100%', resizeMode: 'contain' },
  imgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stockTag:       { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#F59E0B', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  stockTagText:   { color: '#FFF', fontSize: 9, fontWeight: '800' },
  info:           { paddingHorizontal: 2 },
  category:       { fontSize: 10, color: '#4F46E5', fontWeight: '800', marginBottom: 4 },
  name:           { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  desc:           { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price:          { fontSize: 18, fontWeight: '900' },
  addBtn:         { backgroundColor: '#1A1A1A', width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnDone:     { backgroundColor: '#10B981' },
  addBtnDisabled: { backgroundColor: '#D1D5DB' },
  addBtnText:     { color: '#FFF', fontSize: 18 },
  empty:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 40 },
  emptyTitle:     { fontSize: 20, fontWeight: '900', color: '#111827' },
  emptySubtitle:  { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});