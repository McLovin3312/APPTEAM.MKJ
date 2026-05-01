import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

const OPCIONES = [
  { label: "Clientes",  desc: "Gestiona tus clientes",   screen: "Clientes"  },
  { label: "Productos", desc: "Gestiona tus productos",  screen: "Productos" },
  { label: "Compras",   desc: "Registrar una compra",    screen: "Compra"    },

];

const MenuScreen = ({ navigation, route }: Props) => {
  const { email } = route.params as { email: string };
  const nombre = email.split("@")[0];
  const [modalSalir, setModalSalir] = useState(false);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("sesion");
    navigation.replace("Login");
  };

  return (
    <View style={s.container}>

      <View style={s.header}>
        <View>
          <Text style={s.saludo}>Bienvenido </Text>
          <Text style={s.nombre}>{nombre}</Text>
        </View>
        <TouchableOpacity style={s.btnSalir} onPress={() => setModalSalir(true)}>
          <Text style={s.btnSalirText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={s.sesionCard}>
        <Text style={s.sesionLabel}>Sesión activa</Text>
        <Text style={s.sesionEmail}>{email}</Text>
      </View>

      <Text style={s.seccion}>Módulos</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.grid}>
          {OPCIONES.map((op) => (
            <TouchableOpacity key={op.screen} style={s.card}
              onPress={() => navigation.navigate(op.screen)} activeOpacity={0.75}>

              <Text style={s.cardLabel}>{op.label}</Text>
              <Text style={s.cardDesc}>{op.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalSalir} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>¿Cerrar sesión?</Text>
            <Text style={s.modalSub}>Tendrás que volver a iniciar sesión.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnSec} onPress={() => setModalSalir(false)}>
                <Text style={s.btnSecText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPri} onPress={handleLogout}>
                <Text style={s.btnPriText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#1a1a1a" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, backgroundColor: "#222", borderBottomWidth: 1, borderColor: "#333" },
  saludo:       { fontSize: 13, color: "#888" },
  nombre:       { fontSize: 22, fontWeight: "800", color: "#f0f0f0", marginTop: 2 },
  btnSalir:     { borderWidth: 1, borderColor: "#444", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  btnSalirText: { color: "#aaa", fontWeight: "600", fontSize: 13 },
  sesionCard:   { marginHorizontal: 20, marginTop: 16, backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#333", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sesionLabel:  { fontSize: 12, color: "#666", fontWeight: "600" },
  sesionEmail:  { fontSize: 13, color: "#f0f0f0", fontWeight: "500" },
  seccion:      { fontSize: 13, fontWeight: "700", color: "#666", marginTop: 20, marginBottom: 12, marginHorizontal: 20, textTransform: "uppercase", letterSpacing: 1 },
  grid:         { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 10 },
  card:         { width: "47%", backgroundColor: "#2a2a2a", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#333" },
  cardIcono:    { fontSize: 28, marginBottom: 10 },
  cardLabel:    { fontSize: 15, fontWeight: "700", color: "#f0f0f0", marginBottom: 4 },
  cardDesc:     { fontSize: 11, color: "#666" },
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modal:        { backgroundColor: "#2a2a2a", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#333" },
  modalTitle:   { fontSize: 18, fontWeight: "700", color: "#f0f0f0", marginBottom: 6 },
  modalSub:     { fontSize: 13, color: "#888", marginBottom: 20 },
  modalBtns:    { flexDirection: "row", gap: 10 },
  btnSec:       { flex: 1, borderWidth: 1, borderColor: "#444", borderRadius: 10, padding: 12, alignItems: "center" },
  btnSecText:   { color: "#aaa", fontWeight: "600" },
  btnPri:       { flex: 1, backgroundColor: "#f0f0f0", borderRadius: 10, padding: 12, alignItems: "center" },
  btnPriText:   { color: "#1a1a1a", fontWeight: "700" },
});

export default MenuScreen;