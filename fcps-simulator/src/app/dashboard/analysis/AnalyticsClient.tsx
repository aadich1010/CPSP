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

const difficultyData = [
  { name: "Easy",   value: 88, color: "#1D9E75" },
  { name: "Medium", value: 65, color: "#0F6E56" },
  { name: "Hard",   value: 41, color: "#9FE1CB" },
];

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
const T = {
  teal:      "#1D9E75",
  tealDark:  "#0F6E56",
  tealLight: "#9FE1CB",
  tealBg:    "#E1F5EE",
  white:     "#FFFFFF",
  gray:      "#F7F9F8",
  border:    "#D4EDE5",
  text:      "#0B2D22",
  muted:     "#5A8A78",
};

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: "8px 14px",
      boxShadow: "0 2px 8px rgba(15,110,86,0.10)",
      fontSize: 13, color: T.text,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: T.tealDark }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || T.teal }}>
          {p.name}: <strong>{p.value}{p.name === "Score" ? "%" : p.name === "Accuracy" ? "%" : ""}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }: any) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: "20px 24px",
    borderLeft: `4px solid ${accent || T.teal}`,
    flex: 1, minWidth: 160,
  }}>
    <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, color: T.text, margin: "6px 0 2px", lineHeight: 1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>}
  </div>
);

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const Card = ({ title, children, style }: any) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: "20px 24px", ...style,
  }}>
    {title && (
      <div style={{ fontSize: 13, fontWeight: 600, color: T.tealDark, marginBottom: 16,
        textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </div>
    )}
    {children}
  </div>
);

// ─── DIFFICULTY BAR ───────────────────────────────────────────────────────────
const DiffBar = ({ name, value, color }: any) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.text, marginBottom: 5 }}>
      <span style={{ fontWeight: 500 }}>{name}</span>
      <span style={{ color: T.muted }}>{value}%</span>
    </div>
    <div style={{ background: T.tealBg, borderRadius: 99, height: 10, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", borderRadius: 99,
        background: color, transition: "width 0.6s ease",
      }} />
    </div>
  </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ attempts = [] }: { attempts: any[] }) {
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

  const tabs = ["overview", "subjects", "difficulty"];

  return (
    <div className="animate-fade-in" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: T.text }}>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 28px 0" }}>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total Attempts"  value={totalAttempts} sub="All time"        accent={T.teal}      />
          <StatCard label="Average Score"   value={`${avgScore}%`} sub="Last 10 quizzes" accent={T.tealDark}  />
          <StatCard label="Pass Rate"        value={`${passRate}%`} sub="≥60% threshold"  accent="#0B8A62"     />
          <StatCard label="Overall Accuracy" value={`${accuracy}%`} sub="Correct answers" accent={T.tealLight} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "7px 18px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 600,
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
          <>
            {/* Score over time */}
            <Card title="Score over time" style={{ marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={scoreOverTime} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" name="Score" stroke={T.teal}
                    strokeWidth={2.5} dot={{ r: 4, fill: T.teal, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: T.tealDark }} />
                </LineChart>
              </ResponsiveContainer>
              {/* Supabase hint */}
              <div style={{ marginTop: 8, fontSize: 11, color: T.muted, fontFamily: "monospace",
                background: T.tealBg, borderRadius: 6, padding: "6px 10px" }}>
                {`// Supabase: .from('quiz_attempts').select('created_at, score').eq('user_id', userId)`}
              </div>
            </Card>

            {/* Pass rate + accuracy donut row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Card title="Pass vs Fail" style={{ flex: 1, minWidth: 220 }}>
                <ResponsiveContainer width="100%" height={160}>
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
                <div style={{ textAlign: "center", marginTop: -8, fontSize: 13, color: T.muted }}>
                  <span style={{ color: T.teal, fontWeight: 700 }}>{passRate}%</span> passed (≥60%)
                </div>
              </Card>

              <Card title="Accuracy breakdown" style={{ flex: 1, minWidth: 220 }}>
                <ResponsiveContainer width="100%" height={160}>
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
                <div style={{ textAlign: "center", marginTop: -8, fontSize: 13, color: T.muted }}>
                  <span style={{ color: T.tealDark, fontWeight: 700 }}>{accuracy}%</span> correct answers
                </div>
              </Card>

              <Card title="Radar — all subjects" style={{ flex: 1.5, minWidth: 260 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: T.muted }} />
                    <Radar name="Score" dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.18} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}

        {/* ── SUBJECTS TAB ── */}
        {activeTab === "subjects" && (
          <Card title="Subject-wise performance (% correct)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectPerformance} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
                barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="correct" name="Accuracy" radius={[6, 6, 0, 0]}>
                  {subjectPerformance.map((entry, i) => (
                    <Cell key={i} fill={entry.correct >= 70 ? T.teal : entry.correct >= 60 ? "#0B8A62" : T.tealLight} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: T.muted }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.teal, marginRight: 5 }} />≥70% Strong</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#0B8A62", marginRight: 5 }} />60–69% OK</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.tealLight, marginRight: 5 }} />Below 60% — Needs work</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: T.muted, fontFamily: "monospace",
              background: T.tealBg, borderRadius: 6, padding: "6px 10px" }}>
              {`// Supabase: .from('quiz_attempts').select('subject, correct_count, total_questions')`}
            </div>
          </Card>
        )}

        {/* ── DIFFICULTY TAB ── */}
        {activeTab === "difficulty" && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Card title="Accuracy by difficulty level" style={{ flex: 2, minWidth: 300 }}>
              <div style={{ padding: "8px 0" }}>
                {difficultyData.map(d => (
                  <DiffBar key={d.name} name={d.name} value={d.value} color={d.color} />
                ))}
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: T.muted, fontFamily: "monospace",
                background: T.tealBg, borderRadius: 6, padding: "6px 10px" }}>
                {`// Supabase: .from('quiz_attempts').select('difficulty, correct_count, total_questions')`}
              </div>
            </Card>

            <Card title="Distribution" style={{ flex: 1, minWidth: 220 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={difficultyData} cx="50%" cy="50%" outerRadius={80}
                    paddingAngle={4} dataKey="value" nameKey="name" label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}>
                    {difficultyData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Difficulty stat cards */}
            <div style={{ width: "100%", display: "flex", gap: 16, flexWrap: "wrap" }}>
              {difficultyData.map(d => (
                <StatCard key={d.name} label={`${d.name} questions`} value={`${d.value}%`}
                  sub="Accuracy rate" accent={d.color} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
