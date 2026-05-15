import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  ActivityIndicator, TouchableOpacity, StatusBar,


  Dimensions, TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { supabase } from '../lib/supabase';
import { productService } from '../lib/productService'; 
import { useCart } from '../Context/CartContext';
import { authService } from '../lib/authService';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function HomeShopScreen({ navigation }: any) {
  // Desestructuramos 'count' para el círculo rojo del carrito [cite: 1630, 1631]
  const { addItem, items, count } = useCart(); 


  
  const [products,   setProducts]   = useState<any[]>([]);
  const [filtered,   setFiltered]   = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catActiva,  setCatActiva]  = useState('Todos');
  const [addedId,    setAddedId]    = useState<string | null>(null);
  
  // Estado de alerta para manejar la confirmación de Logout [cite: 1645, 1684]
  const [alert, setAlert] = useState({ 
    visible: false, 
    title: '', 
    msg: '', 
    isLogout: false 


  });

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
      const [dbResponse, dummyData] = await Promise.all([
        supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .order('created_at', { ascending: false }),
        productService.getDummyProducts()
      ]);

      if (dbResponse.error) throw dbResponse.error;
      const dbLista = dbResponse.data ?? [];
      const formattedDummy = dummyData.map((item: any) => ({
        id: `dummy-${item.id}`,
        nombre: item.title,
        descripcion: item.description,
        precio: item.price,
        imagen_url: item.thumbnail,
        categoria: item.category,
        stock: item.stock ?? 10,
      }));

      const listaFinal = [...dbLista, ...formattedDummy];
      setProducts(listaFinal);
      const categoriasUnicas = Array.from(new Set<string>(listaFinal.map((p: any) => p.categoria)));
      const catsOrdenadas = ['Todos', ...categoriasUnicas.sort((a, b) => a.localeCompare(b))];
      setCategories(catsOrdenadas);
    } catch (error) {
      setAlert({ visible: true, title: 'ERROR', msg: 'No se pudieron cargar los productos.', isLogout: false });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item: any) => {
    addItem({
      id: item.id,
      title: item.nombre,

      price: item.precio,
      thumbnail: item.imagen_url ?? '',

      category: item.categoria,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
  };

  // Función para disparar el modal de confirmación [cite: 1654, 1685]
  const triggerLogout = () => {
    setAlert({ 
      visible: true, 
      title: 'CERRAR SESIÓN', 
      msg: '¿Estás seguro de que deseas salir de tu cuenta?', 
      isLogout: true 
    });
  };

  // Cierre de sesión definitivo [cite: 1656, 1657]
  const confirmLogout = async () => {
    try {
      await authService.signOut();
      setAlert({ ...alert, visible: false });
      navigation.replace('Login'); // Bloqueamos el retroceso [cite: 1694]
    } catch (error) {
      setAlert({ visible: true, title: 'ERROR', msg: 'Fallo al cerrar sesión.', isLogout: false });
    }
  };

  const cancelAlert = () => {

    setAlert({ ...alert, visible: false });
  };

  const renderProducto = ({ item }: any) => {
    const added = addedId === item.id;
    return (
      <View style={s.card}>
        <View style={s.imgBox}>
          {item.imagen_url ? (
            <Image source={{ uri: item.imagen_url }} style={s.img} />
          ) : (

            <View style={s.imgPlaceholder}><Text style={{ fontSize: 36 }}>📦</Text></View>
          )}
          {item.stock !== null && item.stock <= 5 && item.stock > 0 && (

<View style={s.stockTag}><Text style={s.stockTagText}>¡Últimas {item.stock}!</Text></View>
          )}
        </View>
        <View style={s.info}>
          <Text style={s.category}>{item.categoria.toUpperCase()}</Text>


          <Text style={s.name} numberOfLines={1}>{item.nombre}</Text>
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


      {/* Header con Carrito y Salida Funcionales [cite: 1666, 1668] */}
      <View style={s.header}>
        <View>
          <Text style={s.welcome}>¡Hola de nuevo!</Text>
          <Text style={s.title}>Explorar</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation.navigate('Cart')}>
            <MaterialCommunityIcons name="cart-outline" size={26} color="#1A1A1A" />
            {count > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[s.headerBtn, { backgroundColor: '#FEE2E2' }]} onPress={triggerLogout}>
             <MaterialCommunityIcons name="logout-variant" size={24} color="#EF4444" />
          </TouchableOpacity>

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
      </View>

      {/* Categorías */}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} style={[s.chip, catActiva === cat && s.chipActivo]} onPress={() => setCatActiva(cat)}>

            <Text style={[s.chipText, catActiva === cat && s.chipTextActivo]}>{cat === 'Todos' ? '✨ Todos' : cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listado de Productos */}
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


      {/* MODAL PERSONALIZADO CON DOBLE BOTÓN [cite: 1675, 1688] */}
      <CustomAlert
        visible={alert.visible} 
        title={alert.title} 
        message={alert.msg}
        onClose={() => {
          if(alert.isLogout) confirmLogout(); // Si presiona "Continuar" [cite: 1689]
          else cancelAlert();
        }}

        onCancel={alert.isLogout ? cancelAlert : undefined} // Botón de "Cancelar" [cite: 1687, 1691]
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
  headerBtn:      { padding: 10, backgroundColor: '#F3F4F6', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cartBadge:      { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderSize: 2, borderColor: '#FFF' },

  cartBadgeText:  { color: '#FFF', fontSize: 11, fontWeight: '900' },
  searchBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 10, borderRadius: 16, paddingHorizontal: 14, elevation: 2 },
  searchIcon:     { fontSize: 16, marginRight: 8 },
  searchInput:    { flex: 1, paddingVertical: 12, color: '#111827', fontSize: 15 },

  filterBar:      { backgroundColor: '#FFF', paddingVertical: 10, maxHeight: 60 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActivo:     { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  chipText:       { fontSize: 12, color: '#6B7280', fontWeight: '700' },




  chipTextActivo: { color: '#FFF' },
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
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price:          { fontSize: 18, fontWeight: '900' },
  addBtn:         { backgroundColor: '#1A1A1A', width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnDone:     { backgroundColor: '#10B981' },
  addBtnDisabled: { backgroundColor: '#D1D5DB' },




  addBtnText:     { color: '#FFF', fontSize: 18 },
});