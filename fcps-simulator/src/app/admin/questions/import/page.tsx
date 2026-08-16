'use client'

import { useState } from 'react'
import { importQuestionsBulk } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/design-system/Icon';
import { SUBJECTS as CANONICAL_SUBJECTS } from '@/lib/subjects'

const SUBJECTS = [...CANONICAL_SUBJECTS, 'Miscellaneous']

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
  // Roman Urdu (Urdu language, English/Latin letters) versions -- optional.
  // Populated from the source JSON when present (see field() lookups in
  // handleParse below), else defaults to '' like explanation/difficulty
  // above. IMPORTANT: because importQuestionsBulk() upserts the WHOLE row
  // matched by question_text, re-uploading an English-only batch AFTER a
  // question already has Roman Urdu saved will overwrite it back to ''
  // (the app then just falls back to showing English -- nothing breaks --
  // but the translation is gone). Always re-upload the fully-translated
  // file, not the original English-only one, once a batch has been
  // translated.
  roman_urdu_question_text?: string
  roman_urdu_option_a?:      string
  roman_urdu_option_b?:      string
  roman_urdu_option_c?:      string
  roman_urdu_option_d?:      string
  roman_urdu_option_e?:      string
  roman_urdu_explanation?:   string
}

// Shape of a single record from arbitrary/untrusted pasted JSON before
// it's normalized into ParsedQuestion. Field names vary by source
// (ChatGPT export, spreadsheet export, etc.), so this stays loose by
// design — but `unknown`-typed, not `any`, so every access below is
// still checked.
type RawImportRecord = Record<string, unknown>

interface ImportResult {
  error?: string
  count?: number
  newCount?: number
  updatedCount?: number
}

