import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/users', {
        email,
        password
      });
      alert('User registered successfully');
      setEmail('');
      setPassword('');
      setError(null);
    } catch (err) {
      setError('Error registering user');
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-field">
          <input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <label htmlFor="email">Email</label>
        </div>
        <div className="input-field">
          <input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <label htmlFor="password">Password</label>
        </div>
        <button className="btn waves-effect waves-light" type="submit">Register</button>
        {error && <p className="red-text">{error}</p>}
      </form>
    </div>
  );
};

export default Register;