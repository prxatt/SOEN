import React from "react";
import Navigation from "./components/Navigation";
import Hero3D from "./components/Hero3D";
import Features3D from "./components/Features3D";

export default function App() {
  return (
    <div className="app">
      <Navigation />
      <Hero3D />
      <Features3D />
      <footer className="footer">© 2025 Praxis AI</footer>
    </div>
  );
}
