import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productService } from '../lib/productService'; 
import { supabase } from '../lib/supabase'; 
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

// ─── Colores por categoría ───────────────────────────────────────
const CAT_STYLES: Record<string, { bg: string; accent: string; emoji: string }> = {
  smartphones:       { bg: '#EEF2FF', accent: '#4F46E5', emoji: '📱' },
  laptops:           { bg: '#FFF7ED', accent: '#F59E0B', emoji: '💻' },
  fragrances:        { bg: '#FDF2F8', accent: '#EC4899', emoji: '🌸' },
  skincare:          { bg: '#F0FDF4', accent: '#10B981', emoji: '✨' },
  groceries:         { bg: '#ECFDF5', accent: '#059669', emoji: '🛒' },
  'home-decoration': { bg: '#FEF3C7', accent: '#D97706', emoji: '🏠' },
  furniture:         { bg: '#EFF6FF', accent: '#3B82F6', emoji: '🪑' },
  tops:              { bg: '#FFF1F2', accent: '#F43F5E', emoji: '👕' },
  'womens-dresses':  { bg: '#FAF5FF', accent: '#A855F7', emoji: '👗' },
  'womens-shoes':    { bg: '#F0FDF4', accent: '#10B981', emoji: '👠' },
  'mens-shirts':     { bg: '#EFF6FF', accent: '#3B82F6', emoji: '👔' },
  'mens-shoes':      { bg: '#FFF7ED', accent: '#F59E0B', emoji: '👟' },
  'mens-watches':    { bg: '#F8FAFC', accent: '#64748B', emoji: '⌚' },
  'womens-watches':  { bg: '#FDF4FF', accent: '#C026D3', emoji: '⌚' },
  'womens-bags':     { bg: '#FFF1F2', accent: '#F43F5E', emoji: '👜' },
  'womens-jewellery':{ bg: '#FFFBEB', accent: '#EAB308', emoji: '💍' },
  sunglasses:        { bg: '#ECFDF5', accent: '#10B981', emoji: '🕶' },
  automotive:        { bg: '#FEF2F2', accent: '#EF4444', emoji: '🚗' },
  motorcycle:        { bg: '#FEF2F2', accent: '#DC2626', emoji: '🏍' },
  lighting:          { bg: '#FEFCE8', accent: '#EAB308', emoji: '💡' },
  electronics:       { bg: '#EFF6FF', accent: '#2563EB', emoji: '🔌' },
  wearables:         { bg: '#F5F3FF', accent: '#7C3AED', emoji: '⌚' },
  general:           { bg: '#F3F4F6', accent: '#6B7280', emoji: '📦' },
};

const getCat = (cat: string) =>
  CAT_STYLES[cat?.toLowerCase()] ?? { bg: '#F3F4F6', accent: '#6B7280', emoji: '📦' };

const DEFAULT_CATS = [
  'smartphones','laptops','electronics','wearables','furniture',
  'home-decoration','fragrances','skincare','groceries','tops',
  'womens-dresses','womens-shoes','mens-shirts','mens-shoes',
  'mens-watches','womens-watches','womens-bags','womens-jewellery',
  'sunglasses','automotive','motorcycle','lighting','general',
];

const EMPTY_FORM = {
  nombre: '', precio: 0, categoria: '', descripcion: '', imagen_url: '', stock: 0,
};

