import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import { registerRoutes } from '../../../server/routes';

const app = express();

// Initialize routes and handler
const initializeHandler = async () => {
  try {
    await registerRoutes(app);
  } catch (error) {
    console.error('Error initializing handler:', error);
    throw error;
  }
};

// Initialize immediately
initializeHandler();

// Create serverless handler
const handler = serverless(app);

export const api: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  try {
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
    const response = await handler(event, context) as HandlerResponse;
    return {
      ...response,
      headers: {
        ...(response.headers || {}),
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