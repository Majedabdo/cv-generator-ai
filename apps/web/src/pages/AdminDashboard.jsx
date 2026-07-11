import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CreditCard, FileText, Cpu, LifeBuoy, Star, Newspaper,
  LayoutTemplate, Tag, Bell, Mail, Settings as SettingsIcon, ShieldCheck, Activity,
  LogOut, Menu, X, Search, Trash2, KeyRound, Ban, CheckCircle2, Loader2, Download,
  TrendingUp, Server, Circle, Save, Send, Plus, DollarSign, Eye, Bot, RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import adminApi from "@/lib/adminApi";
import { toast } from "@/hooks/use-toast";

const NAV = [
  { key: "home", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "resumes", label: "Resume Analytics", icon: FileText },
  { key: "ai", label: "AI Analytics", icon: Cpu },
  { key: "prompts", label: "AI System Prompts", icon: Bot },
  { key: "support", label: "Support", icon: LifeBuoy },
  { key: "feedback", label: "Feedback", icon: Star },
  { key: "blog", label: "Blog", icon: Newspaper },
  { key: "templates", label: "Templates", icon: LayoutTemplate },
  { key: "pricing", label: "Pricing & Coupons", icon: Tag },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "email", label: "Email Templates", icon: Mail },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "security", label: "Security & Logs", icon: ShieldCheck },
  { key: "system", label: "System Health", icon: Activity },
];

const CHART_COLORS = ["#8b5cf6", "#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
const money = (v, c = "SAR") => `${Number(v || 0).toLocaleString()} ${c}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");

/* ------------------------------- primitives ------------------------------ */

function Card({ className = "", children }) {
  return <div className={`rounded-2xl border border-border bg-card ${className}`}>{children}</div>;
}
function Stat({ icon: Icon, label, value, tint = "bg-violet-500/10 text-violet-500", sub }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
function Head({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function Spin() {
  return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
}
function StatusPill({ value }) {
  const ok = ["paid", "operational", "joined", "closed", "rewarded"].includes(value);
  const warn = ["pending", "open", "degraded"].includes(value);
  const tint = ok ? "bg-emerald-500/10 text-emerald-500" : warn ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tint}`}>{value || "—"}</span>;
}
const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const btnP = "inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60";
const btnO = "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary";

function ChartCard({ title, children, className = "" }) {
  return (
    <Card className={`p-5 ${className}`}>
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}
const axis = { tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" }, axisLine: false, tickLine: false };
const tip = { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 } };

/* --------------------------------- sections ------------------------------ */

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { adminApi.get("/overview").then(setData).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  if (!data) return <Spin />;
  const s = data.stats, c = data.charts;
  const cards = [
    [Users, "Today's visitors", s.todayVisitors, "bg-violet-500/10 text-violet-500"],
    [DollarSign, "Today's revenue", money(s.todayRevenue), "bg-emerald-500/10 text-emerald-500"],
    [TrendingUp, "Monthly revenue", money(s.monthRevenue), "bg-indigo-500/10 text-indigo-500"],
    [TrendingUp, "Yearly revenue", money(s.yearRevenue), "bg-purple-500/10 text-purple-500"],
    [FileText, "Resumes today", s.todayResumes, "bg-sky-500/10 text-sky-500"],
    [Cpu, "AI requests", s.todayAiRequests, "bg-pink-500/10 text-pink-500"],
    [CreditCard, "Payments today", s.todayPayments, "bg-emerald-500/10 text-emerald-500"],
    [Users, "New users today", s.todayNewUsers, "bg-amber-500/10 text-amber-500"],
    [Users, "Total users", s.totalUsers, "bg-violet-500/10 text-violet-500"],
    [CheckCircle2, "Active users", s.activeUsers, "bg-emerald-500/10 text-emerald-500"],
    [LifeBuoy, "Pending tickets", s.pendingTickets, "bg-amber-500/10 text-amber-500"],
    [Ban, "Open refunds", s.openRefunds, "bg-rose-500/10 text-rose-500"],
  ];
  return (
    <>
      <Head title="Overview" subtitle="Real-time platform statistics." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([i, l, v, t]) => <Stat key={l} icon={i} label={l} value={v} tint={t} />)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily revenue (30d)">
          <AreaChart data={c.dailyRevenue}><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" {...axis} /><YAxis {...axis} width={30} /><Tooltip {...tip} /><Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#gr)" /></AreaChart>
        </ChartCard>
        <ChartCard title="Monthly revenue (12mo)">
          <BarChart data={c.monthlyRevenue}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="month" {...axis} tickFormatter={(m) => m.slice(5)} /><YAxis {...axis} width={30} /><Tooltip {...tip} /><Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
        </ChartCard>
        <ChartCard title="Visitors">
          <LineChart data={c.visitors}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" {...axis} /><YAxis {...axis} width={30} /><Tooltip {...tip} /><Line type="monotone" dataKey="visitors" stroke="#ec4899" strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
        <ChartCard title="Resume generation">
          <BarChart data={c.resumeGen}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" {...axis} /><YAxis {...axis} width={30} /><Tooltip {...tip} /><Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} /></BarChart>
        </ChartCard>
        <ChartCard title="AI usage">
          <AreaChart data={c.aiUsage}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" {...axis} /><YAxis {...axis} width={30} /><Tooltip {...tip} /><Area type="monotone" dataKey="requests" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.15} /></AreaChart>
        </ChartCard>
        <ChartCard title="Conversion rate (%)">
          <LineChart data={c.conversion}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="month" {...axis} tickFormatter={(m) => m.slice(5)} /><YAxis {...axis} width={30} /><Tooltip {...tip} /><Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} /></LineChart>
        </ChartCard>
        <PieCard title="Countries" data={c.countries} />
        <PieCard title="Devices" data={c.devices} />
        <PieCard title="Traffic sources" data={c.sources} />
      </div>
    </>
  );
}
function PieCard({ title, data }) {
  return (
    <ChartCard title={title}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tip} />
      </PieChart>
    </ChartCard>
  );
}

