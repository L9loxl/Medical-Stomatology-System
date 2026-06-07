import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const GUM = {
  upperArch: "#d98a8a",
  lowerArch: "#d07f7f",
  upperFloor: "#d98585",
  lowerFloor: "#cf7b7b",
  ridge: "#dd9090",
  collar: "#d98787",
  sheen: "#ff9a9a",
};

export type ToothStatus3D =
  | "healthy" | "decayed" | "filled" | "crowned"
  | "missing" | "implant" | "extracted"
  | "root_canal" | "bridge" | "fractured";

interface ToothDef {
  n: number; angle: number;
  w: number; h: number; d: number;
  jaw: "upper" | "lower";
  type: "central" | "lateral" | "canine" | "premolar1" | "premolar2" | "molar1" | "molar2" | "molar3";
}

const TOOTH_DEFS: ToothDef[] = [
  { n:11, angle:-7,   w:0.44, h:0.94, d:0.28, jaw:"upper", type:"central" },
  { n:12, angle:-22,  w:0.36, h:0.82, d:0.25, jaw:"upper", type:"lateral" },
  { n:13, angle:-38,  w:0.38, h:0.94, d:0.31, jaw:"upper", type:"canine" },
  { n:14, angle:-54,  w:0.42, h:0.70, d:0.45, jaw:"upper", type:"premolar1" },
  { n:15, angle:-67,  w:0.42, h:0.66, d:0.47, jaw:"upper", type:"premolar2" },
  { n:16, angle:-80,  w:0.60, h:0.60, d:0.56, jaw:"upper", type:"molar1" },
  { n:17, angle:-93,  w:0.55, h:0.56, d:0.54, jaw:"upper", type:"molar2" },
  { n:18, angle:-106, w:0.50, h:0.50, d:0.50, jaw:"upper", type:"molar3" },
  { n:21, angle:7,    w:0.44, h:0.94, d:0.28, jaw:"upper", type:"central" },
  { n:22, angle:22,   w:0.36, h:0.82, d:0.25, jaw:"upper", type:"lateral" },
  { n:23, angle:38,   w:0.38, h:0.94, d:0.31, jaw:"upper", type:"canine" },
  { n:24, angle:54,   w:0.42, h:0.70, d:0.45, jaw:"upper", type:"premolar1" },
  { n:25, angle:67,   w:0.42, h:0.66, d:0.47, jaw:"upper", type:"premolar2" },
  { n:26, angle:80,   w:0.60, h:0.60, d:0.56, jaw:"upper", type:"molar1" },
  { n:27, angle:93,   w:0.55, h:0.56, d:0.54, jaw:"upper", type:"molar2" },
  { n:28, angle:106,  w:0.50, h:0.50, d:0.50, jaw:"upper", type:"molar3" },
  { n:41, angle:-7,   w:0.34, h:0.76, d:0.22, jaw:"lower", type:"central" },
  { n:42, angle:-22,  w:0.34, h:0.76, d:0.22, jaw:"lower", type:"lateral" },
  { n:43, angle:-38,  w:0.36, h:0.88, d:0.28, jaw:"lower", type:"canine" },
  { n:44, angle:-54,  w:0.40, h:0.66, d:0.42, jaw:"lower", type:"premolar1" },
  { n:45, angle:-67,  w:0.40, h:0.62, d:0.44, jaw:"lower", type:"premolar2" },
  { n:46, angle:-80,  w:0.58, h:0.56, d:0.56, jaw:"lower", type:"molar1" },
  { n:47, angle:-93,  w:0.54, h:0.52, d:0.52, jaw:"lower", type:"molar2" },
  { n:48, angle:-106, w:0.50, h:0.48, d:0.48, jaw:"lower", type:"molar3" },
  { n:31, angle:7,    w:0.34, h:0.76, d:0.22, jaw:"lower", type:"central" },
  { n:32, angle:22,   w:0.34, h:0.76, d:0.22, jaw:"lower", type:"lateral" },
  { n:33, angle:38,   w:0.36, h:0.88, d:0.28, jaw:"lower", type:"canine" },
  { n:34, angle:54,   w:0.40, h:0.66, d:0.42, jaw:"lower", type:"premolar1" },
  { n:35, angle:67,   w:0.40, h:0.62, d:0.44, jaw:"lower", type:"premolar2" },
  { n:36, angle:80,   w:0.58, h:0.56, d:0.56, jaw:"lower", type:"molar1" },
  { n:37, angle:93,   w:0.54, h:0.52, d:0.52, jaw:"lower", type:"molar2" },
  { n:38, angle:106,  w:0.50, h:0.48, d:0.48, jaw:"lower", type:"molar3" },
];

