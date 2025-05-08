/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private logToConsole: boolean = true;

  constructor() {
    this.configure();
  }

  private configure() {
    // Configurações baseadas em variáveis de ambiente
    this.logToConsole = process.env.NODE_ENV !== "production";
    this.maxLogs = parseInt(process.env.LOG_MAX_ENTRIES || "1000", 10);
  }

  private createEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    // Limita o tamanho do log
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift();
    }

    this.logs.push(entry);

    // Log no console em desenvolvimento
    if (this.logToConsole) {
      const dataStr = data ? ` ${JSON.stringify(data)}` : "";
      console[level](
        `[${entry.timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`
      );
    }

    return entry;
  }

  debug(message: string, data?: Record<string, any>) {
    return this.createEntry("debug", message, data);
  }

  info(message: string, data?: Record<string, any>) {
    return this.createEntry("info", message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    return this.createEntry("warn", message, data);
  }

  error(message: string, data?: Record<string, any>) {
    return this.createEntry("error", message, data);
  }

  // Métodos para obter logs para a interface
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    const filteredLogs = level
      ? this.logs.filter((log) => log.level === level)
      : this.logs;

    return filteredLogs.slice(-limit);
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
