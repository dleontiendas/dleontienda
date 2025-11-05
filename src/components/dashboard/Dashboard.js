import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ProductsTab from "./ProductsTab.js";
import OrdersTab from "./OrdersTab.js";
import "./Dashboard.css";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("productos");

  return (
    <div className="dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="dashboard-main">
        {activeTab === "productos" && <ProductsTab />}
        {activeTab === "pedidos" && <OrdersTab />}
        {activeTab === "reportes" && <p>Reportes (en desarrollo)</p>}
        {activeTab === "usuarios" && <p>Usuarios (en desarrollo)</p>}
        {activeTab === "configuracion" && <p>Configuración (en desarrollo)</p>}
      </main>
    </div>
  );
};

export default Dashboard;