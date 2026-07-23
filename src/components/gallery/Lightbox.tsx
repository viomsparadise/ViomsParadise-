import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-950/95 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <button aria-label="Close" className="absolute right-5 top-5 text-ivory/70 hover:text-ivory" onClick={onClose}>
            <X className="h-7 w-7" />
          </button>
          <button
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory/70 hover:text-ivory sm:left-8"
            onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); }}
          >
            <ChevronLeft className="h-9 w-9" />
          </button>
          <motion.img
            key={index}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            src={images[index]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-luxury"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/70 hover:text-ivory sm:right-8"
            onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % images.length); }}
          >
            <ChevronRight className="h-9 w-9" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
