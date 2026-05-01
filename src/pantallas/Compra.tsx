import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";

type Cliente  = { id: number; nombre: string; apellido: string; correo: string; fecha: string };
type Producto = { id: number; nombre: string; descripcion: string; valor_unitario: number; stock: number };

type DetalleCompra = {
  id_producto: number;
  nombreProducto: string;
  cantidad: number;
  valor: number;
  subtotal: number;
};

type Props = { navigation: any };

const formatCOP = (valor: number) => `$${valor.toLocaleString("es-CO")} COP`;

type FilaProps = {
  item: DetalleCompra;
  stockDisponible: number;
  onSumar: () => void;
  onRestar: () => void;
  onQuitar: () => void;
};

const FilaDetalle = ({ item, stockDisponible, onSumar, onRestar, onQuitar }: FilaProps) => (
  <View style={s.filaDetalle}>
    <View style={{ flex: 1 }}>
      <Text style={s.filaProducto}>{item.nombreProducto}</Text>
      <Text style={s.filaSub}>{formatCOP(item.valor)} c/u</Text>
    </View>
    <View style={s.cantidadRow}>
      <TouchableOpacity style={s.btnCantidad} onPress={onRestar}>
        <Text style={s.btnCantidadText}>−</Text>
      </TouchableOpacity>
      <Text style={s.cantidadNum}>{item.cantidad}</Text>
      <TouchableOpacity
        style={[s.btnCantidad, stockDisponible <= 0 && s.btnCantidadDis]}
        onPress={onSumar} disabled={stockDisponible <= 0}>
        <Text style={s.btnCantidadText}>+</Text>
      </TouchableOpacity>
    </View>
    <Text style={s.filaSubtotal}>{formatCOP(item.subtotal)}</Text>
    <TouchableOpacity style={s.btnQuitar} onPress={onQuitar}>
      <Text style={s.btnQuitarText}>✕</Text>
    </TouchableOpacity>
  </View>
);

