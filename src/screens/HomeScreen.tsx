import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { productService } from '../api/productService';
import { authService } from '../api/authService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getDummyProducts();
      const sanitizedData = data.map((item: any, index: number) => ({
        ...item,
        id: item.id ? item.id.toString() : `temp-${index}-${Math.random()}`,
        title: item.title || 'Producto sin nombre',
        price: item.price || 0,
        category: item.category || 'General',
        thumbnail: item.thumbnail || 'https://via.placeholder.com/150'
      }));
      setProducts(sanitizedData);
    } catch (error) {
      console.error("Error crítico en Home:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres salir de ManyShop?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive",
          onPress: async () => {
            try {
              await authService.signOut();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert("Error", "No se pudo cerrar la sesión");
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.image} />
        <View style={styles.tag}>
          <Text style={styles.tagText}>⭐ {item.rating || '5.0'}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${item.price}</Text>
          <View style={styles.addBtn}><Text style={styles.addBtnText}>+</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loaderText}>Cargando MANYSHOP...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>¡Hola de nuevo!</Text>
          <Text style={styles.title}>Explorar</Text>
        </View>
        <TouchableOpacity style={styles.profileCircle} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout-variant" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        {['Todos', 'Tech', 'Moda', 'Hogar'].map((label, idx) => (
          <View key={idx} style={[styles.chip, idx === 0 && styles.chipActive]}>
            <Text style={[styles.chipText, idx === 0 && styles.chipTextActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loaderText: { marginTop: 15, color: '#666', fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  welcome: { fontSize: 14, color: '#AAA', fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  profileCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  chipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '700' },
  chipTextActive: { color: '#FFF' },
  listContent: { paddingHorizontal: 10, paddingBottom: 30 },
  card: { backgroundColor: '#FFF', width: (width / 2) - 20, margin: 8, borderRadius: 24, padding: 12, elevation: 3 },
  imageContainer: { width: '100%', height: 130, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 12 },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
  tag: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '800' },
  info: { paddingHorizontal: 2 },
  category: { fontSize: 10, color: '#007AFF', fontWeight: '800', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 18, fontWeight: '900' },
  addBtn: { backgroundColor: '#1A1A1A', width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#FFF', fontSize: 18 }
});