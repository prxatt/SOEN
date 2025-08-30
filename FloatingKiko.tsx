import React, { useRef, useFrame } from "react";
import { Canvas, useFrame as useThreeFrame } from "@react-three/fiber";

function Kiko() {
  const ref = useRef<any>();
  useThreeFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.2;
      ref.current.rotation.y += 0.01;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#8b5cf6" emissive="#6366f1" />
    </mesh>
  );
}

export default function FloatingKiko() {
  return (
    <Canvas className="kiko">
      <ambientLight intensity={0.5} />
      <Kiko />
    </Canvas>
  );
}
