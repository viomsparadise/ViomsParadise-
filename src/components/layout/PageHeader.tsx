import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  image,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
}) {
  return (
    <section className={cn("relative flex min-h-[52vh] items-end overflow-hidden bg-forest-900 pt-24", className)}>
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/20" />
        </>
      )}
      <div className="container-luxe relative z-10 pb-16">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="eyebrow text-gold">
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 max-w-2xl text-balance font-display text-4xl text-ivory sm:text-5xl lg:text-6xl"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-xl text-balance text-ivory/70"
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  );
}
