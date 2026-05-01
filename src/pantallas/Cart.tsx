import React, { useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../Context/CartContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: any) => (
    <View style={s.card}>
      <Image source={{ uri: item.thumbnail }} style={s.img} />
      <View style={s.info}>
        <Text style={s.category}>{item.category?.toUpperCase()}</Text>
        <Text style={s.name} numberOfLines={2}>{item.title}</Text>
        <Text style={s.price}>${item.price}</Text>
      </View>
      <View style={s.qtyBox}>
        <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.id, item.quantity - 1)}>
          <Text style={s.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.qty}>{item.quantity}</Text>
        <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.id, item.quantity + 1)}>
          <Text style={s.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.delBtn} onPress={() => removeItem(item.id)}>
          <Text style={s.delBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (items.length === 0) return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mi Carrito</Text>
      </View>
      <View style={s.empty}>
        <Text style={{ fontSize: 64 }}>🛒</Text>
        <Text style={s.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={s.emptySubtitle}>Agrega productos desde la tienda</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Mi Carrito</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={s.clearText}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Resumen */}
      <View style={s.summary}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</Text>
          <Text style={s.summaryValue}>${total.toFixed(2)}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Envío</Text>
          <Text style={[s.summaryValue, { color: '#10B981' }]}>Gratis</Text>
        </View>
        <View style={[s.summaryRow, s.totalRow]}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={s.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={s.checkoutBtnText}>PROCEDER AL PAGO →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FB' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle:    { fontSize: 24, fontWeight: '900', color: '#111827' },
  clearText:      { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  list:           { padding: 16, paddingBottom: 8 },
  card:           { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 12, marginBottom: 12, elevation: 2, gap: 12, alignItems: 'center' },
  img:            { width: 72, height: 72, borderRadius: 14, backgroundColor: '#F3F4F6', resizeMode: 'contain' },
  info:           { flex: 1 },
  category:       { fontSize: 10, color: '#4F46E5', fontWeight: '800', marginBottom: 2 },
  name:           { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  price:          { fontSize: 16, fontWeight: '900', color: '#111827' },
  qtyBox:         { alignItems: 'center', gap: 6 },
  qtyBtn:         { width: 28, height: 28, borderRadius: 9, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText:     { fontSize: 18, color: '#111827', fontWeight: '700', lineHeight: 22 },
  qty:            { fontSize: 16, fontWeight: '900', color: '#111827', minWidth: 20, textAlign: 'center' },
  delBtn:         { width: 28, height: 28, borderRadius: 9, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  delBtnText:     { fontSize: 14 },
  summary:        { backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 20 },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel:   { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  summaryValue:   { color: '#111827', fontSize: 14, fontWeight: '700' },
  totalRow:       { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 4 },
  totalLabel:     { fontSize: 18, fontWeight: '900', color: '#111827' },
  totalValue:     { fontSize: 22, fontWeight: '900', color: '#111827' },
  checkoutBtn:    { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 14 },
  checkoutBtnText:{ color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  empty:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle:     { fontSize: 22, fontWeight: '900', color: '#111827' },
  emptySubtitle:  { fontSize: 15, color: '#9CA3AF' },
});