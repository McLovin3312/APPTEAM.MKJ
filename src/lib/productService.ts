import { supabase } from './supabase';

const DUMMY_API_URL = 'https://dummyjson.com/products';

export interface Product {
  id?: string;
  nombre: string;
  precio: number;
  categoria: string;
  descripcion?: string;
  imagen_url?: string;
  stock?: number;
  activo?: boolean;
}

export const productService = {

  // ─── Tienda: productos externos (DummyJSON) ─────────────────
  async getDummyProducts() {
    try {
      const response = await fetch(DUMMY_API_URL);
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error('Error trayendo productos dummy:', error);
      return [];
    }
  },

  // ─── Admin: CRUD en Supabase ─────────────────────────────────

  async getAll() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(product: Omit<Product, 'id'>) {
    const { data, error } = await supabase
      .from('productos')
      .insert([{ ...product, activo: true }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('productos')
      .update(product)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};