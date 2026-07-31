import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/img/img1.jpg";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-forest-950">
      <img
        src={heroImage}
        alt="Viom's Paradise nestled in misted tea garden hills"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/50 to-forest-950/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950/60 via-transparent to-transparent" />

      <div className="container-luxe relative z-10 flex w-full flex-col gap-10 pb-20 pt-40 md:pb-28">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          <p className="eyebrow text-gold">Private Homestay · Eastern Himalayan Foothills</p>
          <h1 className="mt-5 max-w-3xl text-balance font-display text-5xl font-normal leading-[1.05] text-ivory sm:text-6xl lg:text-7xl">
            Experience Comfort, <em className="italic text-gold">Nature</em>, and Peace.
          </h1>
          <p className="mt-6 max-w-lg text-balance text-base leading-relaxed text-ivory/70 sm:text-lg">
            Viom's Paradise is a private homestay folded into the tea gardens above Siliguri —
            two bedrooms and a full kitchen, all to yourselves, with nothing to do but slow down.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center gap-4"
        >
          <Link to="/booking">
            <Button variant="gold" size="lg">Book Your Stay</Button>
          </Link>
          <Link to="/about">
            <Button variant="outlineLight" size="lg">Discover the Property</Button>
          </Link>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-ivory/50"
      >
        <ArrowDown className="h-5 w-5" />
      </motion.div>
    </section>
  );
}
