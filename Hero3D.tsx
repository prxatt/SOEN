import React, { useEffect } from "react";
import FloatingKiko from "./FloatingKiko";
import gsap from "gsap";

export default function Hero3D() {
  useEffect(() => {
    gsap.to(".hero h1", { opacity: 1, y: 0, duration: 1 });
    gsap.to(".hero h2", { opacity: 1, y: 0, duration: 1, delay: 0.3 });
    gsap.to(".hero .cta", { opacity: 1, y: 0, duration: 1, delay: 0.6 });
  }, []);

  return (
    <section className="hero">
      <h1>Transform Chaos Into Clarity</h1>
      <h2>Meet Kiko, your AI companion that turns thoughts into focused action</h2>
      <button className="cta">Experience Praxis AI</button>
      <FloatingKiko />
    </section>
  );
}
