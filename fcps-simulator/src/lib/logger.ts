//
// This logger gives you structured JSON in both environments so Vercel's log
// drain / any log aggregator can parse fields instead of grepping strings.

type Level = 'info' | 'warn' | 'error'

function emit(level: Level, event: string, meta: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...meta,
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => emit('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => emit('warn', event, meta),
  error: (event: string, meta?: Record<string, unknown>) => emit('error', event, meta),
}