const ARCH = {
  upper: { a: 3.15, b: 2.5, y: 0.92 },
  lower: { a: 2.85, b: 2.2, y: -0.92 },
};

const STATUS_HEX: Record<string, string | null> = {
  healthy:    "#f5efd0",
  decayed:    "#c0192c",
  filled:     "#d97706",
  crowned:    "#7c3aed",
  missing:    null,
  implant:    "#71717a",
  extracted:  null,
  root_canal: "#c2410c",
  bridge:     "#0369a1",
  fractured:  "#991b1b",
};

function toothPos(angle: number, jaw: "upper" | "lower"): THREE.Vector3 {
  const rad = (angle * Math.PI) / 180;
  const { a, b, y } = ARCH[jaw];
  return new THREE.Vector3(a * Math.sin(rad), y, b * Math.cos(rad));
}

function Tooth({
  def, status, selected, hovered, onClick, onOver, onOut,
}: {
  def: ToothDef; status: ToothStatus3D; selected: boolean; hovered: boolean;
  onClick: () => void; onOver: () => void; onOut: () => void;
}) {
  const hex = STATUS_HEX[status];
  if (!hex) return null;

  const pos = toothPos(def.angle, def.jaw);
  const rotY = -(def.angle * Math.PI) / 180;

  const baseColor = useMemo(() => new THREE.Color(hex), [hex]);
  const matColor = useMemo(() => {
    const c = baseColor.clone();
    if (selected) c.set("#fbbf24");
    else if (hovered) c.multiplyScalar(1.18);
    return c;
  }, [baseColor, selected, hovered]);

  const crownY = def.jaw === "upper" ? pos.y - def.h * 0.28 : pos.y + def.h * 0.28;
  const biteY  = def.jaw === "upper" ? -def.h * 0.52 : def.h * 0.52;
  const isMolar   = def.type.startsWith("molar");
  const isPremolar = def.type.startsWith("premolar");
  const isCanine   = def.type === "canine";
  const isIncisor  = def.type === "central" || def.type === "lateral";

  const roughness = status === "crowned" ? 0.1
    : status === "implant" ? 0.4
    : isIncisor ? 0.15 : 0.2;
  const metalness = status === "crowned" ? 0.12
    : status === "implant" ? 0.5 : 0.03;

  const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); };
  const handleOver  = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onOver(); };
  const handleOut   = () => onOut();

  const collarY = def.jaw === "upper" ? def.h * 0.28 : -def.h * 0.28;
  const collarR = Math.max(def.w, def.d) * 0.58;

  return (
    <group position={[pos.x, crownY, pos.z]} rotation={[0, rotY, 0]}>
      {/* Gum collar hugging the tooth at the gingival margin (scalloped gumline) */}
      {status !== "implant" && (
        <mesh position={[0, collarY, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[collarR, 0.075, 10, 24]} />
          <meshPhysicalMaterial
            color={GUM.collar}
            roughness={0.6}
            clearcoat={0.45}
            clearcoatRoughness={0.5}
            sheen={0.5}
            sheenColor={GUM.sheen}
            sheenRoughness={0.7}
          />
        </mesh>
      )}

      {/* Crown body */}
      <mesh onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut} castShadow receiveShadow>
        <boxGeometry args={[def.w, def.h, def.d]} />
        <meshStandardMaterial color={matColor} roughness={roughness} metalness={metalness} envMapIntensity={1.4} />
      </mesh>

      {/* Molar / premolar cusps */}
      {(isMolar || isPremolar) && (
        <>
          {[
            [-def.w * 0.25, biteY, -def.d * 0.22],
            [ def.w * 0.25, biteY, -def.d * 0.22],
            [-def.w * 0.25, biteY,  def.d * 0.22],
            [ def.w * 0.25, biteY,  def.d * 0.22],
          ].map(([cx, cy, cz], i) => (
            <mesh key={i} position={[cx as number, cy as number, cz as number]} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
              <sphereGeometry args={[isMolar ? 0.068 : 0.055, 8, 6]} />
              <meshStandardMaterial color={matColor} roughness={roughness} metalness={metalness} />
            </mesh>
          ))}
        </>
      )}

      {/* Canine cusp */}
      {isCanine && (
        <mesh
          position={[0, biteY, 0]}
          rotation={[def.jaw === "upper" ? Math.PI : 0, 0, 0]}
          onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}
        >
          <coneGeometry args={[0.09, 0.18, 6]} />
          <meshStandardMaterial color={matColor} roughness={roughness + 0.05} metalness={metalness} />
        </mesh>
      )}

      {/* Incisor edge highlight */}
      {isIncisor && (
        <mesh position={[0, biteY * 0.96, 0]} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
          <boxGeometry args={[def.w * 0.88, 0.045, def.d * 0.72]} />
          <meshStandardMaterial color={matColor} roughness={0.1} metalness={0.08} />
        </mesh>
      )}

      {/* Implant indicator */}
      {status === "implant" && (
        <mesh position={[0, def.jaw === "upper" ? def.h * 0.4 : -def.h * 0.4, 0]}>
          <cylinderGeometry args={[def.w * 0.18, def.w * 0.22, def.h * 0.6, 8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
        </mesh>
      )}

      {/* Fracture line on fractured tooth */}
      {status === "fractured" && (
        <mesh position={[0, 0, def.d * 0.51]}>
          <planeGeometry args={[def.w * 0.7, def.h * 0.5]} />
          <meshStandardMaterial color="#6b0f0f" roughness={1} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover label */}
      {hovered && (
        <Html distanceFactor={7} center position={[0, def.jaw === "upper" ? def.h * 0.7 : -def.h * 0.7, 0]}>
          <div style={{
            background: "rgba(0,0,0,0.85)", color: "#fff", fontSize: 12,
            padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap",
            pointerEvents: "none", fontFamily: "Inter, sans-serif",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            #{def.n} · {status.replace("_", " ")}
          </div>
        </Html>
      )}
    </group>
  );
}

function GumArch({ jaw }: { jaw: "upper" | "lower" }) {
  const curve = useMemo(() => {
    const { a, b, y } = ARCH[jaw];
    const pts: THREE.Vector3[] = [];
    for (let deg = -112; deg <= 112; deg += 2.5) {
      const rad = (deg * Math.PI) / 180;
      pts.push(new THREE.Vector3(a * Math.sin(rad), y, b * Math.cos(rad)));
    }
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  }, [jaw]);

  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 160, 0.4, 20, false]} />
      <meshPhysicalMaterial
        color={jaw === "upper" ? GUM.upperArch : GUM.lowerArch}
        roughness={0.62}
        clearcoat={0.4}
        clearcoatRoughness={0.5}
        sheen={0.55}
        sheenColor={GUM.sheen}
        sheenRoughness={0.7}
      />
    </mesh>
  );
}