export default function AdminProductsScreen({ navigation }: any) {
  const [products,   setProducts]   = useState<any[]>([]);
  const [filtered,   setFiltered]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [catModal,   setCatModal]   = useState(false);
  const [editing,    setEditing]    = useState<any | null>(null);
  const [form,       setForm]       = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATS);
  const [newCat,     setNewCat]     = useState('');
  const [catOpen,    setCatOpen]    = useState(false);
  const [imgOk,      setImgOk]      = useState(false);
  const [alert,      setAlert]      = useState({ visible: false, title: '', msg: '', type: 'error' });

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q
      ? products.filter(p => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q))
      : products
    );
  }, [search, products]);

  useEffect(() => { setImgOk(false); }, [form.imagen_url]);

  const cargar = async () => {
    try {
      setLoading(true);
      
      const [dbLista, dummyData] = await Promise.all([
        productService.getAll(),
        productService.getDummyProducts()
      ]);

      const rawDummy = Array.isArray(dummyData) ? dummyData : [];

      const formattedDummy = rawDummy.map((item: any) => ({
        id: `dummy-${item.id}`,
        nombre: item.title,         
        descripcion: item.description || '',
        precio: item.price || 0,      
        imagen_url: item.thumbnail || '', 
        categoria: item.category || 'general', 
        stock: item.stock ?? 10,
        es_api_pura: true
      }));

      const dummyFiltrados = formattedDummy.filter((pDummy: any) => {
        const idOriginal = pDummy.id.replace('dummy-', '');
        return !dbLista.some((pDB: any) => pDB.id_referencia_api === idOriginal);
      });

      const listaFinal = [...dbLista, ...dummyFiltrados];
      setProducts(listaFinal);
      
      const dbCats = [...new Set(listaFinal.map((p: any) => p.categoria.toLowerCase()))];
      setCategories(prev => [...new Set([...prev, ...dbCats])]);
    } catch (error: any) { 
      console.error("Error cargando el catálogo administrativo masivo:", error);
      showAlert('ERROR', 'No se pudieron procesar las fuentes de datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, msg: string, type = 'error') =>
    setAlert({ visible: true, title, msg, type });

  const abrirCrear = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCatOpen(false);
    setModal(true);
  };

  const abrirEditar = (p: any) => {
    setEditing(p);
    setForm({
      nombre:      p.nombre,
      precio:      p.precio,
      categoria:   p.categoria,
      descripcion: p.descripcion ?? '',
      imagen_url:  p.imagen_url  ?? '',
      stock:       p.stock       ?? 0,
    });
    setCatOpen(false);
    setModal(true);
  };

  const confirmarEliminar = (p: any) => {
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que deseas eliminar "${p.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(p) },
      ]
    );
  };

  const eliminar = async (p: any) => {
    try {
      if (p.id && p.id.toString().includes('dummy-')) {
        setProducts(prev => prev.filter(item => item.id !== p.id));
      } else {
        const { error } = await supabase.from('productos').delete().eq('id', p.id);
        if (error) throw error;
        setProducts(prev => prev.filter(item => item.id !== p.id));
      }
      showAlert('ELIMINADO', 'Producto removido con éxito.', 'success');
    } catch {
      showAlert('ERROR', 'No se pudo eliminar de la base de datos.', 'error');
    }
  };

  // GUARDAR UNIVERSAL CORREGIDO (Sincronizado con productService)
  const guardar = async () => {
    if (!form.nombre.trim() || !form.precio || !form.categoria.trim()) {
      showAlert('CAMPOS VACÍOS', 'Nombre, precio y categoría son obligatorios.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        id: editing ? editing.id : undefined,
        id_referencia_api: editing?.id_referencia_api ?? undefined
      };

      // Si es un producto de la API que se va a editar/clonar por primera vez
      if (editing && editing.id && editing.id.toString().includes('dummy-') && !payload.id_referencia_api) {
        payload.id_referencia_api = editing.id.toString().replace('dummy-', '');
        // Limpiamos el id temporal de la API para que Supabase le genere un UUID real de base de datos
        payload.id = undefined; 
      }

      // CORRECCIÓN CLAVE: Usamos la función universal createProduct que ya tienes en tu servicio
      await productService.createProduct(payload);
      
      // Recargamos el catálogo híbrido fresco
      await cargar(); 
      
      showAlert(
        editing ? 'ACTUALIZADO' : 'CREADO', 
        editing ? 'Producto procesado y guardado en Supabase.' : 'Producto creado con éxito.', 
        'success'
      );
      setModal(false);
    } catch (e: any) {
      showAlert('ERROR', e.message ?? 'No se pudo guardar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const agregarCategoria = () => {
    const limpia = newCat.trim().toLowerCase().replace(/\s+/g, '-');
    if (!limpia) return;
    if (categories.includes(limpia)) {
      showAlert('YA EXISTE', `La categoría "${limpia}" ya está en la lista.`, 'error');
      return;
    }
    setCategories(prev => [...prev, limpia]);
    setNewCat('');
  };

  const eliminarCategoria = (cat: string) => {
    const enUso = products.some(p => p.categoria.toLowerCase() === cat);
    if (enUso) {
      showAlert(
        'CATEGORÍA EN USO',
        `"${cat}" está asignada a productos existentes. Cambia su categoría primero.`,
        'error'
      );
      return;
    }
    Alert.alert('Eliminar categoría', `¿Eliminar "${cat}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive',
        onPress: () => setCategories(prev => prev.filter(c => c !== cat)) },
    ]);
  };

  const setField = (k: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: k === 'precio' || k === 'stock' ? Number(v) : v }));

  const renderProduct = useCallback(({ item }: { item: any }) => {
    const cs = getCat(item.categoria);
    return (
      <View style={[s.card, { backgroundColor: '#FFF' }]}>
        <View style={[s.cardTop, { backgroundColor: cs.bg }]}>
          {item.imagen_url ? (
            <Image source={{ uri: item.imagen_url }} style={s.cardImg} resizeMode="contain" />
          ) : (
            <Text style={s.cardEmoji}>{cs.emoji}</Text>
          )}
          <View style={[s.accentDot, { backgroundColor: item.es_api_pura ? '#9CA3AF' : '#10B981' }]} />
        </View>
        <View style={s.cardBody}>
          <Text style={[s.cardCat, { color: cs.accent }]}>{item.categoria ? item.categoria.toUpperCase() : 'GENERAL'}</Text>
          <Text style={s.cardName} numberOfLines={1}>{item.nombre}</Text>
          <View style={s.cardFooter}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardPrice}>${item.precio}</Text>
              {item.stock !== undefined && (
                <Text style={s.cardStock}>Stock: {item.stock}</Text>
              )}
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity style={s.editBtn} onPress={() => abrirEditar(item)}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtn} onPress={() => confirmarEliminar(item)}>
                <Text>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }, [products]);

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
          <Text style={s.headerTitle}>Productos</Text>
        </View>
        <TouchableOpacity style={s.catMgrBtn} onPress={() => setCatModal(true)}>
          <Text style={s.catMgrIcon}>🏷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={abrirCrear}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar por nombre o categoría..."
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

      <Text style={s.count}>{filtered.length} productos en el inventario</Text>

      {/* Listado */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={s.loadingText}>Sincronizando catálogos híbridos masivos...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>📦</Text>
          <Text style={s.emptyText}>
            {search ? 'Sin resultados para tu búsqueda' : 'Aún no hay productos.\n¡Crea el primero!'}
          </Text>
          {!search && (
            <TouchableOpacity style={s.emptyBtn} onPress={abrirCrear}>
              <Text style={s.emptyBtnText}>+ Crear producto</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL: Crear / Editar Producto */}
      <Modal visible={modal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>
                {editing ? '✏️  Editar Producto Universal' : '📦  Nuevo Producto'}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 16 }}>
                {editing?.es_api_pura ? 'Al guardar, este producto externo de DummyJSON se clonará automáticamente en Supabase.' : 'Guardado directo en base de datos de Supabase.'}
              </Text>

              {/* Nombre */}
              <View style={s.fieldBox}>
                <Text style={s.fieldLabel}>Nombre del producto *</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="Ej. iPhone 15 Pro"
                  placeholderTextColor="#6B7280"
                  value={form.nombre}
                  onChangeText={setField('nombre')}
                />
              </View>

              {/* Categorías */}
              <View style={s.fieldBox}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.fieldLabel}>Categoría *</Text>
                </View>

                <TouchableOpacity
                  style={[s.fieldInput, s.catSelector]}
                  onPress={() => setCatOpen(o => !o)}
                  activeOpacity={0.8}
                >
                  {form.categoria ? (
                    <View style={s.catSelectedRow}>
                      <Text style={s.catSelectedEmoji}>{getCat(form.categoria).emoji}</Text>
                      <Text style={s.catSelectedText}>{form.categoria}</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#6B7280', fontSize: 15 }}>Selecciona una categoría...</Text>
                  )}
                  <Text style={{ color: '#9CA3AF' }}>{catOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {catOpen && (
                  <View style={s.dropdown}>
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                      {categories.map(cat => {
                        const cs = getCat(cat);
                        const selected = form.categoria === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[s.dropItem, selected && { backgroundColor: cs.bg }]}
                            onPress={() => {
                              setField('categoria')(cat);
                              setCatOpen(false);
                            }}
                          >
                            <Text style={s.dropEmoji}>{cs.emoji}</Text>
                            <Text style={[s.dropText, selected && { color: cs.accent, fontWeight: '800' }]}>
                              {cat}
                            </Text>
                            {selected && <Text style={{ color: cs.accent, marginLeft: 'auto' }}>✓</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Precio y Stock */}
              <View style={s.row}>
                <View style={[s.fieldBox, { flex: 1, marginRight: 10 }]}>
                  <Text style={s.fieldLabel}>Precio (USD) *</Text>
                  <TextInput
                    style={s.fieldInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={String(form.precio || '')}
                    onChangeText={setField('precio')}
                  />
                </View>
                <View style={[s.fieldBox, { flex: 1 }]}>
                  <Text style={s.fieldLabel}>Stock</Text>
                  <TextInput
                    style={s.fieldInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={String(form.stock || '')}
                    onChangeText={setField('stock')}
                  />
                </View>
              </View>

              {/* URL Imagen */}
              <View style={s.fieldBox}>
                <Text style={s.fieldLabel}>URL de imagen</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  placeholderTextColor="#6B7280"
                  keyboardType="url"
                  autoCapitalize="none"
                  value={form.imagen_url}
                  onChangeText={setField('imagen_url')}
                />

                {form.imagen_url.trim().length > 10 && (
                  <View style={s.imgPreviewBox}>
                    {!imgOk && (
                      <View style={s.imgPreviewPlaceholder}>
                        <ActivityIndicator color="#4F46E5" size="small" />
                        <Text style={s.imgPreviewHint}>Cargando preview...</Text>
                      </View>
                    )}
                    <Image
                      source={{ uri: form.imagen_url }}
                      style={[s.imgPreview, !imgOk && { position: 'absolute', opacity: 0 }]}
                      resizeMode="contain"
                      onLoad={() => setImgOk(true)}
                      onError={() => setImgOk(false)}
                    />
                    {imgOk && (
                      <View style={s.imgPreviewBadge}>
                        <Text style={s.imgPreviewBadgeText}>✓ Imagen válida</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Descripción */}
              <View style={s.fieldBox}>
                <Text style={s.fieldLabel}>Descripción</Text>
                <TextInput
                  style={[s.fieldInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Descripción breve del producto..."
                  placeholderTextColor="#6B7280"
                  multiline
                  value={form.descripcion}
                  onChangeText={setField('descripcion')}
                />
              </View>

              {/* Acciones */}
              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)} disabled={saving}>
                  <Text style={s.cancelBtnText}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={guardar} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={s.saveBtnText}>GUARDAR EN SUPABASE</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL CATEGORÍAS */}
      <Modal visible={catModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { maxHeight: '85%' }]}>
            <View style={s.modalHandle} />
            <View style={s.catMgrHeader}>
              <Text style={s.modalTitle}>🏷  Categorías</Text>
              <TouchableOpacity onPress={() => setCatModal(false)}>
                <Text style={{ color: '#9CA3AF', fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.catMgrSub}>
              {categories.length} categorías · Las que están en uso no se pueden eliminar
            </Text>

            <View style={s.newCatRow}>
              <TextInput
                style={s.newCatInput}
                placeholder="nueva-categoria"
                placeholderTextColor="#6B7280"
                value={newCat}
                onChangeText={setNewCat}
                autoCapitalize="none"
                onSubmitEditing={agregarCategoria}
              />
              <TouchableOpacity
                style={[s.newCatBtn, !newCat.trim() && { opacity: 0.4 }]}
                onPress={agregarCategoria}
                disabled={!newCat.trim()}
              >
                <Text style={s.newCatBtnText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.catHint}>Los espacios se convierten automáticamente en guiones</Text>

            <ScrollView style={s.catList} showsVerticalScrollIndicator={false}>
              {categories.map(cat => {
                const cs = getCat(cat);
                const enUso = products.some(p => p.categoria.toLowerCase() === cat);
                return (
                  <View key={cat} style={s.catItem}>
                    <View style={[s.catItemDot, { backgroundColor: cs.bg, borderColor: cs.accent }]}>
                      <Text style={{ fontSize: 14 }}>{cs.emoji}</Text>
                    </View>
                    <Text style={s.catItemText}>{cat}</Text>
                    {enUso && (
                      <View style={s.catInUseBadge}>
                        <Text style={s.catInUseText}>en uso</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[s.catDelBtn, enUso && { opacity: 0.3 }]}
                      onPress={() => eliminarCategoria(cat)}
                    >
                      <Text style={s.catDelBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.msg}
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
  catMgrBtn:       { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  catMgrIcon:      { fontSize: 20 },
  addBtn:          { width: 42, height: 42, borderRadius: 12, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  addBtnText:      { color: '#FFF', fontSize: 26, lineHeight: 30 },
  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, borderRadius: 16, paddingHorizontal: 14, elevation: 2 },
  searchIcon:      { fontSize: 16, marginRight: 8 },
  searchInput:     { flex: 1, paddingVertical: 14, color: '#111827', fontSize: 15 },
  count:           { paddingHorizontal: 20, color: '#6B7280', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  list:            { paddingHorizontal: 10, paddingBottom: 40 },
  card:            { width: (width / 2) - 20, margin: 8, borderRadius: 22, overflow: 'hidden', elevation: 3 },
  cardTop:         { height: 110, justifyContent: 'center', alignItems: 'center' },
  cardImg:         { width: '85%', height: '85%' },
  cardEmoji:       { fontSize: 36 },
  accentDot:       { position: 'absolute', top: 10, right: 10, width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#FFF' },
  cardBody:        { padding: 12 },
  cardCat:         { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  cardName:        { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 6 },
  cardFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardPrice:       { fontSize: 17, fontWeight: '900', color: '#111827' },
  cardStock:       { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  cardActions:     { flexDirection: 'row', gap: 6 },
  editBtn:         { width: 30, height: 30, borderRadius: 9, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  delBtn:          { width: 30, height: 30, borderRadius: 9, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText:     { marginTop: 12, color: '#6B7280', fontWeight: '600' },
  emptyText:       { color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 22 },
  emptyBtn:        { marginTop: 20, backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText:    { color: '#FFF', fontWeight: '800', fontSize: 15 },
  modalOverlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet:      { backgroundColor: '#111827', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '92%' },
  modalHandle:     { width: 44, height: 4, backgroundColor: '#374151', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:      { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  row:             { flexDirection: 'row' },
  fieldBox:        { marginBottom: 16 },
  fieldLabelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel:      { color: '#9CA3AF', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
  fieldInput:      { backgroundColor: '#1F2937', borderRadius: 14, padding: 14, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#374151' },
  catSelector:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catSelectedRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catSelectedEmoji:{ fontSize: 18 },
  catSelectedText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  dropdown:        { backgroundColor: '#1F2937', borderRadius: 14, borderWidth: 1, borderColor: '#374151', marginTop: 4, overflow: 'hidden' },
  dropItem:        { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: '#374151' },
  dropEmoji:       { fontSize: 18, width: 28, textAlign: 'center' },
  dropText:        { color: '#D1D5DB', fontSize: 14, flex: 1 },
  imgPreviewBox:         { marginTop: 10, backgroundColor: '#1F2937', borderRadius: 14, overflow: 'hidden', height: 160, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  imgPreviewPlaceholder: { alignItems: 'center', gap: 8 },
  imgPreviewHint:        { color: '#6B7280', fontSize: 12 },
  imgPreview:            { width: '100%', height: '100%' },
  imgPreviewBadge:       { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#065F46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  imgPreviewBadgeText:   { color: '#6EE7B7', fontSize: 11, fontWeight: '700' },
  modalActions:    { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelBtn:       { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#374151', alignItems: 'center' },
  cancelBtnText:   { color: '#9CA3AF', fontWeight: '700' },
  saveBtn:         { flex: 1.5, padding: 16, borderRadius: 14, backgroundColor: '#4F46E5', alignItems: 'center' },
  saveBtnText:     { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  catMgrHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catMgrSub:       { color: '#6B7280', fontSize: 12, marginBottom: 16 },
  newCatRow:       { flexDirection: 'row', gap: 10, marginBottom: 4 },
  newCatInput:     { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#FFF', fontSize: 14, borderWidth: 1, borderColor: '#374151' },
  newCatBtn:       { backgroundColor: '#4F46E5', paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  newCatBtnText:   { color: '#FFF', fontWeight: '800', fontSize: 13 },
  catHint:         { color: '#4B5563', fontSize: 11, marginBottom: 16 },
  catList:         { maxHeight: 380 },
  catItem:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1F2937', gap: 10 },
  catItemDot:      { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  catItemText:     { flex: 1, color: '#D1D5DB', fontSize: 14, fontWeight: '600' },
  catInUseBadge:   { backgroundColor: '#064E3B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catInUseText:    { color: '#6EE7B7', fontSize: 10, fontWeight: '700' },
  catDelBtn:       { width: 32, height: 32, borderRadius: 9, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  catDelBtnText:   { fontSize: 14 },
});