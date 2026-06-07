import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, INDIATOKEN',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Returns a standardized JSON response matching the APK's expected format:
 * { "code": number, "msg": string, "data": any }
 */
export function jsonResponse(data: any, status = 200) {
  let body;
  
  // If the data already follows the {code, msg} pattern, use it directly
  if (data && typeof data.code === 'number' && 'msg' in data) {
    body = data;
  } else {
    // Otherwise, wrap it in the standard success format
    body = {
      code: 0,
      msg: "success",
      data: data
    };
  }

  return NextResponse.json(body, {
    status,
    headers: corsHeaders,
  });
}

/**
 * Returns a standard error response with the specific code format
 */
export function errorResponse(message: string, status = 500, errorCode?: number) {
  return NextResponse.json(
    {
      code: errorCode || status,
      msg: message,
      success: false
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
 * Safely parses the request body regardless of content-type (JSON or URL-Encoded)
 */
export async function getSafeBody(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      return Object.fromEntries(params.entries());
    }
    
    // Fallback: try parsing as text then JSON
    const text = await request.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      // If not JSON, check if it's form-like text
      if (text.includes('=') && text.includes('&')) {
        const params = new URLSearchParams(text);
        return Object.fromEntries(params.entries());
      }
      return {};
    }
  } catch (e) {
    console.error('[SafeBody Parser Error]:', e);
    return {};
  }
}
