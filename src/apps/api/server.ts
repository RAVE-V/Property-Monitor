import Fastify from 'fastify';
import cors from '@fastify/cors';
import { propertyRoutes } from './routes/properties';
import * as dotenv from 'dotenv';
dotenv.config();

const server = Fastify({
  logger: true,
});

server.register(cors);

// Register routes
server.register(propertyRoutes);

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:3000`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
