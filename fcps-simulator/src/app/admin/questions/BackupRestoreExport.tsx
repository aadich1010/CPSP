'use client'

import { useState, useRef } from 'react'
import { backupQuestions, restoreQuestions } from './actions'

export default function BackupRestoreExport() {
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Backup all questions as a JSON download
  async function handleBackup() {
    setLoading(true)
    try {
      const res = await backupQuestions()
      if (res.error) {
        alert('Backup failed: ' + res.error)
        return
      }
      if (!res.data || res.data.length === 0) {
        alert('No questions to backup!')
        return
      }

      // Convert to JSON and trigger download
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(res.data, null, 2)
      )}`
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', jsonString)
      downloadAnchor.setAttribute('download', `fcps_questions_backup_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err: any) {
      alert('Error backing up: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Click handler for hidden file input
  function handleRestoreClick() {
    if (confirm('WARNING: Restoring will delete ALL current questions and replace them with the backup file. Are you sure you want to proceed?')) {
      fileInputRef.current?.click()
    }
  }

  // 3. Read uploaded file and invoke restoreQuestions bulk insert
  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const questions = JSON.parse(text)

        if (!Array.isArray(questions)) {
          alert('Invalid backup file structure! Must be an array of questions.')
          setLoading(false)
          return
        }

        // Validate basic properties
        const isValid = questions.every(q => q.question_text && q.option_a && q.option_b && q.option_c && q.option_d && q.correct_answer)
        if (!isValid) {
          alert('Invalid question data structure in backup file. Make sure all questions have text, options A-D, and correct answer.')
          setLoading(false)
          return
        }

        const res = await restoreQuestions(questions)
        if (res.error) {
          alert('Restore failed: ' + res.error)
        } else {
          alert(`Successfully restored ${res.count} questions from backup!`)
          window.location.reload()
        }
      } catch (err: any) {
        alert('Error parsing backup file: ' + err.message)
      } finally {
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  // 4. Export questions (Word or PDF)
  async function handleExport(format: 'word' | 'pdf') {
    setDropdownOpen(false)
    setLoading(true)
    try {
      const res = await backupQuestions()
      if (res.error) {
        alert('Failed to load questions for export: ' + res.error)
        return
      }
      const questions = res.data || []
      if (questions.length === 0) {
        alert('No questions to export!')
        return
      }

      if (format === 'word') {
        // Generate Word (.doc via HTML format)
        const html = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <title>FCPS Simulator Questions Export</title>
            <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
              h1 { text-align: center; color: #0d9488; font-size: 24px; margin-bottom: 5px; }
              h2 { text-align: center; color: #64748b; font-size: 14px; font-weight: normal; margin-bottom: 30px; }
              .q-card { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
              .q-text { font-weight: bold; font-size: 14px; color: #0f172a; margin-bottom: 10px; }
              .opts { margin-left: 20px; margin-bottom: 10px; }
              .opt { margin-bottom: 5px; font-size: 12px; }
              .meta { font-size: 11px; font-weight: bold; color: #0d9488; margin-top: 10px; }
              .exp { font-size: 11px; color: #64748b; font-style: italic; margin-top: 5px; }
            </style>
          </head>
          <body>
            <h1>FCPS Part 1 CBT Simulator</h1>
            <h2>Question Bank Export (${questions.length} Questions)</h2>
            ${questions.map((q, idx) => `
              <div class="q-card">
                <div class="q-text">${idx + 1}. ${q.question_text}</div>
                <div class="opts">
                  <div class="opt">A. ${q.option_a}</div>
                  <div class="opt">B. ${q.option_b}</div>
                  <div class="opt">C. ${q.option_c}</div>
                  <div class="opt">D. ${q.option_d}</div>
                  ${q.option_e ? `<div class="opt">E. ${q.option_e}</div>` : ''}
                </div>
                <div class="meta">Correct Answer: ${q.correct_answer} | Subject: ${q.subject} | Difficulty: ${q.difficulty}</div>
                ${q.explanation ? `<div class="exp">Explanation: ${q.explanation}</div>` : ''}
              </div>
            `).join('')}
          </body>
          </html>
        `
        const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const downloadAnchor = document.createElement('a')
        downloadAnchor.setAttribute('href', url)
        downloadAnchor.setAttribute('download', `fcps_questions_export_${new Date().toISOString().split('T')[0]}.doc`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
        URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        // Open formatted print page
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          alert('Pop-up blocked! Please allow pop-ups for this site to export PDF.')
          return
        }

        printWindow.document.write(`
          <html>
          <head>
            <title>FCPS CBT Simulator - Question Paper</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; padding: 40px; color: #1e293b; }
              h1 { text-align: center; font-size: 24px; margin-bottom: 5px; color: #0d9488; font-weight: 800; }
              h2 { text-align: center; font-size: 14px; color: #64748b; font-weight: 500; margin-bottom: 40px; }
              .q-item { margin-bottom: 25px; page-break-inside: avoid; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
              .q-text { font-weight: 700; font-size: 15px; margin-bottom: 8px; color: #0f172a; }
              .options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-left: 15px; margin-bottom: 10px; }
              .option { font-size: 13px; color: #475569; }
              .meta { font-size: 12px; color: #0d9488; font-weight: bold; margin-top: 5px; }
              .exp { font-size: 12px; color: #64748b; font-style: italic; margin-top: 3px; }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <h1>FCPS Part 1 CBT Simulator</h1>
            <h2>Question Bank Export (${questions.length} Questions)</h2>
            ${questions.map((q, idx) => `
              <div class="q-item">
                <div class="q-text">${idx + 1}. ${q.question_text}</div>
                <div class="options">
                  <div class="option">A. ${q.option_a}</div>
                  <div class="option">B. ${q.option_b}</div>
                  <div class="option">C. ${q.option_c}</div>
                  <div class="option">D. ${q.option_d}</div>
                  ${q.option_e ? `<div class="option">E. ${q.option_e}</div>` : ''}
                </div>
                <div class="meta">Correct Answer: ${q.correct_answer} | Subject: ${q.subject} | Difficulty: ${q.difficulty}</div>
                ${q.explanation ? `<div class="exp">Explanation: ${q.explanation}</div>` : ''}
              </div>
            `).join('')}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
          </html>
        `)
        printWindow.document.close()
      }
    } catch (err: any) {
      alert('Error exporting: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {/* Hidden input for restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFile}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Backup — blue down-arrow icon */}
      <button
        onClick={handleBackup}
        disabled={loading}
        title="Backup Questions (Download JSON)"
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(13,148,136,0.2)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(13,148,136,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(13,148,136,0.2)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v12M6 12l6 8 6-8"/>
          <path d="M4 20h16"/>
        </svg>
      </button>

      {/* Restore — green up-arrow icon */}
      <button
        onClick={handleRestoreClick}
        disabled={loading}
        title="Restore Questions (Upload JSON Backup)"
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(13,148,136,0.2)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(13,148,136,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(13,148,136,0.2)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V8M6 12l6-8 6 8"/>
          <path d="M4 20h16"/>
        </svg>
      </button>

      {/* Export Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={loading}
          title="Export Questions"
          style={{
            display: 'flex',
            gap: 5,
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.75rem',
            height: 32,
            boxShadow: '0 2px 4px rgba(13, 148, 136, 0.15)'
          }}
        >
          📄 Export ▾
        </button>

        {dropdownOpen && (
          <>
            <div 
              onClick={() => setDropdownOpen(false)} 
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 90,
                background: 'transparent'
              }}
            />
            
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 140,
              zIndex: 100,
              overflow: 'hidden'
            }}>
              <button 
                onClick={() => handleExport('word')} 
                style={{
                  background: 'none', 
                  border: 'none', 
                  padding: '10px 14px', 
                  textAlign: 'left',
                  cursor: 'pointer', 
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  color: '#334155',
                  borderBottom: '1px solid #f1f5f9',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                📝 Word (.doc)
              </button>
              <button 
                onClick={() => handleExport('pdf')} 
                style={{
                  background: 'none', 
                  border: 'none', 
                  padding: '10px 14px', 
                  textAlign: 'left',
                  cursor: 'pointer', 
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  color: '#334155',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                📄 PDF (.pdf)
              </button>
            </div>
          </>
        )}
      </div>

      {loading && (
        <span style={{
          fontSize: '0.75rem',
          color: '#0d9488',
          fontWeight: 700,
        }}>
          Processing...
        </span>
      )}
    </div>
  )
}
