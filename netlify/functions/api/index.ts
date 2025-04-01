import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { registerRoutes } from '../../server/routes';

const app = express();
const server = await registerRoutes(app);
const handler = serverless(app);

export const api: Handler = async (event, context) => {
  return handler(event, context);
}; 