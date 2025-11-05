import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase";

const ProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    price_cop: "",
    discount: 0,
    stock: "",
    size: "",
    color: "",
    image1: "",
    image2: "",
    active: true,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (e, editing = false) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    if (editing) setEditingProduct({ ...editingProduct, [name]: val });
    else setNewProduct({ ...newProduct, [name]: val });
  };

  const handleAddProduct = async () => {
    try {
      const docRef = await addDoc(collection(db, "productos"), newProduct);
      setProducts([...products, { id: docRef.id, ...newProduct }]);
      setNewProduct({
        name: "",
        description: "",
        category: "",
        subcategory: "",
        brand: "",
        price_cop: "",
        discount: 0,
        stock: "",
        size: "",
        color: "",
        image1: "",
        image2: "",
        active: true,
      });
    } catch (err) {
      console.error("Error agregando producto:", err);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const ref = doc(db, "productos", editingProduct.id);
      await updateDoc(ref, editingProduct);
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? editingProduct : p)));
      setEditingProduct(null);
    } catch (err) {
      console.error("Error actualizando producto:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "productos", id));
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
  };

  return (
    <div>
      <h2>Gestión de Productos</h2>

      {/* Formulario */}
      <div className="product-form">
        {Object.keys(newProduct).map((field) => {
          if (["active", "discount"].includes(field)) return null;
          return (
            <input
              key={field}
              name={field}
              placeholder={field}
              value={editingProduct ? editingProduct[field] || "" : newProduct[field] || ""}
              onChange={(e) => handleChange(e, !!editingProduct)}
            />
          );
        })}

        <label>Discount:</label>
        <select
          name="discount"
          value={editingProduct ? editingProduct.discount : newProduct.discount}
          onChange={(e) => handleChange(e, !!editingProduct)}
        >
          {[0, 10, 20, 30, 40, 50].map((d) => (
            <option key={d} value={d}>
              {d}%
            </option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            name="active"
            checked={editingProduct ? editingProduct.active : newProduct.active}
            onChange={(e) => handleChange(e, !!editingProduct)}
          />
          Activo
        </label>

        {editingProduct ? (
          <button onClick={handleUpdateProduct}>Actualizar</button>
        ) : (
          <button onClick={handleAddProduct}>Agregar</button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Color</th>
              <th>Talla</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.description}</td>
                <td>{p.category}</td>
                <td>${p.price_cop}</td>
                <td>{p.stock}</td>
                <td>{p.color}</td>
                <td>{p.size}</td>
                <td>{p.active ? "Sí" : "No"}</td>
                <td>
                  <button onClick={() => setEditingProduct(p)}>Editar</button>
                  <button onClick={() => handleDeleteProduct(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductsTab;
