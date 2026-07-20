export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { logger } = await import('./src/lib/logger')

  process.on('uncaughtException', (err) => {
    logger.error('uncaught_exception', { message: err.message, stack: err.stack })
    // Don't process.exit() on Vercel — the platform owns the process lifecycle.
    // On a self-hosted VPS, exit after logging so your process manager
    // (pm2/systemd) restarts a clean instance instead of running corrupted state:
    if (process.env.SELF_HOSTED === 'true') process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', {
      message: reason instanceof Error ? reason.message : String(reason),
    })
  })
}
