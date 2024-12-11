import { createLogger, format, transports } from 'winston';

const { combine, timestamp, json, printf } = format;

// Custom format for console logs
const customFormat = printf(({ level, message, timestamp, ip, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (ip) log += ` | IP: ${ip}`;
  if (Object.keys(meta).length) log += ` | Meta: ${JSON.stringify(meta)}`;
  return log;
});

// Logger configuration
const logger = createLogger({
  level: 'info', // Ensure it allows all levels >= 'info'
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json() // JSON for compatibility with Datadog
  ),
  transports: [
    new transports.Console({
      format: combine(timestamp(), customFormat),
    }),
    new transports.Http({
      host: 'http-intake.logs.us5.datadoghq.com',
      path: `/v1/input/${process.env.DATADOG_API_KEY}?ddsource=nodejs&service=${process.env.SERVICE_NAME}`,
      ssl: true,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      ),
    }),
  ],
});

// Capture unhandled exceptions and rejections
process.on('uncaughtException', (ex) => {
  logger.error('Uncaught Exception', { error: ex.stack || ex.message });
  process.exit(1); // Optional: exit process
});

process.on('unhandledRejection', (ex) => {
  logger.error('Unhandled Rejection', { error: ex.stack || ex.message });
});

export default logger;
