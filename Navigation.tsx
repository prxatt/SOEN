import React from "react";
import { motion } from "framer-motion";

export default function Navigation() {
  return (
    <nav className="navigation">
      <motion.div className="logo" whileHover={{ rotate: 5 }}>
        PRAXIS AI
      </motion.div>
      <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <motion.button whileHover={{ scale: 1.05 }} className="cta">
        Start Your Journey
      </motion.button>
    </nav>
  );
}