function UsersSection() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);
  const load = useCallback((search = "") => {
    setUsers(null);
    adminApi.get(`/users${search ? `?q=${encodeURIComponent(search)}` : ""}`).then((d) => setUsers(d.users)).catch((e) => toast({ variant: "destructive", title: e.message }));
  }, []);
  useEffect(() => { load(); }, [load]);
  const act = async (id, fn, label) => { try { await fn(); toast({ title: label }); load(q); } catch (e) { toast({ variant: "destructive", title: e.message }); } };
  return (
    <>
      <Head title="Users" subtitle="Manage every registered account." />
      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="mb-4 flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" className={`${inp} pl-9`} /></div>
        <button className={btnP}>Search</button>
      </form>
      {!users ? <Spin /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr>{["User", "Plan", "Role", "Country", "AI", "Status", "Joined", ""].map((h) => <th key={h} className="p-3 text-start">{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3"><p className="font-medium">{u.name || "—"}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                  <td className="p-3 capitalize">{u.plan || "free"}</td>
                  <td className="p-3 capitalize">{u.role || "user"}</td>
                  <td className="p-3 text-muted-foreground">{u.country || "—"}</td>
                  <td className="p-3">{u.aiRequests}</td>
                  <td className="p-3"><StatusPill value={u.suspended ? "suspended" : "active"} /></td>
                  <td className="p-3 text-muted-foreground">{fmtDate(u.created)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button title="View" onClick={() => adminApi.get(`/users/${u.id}/detail`).then(setDetail)} className="rounded-md p-1.5 hover:bg-secondary"><Eye className="h-4 w-4" /></button>
                      <button title={u.suspended ? "Unsuspend" : "Suspend"} onClick={() => act(u.id, () => adminApi.patch(`/users/${u.id}`, { suspended: !u.suspended }), "Updated")} className="rounded-md p-1.5 hover:bg-secondary"><Ban className={`h-4 w-4 ${u.suspended ? "text-rose-500" : ""}`} /></button>
                      <button title="Reset password" onClick={() => act(u.id, () => adminApi.post(`/users/${u.id}/reset-password`), "Reset link sent")} className="rounded-md p-1.5 hover:bg-secondary"><KeyRound className="h-4 w-4" /></button>
                      <button title="Delete" onClick={() => { if (confirm("Delete user permanently?")) act(u.id, () => adminApi.del(`/users/${u.id}`), "Deleted"); }} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No users found.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      {detail && <UserDetail data={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
function UserDetail({ data, onClose }) {
  const u = data.user;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between">
          <div><h3 className="text-lg font-bold">{u.name || u.email}</h3><p className="text-sm text-muted-foreground">{u.email}</p></div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[["Plan", u.plan], ["Role", u.role], ["Points", u.points || 0], ["AI reqs", u.aiRequests || 0], ["Country", u.country || "—"], ["Joined", fmtDate(u.created)], ["Last login", fmtDate(u.lastLogin)], ["Suspended", u.suspended ? "Yes" : "No"]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold capitalize">{v}</p></div>
          ))}
        </div>
        {[["Resumes", data.resumes, (r) => `${r.title} · ATS ${r.atsScore || 0}%`], ["Payments", data.payments, (p) => `${money(p.amount, p.currency)} · ${p.status}`], ["Documents", data.documents, (d) => `${d.name} (${d.folder})`], ["Tickets", data.tickets, (t) => `${t.subject} · ${t.status}`]].map(([label, arr, fmt]) => (
          <div key={label} className="mt-4">
            <h4 className="mb-2 text-sm font-bold">{label} ({arr.length})</h4>
            {arr.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : <div className="space-y-1">{arr.map((x) => <div key={x.id} className="rounded-lg border border-border px-3 py-2 text-xs">{fmt(x)}</div>)}</div>}
          </div>
        ))}
      </Card>
    </div>
  );
}

function csvExport(rows, cols, name) {
  const header = cols.map((c) => c[0]).join(",");
  const body = rows.map((r) => cols.map((c) => `"${String(c[1](r) ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click();
}

function PaymentsSection() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => { adminApi.get("/payments").then((d) => setRows(d.payments)).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  const shown = useMemo(() => (rows || []).filter((p) => filter === "all" || p.status === filter), [rows, filter]);
  const total = shown.filter((p) => p.status === "paid").reduce((a, p) => a + (Number(p.amount) || 0), 0);
  return (
    <>
      <Head title="Payments" subtitle="All transactions, revenue and exports."
        action={<button className={btnO} onClick={() => csvExport(shown, [["Invoice", (r) => r.invoiceNumber], ["Email", (r) => r.email], ["Amount", (r) => r.amount], ["Currency", (r) => r.currency], ["Status", (r) => r.status], ["Method", (r) => r.method], ["Date", (r) => r.created]], "payments")}><Download className="h-4 w-4" /> Export CSV</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "paid", "pending", "failed", "refunded"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? "gradient-primary text-white" : "border border-border hover:bg-secondary"}`}>{f}</button>
        ))}
        <span className="ms-auto self-center text-sm text-muted-foreground">Revenue (filtered): <span className="font-bold text-foreground">{money(total)}</span></span>
      </div>
      {!rows ? <Spin /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr>{["Invoice", "Customer", "Amount", "Method", "Status", "Date"].map((h) => <th key={h} className="p-3 text-start">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{p.invoiceNumber || "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.email || "—"}</td>
                  <td className="p-3">{money(p.amount, p.currency)}</td>
                  <td className="p-3 capitalize text-muted-foreground">{(p.method || "—").replace("_", " ")}</td>
                  <td className="p-3"><StatusPill value={p.status} /></td>
                  <td className="p-3 text-muted-foreground">{fmtDate(p.created)}</td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payments.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function ResumeAnalytics() {
  const [d, setD] = useState(null);
  useEffect(() => { adminApi.get("/resume-analytics").then(setD).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  if (!d) return <Spin />;
  return (
    <>
      <Head title="Resume Analytics" subtitle="Insights across all generated resumes." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={FileText} label="Total resumes" value={d.total} />
        <Stat icon={FileText} label="Today" value={d.today} tint="bg-sky-500/10 text-sky-500" />
        <Stat icon={FileText} label="This month" value={d.month} tint="bg-indigo-500/10 text-indigo-500" />
        <Stat icon={Star} label="Avg ATS score" value={`${d.avgAts}%`} tint="bg-emerald-500/10 text-emerald-500" />
        <Stat icon={Star} label="Avg job match" value={`${d.avgJobMatch ?? 0}%`} tint="bg-violet-500/10 text-violet-500" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RankCard title="Most selected templates" data={d.templates} />
        <RankCard title="Most requested jobs" data={d.targetJobs?.length ? d.targetJobs : d.jobs} />
        <RankCard title="Most common skills" data={d.skills} />
        <RankCard title="Most missing keywords" data={d.mostMissingKeywords} />
        <RankCard title="Most missing skills" data={d.mostMissingSkills} />
        <RankCard title="Top job descriptions" data={d.jobs} />
      </div>
    </>
  );
}
function RankCard({ title, data }) {
  const max = Math.max(1, ...(data || []).map((x) => x.value));
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      {(!data || data.length === 0) ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
        <div className="space-y-3">
          {data.map((x) => (
            <div key={x.name}>
              <div className="mb-1 flex justify-between text-xs"><span className="truncate font-medium">{x.name}</span><span className="text-muted-foreground">{x.value}</span></div>
              <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full gradient-primary" style={{ width: `${(x.value / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AiAnalytics() {
  const [d, setD] = useState(null);
  useEffect(() => { adminApi.get("/ai-analytics").then(setD).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  if (!d) return <Spin />;
  return (
    <>
      <Head title="AI Analytics" subtitle="Model usage, cost and health." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Cpu} label="Total AI requests" value={d.totalRequests.toLocaleString()} />
        <Stat icon={Cpu} label="Requests today" value={d.todayRequests} tint="bg-pink-500/10 text-pink-500" />
        <Stat icon={Activity} label="Avg tokens" value={d.avgTokens} tint="bg-indigo-500/10 text-indigo-500" />
        <Stat icon={DollarSign} label="Avg cost / req" value={`$${d.avgCost}`} tint="bg-emerald-500/10 text-emerald-500" />
        <Stat icon={DollarSign} label="Monthly AI cost" value={`$${d.monthlyCost}`} tint="bg-amber-500/10 text-amber-500" />
        <Stat icon={Activity} label="Avg response" value={`${d.avgResponseMs}ms`} />
        <Stat icon={Ban} label="Failed requests" value={d.failed} tint="bg-rose-500/10 text-rose-500" />
        <Stat icon={CheckCircle2} label="API status" value={d.status} tint="bg-emerald-500/10 text-emerald-500" />
      </div>
      <div className="mt-6"><ChartCard title="Daily AI cost (14d)"><AreaChart data={d.dailyCost}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" {...axis} /><YAxis {...axis} width={30} /><Tooltip {...tip} /><Area type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.15} /></AreaChart></ChartCard></div>
    </>
  );
}

function SupportSection() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => { adminApi.get("/support").then((d) => setRows(d.tickets)).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  useEffect(load, [load]);
  const shown = (rows || []).filter((t) => filter === "all" || t.category === filter || t.status === filter);
  return (
    <>
      <Head title="Support Center" subtitle="Tickets, refunds, bugs and questions." />
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "open", "closed", "refund", "bug", "feature", "question"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? "gradient-primary text-white" : "border border-border hover:bg-secondary"}`}>{f}</button>
        ))}
      </div>
      {!rows ? <Spin /> : (
        <div className="space-y-3">
          {shown.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><p className="font-semibold">{t.subject}</p><StatusPill value={t.status} /><span className="rounded bg-secondary px-2 py-0.5 text-xs capitalize">{t.category || "ticket"}</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.email} · {fmtDate(t.created)} · priority {t.priority}</p>
                  {t.reply && <p className="mt-2 rounded-lg bg-primary/5 p-2 text-sm"><span className="font-semibold">Reply: </span>{t.reply}</p>}
                </div>
                <button className={btnO} onClick={() => setEdit(t)}>Manage</button>
              </div>
            </Card>
          ))}
          {shown.length === 0 && <p className="py-8 text-center text-muted-foreground">No tickets.</p>}
        </div>
      )}
      {edit && <TicketModal t={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </>
  );
}
function TicketModal({ t, onClose, onSaved }) {
  const [f, setF] = useState({ status: t.status || "open", priority: t.priority || "normal", assignedTo: t.assignedTo || "", internalNote: t.internalNote || "", reply: t.reply || "" });
  const [saving, setSaving] = useState(false);
  const save = async (email) => {
    setSaving(true);
    try { await adminApi.patch(`/support/${t.id}`, { ...f, sendEmail: !!email }); toast({ title: email ? "Reply sent" : "Ticket updated" }); onSaved(); }
    catch (e) { toast({ variant: "destructive", title: e.message }); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg p-6">
        <div className="mb-4 flex items-start justify-between"><h3 className="font-bold">{t.subject}</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium">Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={`${inp} mt-1`}><option value="open">Open</option><option value="pending">Pending</option><option value="closed">Closed</option></select></label>
            <label className="text-xs font-medium">Priority<select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className={`${inp} mt-1`}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
          </div>
          <label className="block text-xs font-medium">Assign staff<input value={f.assignedTo} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} className={`${inp} mt-1`} placeholder="Agent name" /></label>
          <label className="block text-xs font-medium">Internal note<textarea value={f.internalNote} onChange={(e) => setF({ ...f, internalNote: e.target.value })} rows={2} className={`${inp} mt-1`} /></label>
          <label className="block text-xs font-medium">Reply to customer<textarea value={f.reply} onChange={(e) => setF({ ...f, reply: e.target.value })} rows={3} className={`${inp} mt-1`} /></label>
          <div className="flex gap-2">
            <button disabled={saving} className={btnO} onClick={() => save(false)}><Save className="h-4 w-4" /> Save</button>
            <button disabled={saving} className={btnP} onClick={() => save(true)}><Send className="h-4 w-4" /> Save & email reply</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FeedbackSection() {
  const [d, setD] = useState(null);
  useEffect(() => { adminApi.get("/feedback").then(setD).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  if (!d) return <Spin />;
  return (
    <>
      <Head title="Customer Feedback" subtitle="Reviews, suggestions, NPS and satisfaction." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Star} label="Avg rating" value={`${d.avgRating || 0}/10`} tint="bg-amber-500/10 text-amber-500" />
        <Stat icon={TrendingUp} label="NPS score" value={d.npsScore ?? 0} tint="bg-indigo-500/10 text-indigo-500" />
        <Stat icon={CheckCircle2} label="Satisfaction" value={`${d.csat || 0}%`} tint="bg-emerald-500/10 text-emerald-500" />
        <Stat icon={Star} label="Total feedback" value={d.items?.length || 0} />
      </div>
      <div className="mt-6 space-y-3">
        {(d.items || []).map((x) => (
          <Card key={x.id} className="p-4">
            <div className="flex items-center gap-2"><span className="rounded bg-secondary px-2 py-0.5 text-xs capitalize">{x.type}</span>{x.rating != null && <span className="text-xs text-amber-500">★ {x.rating}</span>}<span className="ms-auto text-xs text-muted-foreground">{fmtDate(x.created)}</span></div>
            {x.message && <p className="mt-2 text-sm">{x.message}</p>}
            {x.authorEmail && <p className="mt-1 text-xs text-muted-foreground">{x.authorEmail}</p>}
          </Card>
        ))}
        {(!d.items || d.items.length === 0) && <p className="py-8 text-center text-muted-foreground">No feedback yet.</p>}
      </div>
    </>
  );
}

function BlogSection() {
  const [posts, setPosts] = useState(null);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => { adminApi.get("/blog").then((d) => setPosts(d.posts)).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  useEffect(load, [load]);
  const blank = { title: "", slug: "", excerpt: "", body: "", category: "", author: "CVPilot Team", cover: "", published: false };
  return (
    <>
      <Head title="Blog Management" subtitle="Create, edit and publish posts." action={<button className={btnP} onClick={() => setEdit(blank)}><Plus className="h-4 w-4" /> New post</button>} />
      {!posts ? <Spin /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{p.title}</p><p className="text-xs text-muted-foreground">{p.category || "Uncategorized"} · {fmtDate(p.created)}</p></div>
                <StatusPill value={p.published ? "published" : "draft"} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
              <div className="mt-3 flex gap-2">
                <button className={btnO} onClick={() => setEdit(p)}>Edit</button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete post?")) adminApi.del(`/blog/${p.id}`).then(load); }}><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
          {posts.length === 0 && <p className="py-8 text-center text-muted-foreground">No posts yet.</p>}
        </div>
      )}
      {edit && <BlogModal post={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </>
  );
}
function BlogModal({ post, onClose, onSaved }) {
  const [f, setF] = useState(post);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!f.title.trim()) return;
    setSaving(true);
    const body = { ...f, slug: f.slug || f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") };
    try { post.id ? await adminApi.patch(`/blog/${post.id}`, body) : await adminApi.post("/blog", body); toast({ title: "Saved" }); onSaved(); }
    catch (e) { toast({ variant: "destructive", title: e.message }); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between"><h3 className="font-bold">{post.id ? "Edit" : "New"} post</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="space-y-3">
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title" className={inp} />
          <div className="grid grid-cols-2 gap-3">
            <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Category / tag" className={inp} />
            <input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="SEO slug (auto)" className={inp} />
          </div>
          <input value={f.cover} onChange={(e) => setF({ ...f, cover: e.target.value })} placeholder="Featured image URL" className={inp} />
          <textarea value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} placeholder="Excerpt / SEO description" rows={2} className={inp} />
          <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Body (HTML)" rows={5} className={inp} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Publish now</label>
          <button disabled={saving} className={btnP} onClick={save}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save post</button>
        </div>
      </Card>
    </div>
  );
}

function TemplatesSection() {
  const [items, setItems] = useState(null);
  const [f, setF] = useState({ name: "", category: "", description: "", premium: false });
  const load = useCallback(() => { adminApi.get("/templates").then((d) => setItems(d.templates)).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  useEffect(load, [load]);
  const add = async (e) => { e.preventDefault(); if (!f.name.trim()) return; try { await adminApi.post("/templates", { ...f, slug: f.name.toLowerCase().replace(/\s+/g, "-") }); setF({ name: "", category: "", description: "", premium: false }); load(); } catch (er) { toast({ variant: "destructive", title: er.message }); } };
  return (
    <>
      <Head title="Template Management" subtitle="Add, enable/disable and categorize resume templates." />
      <form onSubmit={add} className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Template name" className={inp} />
        <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Category" className={inp} />
        <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description" className={inp} />
        <button className={btnP}><Plus className="h-4 w-4" /> Add</button>
      </form>
      {!items ? <Spin /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between"><div><p className="font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.category || "—"}</p></div>{t.premium && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Premium</span>}</div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-3 flex gap-2">
                <button className={btnO} onClick={() => adminApi.patch(`/templates/${t.id}`, { premium: !t.premium }).then(load)}>{t.premium ? "Make free" : "Make premium"}</button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete template?")) adminApi.del(`/templates/${t.id}`).then(load); }}><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="py-8 text-center text-muted-foreground">No templates yet.</p>}
        </div>
      )}
    </>
  );
}

function PricingSection() {
  const [pricing, setPricing] = useState(null);
  const [coupons, setCoupons] = useState(null);
  const [cf, setCf] = useState({ code: "", percentOff: "", amountOff: "", maxUses: "" });
  const loadC = useCallback(() => adminApi.get("/coupons").then((d) => setCoupons(d.coupons)), []);
  useEffect(() => { adminApi.get("/settings/pricing").then((d) => setPricing(d.value || {})).catch(() => setPricing({})); loadC().catch(() => setCoupons([])); }, [loadC]);
  const savePricing = async () => { try { await adminApi.put("/settings/pricing", { value: pricing }); toast({ title: "Pricing saved" }); } catch (e) { toast({ variant: "destructive", title: e.message }); } };
  const addCoupon = async (e) => { e.preventDefault(); if (!cf.code.trim()) return; try { await adminApi.post("/coupons", { code: cf.code.toUpperCase(), percentOff: Number(cf.percentOff) || 0, amountOff: Number(cf.amountOff) || 0, maxUses: Number(cf.maxUses) || 0 }); setCf({ code: "", percentOff: "", amountOff: "", maxUses: "" }); loadC(); } catch (er) { toast({ variant: "destructive", title: er.message }); } };
  if (!pricing) return <Spin />;
  const num = (k) => pricing[k] ?? "";
  return (
    <>
      <Head title="Pricing & Coupons" subtitle="Control prices, discounts and promotions." />
      <Card className="mb-6 p-5">
        <h3 className="mb-4 text-sm font-bold">Prices ({pricing.currency || "SAR"})</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {[["resumePrice", "Resume unlock"], ["proPrice", "Pro plan"], ["teamPrice", "Team plan"], ["currency", "Currency"]].map(([k, l]) => (
            <label key={k} className="text-xs font-medium">{l}<input value={num(k)} onChange={(e) => setPricing({ ...pricing, [k]: k === "currency" ? e.target.value : Number(e.target.value) })} className={`${inp} mt-1`} /></label>
          ))}
        </div>
        <button className={`${btnP} mt-4`} onClick={savePricing}><Save className="h-4 w-4" /> Save pricing</button>
      </Card>
      <form onSubmit={addCoupon} className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-5">
        <input value={cf.code} onChange={(e) => setCf({ ...cf, code: e.target.value })} placeholder="CODE" className={inp} />
        <input value={cf.percentOff} onChange={(e) => setCf({ ...cf, percentOff: e.target.value })} placeholder="% off" className={inp} />
        <input value={cf.amountOff} onChange={(e) => setCf({ ...cf, amountOff: e.target.value })} placeholder="Amount off" className={inp} />
        <input value={cf.maxUses} onChange={(e) => setCf({ ...cf, maxUses: e.target.value })} placeholder="Max uses" className={inp} />
        <button className={btnP}><Plus className="h-4 w-4" /> Add coupon</button>
      </form>
      {!coupons ? <Spin /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase text-muted-foreground"><tr>{["Code", "Discount", "Uses", "Active", ""].map((h) => <th key={h} className="p-3 text-start">{h}</th>)}</tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono font-semibold">{c.code}</td>
                  <td className="p-3">{c.percentOff ? `${c.percentOff}%` : money(c.amountOff)}</td>
                  <td className="p-3">{c.uses || 0}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                  <td className="p-3"><StatusPill value={c.active ? "operational" : "off"} /></td>
                  <td className="p-3"><div className="flex gap-1"><button className={btnO} onClick={() => adminApi.patch(`/coupons/${c.id}`, { active: !c.active }).then(loadC)}>{c.active ? "Disable" : "Enable"}</button><button className="rounded-md p-1.5 text-destructive hover:bg-destructive/10" onClick={() => adminApi.del(`/coupons/${c.id}`).then(loadC)}><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No coupons.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function NotificationsSection() {
  const [f, setF] = useState({ title: "", body: "", segment: "all", plan: "pro" });
  const [sending, setSending] = useState(false);
  const send = async (e) => {
    e.preventDefault(); if (!f.title.trim()) return; setSending(true);
    try { const r = await adminApi.post("/notifications", f); toast({ title: `Sent to ${r.sent} users` }); setF({ ...f, title: "", body: "" }); }
    catch (er) { toast({ variant: "destructive", title: er.message }); } finally { setSending(false); }
  };
  return (
    <>
      <Head title="Notifications" subtitle="Broadcast in-app notifications to segments." />
      <Card className="max-w-xl p-6">
        <form onSubmit={send} className="space-y-3">
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Notification title" className={inp} />
          <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Message" rows={3} className={inp} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium">Segment<select value={f.segment} onChange={(e) => setF({ ...f, segment: e.target.value })} className={`${inp} mt-1`}><option value="all">All users</option><option value="plan">By plan</option></select></label>
            {f.segment === "plan" && <label className="text-xs font-medium">Plan<select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} className={`${inp} mt-1`}><option value="free">Free</option><option value="pro">Pro</option><option value="team">Team</option></select></label>}
          </div>
          <button disabled={sending} className={btnP}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send broadcast</button>
        </form>
      </Card>
    </>
  );
}

function EmailSection() {
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => adminApi.get("/email-templates").then((d) => setItems(d.items)).catch((e) => toast({ variant: "destructive", title: e.message })), []);
  useEffect(load, [load]);
  return (
    <>
      <Head title="Email Templates" subtitle="Edit transactional email content." />
      {!items ? <Spin /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((t) => (
            <Card key={t.id} className="p-4">
              <p className="font-semibold">{t.name || t.key}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.subject}</p>
              <button className={`${btnO} mt-3`} onClick={() => setEdit(t)}>Edit</button>
            </Card>
          ))}
        </div>
      )}
      {edit && <EmailModal t={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </>
  );
}
function EmailModal({ t, onClose, onSaved }) {
  const [f, setF] = useState({ subject: t.subject || "", body: t.body || "" });
  const save = async () => { try { await adminApi.patch(`/email-templates/${t.id}`, f); toast({ title: "Saved" }); onSaved(); } catch (e) { toast({ variant: "destructive", title: e.message }); } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg p-6">
        <div className="mb-4 flex items-start justify-between"><h3 className="font-bold">{t.name}</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="space-y-3">
          <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Subject" className={inp} />
          <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={7} className={inp} />
          <button className={btnP} onClick={save}><Save className="h-4 w-4" /> Save template</button>
        </div>
      </Card>
    </div>
  );
}

const CURRENCIES = ["USD", "SAR", "EUR", "GBP", "AED"];
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

const PAYPAL_STEPS = [
  { field: "clientId", title: "PayPal Client ID", hint: "From your PayPal Developer app credentials. Required, at least 20 characters.", type: "text" },
  { field: "secret", title: "PayPal Secret Key", hint: "Stored encrypted — never displayed again. Leave blank when editing to keep the current secret.", type: "password" },
  { field: "environment", title: "Environment", hint: "Use Sandbox for testing, Live for real payments.", type: "env" },
  { field: "merchantEmail", title: "Merchant Email", hint: "Optional — the PayPal account that receives funds.", type: "text" },
  { field: "currency", title: "Currency", hint: "Charge currency for the resume unlock.", type: "currency" },
  { field: "amount", title: "Payment Amount", hint: "One-time unlock price in the selected currency.", type: "number" },
  { field: "successUrl", title: "Success URL", hint: "Auto-filled. Where PayPal returns after a successful payment.", type: "readonly" },
  { field: "cancelUrl", title: "Cancel URL", hint: "Auto-filled. Where PayPal returns if the buyer cancels.", type: "readonly" },
  { field: "webhookUrl", title: "Webhook URL", hint: "Auto-filled. Add this in your PayPal app to receive payment notifications.", type: "readonly" },
  { field: null, title: "Review & Save", hint: "Confirm your configuration, then save and test the PayPal connection.", type: "review" },
];

function validatePaypalStep(field, form, hadSecret) {
  switch (field) {
    case "clientId":
      return form.clientId.trim().length >= 20 ? "" : "Client ID must be at least 20 characters.";
    case "secret":
      if (hadSecret && !form.secret.trim()) return ""; // keep existing
      return form.secret.trim().length >= 20 ? "" : "Secret Key must be at least 20 characters.";
    case "environment":
      return ["sandbox", "live"].includes(form.environment) ? "" : "Select an environment.";
    case "currency":
      return CURRENCIES.includes(form.currency) ? "" : "Select a currency.";
    case "amount":
      return Number(form.amount) > 0 ? "" : "Amount must be greater than 0.";
    default:
      return "";
  }
}

function PayPalWizard() {
  const [loading, setLoading] = useState(true);
  const [hadSecret, setHadSecret] = useState(false);
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // {ok, message}
  const [form, setForm] = useState({
    clientId: "", secret: "", environment: "sandbox", merchantEmail: "",
    currency: "USD", amount: 2.69,
    successUrl: `${ORIGIN}/payment-success`,
    cancelUrl: `${ORIGIN}/payment-cancel`,
    webhookUrl: `${ORIGIN}/hcgi/api/webhooks/paypal`,
  });

  useEffect(() => {
    adminApi.get("/paypal").then((d) => {
      const v = d.value || {};
      setHadSecret(!!v.secretSet);
      setVerified(!!v.verified);
      setForm((f) => ({
        ...f,
        clientId: v.clientId || "",
        secret: "",
        environment: v.environment || "sandbox",
        merchantEmail: v.merchantEmail || "",
        currency: v.currency || "USD",
        amount: v.amount || 2.69,
        successUrl: v.successUrl || `${ORIGIN}/payment-success`,
        cancelUrl: v.cancelUrl || `${ORIGIN}/payment-cancel`,
        webhookUrl: v.webhookUrl || `${ORIGIN}/hcgi/api/webhooks/paypal`,
      }));
    }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  const set = (k, val) => setForm((f) => ({ ...f, [k]: val }));
  const cur = PAYPAL_STEPS[step];
  const total = PAYPAL_STEPS.length;

  const next = () => {
    const msg = validatePaypalStep(cur.field, form, hadSecret);
    if (msg) { setErr(msg); return; }
    setErr(""); setStep((s) => Math.min(total - 1, s + 1));
  };
  const prev = () => { setErr(""); setStep((s) => Math.max(0, s - 1)); };

  const saveAndTest = async () => {
    // Final full validation.
    for (const s of PAYPAL_STEPS) {
      const msg = validatePaypalStep(s.field, form, hadSecret);
      if (msg) { setErr(msg); return; }
    }
    setSaving(true); setErr(""); setResult(null);
    try {
      await adminApi.put("/paypal", { value: form });
      const test = await adminApi.post("/paypal/test");
      setVerified(true);
      setResult({ ok: true, message: test.message || "PayPal configured successfully" });
      setHadSecret(true);
      toast({ title: "PayPal configured successfully" });
    } catch (e) {
      setVerified(false);
      setResult({ ok: false, message: e.message });
    } finally { setSaving(false); }
  };

  if (loading) return <Spin />;

  const pct = Math.round(((step + 1) / total) * 100);
  const reviewRows = [
    ["Client ID", form.clientId ? `${form.clientId.slice(0, 6)}…${form.clientId.slice(-4)}` : "—"],
    ["Secret Key", form.secret ? "•••••••• (new)" : hadSecret ? "•••••••• (kept)" : "— not set"],
    ["Environment", form.environment],
    ["Merchant email", form.merchantEmail || "—"],
    ["Currency", form.currency],
    ["Amount", `${form.amount} ${form.currency}`],
    ["Success URL", form.successUrl],
    ["Cancel URL", form.cancelUrl],
    ["Webhook URL", form.webhookUrl],
  ];

  return (
    <Card className="max-w-2xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold"><CreditCard className="h-4 w-4" /> PayPal Setup Wizard</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verified ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
          {verified ? "Payments active" : "Not configured"}
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Step {step + 1} / {total}</span>
        <span>{cur.title}</span>
      </div>
      <div className="mb-6 h-2 rounded-full bg-secondary"><div className="h-2 rounded-full gradient-primary transition-all" style={{ width: `${pct}%` }} /></div>

      <div className="min-h-[160px]">
        <h4 className="text-base font-bold">{cur.title}</h4>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">{cur.hint}</p>

        {cur.type === "text" && <input value={form[cur.field]} onChange={(e) => set(cur.field, e.target.value)} className={inp} placeholder={cur.title} />}
        {cur.type === "password" && <input type="password" autoComplete="new-password" value={form.secret} onChange={(e) => set("secret", e.target.value)} className={inp} placeholder={hadSecret ? "Leave blank to keep current secret" : "Enter secret key"} />}
        {cur.type === "number" && <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} className={inp} />}
        {cur.type === "env" && (
          <div className="flex gap-3">
            {["sandbox", "live"].map((v) => (
              <button key={v} onClick={() => set("environment", v)} className={`flex-1 rounded-xl border p-4 text-start ${form.environment === v ? "border-primary bg-primary/5" : "border-border"}`}>
                <span className="block text-sm font-semibold capitalize">{v}</span>
                <span className="block text-xs text-muted-foreground">{v === "sandbox" ? "Test mode (no real charges)" : "Real payments"}</span>
              </button>
            ))}
          </div>
        )}
        {cur.type === "currency" && (
          <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inp}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {cur.type === "readonly" && <input readOnly value={form[cur.field]} className={`${inp} cursor-not-allowed opacity-70`} />}
        {cur.type === "review" && (
          <div className="space-y-1.5 rounded-xl border border-border p-4">
            {reviewRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{k}</span><span className="truncate font-medium">{v}</span></div>
            ))}
          </div>
        )}
      </div>

      {err && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {result && (
        <p className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
          {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />} {result.message}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button onClick={prev} disabled={step === 0} className={`${btnO} disabled:opacity-40`}>Previous</button>
        {cur.type === "review" ? (
          <button onClick={saveAndTest} disabled={saving} className={btnP}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save & test connection</button>
        ) : (
          <button onClick={next} className={btnP}>Next</button>
        )}
      </div>
    </Card>
  );
}

const SETTINGS_TABS = [
  { key: "general", label: "General", fields: [["companyName", "Company name", "text"], ["supportEmail", "Support email", "text"], ["currency", "Currency", "text"], ["timezone", "Timezone", "text"], ["taxPercent", "Tax %", "number"], ["defaultLanguage", "Default language", "text"]] },
  { key: "payments", label: "Payments (PayPal)", wizard: true, fields: [] },
  { key: "ai", label: "AI Provider", fields: [["provider", "Provider (openai/gemini/claude)", "text"], ["model", "Model (e.g. gpt-4o, gpt-4-turbo)", "text"], ["apiKey", "API key (leave blank to use server env)", "text"], ["temperature", "Temperature (0–2)", "number"], ["maxTokens", "Max tokens", "number"]] },
  { key: "seo", label: "SEO", fields: [["metaTitle", "Meta title", "text"], ["metaDescription", "Meta description", "text"], ["robots", "Robots", "text"], ["ga", "Google Analytics ID", "text"], ["gtm", "Google Tag Manager", "text"], ["metaPixel", "Meta Pixel", "text"], ["searchConsole", "Search Console", "text"]] },
  { key: "ads", label: "Ads", fields: [["enabled", "Enable ads", "bool"], ["freeUsersOnly", "Ads only for free users", "bool"], ["adsenseId", "AdSense ID", "text"]] },
  { key: "google", label: "Google & Ads (Live)", integrations: true, fields: [["ga4", "Google Analytics 4 ID (G-XXXX)", "text"], ["gtm", "Google Tag Manager (GTM-XXXX)", "text"], ["clarity", "Microsoft Clarity ID", "text"], ["adsense", "AdSense publisher (ca-pub-XXXX)", "text"]] },
  { key: "backups", label: "Backups", fields: [["daily", "Daily backup", "bool"], ["weekly", "Weekly backup", "bool"], ["monthly", "Monthly backup", "bool"]] },
];
function SettingsSection() {
  const [tab, setTab] = useState("general");
  const [value, setValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const cfg = SETTINGS_TABS.find((t) => t.key === tab);
  const path = cfg?.integrations ? "/integrations" : `/settings/${tab}`;
  useEffect(() => {
    if (cfg?.wizard) { setValue({}); return; }
    setValue(null);
    adminApi.get(path).then((d) => setValue(d.value || {})).catch(() => setValue({}));
  }, [path, cfg?.wizard]);
  const save = async () => { setSaving(true); try { await adminApi.put(path, { value }); toast({ title: "Settings saved" }); } catch (e) { toast({ variant: "destructive", title: e.message }); } finally { setSaving(false); } };
  return (
    <>
      <Head title="Settings" subtitle="Configure the platform without touching code." />
      <div className="mb-4 flex flex-wrap gap-2">
        {SETTINGS_TABS.map((t) => <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.key ? "gradient-primary text-white" : "border border-border hover:bg-secondary"}`}>{t.label}</button>)}
      </div>
      {cfg?.wizard ? <PayPalWizard /> : !value ? <Spin /> : (
        <Card className="max-w-xl p-6">
          <div className="space-y-3">
            {cfg.fields.map(([k, label, type]) => type === "bool" ? (
              <label key={k} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"><span>{label}</span><input type="checkbox" checked={!!value[k]} onChange={(e) => setValue({ ...value, [k]: e.target.checked })} /></label>
            ) : (
              <label key={k} className="block text-xs font-medium">{label}<input type={type} value={value[k] ?? ""} onChange={(e) => setValue({ ...value, [k]: type === "number" ? Number(e.target.value) : e.target.value })} className={`${inp} mt-1`} /></label>
            ))}
            <button disabled={saving} className={btnP} onClick={save}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save {cfg.label}</button>
          </div>
        </Card>
      )}
    </>
  );
}

function SecuritySection() {
  const [logs, setLogs] = useState(null);
  useEffect(() => { adminApi.get("/logs").then((d) => setLogs(d.logs)).catch((e) => toast({ variant: "destructive", title: e.message })); }, []);
  return (
    <>
      <Head title="Security & Audit Log" subtitle="Admin activity, IP addresses and audit trail." />
      {!logs ? <Spin /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase text-muted-foreground"><tr>{["Action", "Actor", "Target", "IP", "When"].map((h) => <th key={h} className="p-3 text-start">{h}</th>)}</tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{l.action}</td>
                  <td className="p-3 text-muted-foreground">{l.actor}</td>
                  <td className="p-3 text-muted-foreground">{l.target || "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{l.ip || "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(l.created).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No activity logged yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function SystemSection() {
  const [d, setD] = useState(null);
  useEffect(() => {
    const load = () => adminApi.get("/system-health").then(setD).catch(() => {});
    load(); const id = setInterval(load, 5000); return () => clearInterval(id);
  }, []);
  if (!d) return <Spin />;
  const gauges = [["CPU usage", d.cpu], ["Memory usage", d.memory], ["Storage usage", d.storage]];
  return (
    <>
      <Head title="System Health" subtitle="Live infrastructure and service status." />
      <div className="grid gap-4 sm:grid-cols-3">
        {gauges.map(([l, v]) => (
          <Card key={l} className="p-5">
            <div className="mb-2 flex justify-between text-sm"><span className="font-medium">{l}</span><span className="font-bold">{v}%</span></div>
            <div className="h-3 rounded-full bg-secondary"><div className={`h-3 rounded-full ${v > 85 ? "bg-rose-500" : v > 65 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${v}%` }} /></div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><Server className="h-4 w-4" /> Services · uptime {Math.floor(d.uptime / 60)}m</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(d.services).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium capitalize">{k}</span>
              <span className="flex items-center gap-1.5 text-xs"><Circle className={`h-2.5 w-2.5 ${v === "operational" ? "fill-emerald-500 text-emerald-500" : "fill-rose-500 text-rose-500"}`} /><StatusPill value={v} /></span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ---------------------------------- shell -------------------------------- */

const PROMPT_KINDS = [
  { key: "chat", label: "Conversation (Pilot chat)", hint: "Governs the public AI chat — how Pilot analyzes documents, reasons before asking, stays natural, never invents data, and emits the hidden [[[READY_TO_BUILD]]] signal." },
  { key: "resume", label: "Resume Generation Engine", hint: "Governs how the structured resume (English + Arabic) is generated and ATS-optimized. Never fabricates employers, dates, metrics, degrees or skills." },
  { key: "quality", label: "Quality Review Engine", hint: "Governs the final HR-grade quality review of the generated resume before it is shown." },
];

function PromptsSection() {
  const [value, setValue] = useState(null);
  const [defaults, setDefaults] = useState({});
  const [active, setActive] = useState("chat");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([
      adminApi.get("/settings/prompts").then((d) => d.value || {}).catch(() => ({})),
      adminApi.get("/prompt-defaults").then((d) => d.defaults || {}).catch(() => ({})),
    ]).then(([v, def]) => {
      setDefaults(def);
      const merged = {};
      for (const k of PROMPT_KINDS.map((p) => p.key)) merged[k] = (v[k] ?? def[k] ?? "");
      setValue(merged);
    });
  }, []);
  const save = async () => {
    setSaving(true);
    try { await adminApi.put("/settings/prompts", { value }); toast({ title: "System prompts saved — live on next request" }); }
    catch (e) { toast({ variant: "destructive", title: e.message }); } finally { setSaving(false); }
  };
  if (!value) return <Spin />;
  const cur = PROMPT_KINDS.find((p) => p.key === active);
  const isDefault = value[active] === (defaults[active] || "");
  return (
    <>
      <Head title="AI System Prompts" subtitle="Every AI behavior rule lives here. Prompts are sent with each OpenAI request; edits take effect immediately."
        action={<button disabled={saving} className={btnP} onClick={save}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save all prompts</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {PROMPT_KINDS.map((p) => (
          <button key={p.key} onClick={() => setActive(p.key)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active === p.key ? "gradient-primary text-white" : "border border-border hover:bg-secondary"}`}>{p.label}</button>
        ))}
      </div>
      <Card className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">{cur.label}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{cur.hint}</p>
          </div>
          <button
            onClick={() => setValue({ ...value, [active]: defaults[active] || "" })}
            disabled={isDefault}
            className={`${btnO} shrink-0 disabled:opacity-40`}
          ><RotateCcw className="h-4 w-4" /> Reset to default</button>
        </div>
        <textarea
          value={value[active]}
          onChange={(e) => setValue({ ...value, [active]: e.target.value })}
          rows={26}
          spellCheck={false}
          className={`${inp} font-mono text-xs leading-relaxed`}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{value[active].length.toLocaleString()} characters</span>
          <span>{isDefault ? "Using built-in default" : "Custom (overrides default)"}</span>
        </div>
      </Card>
    </>
  );
}

const SECTIONS = {
  home: Overview, users: UsersSection, payments: PaymentsSection, resumes: ResumeAnalytics,
  ai: AiAnalytics, prompts: PromptsSection, support: SupportSection, feedback: FeedbackSection, blog: BlogSection,
  templates: TemplatesSection, pricing: PricingSection, notifications: NotificationsSection,
  email: EmailSection, settings: SettingsSection, security: SecuritySection, system: SystemSection,
};

export default function AdminDashboard() {
  const { isAuthed, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary/20 p-6 text-center">
        <ShieldCheck className="h-12 w-12 text-primary" />
        <h1 className="text-xl font-bold">Admin access required</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Your account ({user?.email}) does not have administrator permissions.</p>
        <Link to="/dashboard" className={btnP}>Go to dashboard</Link>
      </div>
    );
  }

  const Section = SECTIONS[active];
  const go = (k) => { setActive(k); setOpen(false); };
  const doLogout = () => { logout(); navigate("/"); };

  const Side = (
    <>
      <div className="flex items-center justify-between border-b border-border p-5">
        <Logo />
        <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
      </div>
      <div className="px-4 py-3"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Admin · {user?.role}</span></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((n) => (
          <button key={n.key} onClick={() => go(n.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === n.key ? "gradient-primary text-white shadow-lg shadow-violet-600/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
            <n.icon className="h-4 w-4 shrink-0" /> {n.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link to="/dashboard" className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"><LayoutDashboard className="h-4 w-4" /> User dashboard</Link>
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"><LogOut className="h-4 w-4" /> Log out</button>
      </div>
    </>
  );

  return (
    <>
      <Seo title="Admin Dashboard" path="/admin" />
      <div className="flex min-h-screen bg-secondary/20">
        <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-border bg-card lg:flex">{Side}</aside>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 start-0 flex w-64 flex-col bg-card">{Side}</aside>
          </div>
        )}
        <div className="flex-1 lg:ms-64">
          <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 backdrop-blur lg:hidden">
            <button onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
            <Logo />
            <button onClick={doLogout}><LogOut className="h-5 w-5" /></button>
          </header>
          <main className="p-5 sm:p-6 lg:p-10"><Section /></main>
        </div>
      </div>
    </>
  );
}
