// ======================= src/pages/auth/Register.js =======================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../Firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

const Register = () => {
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const mapAuthErr = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "El correo ya está registrado.";
      case "auth/invalid-email":
        return "Correo inválido.";
      case "auth/weak-password":
        return "Contraseña débil (mínimo 6).";
      default:
        return "No se pudo registrar. Intenta nuevamente.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if ((form.password || "").length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      // 1) Crear cuenta
      const cred = await createUserWithEmailAndPassword(
        auth,
        String(form.email).trim(),
        form.password
      );

      // 2) Nombre visible (opcional)
      if (form.name) {
        await updateProfile(cred.user, { displayName: String(form.name).trim() });
      }

      // 3) Perfil en Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        name: String(form.name || "").trim() || null,
        role: "customer",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4) Limpia + redirige (AuthContext se actualizará por onAuthStateChanged)
      setForm({ email: "", password: "", name: "" });
      navigate("/"); // o "/dashboard" si prefieres
    } catch (err) {
      setError(mapAuthErr(err?.code));
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h4>Crear cuenta</h4>
      <form onSubmit={handleSubmit}>
        <div className="input-field">
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            placeholder="Tu nombre (opcional)"
          />
          <label className="active" htmlFor="name">Nombre</label>
        </div>

        <div className="input-field">
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />
          <label className="active" htmlFor="email">Email</label>
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
          <label className="active" htmlFor="password">Password</label>
        </div>

        <button className="btn waves-effect waves-light" type="submit" disabled={loading}>
          {loading ? "Creando..." : "Registrarme"}
        </button>

        {error && <p className="red-text" style={{ marginTop: 8 }}>{error}</p>}
      </form>
    </div>
  );
};

export default Register;
