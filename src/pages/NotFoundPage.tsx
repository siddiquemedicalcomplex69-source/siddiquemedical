import { Link } from "react-router-dom";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-14 text-center max-w-md w-full">
          <h1 className="text-6xl font-bold text-[#14b8a6]">404</h1>
          <h2 className="mt-4 text-2xl font-bold text-[#0b1f3a]">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find the page you were looking for. It might have been moved or doesn't exist.
          </p>
          <Button asChild className="mt-8 bg-[#14b8a6] hover:bg-[#0d9488] btn-shimmer hover:scale-105 active:scale-95 transition-all duration-300 text-white w-full">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
