import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const icons = [
    { key: "productos", icon: <Package size={24} /> },
    { key: "pedidos", icon: <ShoppingCart size={24} /> },
    { key: "reportes", icon: <BarChart2 size={24} /> },
    { key: "usuarios", icon: <Users size={24} /> },
    { key: "configuracion", icon: <Settings size={24} /> },
  ];

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="dashboard-sidebar">
      {icons.map(({ key, icon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`sidebar-btn ${activeTab === key ? "active" : ""}`}
          aria-label={key}
          title={key}
        >
          {icon}
        </button>
      ))}
      <button
        type="button"
        className="sidebar-btn sidebar-logout"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut size={24} />
      </button>
    </aside>
  );
};

export default Sidebar;
