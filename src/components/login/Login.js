import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { AuthContext } from "../../context/AuthContext";
import { auth } from "../../Firebase";

export default function Login() {
  const { loginEmail, user } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = useMemo(() => location.state?.from?.pathname || "/dashboard", [location]);

  useEffect(() => {
    // WHY: si ya hay sesión, evitar ver la pantalla de login
    if (user?.uid) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const mapAuthError = (code) => {
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Correo o contraseña incorrectos.";
      case "auth/invalid-email":
        return "Correo inválido.";
      case "auth/user-disabled":
        return "Usuario deshabilitado.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Intenta más tarde.";
      case "auth/configuration-not-found":
        return "Auth no está configurado (habilita Email/Password y autoriza tu dominio en Firebase).";
      default:
        return "No se pudo iniciar sesión. Intenta nuevamente.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginEmail(form.email.trim(), form.password);
      navigate("/dashboard", { replace: true }); // ← redirige al dashboard
    } catch (err) {
      console.error("Login error:", err);
      setError(mapAuthError(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setError("");
    if (!form.email) {
      setError("Escribe tu correo para enviarte el enlace de recuperación.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email.trim());
      alert("Te enviamos un enlace para restablecer tu contraseña.");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(mapAuthError(err?.code));
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h5>Iniciar sesión</h5>
      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="input-field">
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required autoComplete="email" />
          <label className="active" htmlFor="email">Correo</label>
        </div>
        <div className="input-field" style={{ position: "relative" }}>
          <input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
            autoComplete="current-password"
          />
          <label className="active" htmlFor="password">Contraseña</label>
          <button
            type="button"
            className="btn-flat"
            onClick={() => setShowPwd((v) => !v)}
            style={{ position: "absolute", right: 0, top: 0 }}
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPwd ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn waves-effect waves-light" type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
          <button type="button" className="btn-flat" onClick={handleReset}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && <p className="red-text" style={{ marginTop: 8 }}>{error}</p>}
      </form>
    </div>
  );
}