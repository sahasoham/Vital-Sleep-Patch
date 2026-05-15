import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground font-serif font-medium text-lg transition-transform group-hover:scale-105">
                V
              </div>
              <span className="font-serif font-medium text-2xl tracking-tight text-background">Vital</span>
            </Link>
            <p className="text-background/60 max-w-sm mb-8 font-light leading-relaxed text-lg">
              A simpler, more comfortable way to test for pediatric sleep apnea at home. 
              No wires, no hospitals, just answers.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-background mb-6">Product</h4>
            <ul className="space-y-4 text-background/60 text-sm font-light">
              <li><Link href="/" className="hover:text-background transition-colors">How it Works</Link></li>
              <li><Link href="/" className="hover:text-background transition-colors">The Patch</Link></li>
              <li><Link href="/" className="hover:text-background transition-colors">Clinical Evidence</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-background mb-6">Partners</h4>
            <ul className="space-y-4 text-background/60 text-sm font-light">
              <li><Link href="/for-hospitals" className="hover:text-background transition-colors">For Hospitals</Link></li>
              <li><Link href="/" className="hover:text-background transition-colors">For Pediatricians</Link></li>
              <li><Link href="/" className="hover:text-background transition-colors">Revenue Calculator</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-background/40 font-light">
          <p>© {new Date().getFullYear()} Vital Health, Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/" className="hover:text-background/80 transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-background/80 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
