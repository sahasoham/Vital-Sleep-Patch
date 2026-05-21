import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Send, ChevronDown, ChevronUp, FileText, Copy, Printer, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useRequestDemo, useSaveCalculatorSession } from "@workspace/api-client-react";

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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const STARTER_QUESTIONS = [
  "What if my waitlist doubles?",
  "How does this compare to a typical AMC?",
  "What's the ROI timeline?",
];

function InlineFormatted({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function MarkdownMemo({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-xl font-extrabold text-foreground mt-4 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 text-foreground mb-3 text-sm">
          {items.map((it, j) => <li key={j}><InlineFormatted text={it} /></li>)}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-foreground leading-relaxed mb-2">
          <InlineFormatted text={line} />
        </p>
      );
    }
    i++;
  }
  return <div>{elements}</div>;
}

export default function Hospitals() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [calEmail, setCalEmail] = useState("");
  const [calEmailInput, setCalEmailInput] = useState("");
  const [inputs, setInputs] = useState(DEFAULTS);
  const [demoForm, setDemoForm] = useState({ name: "", email: "", institution: "", jobTitle: "" });
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const demoMutation = useRequestDemo();
  const saveMutation = useSaveCalculatorSession();
  const savedRef = useRef(false);

  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [interpLoading, setInterpLoading] = useState(false);
  const interpFiredRef = useRef(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [memoOpen, setMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState<string | null>(null);
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoInstitution, setMemoInstitution] = useState("");
  const [memoCopied, setMemoCopied] = useState(false);

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

  const goToResults = () => {
    setCurrentScreen(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startOver = () => {
    setInputs(DEFAULTS);
    setCalEmail("");
    setCalEmailInput("");
    savedRef.current = false;
    interpFiredRef.current = false;
    setInterpretation(null);
    setChatMessages([]);
    setSessionToken(null);
    setChatOpen(false);
    setMemoText(null);
    setMemoOpen(false);
    setCurrentScreen(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const c = calculate();
  const annual = c.interpRevenue + c.consultRevenue + c.treatRevenue + (c.vitalTests * inputs.monitoring_rev);

  useEffect(() => {
    if (currentScreen === 3 && !savedRef.current) {
      savedRef.current = true;
      const isTest = localStorage.getItem("vsp_is_tester") === "1";
      saveMutation.mutate(
        {
          data: {
            email: calEmail || null,
            calculatedUpside: c.total,
            inputs: inputs as Record<string, unknown>,
            isTest,
          },
        },
        {}
      );
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === 3 && !interpFiredRef.current) {
      interpFiredRef.current = true;
      setInterpLoading(true);
      fetch("/api/calculator/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, results: c }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.text) setInterpretation(data.text);
        })
        .catch(() => {})
        .finally(() => setInterpLoading(false));
    }
  }, [currentScreen]);

  useEffect(() => {
    if (chatOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const sendChat = async (message: string) => {
    if (!message.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: message };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "", streaming: true };
    setChatMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/calculator/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          message,
          inputs,
          results: c,
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.sessionToken && !sessionToken) {
              setSessionToken(parsed.sessionToken);
            }
            if (parsed.error) {
              setChatMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.streaming) {
                  updated[updated.length - 1] = { ...last, content: "Sorry, something went wrong. Please try again.", streaming: false };
                }
                return updated;
              });
            }
            if (parsed.content) {
              setChatMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.streaming) {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.content };
                }
                return updated;
              });
            }
            if (parsed.done) {
              setChatMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.streaming) {
                  updated[updated.length - 1] = { ...last, streaming: false };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setChatMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.streaming) {
          updated[updated.length - 1] = { ...last, content: "Sorry, something went wrong. Please try again.", streaming: false };
        }
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const generateMemo = async () => {
    setMemoLoading(true);
    setMemoText(null);
    try {
      const response = await fetch("/api/calculator/ai/pitch-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution: memoInstitution || null,
          inputs,
          results: c,
        }),
      });
      const data = await response.json();
      if (data.memo) setMemoText(data.memo);
    } catch {
      setMemoText("Failed to generate memo. Please try again.");
    } finally {
      setMemoLoading(false);
    }
  };

  const copyMemo = async () => {
    if (!memoText) return;
    await navigator.clipboard.writeText(memoText);
    setMemoCopied(true);
    setTimeout(() => setMemoCopied(false), 2000);
  };

  const chartData = [
    { name: 'Interpretation', value: c.interpRevenue, fill: 'hsl(var(--primary))' },
    { name: 'Follow-Up Consult', value: c.consultRevenue, fill: 'hsl(var(--primary))' },
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

      {/* Progress Bar — only shown during steps 1-3 */}
      {currentScreen >= 1 && (
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
      )}

      <main className="flex-grow container mx-auto px-4 max-w-3xl py-12">

        {/* Step 0 — email prompt */}
        {currentScreen === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">See your institution's revenue upside</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Enter your work email to receive a copy of your results — or skip to run the numbers anonymously.
            </p>
            <div className="w-full bg-background rounded-2xl p-6 shadow-sm border border-border mb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCalEmail(calEmailInput.trim());
                  setCurrentScreen(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex flex-col gap-4"
              >
                <input
                  type="email"
                  value={calEmailInput}
                  onChange={(e) => setCalEmailInput(e.target.value)}
                  placeholder="you@childrenshospital.org"
                  className="w-full h-12 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            <button
              onClick={() => {
                setCalEmail("");
                setCurrentScreen(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Skip — run without email
            </button>
          </div>
        )}

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
                  % of waitlisted children who are good candidates for at-home screening (typically children with straightforward suspected OSA, without severe comorbidities)
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
                Each patient screened via Vital generates multiple revenue events. Enter your institution's rates below — we've pre-filled national benchmarks to get you started.
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
                onClick={goToResults}
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

            {/* AI Interpretation Callout — hidden when nothing to show */}
            {(interpLoading || interpretation) && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {interpLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-primary/10 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-primary/10 rounded animate-pulse w-5/6"></div>
                      <div className="h-4 bg-primary/10 rounded animate-pulse w-3/4"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">{interpretation}</p>
                  )}
                </div>
              </div>
            )}

            {/* Headline Card */}
            <div className="bg-gradient-to-br from-secondary to-indigo-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden mb-8 shadow-xl">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="text-sm font-bold tracking-widest uppercase text-white/60 mb-2">Total Revenue Upside</div>
                <div className="text-5xl md:text-7xl font-extrabold tracking-tight mb-2">{fmtFull(c.total)}</div>
                <div className="text-white/60 mb-6">Over {inputs.years} year{inputs.years !== 1 ? 's' : ''} of follow-up modeling</div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-medium">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {fmt(annual)} estimated annually
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Revenue Breakdown</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown Table */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-6 overflow-x-auto">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6">Detailed Breakdown</h3>
              <table className="w-full min-w-[400px]">
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
                    <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{num(c.vitalTests)} × ${inputs.interp_fee}</td>
                    <td className="py-4 pl-4 text-right font-semibold text-foreground">{fmtFull(c.interpRevenue)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                        Follow-Up Consult
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{num(c.vitalTests)} × ${inputs.consult_fee}</td>
                    <td className="py-4 pl-4 text-right font-semibold text-foreground">{fmtFull(c.consultRevenue)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-secondary shrink-0"></div>
                        Downstream Treatment
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{num(c.vitalTests)} × {pct(inputs.referral_rate/100)} × ${inputs.treatment_rev}</td>
                    <td className="py-4 pl-4 text-right font-semibold text-foreground">{fmtFull(c.treatRevenue)}</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0"></div>
                        Monitoring ({inputs.years}yr)
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{num(c.vitalTests)} × ${inputs.monitoring_rev} × {inputs.years}yr</td>
                    <td className="py-4 pl-4 text-right font-semibold text-foreground">{fmtFull(c.monitorRevenue)}</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="py-4 pr-4 font-bold text-foreground">Total Upside</td>
                    <td className="py-4 px-4"></td>
                    <td className="py-4 pl-4 text-right font-extrabold text-primary text-lg">{fmtFull(c.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Chat Panel */}
            <div className="bg-background rounded-2xl shadow-sm border border-border mb-6 overflow-hidden">
              <button
                onClick={() => setChatOpen((o) => !o)}
                className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground text-sm">Ask the AI Advisor</div>
                    <div className="text-xs text-muted-foreground">Ask questions about your results</div>
                  </div>
                </div>
                {chatOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {chatOpen && (
                <div className="border-t border-border">
                  {chatMessages.length === 0 && (
                    <div className="p-4 pb-2">
                      <p className="text-xs text-muted-foreground mb-3 font-medium">Try asking:</p>
                      <div className="flex flex-wrap gap-2">
                        {STARTER_QUESTIONS.map((q) => (
                          <button
                            key={q}
                            onClick={() => sendChat(q)}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors font-medium"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}>
                          {msg.content}
                          {msg.streaming && (
                            <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse rounded-full align-middle" />
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  <div className="p-4 border-t border-border flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(chatInput); } }}
                      placeholder="Ask a question about your results…"
                      disabled={chatLoading}
                      className="flex-1 h-10 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm disabled:opacity-50"
                    />
                    <button
                      onClick={() => sendChat(chatInput)}
                      disabled={chatLoading || !chatInput.trim()}
                      className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Demo CTA */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border mb-8">
              {demoSubmitted ? (
                <div className="flex flex-col items-center text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Request received!</h3>
                  <p className="text-muted-foreground">We'll be in touch within one business day to schedule your personalized demo.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-foreground mb-1">Ready to see it in action?</h3>
                  <p className="text-sm text-muted-foreground mb-6">Request a 30-minute demo — we'll walk through exactly how the Vital Sleep Patch would work at your institution.</p>
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
                onClick={() => setMemoOpen(true)}
                className="bg-secondary text-foreground px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-secondary/90 transition-all shadow-md"
              >
                <FileText className="w-4 h-4" /> Generate Pitch Memo
              </button>
              <button 
                onClick={() => window.print()}
                className="bg-muted text-foreground px-6 py-2 rounded-xl font-semibold hover:bg-muted/80 transition-all"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Pitch Memo Modal */}
      {memoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Pitch Memo</h2>
              </div>
              <button
                onClick={() => { setMemoOpen(false); setMemoText(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {!memoText && !memoLoading && (
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a formatted one-page memo you can share with hospital leadership. Optionally enter your institution name for personalization.
                </p>
                <input
                  type="text"
                  value={memoInstitution}
                  onChange={(e) => setMemoInstitution(e.target.value)}
                  placeholder="Institution name (optional)"
                  className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-4"
                />
                <button
                  onClick={generateMemo}
                  className="w-full bg-primary text-primary-foreground h-11 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Generate Memo
                </button>
              </div>
            )}

            {memoLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Generating your pitch memo…</p>
              </div>
            )}

            {memoText && !memoLoading && (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  <MarkdownMemo text={memoText} />
                </div>
                <div className="p-4 border-t border-border flex gap-3 shrink-0">
                  <button
                    onClick={copyMemo}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-semibold"
                  >
                    <Copy className="w-4 h-4" />
                    {memoCopied ? "Copied!" : "Copy to Clipboard"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-semibold"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-border bg-background py-6">
        <p className="text-center text-xs text-muted-foreground max-w-3xl mx-auto px-6">
          This calculator models projected revenue for planning purposes only. The Vital Sleep Patch is an investigational device not currently available for commercial deployment.
        </p>
      </div>
      <Footer />
    </div>
  );
}
