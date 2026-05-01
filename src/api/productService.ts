import { supabase } from './supabaseClient';

// URL de la API de productos de prueba (DummyJSON)
const DUMMY_API_URL = 'https://dummyjson.com/products';

export const productService = {
  // 1. Obtener productos de la API Dummy (Para llenar la tienda rápido)
  async getDummyProducts() {
    try {
      const response = await fetch(DUMMY_API_URL);
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error("Error trayendo productos dummy:", error);
      return [];
    }
  },

  // 2. CRUD: Leer productos propios desde tu Supabase
  async getMyProducts() {
    const { data, error } = await supabase
      .from('productos') // Asegúrate de que tu tabla en Supabase se llame así
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // 3. CRUD: Crear un nuevo producto (Función de ADMIN)
  async createProduct(nuevoProducto: any) {
    const { data, error } = await supabase
      .from('productos')
      .insert([nuevoProducto]);
    
    if (error) throw error;
    return data;
  }
};