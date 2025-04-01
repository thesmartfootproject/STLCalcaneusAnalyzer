import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { registerRoutes } from '../../server/routes';

// Type declarations for serverless-http
type ServerlessHandler = (event: any, context: any) => Promise<any>;

const app = express();
let handler: ServerlessHandler;

// Initialize routes and handler
const initializeHandler = async () => {
  try {
    await registerRoutes(app);
    handler = serverless(app);
  } catch (error) {
    console.error('Error initializing handler:', error);
    throw error;
  }
};

// Initialize immediately
initializeHandler();

export const api: Handler = async (event, context) => {
  try {
    // Ensure handler is initialized
    if (!handler) {
      await initializeHandler();
    }
    
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
  } catch (error) {
    console.error('Error in API handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}; 