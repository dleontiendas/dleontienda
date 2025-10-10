import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element }) => {
  // Verificar si hay un token en localStorage
  const token = localStorage.getItem('token');

  // Si no hay token, redirige al usuario a la página de inicio de sesión
  return token ? element : <Navigate to="/login" />;
};

export default PrivateRoute;