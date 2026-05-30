/* eslint-disable no-console */
type Level = 'info' | 'warn' | 'error' | 'debug';
type Context = Record<string, unknown>;

function emit(level: Level, msg: string, context: Context = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...context,
  });

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (msg: string, context?: Context) => emit('info', msg, context),
  warn: (msg: string, context?: Context) => emit('warn', msg, context),
  error: (msg: string, context?: Context) => emit('error', msg, context),
  debug: (msg: string, context?: Context) => emit('debug', msg, context),
};
