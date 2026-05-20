import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Flag } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

type WaitlistRow = {
  id: number;
  email: string;
  name: string | null;
  childAge: string | null;
  createdAt: string;
};

type DemoRow = {
  id: number;
  name: string;
  email: string;
  institution: string;
  jobTitle: string | null;
  calculatedUpside: number;
  createdAt: string;
};

type CalcSessionRow = {
  id: number;
  email: string | null;
  calculatedUpside: number;
  inputs: Record<string, unknown>;
  isTest: boolean;
  createdAt: string;
};

type AuthState = "loading" | "authed" | "unauthed";

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Admin() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [tab, setTab] = useState<"waitlist" | "demo" | "calculator">("waitlist");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [calcSessions, setCalcSessions] = useState<CalcSessionRow[]>([]);
  const [showTestEntries, setShowTestEntries] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchData = useCallback(async (includeTest = false) => {
    try {
      const [wRes, dRes, cRes] = await Promise.all([
        fetch(`${API}/api/admin/waitlist`, { credentials: "include" }),
        fetch(`${API}/api/admin/demo-requests`, { credentials: "include" }),
        fetch(`${API}/api/admin/calculator-sessions?includeTest=${includeTest}`, { credentials: "include" }),
      ]);
      if (wRes.status === 401 || dRes.status === 401 || cRes.status === 401) {
        setAuthState("unauthed");
        return;
      }
      setWaitlist(await wRes.json());
      setDemos(await dRes.json());
      setCalcSessions(await cRes.json());
      localStorage.setItem("vsp_is_tester", "1");
      setAuthState("authed");
    } catch {
      setAuthState("unauthed");
    }
  }, []);

  useEffect(() => {
    fetchData(showTestEntries);
  }, [fetchData, showTestEntries]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem("vsp_is_tester", "1");
        setPassword("");
        await fetchData(showTestEntries);
      } else {
        const data = await res.json();
        setLoginError(data.error ?? "Incorrect password.");
      }
    } catch {
      setLoginError("Could not connect to server.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API}/api/admin/logout`, { method: "POST", credentials: "include" });
    localStorage.removeItem("vsp_is_tester");
    setAuthState("unauthed");
    setWaitlist([]);
    setDemos([]);
    setCalcSessions([]);
  };

  const handleToggleTest = async (id: number) => {
    setTogglingId(id);
    setCalcSessions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isTest: !r.isTest } : r))
    );
    try {
      const res = await fetch(`${API}/api/admin/calculator-sessions/${id}/toggle-test`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        const updated: CalcSessionRow = await res.json();
        setCalcSessions((prev) => prev.map((r) => (r.id === id ? updated : r)));
      } else {
        await fetchData(showTestEntries);
      }
    } catch {
      await fetchData(showTestEntries);
    } finally {
      setTogglingId(null);
    }
  };

  const visibleCalcSessions = showTestEntries
    ? calcSessions
    : calcSessions.filter((r) => !r.isTest);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authState === "unauthed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">V</div>
            <span className="font-semibold text-lg">Admin</span>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
            <h1 className="text-xl font-bold text-foreground mb-1">Sign in</h1>
            <p className="text-sm text-muted-foreground mb-6">Enter your admin password to continue.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-primary text-primary-foreground h-11 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loggingIn ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-16">
      <Navigation />
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {waitlist.length} waitlist signup{waitlist.length !== 1 ? "s" : ""} &middot; {demos.length} demo request{demos.length !== 1 ? "s" : ""} &middot; {visibleCalcSessions.length} calculator session{visibleCalcSessions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-xl hover:bg-muted"
          >
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 w-fit">
          {(["waitlist", "demo", "calculator"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "waitlist"
                ? `Waitlist (${waitlist.length})`
                : t === "demo"
                ? `Demo Requests (${demos.length})`
                : `Calculator Sessions (${visibleCalcSessions.length})`}
            </button>
          ))}
        </div>

        {tab === "waitlist" && (
          <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Waitlist Signups</h2>
              <a
                href={`${API}/api/admin/waitlist/export.csv`}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
              >
                Export CSV
              </a>
            </div>
            {waitlist.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">No signups yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold tracking-widest uppercase text-muted-foreground border-b border-border">
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Child's Age</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((row, i) => (
                      <tr key={row.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs">{row.id}</td>
                        <td className="px-6 py-3.5 font-medium text-foreground">
                          <a href={`mailto:${row.email}`} className="hover:text-primary transition-colors">{row.email}</a>
                        </td>
                        <td className="px-6 py-3.5 text-foreground">{row.name ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-6 py-3.5 text-foreground">{row.childAge ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{fmtDate(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "demo" && (
          <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Demo Requests</h2>
              <a
                href={`${API}/api/admin/demo-requests/export.csv`}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
              >
                Export CSV
              </a>
            </div>
            {demos.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">No demo requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold tracking-widest uppercase text-muted-foreground border-b border-border">
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Institution</th>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-6 py-3">Upside</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demos.map((row, i) => (
                      <tr key={row.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs">{row.id}</td>
                        <td className="px-6 py-3.5 font-medium text-foreground">{row.name}</td>
                        <td className="px-6 py-3.5">
                          <a href={`mailto:${row.email}`} className="text-primary hover:text-primary/80 transition-colors">{row.email}</a>
                        </td>
                        <td className="px-6 py-3.5 text-foreground">{row.institution}</td>
                        <td className="px-6 py-3.5 text-foreground">{row.jobTitle ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-6 py-3.5 font-semibold text-foreground">{fmt(row.calculatedUpside)}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{fmtDate(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "calculator" && (
          <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold text-foreground">Calculator Sessions</h2>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTestEntries}
                    onChange={(e) => setShowTestEntries(e.target.checked)}
                    className="rounded"
                  />
                  Show test entries
                </label>
              </div>
              <a
                href={`${API}/api/admin/calculator-sessions/export.csv?includeTest=${showTestEntries}`}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
              >
                Export CSV
              </a>
            </div>
            {visibleCalcSessions.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">No sessions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold tracking-widest uppercase text-muted-foreground border-b border-border">
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Waitlist</th>
                      <th className="px-6 py-3">Eligibility</th>
                      <th className="px-6 py-3">Interp Fee</th>
                      <th className="px-6 py-3">Years</th>
                      <th className="px-6 py-3">Upside</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCalcSessions.map((row, i) => {
                      const inp = row.inputs as Record<string, number>;
                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-border/50 hover:bg-muted/30 transition-colors group ${
                            row.isTest ? "opacity-50" : ""
                          } ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                        >
                          <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs">{row.id}</td>
                          <td className="px-6 py-3.5 font-medium text-foreground">
                            {row.email ? (
                              <a href={`mailto:${row.email}`} className="hover:text-primary transition-colors">{row.email}</a>
                            ) : (
                              <span className="text-muted-foreground italic">Anonymous</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-foreground">{inp.waitlist != null ? Math.round(inp.waitlist).toLocaleString() : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-6 py-3.5 text-foreground">{inp.eligibility != null ? `${inp.eligibility}%` : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-6 py-3.5 text-foreground">{inp.interp_fee != null ? `$${inp.interp_fee}` : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-6 py-3.5 text-foreground">{inp.years != null ? inp.years : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-6 py-3.5 font-semibold text-foreground">{fmt(row.calculatedUpside)}</td>
                          <td className="px-6 py-3.5 text-muted-foreground">{fmtDate(row.createdAt)}</td>
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => handleToggleTest(row.id)}
                              disabled={togglingId === row.id}
                              title={row.isTest ? "Unmark as test" : "Mark as test"}
                              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted disabled:cursor-wait ${
                                row.isTest ? "text-amber-500" : "text-muted-foreground"
                              }`}
                            >
                              <Flag className="w-3.5 h-3.5" fill={row.isTest ? "currentColor" : "none"} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
