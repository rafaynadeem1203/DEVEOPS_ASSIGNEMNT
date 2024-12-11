import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedRouter from './routes/seedRoutes.js';
import productRouter from './routes/productRoutes.js';
import userRouter from './routes/userRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';
import tracer from 'dd-trace';
import logger from './logger.js';


tracer.init({
  service: process.env.DD_SERVICE || 'mern-backend', 
  env: process.env.DD_ENV || 'development', 
  version: process.env.APP_VERSION || '1.0.0', 
  logInjection: true, 
  analytics: true, 
});


// Load environment variables
dotenv.config();

mongoose.set('debug', (collectionName, method, query, doc) => {
  const span = tracer.startSpan('mongo.query', {
    service: 'mongodb',
    resource: `${collectionName}.${method}`,
    type: 'db',
  });

  const startTime = Date.now();
  
  try {
    logger.debug({
      message: 'MongoDB query executed',
      collection: collectionName,
      method,
      query,
      doc,
    });
    span.setTag('db.collection', collectionName);
    span.setTag('db.method', method);
    span.setTag('db.query', JSON.stringify(query));
  } catch (error) {
    span.setTag('error', true);
    span.log({ error: error.message });
  } finally {
    const duration = Date.now() - startTime;
    span.setTag('db.duration', `${duration}ms`);
    span.finish();
  }
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for tracing and logging requests
app.use((req, res, next) => {
  const start = Date.now();
  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger.log({
      level: logLevel,
      message: 'Request completed',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: userIp,
    });
  });

  next();
});

// API Endpoints
app.get('/api/keys/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
});

app.get('/api/keys/google', (req, res) => {
  res.send({ key: process.env.GOOGLE_API_KEY || '' });
});

app.use('/api/upload', uploadRouter);
app.use('/api/seed', seedRouter);
app.use('/api/products', productRouter);
app.use('/api/users', userRouter); 
app.use('/api/orders', orderRouter);

// Serve React Frontend
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, '/frontend/build')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '/frontend/build/index.html'))
);

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error({
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    status: res.statusCode || 500,
  });
  res.status(500).send({ message: err.message });
});

// Start the Server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`, {
    environment: process.env.NODE_ENV || 'development',
  });
});
