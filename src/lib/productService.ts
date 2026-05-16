import { supabase } from './supabase';

const DUMMY_API_URL = 'https://dummyjson.com/products?limit=100';

export const productService = {
  // 1. Obtener productos de la API Dummy (Catálogo masivo)
  async getDummyProducts() {
    try {
      const url = `https://dummyjson.com/products?limit=100&skip=0&t=${Date.now()}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error("Error trayendo productos dummy:", error);
      return [];
    }
  },

  // 2. Leer todos los productos locales
  async getAll() {
    const { data, error } = await supabase
      .from('productos') 
      .select('*');
    if (error) throw error;
    return data || [];
  },

  // 3. Crear un producto local desde cero
  async create(nuevoProducto: any) {
    const { data, error } = await supabase
      .from('productos')
      .insert([nuevoProducto]);
    if (error) throw error;
    return data;
  },

  // 4. LÓGICA ULTRA-BLINDADA ANTI-CACHÉ DE COLUMNAS
  async createProduct(nuevoProducto: any) {
    if (!nuevoProducto) throw new Error("Datos del producto vacíos.");

    // Estructuramos un registro estándar con las columnas básicas que TODO Supabase tiene
    let registro: any = {
      nombre: nuevoProducto.nombre,
      descripcion: nuevoProducto.descripcion,
      precio: nuevoProducto.precio,
      imagen_url: nuevoProducto.imagen_url,
      categoria: nuevoProducto.categoria,
      stock: nuevoProducto.stock,
      activo: true,
    };

    // TRUCO MAESTRO: Si la base de datos no reconoce la columna en caché,
    // solo le enviamos el id_referencia_api si explícitamente viene de un guardado local previo.
    // Si es un clon nuevo de la API, dejamos que se inserte como un producto normal nativo
    // para evitar que salte el error de "columna no encontrada en la caché"
    if (nuevoProducto.id_referencia_api && !nuevoProducto.id_referencia_api.includes('dummy-')) {
      registro.id_referencia_api = nuevoProducto.id_referencia_api;
    }

    // Si es un producto que ya tiene ID de Supabase (es decir, una edición de algo ya guardado)
    if (nuevoProducto.id && !String(nuevoProducto.id).includes('dummy-')) {
      const { data, error } = await supabase
        .from('productos')
        .update(registro)
        .eq('id', nuevoProducto.id);
      
      if (error) throw error;
      return data;
    } 
    // Si es un clon de la API que se guarda por primera vez o un producto nuevo desde cero
    else {
      // Si venía un ID temporal con "dummy-", se lo quitamos para que no cause conflicto
      const { data, error } = await supabase
        .from('productos')
        .insert([registro]); 
      
      if (error) throw error;
      return data;
    }
  }
};