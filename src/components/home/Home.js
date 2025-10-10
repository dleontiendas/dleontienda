import React, { useEffect, useState } from "react";
//import axios from "axios";
import ProductList from "../product/ProductList";

const Home = () => {
  const [products, setProducts] = useState([]);

  /*useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:8081/products");
        setProducts(response.data);
      } catch (err) {
        console.error("Error fetching products", err);
      }
    };

    fetchProducts();
  }, []);*/

  return (
    <div /*style={{ padding: "2rem" }}*/>
      
      <ProductList products={products} />
    </div>
  );
};

export default Home;
