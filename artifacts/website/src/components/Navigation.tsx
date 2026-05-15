import { Link } from "wouter";

export function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background font-serif font-medium text-lg transition-transform group-hover:scale-105">
            V
          </div>
          <span className="font-serif font-medium text-2xl tracking-tight text-foreground">Vital</span>
        </Link>
        <nav className="flex items-center gap-8 text-sm font-medium">
          <Link href="/for-hospitals" className="text-muted-foreground hover:text-foreground transition-colors">
            For Hospitals
          </Link>
          <div className="w-px h-4 bg-border"></div>
          <a href="#waitlist" className="bg-foreground text-background px-6 py-2.5 rounded-full hover:bg-foreground/90 transition-all shadow-sm">
            Join Waitlist
          </a>
        </nav>
      </div>
    </header>
  );
}
