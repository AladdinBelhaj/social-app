import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import publicationRoutes from './routes/publicationRoutes.js';
import Eureka from 'eureka-js-client';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/publications', publicationRoutes);
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('Hello World!'));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Eureka registration
const client = new Eureka.Eureka({
  instance: {
    app: 'PUB-SERVICE',
    instanceId: 'pub-service-1',
    hostName: 'localhost',
    ipAddr: '127.0.0.1',
    port: {
      $: PORT,
      '@enabled': 'true',
    },
    vipAddress: 'pub-service',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
    statusPageUrl: `http://localhost:${PORT}/`,
    healthCheckUrl: `http://localhost:${PORT}/`,
    homePageUrl: `http://localhost:${PORT}/`,
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
  else console.log('✓ Registered with Eureka as PUB-SERVICE');
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
