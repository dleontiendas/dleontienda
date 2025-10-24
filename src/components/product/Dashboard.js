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
  BarChart2,
  Settings,
  Users,
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("productos");

  // Datos
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    price_cop: "",
    discount: 0,
    stock: "",
    size: "",
    color: "",
    image1: "",
    image2: "",
    active: true,
  });

  const [editingProduct, setEditingProduct] = useState(null);

 
  // Cargar productos (colección: productos)
  
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
        console.log(" Productos cargados:", items);
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);


  //  Cargar pedidos

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

  //  CRUD Productos
  
  const handleChange = (e, editing = false) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    if (editing) {
      setEditingProduct({ ...editingProduct, [name]: val });
    } else {
      setNewProduct({ ...newProduct, [name]: val });
    }
  };

  const handleAddProduct = async () => {
    try {
      const docRef = await addDoc(collection(db, "productos"), newProduct);
      setProducts([...products, { id: docRef.id, ...newProduct }]);
      setNewProduct({
        name: "",
        description: "",
        category: "",
        subcategory: "",
        brand: "",
        price_cop: "",
        discount: 0,
        stock: "",
        size: "",
        color: "",
        image1: "",
        image2: "",
        active: true,
      });
    } catch (err) {
      console.error("Error agregando producto:", err);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const productRef = doc(db, "productos", editingProduct.id);
      await updateDoc(productRef, editingProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
      setEditingProduct(null);
    } catch (err) {
      console.error("Error actualizando producto:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "productos", id));
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
  };

 
  //  Actualizar estado pedido

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
        <h2>
          {activeTab === "productos" && "Gestión de Productos"}
          {activeTab === "pedidos" && "Gestión de Pedidos"}
        </h2>

        {/* 
            //TAB: PRODUCTOS
        */}
        {activeTab === "productos" && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              {Object.keys(newProduct).map((field) => {
                if (field === "active" || field === "discount") return null;
                return (
                  <input
                    key={field}
                    name={field}
                    placeholder={field}
                    value={
                      editingProduct
                        ? editingProduct[field] || ""
                        : newProduct[field] || ""
                    }
                    onChange={(e) => handleChange(e, !!editingProduct)}
                    style={{
                      display: "block",
                      margin: "6px 0",
                      padding: "8px",
                      width: "100%",
                    }}
                  />
                );
              })}

              <label>Discount:</label>
              <select
                name="discount"
                value={
                  editingProduct ? editingProduct.discount : newProduct.discount
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
                  name="active"
                  checked={
                    editingProduct ? editingProduct.active : newProduct.active
                  }
                  onChange={(e) => handleChange(e, !!editingProduct)}
                />
                Active (visible in store)
              </label>

              {editingProduct ? (
                <button onClick={handleUpdateProduct}>Update</button>
              ) : (
                <button onClick={handleAddProduct}>Add Product</button>
              )}
            </div>

            {/* Tabla */}
            {loading ? (
              <p>Loading products...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="striped highlight responsive-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Price (COP)</th>
                      <th>Stock</th>
                      <th>Color</th>
                      <th>Size</th>
                      <th>Discount</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.description}</td>
                        <td>{product.category}</td>
                        <td>${Number(product.price_cop).toLocaleString()}</td>
                        <td>{product.stock}</td>
                        <td>{product.color}</td>
                        <td>{product.size}</td>
                        <td>{product.discount}%</td>
                        <td>
                          {product.active ? (
                            <span style={{ color: "green" }}>Yes</span>
                          ) : (
                            <span style={{ color: "red" }}>No</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => setEditingProduct(product)}
                            style={{ marginRight: "8px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
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

        {/* TAB: PEDIDOS */}
        {activeTab === "pedidos" && (
          <>
            {loadingOrders ? (
              <p>Loading orders...</p>
            ) : (
              <table className="striped highlight responsive-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>
                        {order.cliente?.nombre} {order.cliente?.apellido}
                      </td>
                      <td>{order.cliente?.email}</td>
                      <td>${order.total?.toLocaleString()}</td>
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
                            (s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const iconButton = (isActive) => ({
  background: "none",
  border: "none",
  margin: "1rem 0",
  color: isActive ? "#ff9800" : "#fff",
  cursor: "pointer",
});

export default Dashboard;
