import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import { useGetWaitlistCount } from "@workspace/api-client-react";
import { ArrowRight, Check, Shield, Activity, Clock } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const { data: countData } = useGetWaitlistCount();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-20 selection:bg-primary selection:text-primary-foreground">
      <Navigation />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background pt-24 pb-32 lg:pt-40 lg:pb-48">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
              <motion.div 
                className="flex-1 text-center lg:text-left z-10"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 border border-secondary-border">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-30"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
                  </span>
                  Coming Soon
                </motion.div>
                <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-serif tracking-tight text-foreground mb-8 leading-[1.1]">
                  Finally, a sleep study for your child, <span style={{ color: "#7c3bede6" }}>at home, not at the hospital.</span>
                </motion.h1>
                <motion.p variants={fadeIn} className="text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
                  The Vital Patch is a simple, wire-free adhesive that tests for sleep apnea while your child sleeps comfortably in their own bed.
                </motion.p>
                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                  <a href="#waitlist" className="bg-foreground text-background px-10 py-5 rounded-full font-medium text-lg hover:bg-foreground/90 transition-all hover:scale-[1.02] inline-flex items-center gap-3 shadow-lg">
                    Join the waitlist <ArrowRight className="w-5 h-5" />
                  </a>
                  {(countData?.count ?? 0) > 0 && (
                    <p className="text-sm font-medium text-muted-foreground bg-white/50 px-4 py-2 rounded-full border border-border/50">
                      Join <span className="text-foreground font-semibold">{countData?.count}</span> parents waiting
                    </p>
                  )}
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex-1 w-full max-w-xl relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              >
                <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl relative bg-muted ring-1 ring-border/50">
                  <img 
                    src="/images/sleeping-child.png" 
                    alt="Peaceful sleeping child" 
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-multiply"></div>
                </div>
                {/* Floating element */}
                <motion.div 
                  className="absolute -bottom-8 -left-8 bg-white p-5 rounded-2xl shadow-xl flex items-center gap-5 border border-border/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <Activity className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Clinical Grade</p>
                    <p className="text-sm text-muted-foreground">Zero hospital cables</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div 
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeIn} className="text-4xl lg:text-5xl font-serif mb-6 text-foreground">The current process is broken.</motion.h2>
              <motion.p variants={fadeIn} className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Suspect your child has sleep apnea? Right now, that means waiting 6-9 months for a hospital bed, then watching them try to sleep covered in 20+ uncomfortable wires and sensors. It's stressful and no longer necessary.
              </motion.p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                { stat: "6+ Months", title: "Long Wait Times", desc: "Average wait time for an overnight pediatric sleep study in a hospital." },
                { stat: "20+ Wires", title: "Uncomfortable", desc: "The number of cables and sensors attached to a child during a traditional study." },
                { stat: "Poor Sleep", title: "Inconclusive", desc: "Children rarely sleep normally in hospitals, leading to inconclusive results." }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeIn} className="bg-background p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-foreground font-serif text-3xl mb-4">{item.stat}</div>
                  <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-32 bg-secondary/30">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col md:flex-row items-center gap-20">
              <motion.div 
                className="flex-1 relative order-2 md:order-1"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              >
                <div className="absolute inset-0 bg-white/50 rounded-full blur-3xl opacity-50"></div>
                <img 
                  src="/images/vital-patch.png" 
                  alt="Vital Sleep Patch Product" 
                  className="relative z-10 w-full max-w-md mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                />
              </motion.div>
              <motion.div 
                className="flex-1 order-1 md:order-2"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2 variants={fadeIn} className="text-4xl lg:text-5xl font-serif mb-8 text-foreground leading-tight">
                  A single patch. <br/>Clinical-grade results.
                </motion.h2>
                <motion.p variants={fadeIn} className="text-xl text-muted-foreground mb-10 font-light leading-relaxed">
                  The Vital Patch uses advanced micro-sensors to monitor breathing, oxygen levels, and heart rate all from a single, soft adhesive patch placed on the chest.
                </motion.p>
                
                <motion.ul variants={staggerContainer} className="space-y-6">
                  {[
                    "FDA-cleared accuracy for pediatric diagnosis",
                    "Soft, breathable, skin-friendly medical adhesive",
                    "Child sleeps in their own bed, in their own home",
                    "Results sent securely to your pediatrician in 24 hours"
                  ].map((feature, i) => (
                    <motion.li key={i} variants={fadeIn} className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Check className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-foreground/90 text-lg font-medium">{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-32 bg-foreground text-background">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div 
              className="text-center max-w-2xl mx-auto mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl lg:text-5xl font-serif mb-6 text-background">How it works</h2>
              <p className="text-background/80 text-xl font-light">Three simple steps to getting the answers you need.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-background/20"></div>
              
              {[
                { step: "1", title: "Order the Kit", desc: "Prescribed by your doctor or ordered directly, the kit arrives at your door in days." },
                { step: "2", title: "Apply at Bedtime", desc: "Simply place the soft patch on your child's chest before sleep. No wires to tangle." },
                { step: "3", title: "Get Answers", desc: "Remove in the morning. A detailed clinical report is securely generated for your doctor." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="text-center relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                >
                  <div className="w-24 h-24 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center text-3xl font-serif text-background mx-auto mb-8 border border-background/20 shadow-xl">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-serif mb-4 text-background">{item.title}</h3>
                  <p className="text-background/70 leading-relaxed font-light text-lg">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Hospital CTA */}
        <section className="py-16 border-y border-border bg-background">
          <div className="container mx-auto px-6">
            <div className="bg-secondary/50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto border border-secondary">
              <div>
                <h3 className="font-serif text-2xl mb-2 text-foreground">Are you a hospital administrator?</h3>
                <p className="text-muted-foreground text-lg font-light">See how Vital can reduce your waitlist and open new revenue streams.</p>
              </div>
              <Link href="/for-hospitals" className="px-8 py-4 bg-white text-foreground border border-border shadow-sm font-medium rounded-full hover:bg-background transition-colors shrink-0">
                Calculate Revenue Upside
              </Link>
            </div>
          </div>
        </section>

        {/* Waitlist Section */}
        <section id="waitlist" className="py-32 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
              <motion.div 
                className="flex-1"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl lg:text-6xl font-serif mb-8 text-foreground leading-[1.1]">Sleep better,<br/>sooner.</h2>
                <p className="text-xl text-muted-foreground mb-10 font-light leading-relaxed max-w-md">
                  We're launching soon. Request an invitation to secure early access and help us transform pediatric sleep care.
                </p>
                <div className="flex flex-wrap items-center gap-8 text-sm font-medium text-foreground/80">
                  <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-foreground/60" /> Secure Data</div>
                  <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-foreground/60" /> Clinical Grade</div>
                  <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-foreground/60" /> 24hr Results</div>
                </div>
              </motion.div>
              <motion.div 
                className="flex-1 w-full flex justify-center lg:justify-end"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <WaitlistForm />
              </motion.div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
