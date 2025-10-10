import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/users/login', {
        email,
        password
      });
      
      if (response.status === 200) {
        const user = response.data; // Suponemos que `response.data` contiene el nombre del usuario
        localStorage.setItem('user', JSON.stringify(user)); // Guarda el usuario en localStorage
        
        alert('Logged in successfully');
        setEmail('');
        setPassword('');
        setError(null);
        navigate('/');
      }
  
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="container">
      <h5>Iniciar sesión o Registrarse</h5>
      <form onSubmit={handleSubmit}>
        <div className="input-field">
          <input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <label htmlFor="email">Correo</label>
        </div>
        <div className="input-field">
          <input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <label htmlFor="Password">Contraseña</label>
        </div>
        <button className="btn waves-effect waves-light" type="submit">Iniciar sesión</button>
        {error && <p className="red-text">{error}</p>}
      </form>
    </div>
  );
};

export default Login;