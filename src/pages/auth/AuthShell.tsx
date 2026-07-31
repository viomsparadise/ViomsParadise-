import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest-950 lg:block">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1800&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/30 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-ivory">
          <Link to="/" className="font-display text-xl">
            Viom's <span className="italic text-gold">Paradise</span>
          </Link>
          <p className="max-w-sm font-display text-3xl leading-snug">
            Experience Comfort, <em className="italic text-gold">Nature</em>, and Peace.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 block font-display text-xl text-forest-900 lg:hidden">
            Viom's <span className="italic text-gold">Paradise</span>
          </Link>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl text-forest-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-forest-900/60">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-forest-900/60">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
