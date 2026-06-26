import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Briefcase, Star, Shield, MapPin, Wifi } from "lucide-react";

const slides = [
  {
    icon: <div className="flex gap-3"><Briefcase size={32} className="text-primary" /><Star size={32} className="text-amber-500" /></div>,
    title: "Post Jobs or Offer Skills",
    body: "Need help with something? Post a job. Have a skill to share? Create a skill post and find clients looking for exactly what you do.",
    highlight: null,
  },
  {
    icon: <div className="flex gap-3"><Wifi size={32} className="text-primary" /><MapPin size={32} className="text-emerald-500" /></div>,
    title: "Work Online or Offline",
    body: "Some jobs can be done remotely over the internet. Others require meeting in person. You can filter and choose what works best for you.",
    highlight: null,
  },
  {
    icon: <Shield size={32} className="text-primary" />,
    title: "Offline Jobs Require Verification",
    body: "For your safety, offline (in-person) jobs require both parties to complete identity verification before contact details are shared.",
    highlight: "Your KTP is only used for verification and is never shown publicly.",
  },
];

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button onClick={onDone} className="text-muted-foreground text-sm px-3 py-1">Skip</button>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28 }}
            className="flex flex-col items-center text-center gap-6"
          >
            <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center">
              {slide.icon}
            </div>
            <h2 className="text-xl text-foreground leading-snug" style={{ fontWeight: 700 }}>{slide.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{slide.body}</p>
            {slide.highlight && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex gap-2 items-start">
                <Shield size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-emerald-700 text-xs text-left leading-relaxed">{slide.highlight}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 py-4">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`rounded-full h-2 transition-all duration-300 ${i === idx ? "w-6 bg-primary" : "w-2 bg-slate-200"}`}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <button
          onClick={() => isLast ? onDone() : setIdx(idx + 1)}
          className="w-full bg-primary text-white rounded-2xl py-4 transition-opacity active:opacity-80"
          style={{ fontWeight: 600 }}
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
