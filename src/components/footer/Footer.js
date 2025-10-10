import React from 'react';

const Footer = () => {
  return (
    <footer className="page-footer white">
      <div className="container">
        <div className="row">
          <div className="col l6 s12">
            <h5 className="orange-text text-darken-2 ">Empresa</h5>
            <p className="orange-text text-darken-2">Tu lugar favorito para comprar todo</p>
          </div>
          <div className="col l4 offset-l2 s12">
            <h5 className="orange-text text-darken-2">Enlances</h5>
            <ul>
              <li><a className="orange-text text-darken-2" href="/">Inicio</a></li>
              <li><a className="orange-text text-darken-2" href="/products">Productos</a></li>
              <li><a className="orange-text text-darken-2" href="/cart">Carrito</a></li>
              <li><a className="orange-text text-darken-2" href="/chat">Chat</a></li>
              <li><a className="orange-text text-darken-2" href="/login">Iniciar</a></li>
              <li><a className="orange-text text-darken-2" href="/register">Registrarse</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-copyright">
        <div className="container orange-text text-darken-2">
          © 2025 Denuedo
          <a className="orange-text text-darken-2 right" href="#!">Más Informacíon</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;