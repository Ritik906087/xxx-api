
import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
  'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
};

/**
 * Returns a standard JSON response with CORS headers
 */
export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

/**
 * Returns a standard error response with CORS headers
 */
export function errorResponse(message: string, status = 500, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    {
      status,
      headers: corsHeaders,
    }
  );
}

/**
 * Handles CORS preflight requests
 */
export function handleOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Safely parses the request body regardless of content-type
 */
export async function getSafeBody(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      return Object.fromEntries(formData.entries());
    }
    // Fallback attempt
    const text = await request.text();
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  } catch (e) {
    console.error('[SafeBody Parser Error]:', e);
    return {};
  }
}
