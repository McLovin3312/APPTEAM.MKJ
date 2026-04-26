import { supabase } from './supabaseClient';

export const authService = {
  /**
   * Registro de Usuario:
   * Envía los datos a auth.users y el Trigger automático llena la tabla perfiles.
   */
  async signUp(email: string, pass: string, userData: { nombre: string, apellido: string, telefono: string }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          nombre: userData.nombre,
          apellido: userData.apellido,
          telefono: userData.telefono,
          es_admin: false // Por defecto es usuario normal
        }
      }
    });

    if (error) throw error;
    return data;
  },

  /**
   * Login:
   * Al haber desactivado "Confirm email", el acceso será inmediato tras el registro.
   */
  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Cerrar Sesión:
   * Elimina la sesión activa del cliente y del servidor de Supabase.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};