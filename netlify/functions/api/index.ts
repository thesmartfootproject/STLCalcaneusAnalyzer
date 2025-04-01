import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { registerRoutes } from '../../server/routes';

const app = express();

// Initialize routes
let handler: any;
(async () => {
  await registerRoutes(app);
  handler = serverless(app);
})();

export const api: Handler = async (event, context) => {
  // Ensure handler is initialized
  if (!handler) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  // Add CORS headers to response
  const response = await handler(event, context);
  return {
    ...response,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': '*'
    }
  };
}; 