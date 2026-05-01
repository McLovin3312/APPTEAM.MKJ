import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen         from '../pantallas/Login';
import RegisterScreen      from '../pantallas/Register';
import AdminScreen         from '../pantallas/Admin';
import AdminProductsScreen from '../pantallas/AdminProducts';
import AdminClientsScreen  from '../pantallas/AdminClients';
import AdminOrdersScreen   from '../pantallas/AdminOrders';
import AdminReportsScreen  from '../pantallas/AdminReports';
import CheckoutScreen      from '../pantallas/Chekout';
import { ShopNavigator }   from './ShopNavigator';
import { CartProvider }    from '../Context/CartContext';


const Stack = createNativeStackNavigator();

export const StackNavigator = () => {
  const navRef = useRef<NavigationContainerRef<any>>(null);

  const logout = () => {
    navRef.current?.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  return (
    
      <CartProvider>
        <NavigationContainer ref={navRef}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login"         component={LoginScreen}         />
            <Stack.Screen name="Register"      component={RegisterScreen}      />
            <Stack.Screen name="HomeShop"      component={ShopNavigator}       />
            <Stack.Screen name="Checkout"      component={CheckoutScreen}      />
            <Stack.Screen name="Admin"         component={AdminScreen}         />
            <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
            <Stack.Screen name="AdminClients"  component={AdminClientsScreen}  />
            <Stack.Screen name="AdminOrders"   component={AdminOrdersScreen}   />
            <Stack.Screen name="AdminReports"  component={AdminReportsScreen}  />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    
  );
};