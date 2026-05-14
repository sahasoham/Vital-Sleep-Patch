import { Link } from "wouter";

export function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="font-semibold text-lg tracking-tight">Vital</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/for-hospitals" className="text-muted-foreground hover:text-foreground transition-colors">
            For Hospitals
          </Link>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors">
            Join Waitlist
          </button>
        </nav>
      </div>
    </header>
  );
}
