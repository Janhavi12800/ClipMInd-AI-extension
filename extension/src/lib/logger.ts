type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_PREFIX = '[TechShield]'

class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry = {
      level,
      context: this.context,
      message,
      timestamp: new Date().toISOString(),
      data: data ?? undefined,
    }

    const formatted = `${LOG_PREFIX}[${this.context}] ${message}`

    switch (level) {
      case 'debug':
        console.debug(formatted, data ?? '')
        break
      case 'info':
        console.info(formatted, data ?? '')
        break
      case 'warn':
        console.warn(formatted, data ?? '')
        break
      case 'error':
        console.error(formatted, data ?? '')
        break
    }

    if (level === 'error' || level === 'warn') {
      this.persistLog(entry).catch(() => {})
    }
  }

  private async persistLog(entry: Record<string, unknown>): Promise<void> {
    const { storage } = await import('./storage')
    const logs = await storage.getLogBuffer()
    logs.push(entry)
    if (logs.length > 200) logs.splice(0, logs.length - 200)
    await storage.setLogBuffer(logs)
  }

  debug(message: string, data?: unknown): void { this.log('debug', message, data) }
  info(message: string, data?: unknown): void { this.log('info', message, data) }
  warn(message: string, data?: unknown): void { this.log('warn', message, data) }
  error(message: string, data?: unknown): void { this.log('error', message, data) }
}

export function createLogger(context: string): Logger {
  return new Logger(context)
}
