import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Eliminar el token de localStorage al cerrar sesión
    localStorage.removeItem('token');
    
    // Redirigir al usuario a la página de inicio de sesión
    navigate('/login');
  }, [navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
    </div>
  );
};

export default Logout;