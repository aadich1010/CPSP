'use client'

import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── MOCK DATA (replace with Supabase queries) ───────────────────────────────

const scoreOverTime = [
  { date: "Jan 1",  score: 52 },
  { date: "Jan 8",  score: 58 },
  { date: "Jan 15", score: 55 },
  { date: "Jan 22", score: 63 },
  { date: "Jan 29", score: 70 },
  { date: "Feb 5",  score: 68 },
  { date: "Feb 12", score: 74 },
  { date: "Feb 19", score: 71 },
  { date: "Feb 26", score: 78 },
  { date: "Mar 5",  score: 82 },
];

const subjectPerformance = [
  { subject: "Anatomy",       correct: 72, total: 100 },
  { subject: "Physiology",    correct: 65, total: 100 },
  { subject: "Biochemistry",  correct: 58, total: 100 },
  { subject: "Pathology",     correct: 81, total: 100 },
  { subject: "Pharmacology",  correct: 69, total: 100 },
  { subject: "Microbiology",  correct: 74, total: 100 },
];

// Brand-emerald family (matches --emerald:#10B981 in globals.css) -- this
// file used to run its own separate teal palette (#1D9E75 / #0F6E56 /
// #9FE1CB), which read as a visibly different "brand color" from the rest
// of the app when a student moved from the dashboard/exam screens into
// Analytics.
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   "#10B981",
  Medium: "#059669",
  Hard:   "#6EE7B7",
};

const radarData = subjectPerformance.map(s => ({
  subject: s.subject.slice(0, 5),
  score: s.correct,
}));

// ─── SUPABASE QUERY HINTS ─────────────────────────────────────────────────────
/*
  Replace mock data above with real Supabase calls:

  // Score over time
  const { data } = await supabase
    .from('quiz_attempts')
    .select('created_at, score')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  // Subject performance
  const { data } = await supabase
    .from('quiz_attempts')
    .select('subject, correct_count, total_questions')
    .eq('user_id', userId);

  // Difficulty breakdown
  const { data } = await supabase
    .from('quiz_attempts')
    .select('difficulty, correct_count, total_questions')
    .eq('user_id', userId);
*/

// ─── THEME ───────────────────────────────────────────────────────────────────
// Same emerald family as DIFFICULTY_COLORS above -- kept the `teal*` key
// names (renaming them would touch every usage below for no behavioural
// gain) but the values now match the site-wide --emerald brand color
// instead of this file's old standalone teal.
const T = {
  teal:      "#10B981",
  tealDark:  "#059669",
  tealLight: "#6EE7B7",
  tealBg:    "#D1FAE5",
  white:     "#FFFFFF",
  gray:      "#F7F9F8",
  border:    "#BBF0D8",
  text:      "#0B2D22",
  muted:     "#5A8A78",
};

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: "8px 14px",
      boxShadow: "0 2px 8px rgba(15,110,86,0.10)",
      fontSize: 13, color: T.text,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: T.tealDark }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.teal }}>
          {p.name}: <strong>{p.value}{p.name === "Score" ? "%" : p.name === "Accuracy" ? "%" : ""}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

const StatCard = ({ label, value, sub, accent }: StatCardProps) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "8px 12px",
    borderLeft: `4px solid ${accent || T.teal}`,
    flex: 1, minWidth: 140,
  }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ fontSize: 21, fontWeight: 700, color: T.text, margin: "2px 0 1px", lineHeight: 1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 10, color: T.muted }}>{sub}</div>}
  </div>
);

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Card = ({ title, children, style }: CardProps) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "8px 12px",
    display: "flex", flexDirection: "column", minHeight: 0, ...style,
  }}>
    {title && (
      <div style={{ fontSize: 10.5, fontWeight: 600, color: T.tealDark, marginBottom: 4,
        textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0 }}>
        {title}
      </div>
    )}
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

// ─── DIFFICULTY BAR ───────────────────────────────────────────────────────────
interface DiffBarProps {
  name: string;
  value: number;
  color: string;
}

