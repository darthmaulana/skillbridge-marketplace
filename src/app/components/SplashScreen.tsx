import { useEffect } from "react";
import { motion } from "motion/react";

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-primary">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M8 32L20 12L26 22L32 16L38 32H8Z" fill="white" opacity="0.9" />
            <circle cx="32" cy="14" r="5" fill="white" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-white text-3xl tracking-tight" style={{ fontWeight: 700 }}>SkillBridge</h1>
          <p className="text-white/75 mt-1 text-sm tracking-wide">Find jobs. Offer skills. Connect safely.</p>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-12 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className={`rounded-full ${i === 0 ? "w-6 bg-white" : "w-2 bg-white/40"} h-2 transition-all`} />
        ))}
      </motion.div>
    </div>
  );
}
