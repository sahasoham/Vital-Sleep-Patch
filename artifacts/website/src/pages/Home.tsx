import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import { useGetWaitlistCount } from "@workspace/api-client-react";
import { ArrowRight, CheckCircle2, Shield, HeartPulse, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: countData } = useGetWaitlistCount();

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navigation />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background py-20 lg:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10"></div>
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Coming Soon
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                  Finally, a pediatric sleep study <span className="text-primary">at home, not at the hospital.</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                  The Vital Patch is a simple, wire-free adhesive that tests for sleep apnea while your child sleeps comfortably in their own bed.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <a href="#waitlist" className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary/90 transition-transform hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-primary/20">
                    Join the waitlist <ArrowRight className="w-5 h-5" />
                  </a>
                  {countData?.count && countData.count > 0 && (
                    <p className="text-sm font-medium text-muted-foreground">
                      Join <span className="text-foreground">{countData.count}</span> parents waiting
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full max-w-lg relative">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative bg-muted">
                  <img 
                    src="/images/sleeping-child.png" 
                    alt="Peaceful sleeping child" 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                {/* Floating element */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-border animate-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <HeartPulse className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Wire-free comfort</p>
                    <p className="text-xs text-muted-foreground">Zero hospital cables</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-24 bg-muted/50 border-y border-border">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">The current process is broken.</h2>
            <p className="text-lg text-muted-foreground mb-12">
              Suspect your child has sleep apnea? Right now, that means waiting 6-9 months for a hospital bed, then watching them try to sleep covered in 20+ uncomfortable wires and sensors. It's stressful, inaccurate, and outdated.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                <div className="text-destructive font-bold text-xl mb-2">6+ Months</div>
                <p className="text-muted-foreground">Average wait time for an overnight pediatric sleep study in a hospital.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                <div className="text-destructive font-bold text-xl mb-2">20+ Wires</div>
                <p className="text-muted-foreground">The number of cables and sensors attached to a child during a traditional study.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                <div className="text-destructive font-bold text-xl mb-2">Poor Sleep</div>
                <p className="text-muted-foreground">Children rarely sleep normally in hospitals, leading to inconclusive results.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 relative order-2 md:order-1">
                <div className="absolute inset-0 bg-accent rounded-full blur-3xl opacity-50"></div>
                <img 
                  src="/images/vital-patch.png" 
                  alt="Vital Sleep Patch Product" 
                  className="relative z-10 w-full max-w-md mx-auto drop-shadow-2xl"
                />
              </div>
              <div className="flex-1 order-1 md:order-2">
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">A single patch. <br/>Clinical-grade results.</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  The Vital Patch uses advanced micro-sensors to monitor breathing, oxygen levels, and heart rate all from a single, soft adhesive patch placed on the chest.
                </p>
                
                <ul className="space-y-4">
                  {[
                    "FDA-cleared accuracy for pediatric diagnosis",
                    "Soft, breathable, skin-friendly medical adhesive",
                    "Child sleeps in their own bed, in their own home",
                    "Results sent securely to your pediatrician in 24 hours"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                      <span className="text-foreground font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-secondary-foreground/70 text-lg">Three simple steps to getting the answers you need.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-6">1</div>
                <h3 className="text-xl font-bold mb-3">Order the Kit</h3>
                <p className="text-secondary-foreground/70">Prescribed by your doctor or ordered directly, the kit arrives at your door in days.</p>
              </div>
              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-6">2</div>
                <h3 className="text-xl font-bold mb-3">Apply at Bedtime</h3>
                <p className="text-secondary-foreground/70">Simply place the soft patch on your child's abdomen before sleep. No wires to tangle.</p>
              </div>
              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-6">3</div>
                <h3 className="text-xl font-bold mb-3">Get Answers</h3>
                <p className="text-secondary-foreground/70">Remove in the morning. A detailed clinical report is securely generated for your doctor.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hospital CTA */}
        <section className="py-12 border-y border-border bg-muted/30">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl">
            <div>
              <h3 className="font-bold text-lg">Are you a hospital administrator?</h3>
              <p className="text-muted-foreground text-sm">See how Vital can reduce your waitlist and open new revenue streams.</p>
            </div>
            <Link href="/for-hospitals" className="px-6 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors shrink-0">
              Calculate Revenue Upside
            </Link>
          </div>
        </section>

        {/* Waitlist Section */}
        <section id="waitlist" className="py-24 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/20 -z-10 skew-y-3 transform origin-bottom-right"></div>
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-3xl lg:text-5xl font-bold mb-6">Sleep better, sooner.</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  We're launching soon. Join the waitlist to secure early access and help us transform pediatric sleep care.
                </p>
                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Secure</div>
                  <div className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-primary" /> Clinical Grade</div>
                </div>
              </div>
              <div className="flex-1 w-full flex justify-center md:justify-end">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
