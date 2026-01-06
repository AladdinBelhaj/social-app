import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import Eureka from 'eureka-js-client';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;


app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed', error);
    res.status(500).json({ status: 'error', message: 'Database unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'Unexpected server error' });
});


const client = new Eureka.Eureka({
  instance: {
    app: 'MCSV-SERVICE',
    instanceId: 'mcsv-service-1',
    hostName: 'localhost',
    ipAddr: '127.0.0.1',
    port: {
      $: port,
      '@enabled': 'true',
    },
    vipAddress: 'mcsv-service',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
    statusPageUrl: `http://localhost:${port}/api/health`,
    healthCheckUrl: `http://localhost:${port}/api/health`,
    homePageUrl: `http://localhost:${port}/`,
  },
  eureka: {
    host: 'localhost',
    port: 8761,
    servicePath: '/eureka/apps/',
    maxRetries: 3,
    requestRetryDelay: 2000,
  },
});

client.start((error) => {
  if (error) console.log('Eureka registration error:', error);
  else console.log('✓ Registered with Eureka as MCSV-SERVICE');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  client.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

