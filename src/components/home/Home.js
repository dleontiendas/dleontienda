import React, {  useState } from "react";

import ProductList from "../product/ProductList";

const Home = () => {
  const [products] = useState([]);

 

  return (
    <div /*style={{ padding: "2rem" }}*/>
      
      <ProductList products={products} />
    </div>
  );
};

export default Home;
