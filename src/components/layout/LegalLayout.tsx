import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

export function LegalLayout({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={`Last updated: ${updated}`} />
      <section className="bg-ivory py-16 sm:py-24">
        <div className="container-luxe max-w-3xl space-y-8 leading-relaxed text-forest-900/75">{children}</div>
      </section>
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-forest-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px]">{children}</div>
    </div>
  );
}
