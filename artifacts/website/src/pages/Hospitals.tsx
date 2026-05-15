import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useRequestDemo } from "@workspace/api-client-react";

const DEFAULTS = {
  psg_volume: 1000,
  waitlist: 500,
  eligibility: 60,
  interp_fee: 200,
  consult_fee: 300,
  referral_rate: 60,
  treatment_rev: 4000,
  monitoring_rev: 250,
  years: 3,
};

function fmt(n: number) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'K';
  return '$' + Math.round(n).toLocaleString();
}

function fmtFull(n: number) {
  return '$' + Math.round(n).toLocaleString();
}

function pct(n: number) {
  return (n * 100).toFixed(0) + '%';
}

function num(n: number) {
  return Math.round(n).toLocaleString();
}

export default function Hospitals() {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [inputs, setInputs] = useState(DEFAULTS);
  const [demoForm, setDemoForm] = useState({ name: "", email: "", institution: "", jobTitle: "" });
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const demoMutation = useRequestDemo();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleInputChange = (id: keyof typeof DEFAULTS, value: string) => {
    const parsed = parseFloat(value);
    setInputs(prev => ({
      ...prev,
      [id]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleBlur = (id: keyof typeof DEFAULTS) => {
    if (inputs[id] === 0 || isNaN(inputs[id])) {
      setInputs(prev => ({ ...prev, [id]: DEFAULTS[id] }));
    }
  };

  const calculate = () => {
    const vitalTests = inputs.waitlist * (inputs.eligibility / 100);
    const interpRevenue = vitalTests * inputs.interp_fee;
    const consultRevenue = vitalTests * inputs.consult_fee;
    const treatRevenue = vitalTests * (inputs.referral_rate / 100) * inputs.treatment_rev;
    const monitorRevenue = vitalTests * inputs.monitoring_rev * inputs.years;
    const total = interpRevenue + consultRevenue + treatRevenue + monitorRevenue;

    return { vitalTests, interpRevenue, consultRevenue, treatRevenue, monitorRevenue, total };
  };

  const startOver = () => {
    setInputs(DEFAULTS);
    setCurrentScreen(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const c = calculate();
  const annual = c.interpRevenue + c.consultRevenue + c.treatRevenue + (c.vitalTests * inputs.monitoring_rev);

  const chartData = [
    { name: 'Interpretation', value: c.interpRevenue, fill: 'hsl(var(--primary))' },
    { name: 'Follow-Up Consult', value: c.consultRevenue, fill: 'hsl(var(--primary))' }, // Different shade could be used
    { name: 'Downstream Treatment', value: c.treatRevenue, fill: 'hsl(var(--secondary))' },
    { name: 'Monitoring', value: c.monitorRevenue, fill: 'hsl(var(--primary) / 0.6)' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-secondary text-foreground-foreground p-3 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-sm mb-1">{payload[0].payload.name}</p>
          <p className="font-bold text-lg">{fmtFull(payload[0].value)} <span className="text-xs font-normal opacity-70">({((payload[0].value / c.total) * 100).toFixed(0)}%)</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-muted/30">
      <Navigation />
      
      {/* Header */}
      <div className="bg-secondary text-foreground-foreground py-8">
        <div className="container mx-auto px-4 max-w-4xl flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">V</div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Vital Sleep Patch</h1>
            <p className="text-foreground-foreground/60 text-sm">AMC Revenue Upside Calculator</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-background border-b border-border sticky top-16 z-40">
        <div className="container mx-auto px-4 max-w-4xl flex">
          {[
            { num: 1, title: "Your Lab", sub: "Current capacity" },
            { num: 2, title: "Revenue Inputs", sub: "Fees & downstream" },
            { num: 3, title: "Results", sub: "Your upside" }
          ].map((step) => (
            <div key={step.num} className="flex-1 py-4 flex items-center gap-3 relative pr-4">
              {step.num !== 3 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-border hidden sm:block"></div>
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                currentScreen === step.num ? 'bg-primary text-primary-foreground' : 
                currentScreen > step.num ? 'bg-secondary text-foreground-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step.num}
              </div>
              <div className="hidden sm:block">
                <div className={`text-sm leading-tight transition-colors ${
                  currentScreen === step.num ? 'text-primary font-bold' : 
                  currentScreen > step.num ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}>{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 max-w-3xl py-12">
        {currentScreen === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <div className="text-xs font-bold tracking-widest uppercase text-primary mb-2">Step 1 of 3</div>
              <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Tell us about your lab today</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Vital Sleep Patch creates a <strong>parallel pathway</strong> for children on your waitlist — 
                your existing in-lab PSG program continues at full capacity. Let's start with where you are now.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Current Lab Capacity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="psg_volume" className="block text-sm font-semibold text-foreground mb-1">Annual pediatric PSG volume</label>
                  <p className="text-xs text-muted-foreground mb-2">In-lab studies per year</p>
                  <input
                    id="psg_volume"
                    type="number"
                    value={inputs.psg_volume}
                    onChange={(e) => handleInputChange('psg_volume', e.target.value)}
                    onBlur={() => handleBlur('psg_volume')}
                    className="w-full h-12 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                  />
                </div>
                <div>
                  <label htmlFor="waitlist" className="block text-sm font-semibold text-foreground mb-1">Current waitlist length</label>
                  <p className="text-xs text-muted-foreground mb-2">Patients waiting for a PSG</p>
                  <input
                    id="waitlist"
                    type="number"
                    value={inputs.waitlist}
                    onChange={(e) => handleInputChange('waitlist', e.target.value)}
                    onBlur={() => handleBlur('waitlist')}
                    className="w-full h-12 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-8">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">At-Home Eligibility</h3>
              <div>
                <label htmlFor="eligibility" className="block text-sm font-semibold text-foreground mb-1">Home-test eligibility rate</label>
                <p className="text-xs text-muted-foreground mb-2 max-w-xl">
                  % of waitlisted children who are good candidates for at-home diagnosis (typically children with straightforward suspected OSA, without severe comorbidities)
                </p>
                <div className="relative max-w-[200px]">
                  <input
                    id="eligibility"
                    type="number"
                    value={inputs.eligibility}
                    onChange={(e) => handleInputChange('eligibility', e.target.value)}
                    onBlur={() => handleBlur('eligibility')}
                    className="w-full h-12 pl-4 pr-10 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => { setCurrentScreen(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Next: Revenue Inputs <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentScreen === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-8">
              <div className="text-xs font-bold tracking-widest uppercase text-primary mb-2">Step 2 of 3</div>
              <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Revenue waiting to be unlocked</h2>
              <p className="text-muted-foreground leading-relaxed">
                Each Vital-diagnosed patient generates multiple revenue events. Enter your institution's rates below — we've pre-filled national benchmarks to get you started.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Per-Test Revenue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="interp_fee" className="block text-sm font-semibold text-foreground mb-1">Interpretation fee</label>
                  <p className="text-xs text-muted-foreground mb-2">Physician read of the test</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <input
                      id="interp_fee"
                      type="number"
                      value={inputs.interp_fee}
                      onChange={(e) => handleInputChange('interp_fee', e.target.value)}
                      onBlur={() => handleBlur('interp_fee')}
                      className="w-full h-12 pl-8 pr-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="consult_fee" className="block text-sm font-semibold text-foreground mb-1">Follow-up consult revenue</label>
                  <p className="text-xs text-muted-foreground mb-2">Per diagnosed patient</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <input
                      id="consult_fee"
                      type="number"
                      value={inputs.consult_fee}
                      onChange={(e) => handleInputChange('consult_fee', e.target.value)}
                      onBlur={() => handleBlur('consult_fee')}
                      className="w-full h-12 pl-8 pr-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Downstream Treatment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="referral_rate" className="block text-sm font-semibold text-foreground mb-1">Referral rate</label>
                  <p className="text-xs text-muted-foreground mb-2">% referred for T&A, PAP, etc.</p>
                  <div className="relative">
                    <input
                      id="referral_rate"
                      type="number"
                      value={inputs.referral_rate}
                      onChange={(e) => handleInputChange('referral_rate', e.target.value)}
                      onBlur={() => handleBlur('referral_rate')}
                      className="w-full h-12 pl-4 pr-10 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="treatment_rev" className="block text-sm font-semibold text-foreground mb-1">Avg. downstream revenue</label>
                  <p className="text-xs text-muted-foreground mb-2">Per referred patient</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <input
                      id="treatment_rev"
                      type="number"
                      value={inputs.treatment_rev}
                      onChange={(e) => handleInputChange('treatment_rev', e.target.value)}
                      onBlur={() => handleBlur('treatment_rev')}
                      className="w-full h-12 pl-8 pr-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-8">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Ongoing Monitoring</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="monitoring_rev" className="block text-sm font-semibold text-foreground mb-1">Annual monitoring revenue</label>
                  <p className="text-xs text-muted-foreground mb-2">Follow-ups per patient/year</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <input
                      id="monitoring_rev"
                      type="number"
                      value={inputs.monitoring_rev}
                      onChange={(e) => handleInputChange('monitoring_rev', e.target.value)}
                      onBlur={() => handleBlur('monitoring_rev')}
                      className="w-full h-12 pl-8 pr-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="years" className="block text-sm font-semibold text-foreground mb-1">Years of follow-up</label>
                  <p className="text-xs text-muted-foreground mb-2">How far out to model?</p>
                  <input
                    id="years"
                    type="number"
                    value={inputs.years}
                    onChange={(e) => handleInputChange('years', e.target.value)}
                    onBlur={() => handleBlur('years')}
                    className="w-full h-12 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={() => { setCurrentScreen(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-muted-foreground font-semibold flex items-center gap-2 hover:text-foreground transition-colors px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={() => { setCurrentScreen(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Calculate My Upside <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentScreen === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-8">
              <div className="text-xs font-bold tracking-widest uppercase text-primary mb-2">Step 3 of 3</div>
              <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Your estimated revenue upside</h2>
              <p className="text-muted-foreground leading-relaxed">
                Based on your inputs, here is the incremental revenue your institution could capture by deploying the Vital Sleep Patch as a parallel diagnostic pathway.
              </p>
            </div>

            {/* Headline Card */}
            <div className="bg-gradient-to-br from-secondary to-indigo-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden mb-8 shadow-xl">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="text-sm font-bold tracking-widest uppercase text-white/60 mb-2">Total Revenue Upside</div>
                <div className="text-5xl md:text-7xl font-extrabold tracking-tight mb-2">{fmtFull(c.total)}</div>
                <div className="text-white/60 mb-6">Over {inputs.years} year{inputs.years !== 1 ? 's' : ''} of follow-up modeling</div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-medium">
                  {num(c.vitalTests)} Vital tests / year
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="text-xs font-bold tracking-widest uppercase text-primary mb-1">Annual recurring</div>
                <div className="text-2xl font-extrabold text-foreground">{fmt(annual)}</div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="text-xs font-bold tracking-widest uppercase text-primary mb-1">Per-test revenue</div>
                <div className="text-2xl font-extrabold text-foreground">{fmt(inputs.interp_fee + inputs.consult_fee)}</div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="text-xs font-bold tracking-widest uppercase text-primary mb-1">Tests per year</div>
                <div className="text-2xl font-extrabold text-foreground">{num(c.vitalTests)}</div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-background rounded-2xl p-6 shadow-sm border border-border mb-8">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Revenue Breakdown</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" tickFormatter={(val) => fmt(val)} axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500}} width={140} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={36}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="bg-background rounded-2xl p-6 shadow-sm border border-border mb-8 overflow-x-auto">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Line-Item Detail</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold tracking-widest uppercase text-muted-foreground border-b border-border">
                    <th className="pb-3 pr-4 font-bold">Line Item</th>
                    <th className="pb-3 px-4 font-bold">Formula</th>
                    <th className="pb-3 pl-4 text-right font-bold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-4 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                        Interpretation
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{num(c.vitalTests)} tests × {fmtFull(inputs.interp_fee)}</td>
                    <td className="py-4 pl-4 text-right font-bold text-foreground">{fmtFull(c.interpRevenue)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                        Follow-Up Consult
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{num(c.vitalTests)} tests × {fmtFull(inputs.consult_fee)}</td>
                    <td className="py-4 pl-4 text-right font-bold text-foreground">{fmtFull(c.consultRevenue)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-secondary shrink-0"></div>
                        Downstream Treatment
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{num(c.vitalTests)} tests × {pct(inputs.referral_rate / 100)} ref × {fmtFull(inputs.treatment_rev)}</td>
                    <td className="py-4 pl-4 text-right font-bold text-foreground">{fmtFull(c.treatRevenue)}</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0"></div>
                        Monitoring
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{num(c.vitalTests)} tests × {fmtFull(inputs.monitoring_rev)}/yr × {inputs.years} yrs</td>
                    <td className="py-4 pl-4 text-right font-bold text-foreground">{fmtFull(c.monitorRevenue)}</td>
                  </tr>
                  <tr className="border-t-2 border-primary">
                    <td className="py-4 pr-4 font-bold text-primary text-base">Total Revenue Upside</td>
                    <td className="py-4 px-4"></td>
                    <td className="py-4 pl-4 text-right font-extrabold text-primary text-lg">{fmtFull(c.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground text-center mb-8 px-4 leading-relaxed">
              These are estimates based on your inputs. Actual results will vary depending on payer mix,
              coding and reimbursement timelines, patient case complexity, and clinical workflows.
              This calculator is intended for illustrative purposes only.
            </p>

            {/* Demo Request CTA */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-8">
              {demoSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">We'll be in touch.</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Thanks for your interest. A member of our team will reach out within one business day.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-1">See it in action</h3>
                    <p className="text-sm text-muted-foreground">
                      Ready to explore a partnership? Leave your details and we'll set up a live demo tailored to your institution.
                    </p>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      demoMutation.mutate(
                        {
                          data: {
                            name: demoForm.name,
                            email: demoForm.email,
                            institution: demoForm.institution,
                            jobTitle: demoForm.jobTitle || null,
                            calculatedUpside: c.total,
                            inputs: inputs as Record<string, unknown>,
                          },
                        },
                        {
                          onSuccess: () => setDemoSubmitted(true),
                        }
                      );
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Your name <span className="text-destructive">*</span></label>
                      <input
                        type="text"
                        required
                        value={demoForm.name}
                        onChange={(e) => setDemoForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Dr. Jane Smith"
                        className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Work email <span className="text-destructive">*</span></label>
                      <input
                        type="email"
                        required
                        value={demoForm.email}
                        onChange={(e) => setDemoForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="jane@childrenshospital.org"
                        className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Institution <span className="text-destructive">*</span></label>
                      <input
                        type="text"
                        required
                        value={demoForm.institution}
                        onChange={(e) => setDemoForm(f => ({ ...f, institution: e.target.value }))}
                        placeholder="Children's Hospital Boston"
                        className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Job title <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={demoForm.jobTitle}
                        onChange={(e) => setDemoForm(f => ({ ...f, jobTitle: e.target.value }))}
                        placeholder="Director of Sleep Medicine"
                        className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={demoMutation.isPending}
                        className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                      >
                        {demoMutation.isPending ? "Sending…" : "Request a Demo"}
                        {!demoMutation.isPending && <ArrowRight className="w-4 h-4" />}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        Your calculated upside of <strong>{fmtFull(c.total)}</strong> will be included.
                      </p>
                    </div>
                    {demoMutation.isError && (
                      <p className="sm:col-span-2 text-sm text-destructive">Something went wrong. Please try again.</p>
                    )}
                  </form>
                </>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={startOver}
                className="px-6 py-2 rounded-xl text-muted-foreground font-semibold hover:text-foreground hover:bg-muted transition-all"
              >
                Start Over
              </button>
              <button 
                onClick={() => window.print()}
                className="bg-secondary text-foreground px-6 py-2 rounded-xl font-semibold hover:bg-secondary/90 transition-all shadow-md"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
