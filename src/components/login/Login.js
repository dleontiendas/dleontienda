import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../Firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const mapAuthError = (code) => {
    switch (code) {
      case "auth/invalid-email": return "Correo inválido.";
      case "auth/user-disabled": return "Usuario deshabilitado.";
      case "auth/user-not-found": return "Usuario no encontrado.";
      case "auth/wrong-password": return "Contraseña incorrecta.";
      case "auth/too-many-requests": return "Demasiados intentos. Intenta más tarde.";
      default: return "No se pudo iniciar sesión. Intenta nuevamente.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      const sessionUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
      };
      localStorage.setItem("user", JSON.stringify(sessionUser));
      navigate("/");
    } catch (err) {
      setError(mapAuthError(err?.code));
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!form.email) {
      setError("Escribe tu correo para enviarte el enlace de recuperación.");
      return;
    }
    setError("");
    try {
      await sendPasswordResetEmail(auth, form.email.trim());
      alert("Te enviamos un enlace para restablecer tu contraseña.");
    } catch (err) {
      setError(mapAuthError(err?.code));
      console.error("Password reset error:", err);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h5>Iniciar sesión</h5>
      <form onSubmit={handleSubmit}>
        <div className="input-field">
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />
          <label className="active" htmlFor="email">Correo</label>
        </div>

        <div className="input-field">
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
          />
          <label className="active" htmlFor="password">Contraseña</label>
        </div>

        <button className="btn waves-effect waves-light" type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <button
          type="button"
          className="btn-flat"
          onClick={handleReset}
          style={{ marginLeft: 8 }}
        >
          ¿Olvidaste tu contraseña?
        </button>

        {error && <p className="red-text" style={{ marginTop: 8 }}>{error}</p>}
      </form>
    </div>
  );
};

export default Login;
