import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

function getTextColor(bgHex) {
  try {
    const color = new THREE.Color(bgHex);
    // perceived luminance
    const r = color.r,
      g = color.g,
      b = color.b;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.6 ? "#111111" : "#ffffff";
  } catch {
    return "#111111";
  }
}

function createTextTexture(text, bg = "#ffffff") {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const padding = 40;
  const maxWidth = size - padding * 2;
  const maxHeight = size - padding * 2;

  const wrapLines = (context, t, width) => {
    const words = String(t).split(/\s+/);
    const out = [];
    let current = "";
    for (let i = 0; i < words.length; i++) {
      const candidate = current ? current + " " + words[i] : words[i];
      if (context.measureText(candidate).width <= width) current = candidate;
      else {
        if (current) out.push(current);
        current = words[i];
      }
    }
    if (current) out.push(current);
    return out.length ? out : [""];
  };

  // Find the largest font size that fits both width and height
  let fontSize = 220;
  let fittedLines = [String(text)];
  while (fontSize >= 16) {
    ctx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const lines = wrapLines(ctx, text, maxWidth);
    const lineHeight = Math.ceil(fontSize * 1.15);
    const totalHeight = lines.length * lineHeight;
    let widest = 0;
    for (let i = 0; i < lines.length; i++)
      widest = Math.max(widest, ctx.measureText(lines[i]).width);
    if (totalHeight <= maxHeight && widest <= maxWidth) {
      fittedLines = lines;
      break;
    }
    fontSize -= 4;
  }

  // Draw background and fitted text
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = getTextColor(bg);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const lineHeight = Math.ceil(fontSize * 1.15);
  const totalHeight = fittedLines.length * lineHeight;
  let y = size / 2 - totalHeight / 2 + lineHeight / 2;
  for (let i = 0; i < fittedLines.length; i++) {
    ctx.fillText(fittedLines[i], size / 2, y);
    y += lineHeight;
  }

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

// Approximate per-face texture "up" vectors in cube local space to correct text orientation
const faceTextUp = [
  new THREE.Vector3(0, 1, 0), // +x
  new THREE.Vector3(0, 1, 0), // -x
  new THREE.Vector3(0, 0, -1), // +y (top) v points toward -z
  new THREE.Vector3(0, 0, 1), // -y (bottom) v points toward +z
  new THREE.Vector3(0, 1, 0), // +z
  new THREE.Vector3(0, 1, 0), // -z
];

function Dice({ texts, colors, onResult }, ref) {
  const meshRef = useRef();
  const indicatorRef = useRef();
  const animRef = useRef(null);
  const { camera } = useThree();

  const materials = useMemo(() => {
    const mats = new Array(6);
    for (let slot = 0; slot < 6; slot++) {
      const mi = slotToMaterialIndex[slot];
      mats[mi] = new THREE.MeshBasicMaterial({
        map: createTextTexture(texts[slot], colors?.[slot] || "#ffffff"),
      });
    }
    return mats;
  }, [texts, colors]);

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

  const chooseYawForReadable = (materialIndex) => {
    // Evaluate 4 yaw options; pick the one whose texture-up projects most vertically upwards on screen
    let bestTurns = 0;
    let bestScore = -Infinity;
    const centerLocal = faceNormals[materialIndex].clone().multiplyScalar(1.0);
    for (let k = 0; k < 4; k++) {
      const q = quaternionForTopFace(materialIndex, k);
      const upLocal = faceTextUp[materialIndex];
      const centerWorld = centerLocal.clone().applyQuaternion(q);
      const upWorld = upLocal.clone().applyQuaternion(q).normalize();
      const p0 = centerWorld.clone();
      const p1 = centerWorld.clone().add(upWorld.clone().multiplyScalar(0.5));
      const p0N = p0.clone().project(camera);
      const p1N = p1.clone().project(camera);
      const dx = p1N.x - p0N.x;
      const dy = p1N.y - p0N.y;
      const score = dy - Math.abs(dx) * 0.25; // prefer upward and less sideways
      if (score > bestScore) {
        bestScore = score;
        bestTurns = k;
      }
    }
    return bestTurns;
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
        const yawTurns = chooseYawForReadable(topMatIdx);
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
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(2.04, 2.04)]} />
            <lineBasicMaterial color="#10b981" />
          </lineSegments>
        </mesh>
      </mesh>
    </group>
  );
}

const DiceWithRef = forwardRef(Dice);

export default forwardRef(function DiceScene({ texts, colors, onResult }, ref) {
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
      <DiceWithRef
        ref={diceRef}
        texts={texts}
        colors={colors}
        onResult={onResult}
      />
    </Canvas>
  );
});
