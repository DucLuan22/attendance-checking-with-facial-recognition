import React from "react";
import "./Navbar.css";
const Navbar = () => {
  return (
    <main className="nav-container">
      <span className="logo">RecCam</span>
      <ul className="nav-link-list">
        <li className="nav-link">About</li>
        <li className="nav-link">Emotion Recognition</li>
      </ul>
    </main>
  );
};

export default Navbar;
