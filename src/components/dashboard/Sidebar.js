import React from "react";
import {
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  Users,
} from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const icons = [
    { key: "productos", icon: <Package size={24} /> },
    { key: "pedidos", icon: <ShoppingCart size={24} /> },
    { key: "reportes", icon: <BarChart2 size={24} /> },
    { key: "usuarios", icon: <Users size={24} /> },
    { key: "configuracion", icon: <Settings size={24} /> },
  ];

  return (
    <aside className="dashboard-sidebar">
      {icons.map(({ key, icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`sidebar-btn ${activeTab === key ? "active" : ""}`}
        >
          {icon}
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;
