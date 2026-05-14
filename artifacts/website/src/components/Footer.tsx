import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                V
              </div>
              <span className="font-semibold text-xl tracking-tight">Vital</span>
            </Link>
            <p className="text-background/70 max-w-sm mb-6">
              A simpler, more comfortable way to test for pediatric sleep apnea at home. 
              No wires, no hospitals, just answers.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-background/90">Product</h4>
            <ul className="space-y-3 text-background/70 text-sm">
              <li><Link href="/">How it Works</Link></li>
              <li><Link href="/">The Patch</Link></li>
              <li><Link href="/">Clinical Evidence</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-background/90">Partners</h4>
            <ul className="space-y-3 text-background/70 text-sm">
              <li><Link href="/for-hospitals">For Hospitals</Link></li>
              <li><Link href="/">For Pediatricians</Link></li>
              <li><Link href="/">Revenue Calculator</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50">
          <p>© {new Date().getFullYear()} Vital Health, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/">Privacy Policy</Link>
            <Link href="/">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
