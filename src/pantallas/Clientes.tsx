import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";

type Cliente = { id: number; nombre: string; apellido: string; correo: string; fecha: string };
type Form    = Omit<Cliente, "id">;

const VACIO: Form = { nombre: "", apellido: "", correo: "", fecha: "" };

const Campo = ({ label, value, onChange, error, ...props }: any) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={[s.input, error && s.inputErr]} value={value} onChangeText={onChange}
      placeholderTextColor="#666" autoCapitalize="none" {...props} />
    {error ? <Text style={s.err}>{error}</Text> : null}
  </View>
);

const Fila = ({ label, valor }: { label: string; valor: string }) => (
  <View style={s.infoFila}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValor}>{valor}</Text>
  </View>
);

type TarjetaProps = {
  item: Cliente;
  onVer: () => void;
  onEditar: () => void;
  onEliminar: () => void;
};

const Tarjeta = ({ item, onVer, onEditar, onEliminar }: TarjetaProps) => (
  <View style={s.card}>
    <View style={{ flex: 1 }}>
      <Text style={s.cardNombre}>{item.nombre} {item.apellido}</Text>
      <Text style={s.cardSub}>{item.correo}</Text>
    </View>
    <View>
      <TouchableOpacity style={s.btnAccion} onPress={onVer}>
        <Text style={s.btnAccionText}>Ver</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnAccion} onPress={onEditar}>
        <Text style={s.btnAccionText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnAccion} onPress={onEliminar}>
        <Text style={s.btnAccionText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ClientesScreen = ({ navigation }: { navigation: any }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form,     setForm]     = useState<Form>(VACIO);
  const [editId,   setEditId]   = useState<number | null>(null);
  const [modal,    setModal]    = useState<"form" | "ver" | "confirmar" | null>(null);
  const [detalle,  setDetalle]  = useState<Cliente | null>(null);
  const [errores,  setErrores]  = useState<Partial<Form>>({});
  const [elimId,   setElimId]   = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase.from("cliente").select("*").order("id");
    if (data) setClientes(data);
    setCargando(false);
  };

  const set = (k: keyof Form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const validar = () => {
    const e: Partial<Form> = {};
    if (!form.nombre.trim())   e.nombre   = "Obligatorio";
    if (!form.apellido.trim()) e.apellido = "Obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = "Correo inválido";
    if (!form.fecha.trim())    e.fecha    = "Obligatorio";
    setErrores(e);
    return !Object.keys(e).length;
  };

  const abrirCrear = () => { setForm(VACIO); setEditId(null); setErrores({}); setModal("form"); };

  const abrirEditar = (c: Cliente) => {
    setForm({ nombre: c.nombre, apellido: c.apellido, correo: c.correo, fecha: c.fecha });
    setEditId(c.id); setErrores({}); setModal("form");
  };

  const guardar = async () => {
    if (!validar()) return;
    setCargando(true);
    if (editId) {
      await supabase.from("cliente").update(form).eq("id", editId);
    } else {
      await supabase.from("cliente").insert(form);
    }
    await cargar();
    setModal(null);
  };

  const confirmarEliminar = (id: number) => { setElimId(id); setModal("confirmar"); };

  const eliminar = async () => {
    setCargando(true);
    await supabase.from("cliente").delete().eq("id", elimId);
    await cargar();
    setModal(null); setElimId(null);
  };

  return (
    <View style={s.container}>

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.btnVolver}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Clientes</Text>
        <TouchableOpacity style={s.btnNuevo} onPress={abrirCrear}>
          <Text style={s.btnNuevoText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {cargando
        ? <ActivityIndicator color="#f0f0f0" style={{ marginTop: 60 }} />
        : clientes.length === 0
          ? <Text style={s.vacio}>No hay clientes registrados.</Text>
          : <FlatList data={clientes} keyExtractor={c => String(c.id)}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Tarjeta item={item}
                  onVer={() => { setDetalle(item); setModal("ver"); }}
                  onEditar={() => abrirEditar(item)}
                  onEliminar={() => confirmarEliminar(item.id)}
                />
              )}
            />
      }

      <Modal visible={modal === "form"} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{editId ? "Editar cliente" : "Nuevo cliente"}</Text>
            <Campo label="Nombre"   value={form.nombre}   onChange={set("nombre")}   error={errores.nombre}   placeholder="Nombre" />
            <Campo label="Apellido" value={form.apellido} onChange={set("apellido")} error={errores.apellido} placeholder="Apellido" />
            <Campo label="Correo"   value={form.correo}   onChange={set("correo")}   error={errores.correo}   placeholder="correo@ejemplo.com" keyboardType="email-address" />
            <Campo label="Fecha"    value={form.fecha}    onChange={set("fecha")}    error={errores.fecha}    placeholder="DD/MM/AAAA" />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnSec} onPress={() => setModal(null)}>
                <Text style={s.btnSecText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPri} onPress={guardar}>
                <Text style={s.btnPriText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === "ver"} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Info del cliente</Text>
            {detalle && <>
              <Fila label="ID"       valor={String(detalle.id)} />
              <Fila label="Nombre"   valor={detalle.nombre} />
              <Fila label="Apellido" valor={detalle.apellido} />
              <Fila label="Correo"   valor={detalle.correo} />
              <Fila label="Fecha"    valor={detalle.fecha} />
            </>}
            <TouchableOpacity style={[s.btnPri, { marginTop: 20 }]} onPress={() => setModal(null)}>
              <Text style={s.btnPriText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === "confirmar"} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>¿Eliminar cliente?</Text>
            <Text style={{ color: "#aaa", marginBottom: 20 }}>Esta acción no se puede deshacer.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnSec} onPress={() => setModal(null)}>
                <Text style={s.btnSecText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPri} onPress={eliminar}>
                <Text style={s.btnPriText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#1a1a1a" },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 50, backgroundColor: "#222", borderBottomWidth: 1, borderColor: "#333" },
  headerTitle:   { fontSize: 20, fontWeight: "700", color: "#f0f0f0" },
  btnVolver:     { color: "#aaa", fontSize: 14, fontWeight: "600" },
  btnNuevo:      { backgroundColor: "#f0f0f0", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  btnNuevoText:  { color: "#1a1a1a", fontWeight: "700", fontSize: 14 },
  vacio:         { textAlign: "center", color: "#555", marginTop: 60, fontSize: 14 },
  card:          { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#333" },
  cardNombre:    { fontSize: 15, fontWeight: "700", color: "#f0f0f0" },
  cardSub:       { fontSize: 12, color: "#777", marginTop: 2 },
  btnAccion:     { borderWidth: 1, borderColor: "#444", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#333", marginBottom: 4 },
  btnAccionText: { color: "#ccc", fontWeight: "600", fontSize: 12 },
  overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modal:         { backgroundColor: "#2a2a2a", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#333" },
  modalTitle:    { fontSize: 18, fontWeight: "700", color: "#f0f0f0", marginBottom: 16 },
  label:         { fontSize: 12, fontWeight: "600", color: "#aaa", marginBottom: 4 },
  input:         { borderWidth: 1, borderColor: "#444", borderRadius: 9, padding: 11, fontSize: 14, color: "#f0f0f0", backgroundColor: "#333" },
  inputErr:      { borderColor: "#e74c3c" },
  err:           { color: "#e74c3c", fontSize: 11, marginTop: 2 },
  modalBtns:     { flexDirection: "row", gap: 10, marginTop: 16 },
  btnSec:        { flex: 1, borderWidth: 1, borderColor: "#444", borderRadius: 10, padding: 12, alignItems: "center" },
  btnSecText:    { color: "#aaa", fontWeight: "600" },
  btnPri:        { flex: 1, backgroundColor: "#f0f0f0", borderRadius: 10, padding: 12, alignItems: "center" },
  btnPriText:    { color: "#1a1a1a", fontWeight: "700" },
  infoFila:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#333" },
  infoLabel:     { fontSize: 13, color: "#777", fontWeight: "600" },
  infoValor:     { fontSize: 13, color: "#f0f0f0", flexShrink: 1, textAlign: "right" },
});

export default ClientesScreen;