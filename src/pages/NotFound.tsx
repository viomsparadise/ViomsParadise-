import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-24 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-4xl text-forest-900">This path doesn't lead anywhere.</h1>
        <p className="mt-3 max-w-sm text-forest-900/60">The page you're looking for may have been moved or no longer exists.</p>
        <Link to="/" className="mt-8">
          <Button variant="gold" size="lg">Back to Home</Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
