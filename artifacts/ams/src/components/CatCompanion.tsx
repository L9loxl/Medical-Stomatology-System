import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * A small white-coat cat that periodically strolls across the bottom of the app
 * "exploring" the page. Purely decorative — never intercepts pointer events.
 */
export default function CatCompanion() {
  const controls = useAnimationControls();
  const [flip, setFlip] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const vw = () => window.innerWidth;
    const tripMs = 17000;

    (async function loop() {
      // small initial delay so it doesn't appear instantly on load
      await wait(4000);
      while (aliveRef.current) {
        // walk left -> right
        setFlip(false);
        controls.set({ x: -90 });
        await controls.start({ x: vw() + 30, transition: { duration: tripMs / 1000, ease: "linear" } });
        if (!aliveRef.current) break;
        await wait(9000);
        if (!aliveRef.current) break;
        // walk right -> left
        setFlip(true);
        controls.set({ x: vw() + 30 });
        await controls.start({ x: -90, transition: { duration: tripMs / 1000, ease: "linear" } });
        if (!aliveRef.current) break;
        await wait(11000);
      }
    })();

    return () => {
      aliveRef.current = false;
      controls.stop();
    };
  }, [controls]);

  return (
    <motion.div
      className="fixed bottom-2 left-0 z-30 pointer-events-none"
      animate={controls}
      initial={{ x: -90 }}
      aria-hidden
    >
      <motion.div animate={{ y: [0, -1.5, 0] }} transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}>
        <svg
          width="62"
          height="48"
          viewBox="0 0 72 54"
          style={{ transform: flip ? "scaleX(-1)" : "none", overflow: "visible" }}
        >
          {/* Tail (wags) */}
          <motion.path
            d="M10 34 C 0 30, 2 18, 10 20"
            fill="none"
            stroke="#e6ebf3"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ transformOrigin: "10px 32px" }}
            animate={{ rotate: [0, 18, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Back legs (stepping) */}
          <motion.rect
            x="18" y="36" width="5" height="13" rx="2.5" fill="#dfe6f0"
            style={{ transformOrigin: "20px 36px" }}
            animate={{ rotate: [12, -12, 12] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.rect
            x="26" y="36" width="5" height="13" rx="2.5" fill="#cfd8e6"
            style={{ transformOrigin: "28px 36px" }}
            animate={{ rotate: [-12, 12, -12] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Front legs (stepping, opposite phase) */}
          <motion.rect
            x="44" y="36" width="5" height="13" rx="2.5" fill="#dfe6f0"
            style={{ transformOrigin: "46px 36px" }}
            animate={{ rotate: [-12, 12, -12] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.rect
            x="52" y="36" width="5" height="13" rx="2.5" fill="#cfd8e6"
            style={{ transformOrigin: "54px 36px" }}
            animate={{ rotate: [12, -12, 12] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Body */}
          <ellipse cx="36" cy="30" rx="26" ry="13" fill="#ffffff" stroke="#dbe2ec" strokeWidth="1.5" />
          {/* Collar (accent) */}
          <path d="M50 24 Q55 30 50 36" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />

          {/* Head */}
          <circle cx="57" cy="22" r="12" fill="#ffffff" stroke="#dbe2ec" strokeWidth="1.5" />
          {/* Ears */}
          <path d="M49 13 L47 4 L56 10 Z" fill="#ffffff" stroke="#dbe2ec" strokeWidth="1.2" />
          <path d="M65 13 L68 4 L59 10 Z" fill="#ffffff" stroke="#dbe2ec" strokeWidth="1.2" />
          <path d="M50 12 L49 7 L54 10 Z" fill="#ffc9d4" />
          <path d="M64 12 L66 7 L60 10 Z" fill="#ffc9d4" />
          {/* Eye */}
          <circle cx="61" cy="21" r="2.3" fill="#27313f" />
          {/* Nose */}
          <path d="M67 23 l3 1.5 l-3 1.5 Z" fill="#ff8fa3" />
          {/* Whiskers */}
          <g stroke="#cdd6e3" strokeWidth="1" strokeLinecap="round">
            <path d="M66 25 L74 24" />
            <path d="M66 27 L74 28.5" />
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
