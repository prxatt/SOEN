import React from "react";
import { motion } from "framer-motion";

const features = [
  { title: "Mission Control Dashboard", desc: "Personalized hub" },
  { title: "AI-Powered Notes", desc: "Smart note-taking" },
  { title: "Intelligent Calendar", desc: "Seamless scheduling" },
  { title: "3D Goal Visualization", desc: "Immersive goal universe" },
  { title: "Gamified Progress", desc: "Level up your life" },
  { title: "Kiko AI Companion", desc: "Personal spirit companion" },
];

export default function Features3D() {
  return (
    <section id="features" className="features">
      {features.map((f, i) => (
        <motion.div
          key={i}
          className="feature-card"
          whileHover={{ scale: 1.05, rotate: 1 }}
        >
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </motion.div>
      ))}
    </section>
  );
}