export default function ImportQuestionsPage() {
  const [rawText, setRawText] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedQuestion[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loadedFileNames, setLoadedFileNames] = useState<string[]>([])
  const router = useRouter()

  // British/American spelling (and a couple of common shorthand) variants
  // that should land in the same subject bucket as the canonical SUBJECTS
  // entry above, keyed lowercase. Without this, a JSON batch that spells a
  // subject differently than a previous batch silently creates a second,
  // orphaned subject that never shows up on its own card/filter -- e.g. one
  // real import used 'Anaesthesia' while the subject list (and every other
  // batch) used 'Anesthesia', so that question was invisible everywhere
  // except a raw database query until it was manually merged.
  const SUBJECT_ALIASES: Record<string, string> = {
    'anaesthesia': 'Anesthesia',
    'anaesthesiology': 'Anesthesia',
    'anesthesiology': 'Anesthesia',
    'general surgery': 'General Surgery',
    'paediatrics': 'Pediatrics',
    'gynaecology': 'Obstetrics & Gynecology',
    'obstetrics & gynaecology': 'Obstetrics & Gynecology',
    'obstetrics and gynecology': 'Obstetrics & Gynecology',
    'obstetrics and gynaecology': 'Obstetrics & Gynecology',
    'obs & gynae': 'Obstetrics & Gynecology',
    'ent (otolaryngology)': 'ENT',
    'otolaryngology': 'ENT',
    'ophthalmology & eye': 'Ophthalmology',
  }

  function normalizeSubject(raw: string): string {
    const trimmed = raw.trim()
    return SUBJECT_ALIASES[trimmed.toLowerCase()] ?? trimmed
  }

  function detectSubjectFromText(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('nerve') || lower.includes('artery') || lower.includes('muscle')) return 'Anatomy'
    if (lower.includes('lung') || lower.includes('respiratory') || lower.includes('compliance')) return 'Physiology'
    if (lower.includes('hormone') || lower.includes('pressure') || lower.includes('flow')) return 'Physiology'
    if (lower.includes('drug') || lower.includes('aspirin') || lower.includes('dose')) return 'Pharmacology'
    if (lower.includes('virus') || lower.includes('bacteria') || lower.includes('infection')) return 'Microbiology'
    if (lower.includes('cancer') || lower.includes('tumor') || lower.includes('malignant')) return 'Pathology'
    if (lower.includes('enzyme') || lower.includes('protein') || lower.includes('glucose')) return 'Biochemistry'
    if (lower.includes('anesthesia') || lower.includes('anaesthesia') || lower.includes('intubation') || lower.includes('sedation')) return 'Anesthesia'
    if (lower.includes('surgery') || lower.includes('surgical') || lower.includes('operative') || lower.includes('incision')) return 'General Surgery'
    return 'Miscellaneous'
  }

  // Read one File object as text via FileReader, wrapped in a Promise so a
  // batch of files can be read with Promise.all instead of nesting callbacks.
  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = (ev) => resolve((ev.target?.result as string) ?? '')
      r.onerror = () => reject(r.error ?? new Error(`Failed to read ${file.name}`))
      r.readAsText(file)
    })
  }

  // Parse one file's raw text into an array of raw records, tolerating a
  // top-level object (wrapped into a 1-element array) same as handleParse
  // does. Returns null if the text isn't valid JSON at all -- the caller
  // decides how to surface that per-file failure.
  function parseFileToRecords(text: string): RawImportRecord[] | null {
    const cleaned = text
      .trim()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
    try {
      const value = JSON.parse(cleaned)
      return Array.isArray(value) ? value : [value]
    } catch {
      return null
    }
  }

  async function handleFilesSelected(fileList: FileList) {
    const files = Array.from(fileList)
    if (files.length === 0) return

    // Single file: keep the old behaviour exactly (raw text dropped
    // straight into the textarea, untouched) so Parse Questions' own
    // "Rescue Mode" regex extraction still gets a shot at malformed JSON
    // for the one-file case, same as before this change.
    if (files.length === 1) {
      const text = await readFileAsText(files[0])
      setRawText(text)
      setLoadedFileNames([files[0].name])
      return
    }

    // Multiple files: each is expected to hold its own JSON array (or a
    // single question object) -- merge them into one combined array so
    // the existing Parse Questions / Save Now flow doesn't need to change
    // at all. A file that fails to parse on its own is skipped rather than
    // aborting the whole batch, and reported by name afterwards.
    const contents = await Promise.all(files.map((f) => readFileAsText(f)))
    const merged: RawImportRecord[] = []
    const failed: string[] = []
    contents.forEach((text, i) => {
      const records = parseFileToRecords(text)
      if (records === null) {
        failed.push(files[i].name)
      } else {
        merged.push(...records)
      }
    })

    setLoadedFileNames(files.map((f) => f.name))
    setRawText(JSON.stringify(merged, null, 2))
    setParseError(
      failed.length > 0
        ? `Loaded ${files.length - failed.length} of ${files.length} files. Could not parse as JSON: ${failed.join(', ')}. Fix those files and re-upload them separately.`
        : ''
    )
  }

  function handleParse() {
    if (!rawText.trim()) return
    setParsing(true)
    setParseError('')
    setParsed([])

    setTimeout(() => {
      try {
        const trimmed = rawText.trim()
        let jsonParsed: RawImportRecord[] = []

        // Try standard JSON parse
        try {
          const cleaned = trimmed
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
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

        // Pull the first defined value for any of the given keys out of an
        // untyped record, e.g. field(q, 'option_a', 'A', 'a').
        const field = (q: RawImportRecord, ...keys: string[]): unknown =>
          keys.map((k) => q[k]).find((v) => v !== undefined && v !== null && v !== '')

        const mapped = jsonParsed.map((q: RawImportRecord) => {
          const qText = field(q, 'question', 'question_text', 'stem', 'text', 'q') ?? ''

          let optA = field(q, 'option_a', 'A', 'a') ?? ''
          let optB = field(q, 'option_b', 'B', 'b') ?? ''
          let optC = field(q, 'option_c', 'C', 'c') ?? ''
          let optD = field(q, 'option_d', 'D', 'd') ?? ''
          let optE = field(q, 'option_e', 'E', 'e') ?? ''

          const options = q.options
          if (Array.isArray(options)) {
            optA = options[0] ?? optA
            optB = options[1] ?? optB
            optC = options[2] ?? optC
            optD = options[3] ?? optD
            optE = options[4] ?? optE
          }

          let ansLetter = String(field(q, 'answer', 'correct_answer', 'ans') ?? '').toUpperCase().trim()
          if (ansLetter.length > 1) ansLetter = ansLetter.charAt(0)

          const subName = normalizeSubject(String(field(q, 'subject', 'Subject') ?? detectSubjectFromText(String(qText))))

          // Roman Urdu fields -- several key-name variants accepted since
          // the translated JSON is hand-edited, not machine-generated.
          const romanQ  = field(q, 'roman_urdu_question_text', 'roman_question_text', 'question_text_roman', 'roman_urdu', 'question_roman_urdu') ?? ''
          const romanA  = field(q, 'roman_urdu_option_a', 'roman_option_a', 'option_a_roman') ?? ''
          const romanB  = field(q, 'roman_urdu_option_b', 'roman_option_b', 'option_b_roman') ?? ''
          const romanC  = field(q, 'roman_urdu_option_c', 'roman_option_c', 'option_c_roman') ?? ''
          const romanD  = field(q, 'roman_urdu_option_d', 'roman_option_d', 'option_d_roman') ?? ''
          const romanE  = field(q, 'roman_urdu_option_e', 'roman_option_e', 'option_e_roman') ?? ''
          const romanExp = field(q, 'roman_urdu_explanation', 'roman_explanation', 'explanation_roman') ?? ''

          return {
            question_text: String(qText).trim(),
            option_a: String(optA).trim(),
            option_b: String(optB).trim(),
            option_c: String(optC).trim(),
            option_d: String(optD).trim(),
            option_e: String(optE).trim(),
            correct_answer: ansLetter,
            subject: String(subName).trim(),
            explanation: String(field(q, 'explanation', 'exp') ?? '').trim(),
            difficulty: String(field(q, 'difficulty', 'Difficulty') ?? 'Medium').trim(),
            roman_urdu_question_text: String(romanQ).trim(),
            roman_urdu_option_a: String(romanA).trim(),
            roman_urdu_option_b: String(romanB).trim(),
            roman_urdu_option_c: String(romanC).trim(),
            roman_urdu_option_d: String(romanD).trim(),
            roman_urdu_option_e: String(romanE).trim(),
            roman_urdu_explanation: String(romanExp).trim(),
          }
        }).filter(q => q.question_text && q.option_a && q.correct_answer)

        if (mapped.length === 0) throw new Error("No valid questions found. Ensure keys are correct.")
        setParsed(mapped)
      } catch (err: unknown) {
        setParseError(err instanceof Error ? err.message : String(err))
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
        setLoadedFileNames([])
        router.refresh()
      }
    } catch (err: unknown) {
      // A payload that clears the Server Action body limit (was 1MB by
      // default -- see next.config.ts) never reaches importQuestionsBulk
      // at all; Next.js rejects it at the HTTP layer with a 413, which
      // surfaces here as a generic fetch/parse failure rather than the
      // structured { error } response above. Detect that case specifically
      // so a huge batch doesn't look like a silent no-op -- it was
      // previously very easy to read "Success! Imported N questions" from
      // a *different*, earlier, smaller attempt and not notice this one
      // never actually saved.
      const message = err instanceof Error ? err.message : String(err)
      const isTooLarge = /body exceeded|1 ?mb|413|payload too large/i.test(message)
      setResult({
        error: isTooLarge
          ? 'This batch is too large to upload in one go. Split it into smaller files (a few hundred questions each) and import them one at a time.'
          : message,
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>Bulk Import</h1>
          <p style={{ color: '#64748b' }}>Paste JSON or Upload files to populate your question bank.</p>
        </div>
        <Link href="/admin/questions" className="btn btn-ghost">← Back to Bank</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 30 }}>
        {/* Left Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, color: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>Step 1: Input Data</h3>

            <label className="btn btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              <Icon name="library" /> UPLOAD FILES
              <input type="file" accept=".json,.txt" multiple style={{ display: 'none' }} onChange={(e) => {
                const files = e.target.files; if (!files || files.length === 0) return;
                handleFilesSelected(files);
              }} />
            </label>

            {loadedFileNames.length > 1 && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 16, marginTop: -8 }}>
                {loadedFileNames.length} files loaded and merged: {loadedFileNames.join(', ')}
              </div>
            )}

            <button onClick={handleParse} disabled={parsing || !rawText} className="btn btn-ghost" style={{ width: '100%', border: '1px solid #334155', color: '#cbd5e1' }}>
              {parsing ? 'Processing...' : <><Icon name="search" size="sm" /> Parse Questions</>}
            </button>
          </div>

          <AnimatePresence>
            {parsed.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', borderRadius: 16, padding: 24, color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}><Icon name="upgrade" /></div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 4 }}>{parsed.length} Questions Found</h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: 20 }}>Ready to save to database</p>
                <button onClick={handleImport} disabled={importing} className="btn" style={{ width: '100%', background: 'white', color: '#0f766e', fontWeight: 900, padding: '12px', fontSize: '1rem' }}>
                  {importing ? 'Saving...' : <><Icon name="start" size="sm" /> SAVE NOW</>}
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
            placeholder="Paste your JSON here, or upload one or more JSON files..."
          />

          {parseError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 16, borderRadius: 12 }}><Icon name="incorrect" size="sm" /> {parseError}</div>}

          {result && (
            <div style={{ background: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`, color: result.error ? '#b91c1c' : '#15803d', padding: 16, borderRadius: 12 }}>
              {result.error ? (
                `Error: ${result.error}`
              ) : (
                <>
                  <Icon name="correct" size="sm" /> Success! Processed {result.count} questions
                  {typeof result.newCount === 'number' && typeof result.updatedCount === 'number' ? (
                    <>
                      {' '}&mdash; <strong>{result.newCount} new</strong>, {result.updatedCount} already existed
                      (matched by question text, so those were updated in place rather than added again).
                    </>
                  ) : '.'}
                </>
              )}
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