const CompraScreen = ({ navigation }: Props) => {
  const [clientes,      setClientes]      = useState<Cliente[]>([]);
  const [productos,     setProductos]     = useState<Producto[]>([]);
  const [clienteSelec,  setClienteSelec]  = useState<Cliente | null>(null);
  const [detalles,      setDetalles]      = useState<DetalleCompra[]>([]);
  const [stockLocal,    setStockLocal]    = useState<Record<number, number>>({});
  const [descuento,     setDescuento]     = useState("");
  const [modalCliente,  setModalCliente]  = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalResumen,  setModalResumen]  = useState(false);
  const [modalError,    setModalError]    = useState("");
  const [cargando,      setCargando]      = useState(false);
  const [guardando,     setGuardando]     = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setCargando(true);
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("cliente").select("*").order("id"),
      supabase.from("producto").select("*").order("id"),
    ]);
    if (c) setClientes(c);
    if (p) {
      setProductos(p);
      setStockLocal(Object.fromEntries(p.map((x: Producto) => [x.id, x.stock])));
    }
    setCargando(false);
  };

  const subTotal       = detalles.reduce((acc, d) => acc + d.subtotal, 0);
  const pctDescuento   = Math.min(Math.max(Number(descuento) || 0, 0), 100);
  const descuentoTotal = Math.round(subTotal * pctDescuento / 100);
  const total          = subTotal - descuentoTotal;

  const agregarProducto = (p: Producto) => {
    if (stockLocal[p.id] <= 0) { setModalError("Sin stock disponible."); return; }
    setDetalles(prev => {
      const existe = prev.find(d => d.id_producto === p.id);
      if (existe) return prev.map(d => d.id_producto === p.id
        ? { ...d, cantidad: d.cantidad + 1, subtotal: (d.cantidad + 1) * d.valor }
        : d
      );
      return [...prev, { id_producto: p.id, nombreProducto: p.nombre, cantidad: 1, valor: p.valor_unitario, subtotal: p.valor_unitario }];
    });
    setStockLocal(prev => ({ ...prev, [p.id]: prev[p.id] - 1 }));
    setModalProducto(false);
  };

  const sumarCantidad = (id_producto: number) => {
    if (stockLocal[id_producto] <= 0) return;
    setDetalles(prev => prev.map(d => d.id_producto === id_producto
      ? { ...d, cantidad: d.cantidad + 1, subtotal: (d.cantidad + 1) * d.valor } : d
    ));
    setStockLocal(prev => ({ ...prev, [id_producto]: prev[id_producto] - 1 }));
  };

  const restarCantidad = (id_producto: number) => {
    const det = detalles.find(d => d.id_producto === id_producto);
    if (!det) return;
    if (det.cantidad === 1) { quitarProducto(id_producto); return; }
    setDetalles(prev => prev.map(d => d.id_producto === id_producto
      ? { ...d, cantidad: d.cantidad - 1, subtotal: (d.cantidad - 1) * d.valor } : d
    ));
    setStockLocal(prev => ({ ...prev, [id_producto]: prev[id_producto] + 1 }));
  };

  const quitarProducto = (id_producto: number) => {
    const det = detalles.find(d => d.id_producto === id_producto);
    if (!det) return;
    setStockLocal(prev => ({ ...prev, [id_producto]: prev[id_producto] + det.cantidad }));
    setDetalles(prev => prev.filter(d => d.id_producto !== id_producto));
  };

  const confirmarCompra = () => {
    if (!clienteSelec)         { setModalError("Selecciona un cliente.");        return; }
    if (detalles.length === 0) { setModalError("Agrega al menos un producto.");  return; }
    setModalResumen(true);
  };

  const finalizarCompra = async () => {
    setGuardando(true);
    try {
      // 1. Insertar encabezado
      const { data: enc, error: errEnc } = await supabase
        .from("encabezado")
        .insert({
          id_cliente:      clienteSelec!.id,
          nombre_cliente:  `${clienteSelec!.nombre} ${clienteSelec!.apellido}`,
          fecha:           new Date().toLocaleDateString("es-CO"),
          sub_total:       subTotal,
          descuento_total: descuentoTotal,
          total,
        })
        .select()
        .single();

      if (errEnc) throw errEnc;

      // 2. Insertar detalles
      const detallesDB = detalles.map(d => ({
        id_encabezado:   enc.id,
        id_producto:     d.id_producto,
        nombre_producto: d.nombreProducto,
        cantidad:        d.cantidad,
        valor:           d.valor,
        subtotal:        d.subtotal,
      }));
      await supabase.from("detalle").insert(detallesDB);

      // 3. Actualizar stock en Supabase
      await Promise.all(
        detalles.map(d =>
          supabase.from("producto")
            .update({ stock: stockLocal[d.id_producto] })
            .eq("id", d.id_producto)
        )
      );

      setModalResumen(false);
      navigation.goBack();
    } catch (e) {
      setModalError("Error al guardar la compra.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return (
    <View style={[s.container, { justifyContent: "center" }]}>
      <ActivityIndicator color="#f0f0f0" size="large" />
    </View>
  );

  return (
    <View style={s.container}>

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.btnVolver}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nueva Compra</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <Text style={s.seccion}>Cliente</Text>
        <TouchableOpacity style={s.selectorBtn} onPress={() => setModalCliente(true)}>
          <Text style={s.selectorText}>
            {clienteSelec ? `${clienteSelec.nombre} ${clienteSelec.apellido}` : "Seleccionar cliente..."}
          </Text>
        </TouchableOpacity>

        <View style={s.seccionRow}>
          <Text style={s.seccion}>Productos</Text>
          <TouchableOpacity style={s.btnAgregar} onPress={() => setModalProducto(true)}>
            <Text style={s.btnAgregarText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {detalles.length === 0
          ? <Text style={s.vacio}>No hay productos agregados.</Text>
          : detalles.map(d => (
              <FilaDetalle key={d.id_producto} item={d}
                stockDisponible={stockLocal[d.id_producto]}
                onSumar={() => sumarCantidad(d.id_producto)}
                onRestar={() => restarCantidad(d.id_producto)}
                onQuitar={() => quitarProducto(d.id_producto)}
              />
            ))
        }

        {detalles.length > 0 && <>
          <Text style={[s.seccion, { marginTop: 20 }]}>Descuento</Text>
          <View style={s.descuentoRow}>
            <TextInput
              style={s.descuentoInput}
              value={descuento}
              onChangeText={v => setDescuento(v.replace(/[^0-9]/g, ""))}
              placeholder="0" placeholderTextColor="#666"
              keyboardType="numeric" maxLength={3}
            />
            <Text style={s.descuentoPct}>%</Text>
            {pctDescuento > 0 && <Text style={s.descuentoValor}>− {formatCOP(descuentoTotal)}</Text>}
          </View>

          <View style={s.totalesBox}>
            <View style={s.totalFila}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValor}>{formatCOP(subTotal)}</Text>
            </View>
            <View style={s.totalFila}>
              <Text style={s.totalLabel}>Descuento ({pctDescuento}%)</Text>
              <Text style={s.totalValor}>− {formatCOP(descuentoTotal)}</Text>
            </View>
            <View style={[s.totalFila, s.totalFilaFinal]}>
              <Text style={s.totalLabelFinal}>Total</Text>
              <Text style={s.totalValorFinal}>{formatCOP(total)}</Text>
            </View>
          </View>
        </>}

        <TouchableOpacity style={s.btnConfirmar} onPress={confirmarCompra}>
          <Text style={s.btnConfirmarText}>Confirmar compra</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal cliente */}
      <Modal visible={modalCliente} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Seleccionar cliente</Text>
            {clientes.length === 0
              ? <Text style={s.vacio}>No hay clientes registrados.</Text>
              : clientes.map(c => (
                  <TouchableOpacity key={c.id} style={s.opcionItem}
                    onPress={() => { setClienteSelec(c); setModalCliente(false); }}>
                    <Text style={s.opcionText}>{c.nombre} {c.apellido}</Text>
                    <Text style={s.opcionSub}>{c.correo}</Text>
                  </TouchableOpacity>
                ))
            }
            <TouchableOpacity style={[s.btnSec, { marginTop: 12 }]} onPress={() => setModalCliente(false)}>
              <Text style={s.btnSecText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal producto */}
      <Modal visible={modalProducto} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Seleccionar producto</Text>
            {productos.length === 0
              ? <Text style={s.vacio}>No hay productos registrados.</Text>
              : productos.map(p => (
                  <TouchableOpacity key={p.id}
                    style={[s.opcionItem, stockLocal[p.id] <= 0 && s.opcionSinStock]}
                    onPress={() => agregarProducto(p)}>
                    <Text style={s.opcionText}>{p.nombre}</Text>
                    <Text style={s.opcionSub}>{p.descripcion}</Text>
                    <Text style={s.opcionSub}>{formatCOP(p.valor_unitario)} · Stock: {stockLocal[p.id]}</Text>
                  </TouchableOpacity>
                ))
            }
            <TouchableOpacity style={[s.btnSec, { marginTop: 12 }]} onPress={() => setModalProducto(false)}>
              <Text style={s.btnSecText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal resumen */}
      <Modal visible={modalResumen} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Resumen de compra</Text>
            <Text style={s.resumenCliente}> {clienteSelec?.nombre} {clienteSelec?.apellido}</Text>
            {detalles.map(d => (
              <View key={d.id_producto} style={s.resumenFila}>
                <Text style={s.resumenItem}>{d.nombreProducto} x{d.cantidad}</Text>
                <Text style={s.resumenSubtotal}>{formatCOP(d.subtotal)}</Text>
              </View>
            ))}
            <View style={s.totalesBox}>
              <View style={s.totalFila}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValor}>{formatCOP(subTotal)}</Text>
              </View>
              <View style={s.totalFila}>
                <Text style={s.totalLabel}>Descuento ({pctDescuento}%)</Text>
                <Text style={s.totalValor}>− {formatCOP(descuentoTotal)}</Text>
              </View>
              <View style={[s.totalFila, s.totalFilaFinal]}>
                <Text style={s.totalLabelFinal}>Total</Text>
                <Text style={s.totalValorFinal}>{formatCOP(total)}</Text>
              </View>
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnSec} onPress={() => setModalResumen(false)}>
                <Text style={s.btnSecText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPri} onPress={finalizarCompra} disabled={guardando}>
                {guardando ? <ActivityIndicator color="#1a1a1a" /> : <Text style={s.btnPriText}>Finalizar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal error */}
      <Modal visible={!!modalError} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Aviso</Text>
            <Text style={{ color: "#aaa", marginBottom: 20 }}>{modalError}</Text>
            <TouchableOpacity style={s.btnPri} onPress={() => setModalError("")}>
              <Text style={s.btnPriText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#1a1a1a" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 50, backgroundColor: "#222", borderBottomWidth: 1, borderColor: "#333" },
  headerTitle:      { fontSize: 20, fontWeight: "700", color: "#f0f0f0" },
  btnVolver:        { color: "#aaa", fontSize: 14, fontWeight: "600", width: 60 },
  seccion:          { fontSize: 13, fontWeight: "700", color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  seccionRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 8 },
  selectorBtn:      { backgroundColor: "#2a2a2a", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#333", marginBottom: 4 },
  selectorText:     { color: "#f0f0f0", fontSize: 14 },
  btnAgregar:       { backgroundColor: "#f0f0f0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnAgregarText:   { color: "#1a1a1a", fontWeight: "700", fontSize: 13 },
  vacio:            { textAlign: "center", color: "#555", marginTop: 20, fontSize: 14 },
  filaDetalle:      { flexDirection: "row", alignItems: "center", backgroundColor: "#2a2a2a", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#333" },
  filaProducto:     { fontSize: 14, fontWeight: "700", color: "#f0f0f0" },
  filaSub:          { fontSize: 12, color: "#777", marginTop: 2 },
  cantidadRow:      { flexDirection: "row", alignItems: "center", marginHorizontal: 8 },
  btnCantidad:      { backgroundColor: "#444", borderRadius: 6, width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#555" },
  btnCantidadDis:   { opacity: 0.3 },
  btnCantidadText:  { color: "#f0f0f0", fontSize: 16, fontWeight: "700" },
  cantidadNum:      { color: "#f0f0f0", fontSize: 15, fontWeight: "700", marginHorizontal: 10, minWidth: 20, textAlign: "center" },
  filaSubtotal:     { fontSize: 12, fontWeight: "700", color: "#f0f0f0", marginRight: 8 },
  btnQuitar:        { backgroundColor: "#333", borderRadius: 6, padding: 6, borderWidth: 1, borderColor: "#444" },
  btnQuitarText:    { color: "#ccc", fontSize: 12 },
  descuentoRow:     { flexDirection: "row", alignItems: "center", backgroundColor: "#2a2a2a", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#333", marginBottom: 12 },
  descuentoInput:   { width: 60, color: "#f0f0f0", fontSize: 18, fontWeight: "700", textAlign: "center", borderBottomWidth: 1, borderColor: "#555", paddingBottom: 2 },
  descuentoPct:     { color: "#aaa", fontSize: 18, fontWeight: "700", marginLeft: 4, marginRight: 16 },
  descuentoValor:   { color: "#f0f0f0", fontSize: 13, flex: 1, textAlign: "right" },
  totalesBox:       { backgroundColor: "#2a2a2a", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#333" },
  totalFila:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  totalFilaFinal:   { borderTopWidth: 1, borderColor: "#444", marginTop: 4, paddingTop: 10 },
  totalLabel:       { fontSize: 13, color: "#777" },
  totalValor:       { fontSize: 13, color: "#f0f0f0" },
  totalLabelFinal:  { fontSize: 15, fontWeight: "700", color: "#aaa" },
  totalValorFinal:  { fontSize: 15, fontWeight: "800", color: "#f0f0f0" },
  btnConfirmar:     { backgroundColor: "#f0f0f0", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  btnConfirmarText: { color: "#1a1a1a", fontWeight: "800", fontSize: 16 },
  overlay:          { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modal:            { backgroundColor: "#2a2a2a", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#333" },
  modalTitle:       { fontSize: 18, fontWeight: "700", color: "#f0f0f0", marginBottom: 16 },
  opcionItem:       { backgroundColor: "#333", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#444" },
  opcionSinStock:   { opacity: 0.4 },
  opcionText:       { fontSize: 14, fontWeight: "600", color: "#f0f0f0" },
  opcionSub:        { fontSize: 12, color: "#777", marginTop: 2 },
  resumenCliente:   { fontSize: 15, color: "#f0f0f0", marginBottom: 12 },
  resumenFila:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#333" },
  resumenItem:      { fontSize: 13, color: "#aaa" },
  resumenSubtotal:  { fontSize: 13, color: "#f0f0f0", fontWeight: "600" },
  modalBtns:        { flexDirection: "row", gap: 10, marginTop: 16 },
  btnSec:           { flex: 1, borderWidth: 1, borderColor: "#444", borderRadius: 10, padding: 12, alignItems: "center" },
  btnSecText:       { color: "#aaa", fontWeight: "600" },
  btnPri:           { flex: 1, backgroundColor: "#f0f0f0", borderRadius: 10, padding: 12, alignItems: "center" },
  btnPriText:       { color: "#1a1a1a", fontWeight: "700" },
});

export default CompraScreen;
