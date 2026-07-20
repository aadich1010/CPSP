'use client'

import { useState, useEffect } from 'react'
import { importQuestionsBulk } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 
  'Microbiology', 'Forensic Medicine', 'Community Medicine', 'Surgery', 
  'Medicine', 'Obstetrics & Gynecology', 'Pediatrics', 'ENT', 'Ophthalmology',
  'Miscellaneous'
]

interface ParsedQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e?: string
  correct_answer: string
  subject: string
  explanation?: string
  difficulty?: string
}

export default function ImportQuestionsPage() {
  const [rawText, setRawText] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedQuestion[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  function detectSubjectFromText(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('nerve') || lower.includes('artery') || lower.includes('muscle')) return 'Anatomy'
    if (lower.includes('lung') || lower.includes('respiratory') || lower.includes('compliance')) return 'Physiology'
    if (lower.includes('hormone') || lower.includes('pressure') || lower.includes('flow')) return 'Physiology'
    if (lower.includes('drug') || lower.includes('aspirin') || lower.includes('dose')) return 'Pharmacology'
    if (lower.includes('virus') || lower.includes('bacteria') || lower.includes('infection')) return 'Microbiology'
    if (lower.includes('cancer') || lower.includes('tumor') || lower.includes('malignant')) return 'Pathology'
    if (lower.includes('enzyme') || lower.includes('protein') || lower.includes('glucose')) return 'Biochemistry'
    return 'Miscellaneous'
  }

  function handleParse() {
    if (!rawText.trim()) return
    setParsing(true)
    setParseError('')
    setParsed([])
    
    setTimeout(() => {
      try {
        let trimmed = rawText.trim()
        let jsonParsed: any[] = []

        // Try standard JSON parse
        try {
          const cleaned = trimmed
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2018\u2019]/g, "'")
          jsonParsed = JSON.parse(cleaned)
        } catch (e) {
          // If direct parse fails, try extracting blocks (Rescue Mode)
          const regex = /\{[\s\S]*?\}(?=\s*(?:,|\}|\]|{|$))/g
          const matches = trimmed.match(regex)
          if (matches) {
            for (const m of matches) {
              try { jsonParsed.push(JSON.parse(m)) } catch {}
            }
          }
        }

        if (!Array.isArray(jsonParsed)) jsonParsed = [jsonParsed]

        const mapped = jsonParsed.map((q: any) => {
          const qText = q.question || q.question_text || q.stem || q.text || q.q || ''
          
          let optA = q.option_a || q.A || q.a || ''
          let optB = q.option_b || q.B || q.b || ''
          let optC = q.option_c || q.C || q.c || ''
          let optD = q.option_d || q.D || q.d || ''
          let optE = q.option_e || q.E || q.e || ''

          if (Array.isArray(q.options)) {
            optA = q.options[0] || optA
            optB = q.options[1] || optB
            optC = q.options[2] || optC
            optD = q.options[3] || optD
            optE = q.options[4] || optE
          }

          let ansLetter = String(q.answer || q.correct_answer || q.ans || '').toUpperCase().trim()
          if (ansLetter.length > 1) ansLetter = ansLetter.charAt(0)

          const subName = q.subject || q.Subject || detectSubjectFromText(String(qText))

          return {
            question_text: String(qText).trim(),
            option_a: String(optA).trim(),
            option_b: String(optB).trim(),
            option_c: String(optC).trim(),
            option_d: String(optD).trim(),
            option_e: String(optE).trim(),
            correct_answer: ansLetter,
            subject: subName,
            explanation: String(q.explanation || q.exp || '').trim(),
            difficulty: String(q.difficulty || q.Difficulty || 'Medium').trim(),
          }
        }).filter(q => q.question_text && q.option_a && q.correct_answer)

        if (mapped.length === 0) throw new Error("No valid questions found. Ensure keys are correct.")
        setParsed(mapped)
      } catch (err: any) {
        setParseError(err.message)
      } finally {
        setParsing(false)
      }
    }, 100)
  }

  async function handleImport() {
    if (!parsed.length) return
    setImporting(true)
    setResult(null)
    try {
      const res = await importQuestionsBulk(parsed)
      setResult(res)
      if (!res.error) {
        setParsed([])
        setRawText('')
        router.refresh()
      }
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>Bulk Import</h1>
          <p style={{ color: '#64748b' }}>Paste JSON or Upload a file to populate your question bank.</p>
        </div>
        <Link href="/admin/questions" className="btn btn-ghost">← Back to Bank</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 30 }}>
        {/* Left Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, color: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>Step 1: Input Data</h3>
            
            <label className="btn btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              📂 UPLOAD FILE
              <input type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const r = new FileReader(); r.onload = (ev) => setRawText(ev.target?.result as string); r.readAsText(file);
              }} />
            </label>

            <button onClick={handleParse} disabled={parsing || !rawText} className="btn btn-ghost" style={{ width: '100%', border: '1px solid #334155', color: '#cbd5e1' }}>
              {parsing ? 'Processing...' : '🔍 Parse Questions'}
            </button>
          </div>

          <AnimatePresence>
            {parsed.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', borderRadius: 16, padding: 24, color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✨</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 4 }}>{parsed.length} Questions Found</h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: 20 }}>Ready to save to database</p>
                <button onClick={handleImport} disabled={importing} className="btn" style={{ width: '100%', background: 'white', color: '#0f766e', fontWeight: 900, padding: '12px', fontSize: '1rem' }}>
                  {importing ? 'Saving...' : '🚀 SAVE NOW'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{ width: '100%', height: 300, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: '0.85rem' }}
            placeholder="Paste your JSON here..."
          />

          {parseError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 16, borderRadius: 12 }}>❌ {parseError}</div>}
          
          {result && (
            <div style={{ background: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`, color: result.error ? '#b91c1c' : '#15803d', padding: 16, borderRadius: 12 }}>
              {result.error ? `Error: ${result.error}` : `🎉 Success! Imported ${result.count} questions.`}
            </div>
          )}

          {parsed.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: 12 }}>Preview (First 3):</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {parsed.slice(0, 3).map((q, i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{q.question_text}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ans: {q.correct_answer} | Subject: {q.subject} | Difficulty: {q.difficulty}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
