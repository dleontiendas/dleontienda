// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../Firebase";
import {
  Package,
  ShoppingCart,
  Settings,
  Users,
  BarChart2,
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("productos");

  // Productos
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pedidos
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const emptyProduct = {
    Nombre: "",
    Descripcion: "",
    Departamento: "",
    Categoria: "",
    "Sub-Categoria": "",
    Marca: "",
    "Precio (COL)": "",
    Inventario: "",
    Talla: "",
    Color: "",
    "Imagen de producto 1": "",
    "Imagen de producto 2": "",
    Descuento: 0,
    activo: true,
  };

  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);

  // =========================
  // 🔹 Cargar productos
  // =========================
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // =========================
  // 🔹 Cargar pedidos
  // =========================
  useEffect(() => {
    if (activeTab !== "pedidos") return;
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const pedidos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(pedidos);
      } catch (error) {
        console.error("Error cargando pedidos:", error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [activeTab]);

  // =========================
  // 🔹 CRUD Productos
  // =========================
  const handleAddProduct = async () => {
    try {
      const docRef = await addDoc(collection(db, "productos"), newProduct);
      setProducts([...products, { id: docRef.id, ...newProduct }]);
      setNewProduct(emptyProduct);
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const productRef = doc(db, "productos", editingProduct.id);
      await updateDoc(productRef, editingProduct);
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? editingProduct : p
        )
      );
      setEditingProduct(null);
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "productos", id));
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // =========================
  // 🔹 Actualizar estado pedido
  // =========================
  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "pedidos", id);
      await updateDoc(orderRef, { estado: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, estado: newStatus } : o))
      );
    } catch (error) {
      console.error("Error actualizando pedido:", error);
    }
  };

  // =========================
  // 🔹 Manejo inputs productos
  // =========================
  const handleChange = (e, isEditing) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    if (isEditing) {
      setEditingProduct({ ...editingProduct, [name]: val });
    } else {
      setNewProduct({ ...newProduct, [name]: val });
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "70px",
          background: "#1e1e2d",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "1rem",
        }}
      >
        <button
          onClick={() => setActiveTab("productos")}
          style={iconButton(activeTab === "productos")}
        >
          <Package size={24} />
        </button>
        <button
          onClick={() => setActiveTab("pedidos")}
          style={iconButton(activeTab === "pedidos")}
        >
          <ShoppingCart size={24} />
        </button>
        <button
          onClick={() => setActiveTab("reportes")}
          style={iconButton(activeTab === "reportes")}
        >
          <BarChart2 size={24} />
        </button>
        <button
          onClick={() => setActiveTab("usuarios")}
          style={iconButton(activeTab === "usuarios")}
        >
          <Users size={24} />
        </button>
        <button
          onClick={() => setActiveTab("configuracion")}
          style={iconButton(activeTab === "configuracion")}
        >
          <Settings size={24} />
        </button>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, padding: "2rem", background: "#f5f6fa" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          {activeTab === "productos" && "Gestión de Productos"}
          {activeTab === "pedidos" && "Gestión de Pedidos"}
          {activeTab === "reportes" && "Reportes"}
          {activeTab === "usuarios" && "Usuarios"}
          {activeTab === "configuracion" && "Configuración"}
        </h2>

        {/* =========================
            TAB: PRODUCTOS
            ========================= */}
        {activeTab === "productos" && (
          <>
            {/* Formulario */}
            <div style={{ marginBottom: "1rem" }}>
              {[
                "Nombre",
                "Descripcion",
                "Departamento",
                "Categoria",
                "Sub-Categoria",
                "Marca",
                "Precio (COL)",
                "Inventario",
                "Talla",
                "Color",
                "Imagen de producto 1",
                "Imagen de producto 2",
              ].map((field) => (
                <input
                  key={field}
                  type={
                    field.includes("Precio") || field === "Inventario"
                      ? "number"
                      : "text"
                  }
                  name={field}
                  placeholder={field}
                  value={
                    editingProduct
                      ? editingProduct[field] || ""
                      : newProduct[field] || ""
                  }
                  onChange={(e) => handleChange(e, !!editingProduct)}
                  style={{ display: "block", margin: "6px 0", padding: "8px" }}
                />
              ))}

              <label>Descuento:</label>
              <select
                name="Descuento"
                value={
                  editingProduct ? editingProduct.Descuento : newProduct.Descuento
                }
                onChange={(e) => handleChange(e, !!editingProduct)}
              >
                {[0, 10, 20, 30, 40, 50].map((d) => (
                  <option key={d} value={d}>
                    {d}%
                  </option>
                ))}
              </select>

              <label style={{ display: "block", marginTop: "8px" }}>
                <input
                  type="checkbox"
                  name="activo"
                  checked={editingProduct ? editingProduct.activo : newProduct.activo}
                  onChange={(e) => handleChange(e, !!editingProduct)}
                />
                Activo (visible en la tienda)
              </label>

              {editingProduct ? (
                <button className="btn orange" onClick={handleUpdateProduct}>
                  Actualizar
                </button>
              ) : (
                <button className="btn orange" onClick={handleAddProduct}>
                  Agregar
                </button>
              )}
            </div>

            {/* Lista de productos */}
            {loading ? (
              <p>Cargando productos...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="striped highlight responsive-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Departamento</th>
                      <th>Categoría</th>
                      <th>Sub-Categoría</th>
                      <th>Marca</th>
                      <th>Precio (COL)</th>
                      <th>Inventario</th>
                      <th>Talla</th>
                      <th>Color</th>
                      <th>Descuento</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.Nombre}</td>
                        <td>{product.Descripcion}</td>
                        <td>{product.Departamento}</td>
                        <td>{product.Categoria}</td>
                        <td>{product["Sub-Categoria"]}</td>
                        <td>{product.Marca}</td>
                        <td>
                          $
                          {Number(product["Precio (COL)"] || 0).toLocaleString(
                            "es-CO"
                          )}
                        </td>
                        <td>{product.Inventario}</td>
                        <td>{product.Talla}</td>
                        <td>{product.Color}</td>
                        <td>{product.Descuento ? `${product.Descuento}%` : "0%"}</td>
                        <td>
                          {product.activo ? (
                            <span style={{ color: "green" }}>Sí</span>
                          ) : (
                            <span style={{ color: "red" }}>No</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-small orange"
                            style={{ marginRight: "8px" }}
                            onClick={() => setEditingProduct(product)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn-small red"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* =========================
            TAB: PEDIDOS
        ========================= */}
        {activeTab === "pedidos" && (
          <>
            {loadingOrders ? (
              <p>Cargando pedidos...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="striped highlight responsive-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Total</th>
                      <th>Método de Pago</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.cliente?.nombre} {order.cliente?.apellido}</td>
                        <td>{order.cliente?.email}</td>
                        <td>${Number(order.total).toLocaleString("es-CO")}</td>
                        <td>{order.metodoPago}</td>
                        <td>{order.estado}</td>
                        <td>
                          {order.fecha?.seconds
                            ? new Date(order.fecha.seconds * 1000).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <select
                            value={order.estado}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value)
                            }
                          >
                            {["Pendiente", "Enviado", "Entregado", "Cancelado"].map(
                              (estado) => (
                                <option key={estado} value={estado}>
                                  {estado}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// estilos de botones laterales
const iconButton = (isActive) => ({
  background: "none",
  border: "none",
  margin: "1rem 0",
  color: isActive ? "#ff9800" : "#fff",
  cursor: "pointer",
});

export default Dashboard;
