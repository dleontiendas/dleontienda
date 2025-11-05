import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase";

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar pedidos desde Firebase
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
      } catch (error) {
        console.error("Error cargando pedidos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Actualizar estado de pedido
  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "pedidos", id);
      await updateDoc(orderRef, { estado: newStatus });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, estado: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error actualizando pedido:", error);
    }
  };

  // Calcular total formateado
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div>
      <h2>Gestión de Pedidos</h2>

      {loading ? (
        <p>Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <p>No hay pedidos registrados.</p>
      ) : (
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const cliente = order.cliente || order.customer || {};
                const fecha = order.fecha || order.date;

                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      {cliente.nombre ||
                        cliente.first_name ||
                        "Sin nombre"}{" "}
                      {cliente.apellido || cliente.last_name || ""}
                    </td>
                    <td>{cliente.email || "—"}</td>
                    <td>{cliente.telefono || cliente.phone || "—"}</td>
                    <td>{formatCurrency(order.total || 0)}</td>
                    <td>{order.metodoPago || order.paymentMethod || "N/A"}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          (order.estado || order.status || "Pendiente").toLowerCase()
                        }`}
                      >
                        {order.estado || order.status || "Pendiente"}
                      </span>
                    </td>
                    <td>
                      {fecha?.seconds
                        ? new Date(fecha.seconds * 1000).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <select
                        value={order.estado || order.status || "Pendiente"}
                        onChange={(e) =>
                          handleUpdateOrderStatus(order.id, e.target.value)
                        }
                      >
                        {[
                          "Pendiente",
                          "Enviado",
                          "Entregado",
                          "Cancelado",
                        ].map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