const DiffBar = ({ name, value, color }: DiffBarProps) => (
  <div style={{ marginBottom: 7 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.text, marginBottom: 3 }}>
      <span style={{ fontWeight: 500 }}>{name}</span>
      <span style={{ color: T.muted }}>{value}%</span>
    </div>
    <div style={{ background: T.tealBg, borderRadius: 99, height: 8, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", borderRadius: 99,
        background: color, transition: "width 0.6s ease",
      }} />
    </div>
  </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export interface QuizAttempt {
  score: number;
  total_questions: number;
  subject: string;
  difficulty?: string;
  created_at: string;
}

export interface DifficultyRow {
  difficulty: string;
  correct: number;
  total: number;
}

export default function AnalyticsDashboard({
  attempts = [],
  difficultyRows = [],
}: {
  attempts: QuizAttempt[];
  difficultyRows?: DifficultyRow[];
}) {
  const [activeTab, setActiveTab] = useState("overview");

  // Computed Values
  const totalAttempts  = attempts.length;
  const avgScore       = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / totalAttempts) 
    : 0;
  
  const passedAttempts = attempts.filter(a => (a.score / a.total_questions) >= 0.6).length;
  const passRate       = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  
  const totalCorrect   = attempts.reduce((sum, a) => sum + a.score, 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
  const accuracy       = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Chart Data
  const scoreOverTime = attempts.map(a => ({
    date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round((a.score / a.total_questions) * 100)
  }));

  // Group by Subject
  const subjectMap = new Map();
  attempts.forEach(a => {
    if (!subjectMap.has(a.subject)) {
      subjectMap.set(a.subject, { correct: 0, total: 0 });
    }
    const stat = subjectMap.get(a.subject);
    stat.correct += a.score;
    stat.total += a.total_questions;
  });

  const subjectPerformance = Array.from(subjectMap.entries()).map(([sub, stat]) => ({
    subject: sub,
    correct: Math.round((stat.correct / stat.total) * 100) || 0,
    total: stat.total
  }));

  const radarData = subjectPerformance.map(s => ({
    subject: s.subject.slice(0, 5),
    score: s.correct,
  }));

  // Real accuracy per difficulty band, ordered Easy -> Hard so the bars
  // read as a progression rather than in whatever order Postgres grouped.
  const DIFF_ORDER = ["Easy", "Medium", "Hard"];
  const difficultyData = difficultyRows
    .filter(r => r.total > 0)
    .map(r => ({
      name:  r.difficulty,
      value: Math.round((r.correct / r.total) * 100),
      count: r.total,
      color: DIFFICULTY_COLORS[r.difficulty] || "#059669",
    }))
    .sort((a, b) => DIFF_ORDER.indexOf(a.name) - DIFF_ORDER.indexOf(b.name));

  const tabs = ["overview", "subjects", "difficulty"];

  return (
    <div className="animate-fade-in" style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: T.text,
      height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden",
    }}>

      <div style={{
        maxWidth: 1180, width: "100%", margin: "0 auto", padding: 0,
        flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
      }}>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexShrink: 0 }}>
          <StatCard label="Total Attempts"  value={totalAttempts} sub="All time"        accent={T.teal}      />
          <StatCard label="Average Score"   value={`${avgScore}%`} sub="Last 10 quizzes" accent={T.tealDark}  />
          <StatCard label="Pass Rate"        value={`${passRate}%`} sub="≥60% threshold"  accent="#047857"     />
          <StatCard label="Overall Accuracy" value={`${accuracy}%`} sub="Correct answers" accent={T.tealLight} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexShrink: 0 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "5px 14px", borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              background: activeTab === tab ? T.teal : T.white,
              color:      activeTab === tab ? T.white : T.muted,
              border:     activeTab === tab ? "none" : `1px solid ${T.border}`,
              textTransform: "capitalize", transition: "all 0.15s",
            }}>
              {tab === "overview" ? "Overview" : tab === "subjects" ? "By Subject" : "By Difficulty"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Score over time */}
            <Card title="Score over time" style={{ flex: 1.25, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreOverTime} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} minTickGap={12} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" name="Score" stroke={T.teal}
                    strokeWidth={2.5} dot={{ r: 4, fill: T.teal, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: T.tealDark }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Pass rate + accuracy donut row */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 10 }}>
              <Card title="Pass vs Fail" style={{ flex: 1, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: "Pass", value: passRate }, { name: "Fail", value: 100 - passRate }]}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={68} startAngle={90} endAngle={-270}
                      paddingAngle={3} dataKey="value">
                      <Cell fill={T.teal} />
                      <Cell fill={T.tealBg} />
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", fontSize: 11, color: T.muted, flexShrink: 0 }}>
                  <span style={{ color: T.teal, fontWeight: 700 }}>{passRate}%</span> passed (≥60%)
                </div>
              </Card>

              <Card title="Accuracy breakdown" style={{ flex: 1, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: "Correct", value: accuracy }, { name: "Wrong", value: 100 - accuracy }]}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={68} startAngle={90} endAngle={-270}
                      paddingAngle={3} dataKey="value">
                      <Cell fill={T.tealDark} />
                      <Cell fill={T.tealBg} />
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", fontSize: 11, color: T.muted, flexShrink: 0 }}>
                  <span style={{ color: T.tealDark, fontWeight: 700 }}>{accuracy}%</span> correct answers
                </div>
              </Card>

              <Card title="Radar — all subjects" style={{ flex: 1.5, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: T.muted }} />
                    <Radar name="Score" dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.18} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* ── SUBJECTS TAB ── */}
        {activeTab === "subjects" && (
          <Card title="Subject-wise performance (% correct)" style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
                barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="correct" name="Accuracy" radius={[6, 6, 0, 0]}>
                  {subjectPerformance.map((entry, i) => (
                    <Cell key={i} fill={entry.correct >= 70 ? T.teal : entry.correct >= 60 ? "#047857" : T.tealLight} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 11, color: T.muted, flexShrink: 0, flexWrap: "wrap" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.teal, marginRight: 5 }} />≥70% Strong</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#047857", marginRight: 5 }} />60–69% OK</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.tealLight, marginRight: 5 }} />Below 60% — Needs work</span>
            </div>
          </Card>
        )}

        {/* ── DIFFICULTY TAB ── */}
        {activeTab === "difficulty" && (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 10 }}>
            <Card title="Accuracy by difficulty level" style={{ flex: 2, minWidth: 0 }}>
              <div style={{ padding: "4px 0" }}>
                {difficultyData.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.muted }}>
                    No graded attempts yet — complete an exam to see this breakdown.
                  </div>
                ) : difficultyData.map(d => (
                  <DiffBar key={d.name} name={`${d.name} (${d.count} questions)`}
                    value={d.value} color={d.color} />
                ))}
              </div>
            </Card>

            <Card title="Distribution" style={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={difficultyData} cx="50%" cy="50%" outerRadius="78%"
                    paddingAngle={4} dataKey="value" nameKey="name" label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}>
                    {difficultyData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            </div>

            {/* Difficulty stat cards */}
            <div style={{ width: "100%", display: "flex", gap: 10, flexShrink: 0 }}>
              {difficultyData.map(d => (
                <StatCard key={d.name} label={`${d.name} questions`} value={`${d.value}%`}
                  sub={`${d.count} questions answered`} accent={d.color} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
