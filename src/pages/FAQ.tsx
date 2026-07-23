import { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { useFaqs } from "@/hooks/useContent";
import { cn } from "@/lib/utils";

export default function FAQ() {
  const { faqs } = useFaqs();
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <>
      <PageHeader eyebrow="Good to Know" title="Frequently Asked Questions" description="Everything guests usually want to know before booking." />

      <section className="bg-ivory py-16 sm:py-24">
        <div className="container-luxe max-w-3xl">
          <div className="divide-y divide-forest-900/10 border-y border-forest-900/10">
            {faqs.map((f) => {
              const isOpen = open === f.id;
              return (
                <div key={f.id}>
                  <button
                    onClick={() => setOpen(isOpen ? null : f.id)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="font-display text-lg text-forest-900">{f.question}</span>
                    <Plus className={cn("h-5 w-5 shrink-0 text-gold transition-transform", isOpen && "rotate-45")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 leading-relaxed text-forest-900/65">{f.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
