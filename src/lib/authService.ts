import { supabase } from '../lib/supabase';

export const authService = {

  async signUp(email: string, pass: string, userData: { nombre: string; apellido: string; telefono: string }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          nombre:    userData.nombre,
          apellido:  userData.apellido,
          telefono:  userData.telefono,
          es_admin:  false,
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};