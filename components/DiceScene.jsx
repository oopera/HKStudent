import { Edges } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

function createTextTexture(text) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const padding = 40;
  const maxWidth = size - padding * 2;
  let fontSize = 200;
  ctx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const width = ctx.measureText(text).width;
  while (width > maxWidth && fontSize > 24) {
    fontSize -= 4;
    ctx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  }
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (let i = 0; i < words.length; i++) {
    const test = current ? current + " " + words[i] : words[i];
    if (ctx.measureText(test).width <= maxWidth) current = test;
    else {
      if (current) lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  let y = size / 2 - totalHeight / 2 + lineHeight / 2;
  lines.forEach((line) => {
    ctx.fillText(line, size / 2, y);
    y += lineHeight;
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

// material order for BoxGeometry: [ +x, -x, +y, -y, +z, -z ]
const slotToMaterialIndex = [2, 0, 4, 5, 1, 3];
const materialIndexToSlot = [1, 4, 0, 5, 2, 3];
const faceNormals = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

function Dice({ texts, onResult }, ref) {
  const meshRef = useRef();
  const indicatorRef = useRef();
  const animRef = useRef(null);

  const materials = useMemo(() => {
    const mats = new Array(6);
    for (let slot = 0; slot < 6; slot++) {
      const mi = slotToMaterialIndex[slot];
      mats[mi] = new THREE.MeshBasicMaterial({
        map: createTextTexture(texts[slot]),
      });
    }
    return mats;
  }, [texts]);

  useEffect(() => {
    return () => {
      // dispose materials
      materials.forEach((m) => {
        if (!m) return;
        if (m.map) m.map.dispose();
        m.dispose();
      });
    };
  }, [materials]);

  const getTopMaterialIndex = () => {
    if (!meshRef.current) return 2;
    const q = meshRef.current.quaternion;
    let bestIdx = 2;
    let bestDot = -Infinity;
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 6; i++) {
      const worldNormal = faceNormals[i].clone().applyQuaternion(q);
      const dot = worldNormal.dot(up);
      if (dot > bestDot) {
        bestDot = dot;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const quaternionForTopFace = (materialIndex, yawQuarterTurns = 0) => {
    const from = faceNormals[materialIndex];
    const to = new THREE.Vector3(0, 1, 0);
    const align = new THREE.Quaternion().setFromUnitVectors(from, to);
    const yaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      (Math.PI / 2) * (yawQuarterTurns % 4)
    );
    return yaw.multiply(align);
  };

  useImperativeHandle(
    ref,
    () => ({
      roll: () => {
        if (!meshRef.current) return;
        onResult && onResult(null);
        const spinEndEuler = new THREE.Euler(
          Math.PI * 2 * (2 + Math.random() * 3),
          Math.PI * 2 * (2 + Math.random() * 3),
          Math.PI * 2 * (2 + Math.random() * 3),
          "XYZ"
        );
        animRef.current = {
          phase: 1,
          start: performance.now(),
          duration: 1200,
          from: meshRef.current.quaternion.clone(),
          to: new THREE.Quaternion().setFromEuler(spinEndEuler),
        };
      },
    }),
    [onResult]
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // update top indicator
    if (indicatorRef.current) {
      const topIdx = getTopMaterialIndex();
      const localNormal = faceNormals[topIdx];
      const pos = localNormal.clone().multiplyScalar(1.02);
      indicatorRef.current.position.copy(pos);
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        localNormal
      );
      indicatorRef.current.quaternion.copy(q);
    }

    const anim = animRef.current;
    if (!anim) return;
    const now = performance.now();
    const t = Math.min(1, (now - anim.start) / anim.duration);
    const eased = 1 - Math.pow(1 - t, 3);
    mesh.quaternion.slerpQuaternions(anim.from, anim.to, eased);
    if (t >= 1) {
      if (anim.phase === 1) {
        // snap phase
        const topMatIdx = getTopMaterialIndex();
        const yawTurns = Math.floor(Math.random() * 4);
        animRef.current = {
          phase: 2,
          start: performance.now(),
          duration: 450,
          from: mesh.quaternion.clone(),
          to: quaternionForTopFace(topMatIdx, yawTurns),
        };
      } else if (anim.phase === 2) {
        // finish
        animRef.current = null;
        const finalTop = getTopMaterialIndex();
        const slotIdx = materialIndexToSlot[finalTop];
        onResult && onResult({ slot: slotIdx + 1, text: texts[slotIdx] });
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight intensity={0.6} position={[5, 10, 7.5]} />
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        {materials.map((m, i) => (
          <meshBasicMaterial key={i} attach={`material-${i}`} map={m.map} />
        ))}
        <mesh ref={indicatorRef}>
          <planeGeometry args={[2.04, 2.04]} />
          <meshBasicMaterial color={0x10b981} transparent opacity={0} />
          <Edges color="#10b981" />
        </mesh>
      </mesh>
    </group>
  );
}

const DiceWithRef = forwardRef(Dice);

export default forwardRef(function DiceScene({ texts, onResult }, ref) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const diceRef = useRef();
  useImperativeHandle(ref, () => ({
    roll: () => diceRef.current && diceRef.current.roll(),
  }));

  if (!mounted) return null;
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [3.5, 3.0, 3.5], fov: 45 }}>
      <color attach="background" args={["#f3f4f6"]} />
      <DiceWithRef ref={diceRef} texts={texts} onResult={onResult} />
    </Canvas>
  );
});
