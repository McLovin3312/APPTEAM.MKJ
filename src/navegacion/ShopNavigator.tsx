import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeShopScreen from '../pantallas/HomeShop';
import CartScreen     from '../pantallas/Cart';
import MyOrdersScreen from '../pantallas/MyOrders';
import ProfileScreen  from '../pantallas/Profile';
import { useCart }    from '../Context/CartContext';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, label, focused, badge }: {
  emoji: string; label: string; focused: boolean; badge?: number;
}) => (
  <View style={ti.wrap}>
    <View style={[ti.iconBox, focused && ti.iconBoxActive]}>
      <Text style={ti.emoji}>{emoji}</Text>
      {badge && badge > 0 ? (
        <View style={ti.badge}>
          <Text style={ti.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </View>
    <Text style={[ti.label, focused && ti.labelActive]}>{label}</Text>
  </View>
);

const ti = StyleSheet.create({
  wrap:          { alignItems: 'center', paddingTop: 6 },
  iconBox:       { width: 44, height: 30, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconBoxActive: { backgroundColor: '#EEF2FF' },
  emoji:         { fontSize: 22 },
  label:         { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginTop: 2 },
  labelActive:   { color: '#4F46E5' },
  badge:         { position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeText:     { color: '#FFF', fontSize: 9, fontWeight: '900' },
});

export const ShopNavigator = ({ navigation }: any) => {
  const { count } = useCart();

  // Pasamos la función logout como initialParam al tab de Perfil
  const handleLogout = async () => {
  console.log('navigation keys:', Object.keys(navigation));
  console.log('getParent:', navigation.getParent?.());
  console.log('state:', JSON.stringify(navigation.getState?.()));
};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 72,
          paddingBottom: 8,
          elevation: 20,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Tienda"
        component={HomeShopScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Tienda" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Carrito"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛒" label="Carrito" focused={focused} badge={count} />
          ),
        }}
      />
      <Tab.Screen
        name="MisPedidos"
        component={MyOrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📦" label="Pedidos" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Perfil" focused={focused} />
          ),
        }}
      >
        {() => <ProfileScreen onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};