function GumFloor({ jaw }: { jaw: "upper" | "lower" }) {
  const geometry = useMemo(() => {
    const { a, b, y } = ARCH[jaw];
    const innerScale = 0.78;
    const geo = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    for (let deg = -112; deg <= 112; deg += 4) {
      const rad = (deg * Math.PI) / 180;
      pts.push(new THREE.Vector3(a * innerScale * Math.sin(rad), y + (jaw === "upper" ? 0.05 : -0.05), b * innerScale * Math.cos(rad)));
    }
    const center = new THREE.Vector3(0, y + (jaw === "upper" ? 0.06 : -0.06), 0);
    const verts: number[] = [center.x, center.y, center.z];
    pts.forEach(p => verts.push(p.x, p.y, p.z));
    const idx: number[] = [];
    for (let i = 1; i < pts.length; i++) idx.push(0, i, i + 1);
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, [jaw]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshPhysicalMaterial
        color={jaw === "upper" ? GUM.upperFloor : GUM.lowerFloor}
        roughness={0.68}
        clearcoat={0.3}
        clearcoatRoughness={0.55}
        sheen={0.4}
        sheenColor={GUM.sheen}
        sheenRoughness={0.75}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function GumRidge({ jaw }: { jaw: "upper" | "lower" }) {
  const curve = useMemo(() => {
    const { a, b, y } = ARCH[jaw];
    const ridgeY = y + (jaw === "upper" ? -0.28 : 0.28);
    const pts: THREE.Vector3[] = [];
    for (let deg = -112; deg <= 112; deg += 3) {
      const rad = (deg * Math.PI) / 180;
      pts.push(new THREE.Vector3(a * 0.86 * Math.sin(rad), ridgeY, b * 0.86 * Math.cos(rad)));
    }
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  }, [jaw]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 140, 0.15, 14, false]} />
      <meshPhysicalMaterial
        color={GUM.ridge}
        roughness={0.6}
        clearcoat={0.4}
        clearcoatRoughness={0.5}
        sheen={0.5}
        sheenColor={GUM.sheen}
        sheenRoughness={0.7}
      />
    </mesh>
  );
}

function Scene({
  chartData, selectedTooth, onToothClick,
}: {
  chartData: Array<{ toothNumber: number; status: string }>;
  selectedTooth: number | null;
  onToothClick: (n: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const getStatus = (n: number): ToothStatus3D =>
    (chartData.find(e => e.toothNumber === n)?.status as ToothStatus3D) ?? "healthy";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.8, 9.5]} fov={36} />
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={18}
        maxPolarAngle={Math.PI * 0.82}
        target={[0, 0, 1.4]}
        autoRotate
        autoRotateSpeed={0.7}
      />

      {/* Lighting */}
      <ambientLight intensity={0.45} color="#fff5f5" />
      <directionalLight position={[0, 9, 7]} intensity={1.8} castShadow color="#ffffff"
        shadow-mapSize={[2048, 2048]} shadow-camera-far={30} />
      <directionalLight position={[-5, 3, 5]} intensity={0.55} color="#ffe0e8" />
      <directionalLight position={[5, 3, 5]} intensity={0.55} color="#ffe0e8" />
      <pointLight position={[0, -4, 3]} intensity={0.4} color="#ffd0d8" />
      <pointLight position={[0, 5, -2]} intensity={0.2} color="#c0d0ff" />
      <hemisphereLight args={["#fff0f3", "#2a1a30", 0.6]} />

      {/* Gum geometry */}
      <GumArch jaw="upper" />
      <GumArch jaw="lower" />
      <GumFloor jaw="upper" />
      <GumFloor jaw="lower" />
      <GumRidge jaw="upper" />
      <GumRidge jaw="lower" />

      {/* Teeth */}
      {TOOTH_DEFS.map(def => (
        <Tooth
          key={def.n}
          def={def}
          status={getStatus(def.n)}
          selected={selectedTooth === def.n}
          hovered={hovered === def.n}
          onClick={() => onToothClick(def.n)}
          onOver={() => setHovered(def.n)}
          onOut={() => setHovered(null)}
        />
      ))}
    </>
  );
}

interface Props {
  chartData: Array<{ toothNumber: number; status: string }>;
  selectedTooth?: number | null;
  onToothClick?: (n: number) => void;
  height?: number;
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function DentalChart3D({ chartData, selectedTooth = null, onToothClick, height = 480 }: Props) {
  const { t } = useI18n();
  const [webglOk] = useState(() => isWebGLAvailable());

  if (!webglOk) {
    return (
      <div
        className="w-full rounded-xl overflow-hidden bg-gradient-to-b from-[#1a1025] to-[#0d0818] flex items-center justify-center text-center px-6"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground max-w-xs">{t.webglUnavailable}</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden bg-gradient-to-b from-[#1a1025] to-[#0d0818]" style={{ height }}>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">{t.loading3D}</p>
          </div>
        </div>
      }>
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
          <Scene
            chartData={chartData}
            selectedTooth={selectedTooth}
            onToothClick={onToothClick ?? (() => {})}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
