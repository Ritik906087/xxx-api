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
 * Standardized JSON response wrapper for Vantage Engine
 * Matches the format: { "code": 0, "msg": "success", "data": ... }
 */
export function jsonResponse(data: any, status = 200) {
  let body;
  
  // APK expectation: { code: 0, msg: "success", data: "..." }
  // Check if data is already wrapped or has a specific code
  if (data && typeof data.code === 'number' && 'msg' in data) {
    body = data;
  } else {
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
 * Standard error response wrapper
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

export function handleOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Ultra-Robust Body Parser for APK compatibility
 * Extracts phone numbers even from raw/malformed strings
 */
export async function getSafeBody(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const text = await request.text();
    
    if (!text) return {};
    
    let body: any = { rawText: text };

    // Try parsing as JSON
    if (contentType.includes('application/json') || text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(text);
        body = { ...body, ...json };
      } catch (e) {}
    }

    // Try parsing as Form-Url-Encoded
    if (text.includes('=') && !text.trim().startsWith('{')) {
      try {
        const params = new URLSearchParams(text);
        const formEntries = Object.fromEntries(params.entries());
        body = { ...body, ...formEntries };
      } catch (e) {}
    }

    // Regex Fallback: Find any 10-digit number in raw text
    if (!body.mobileNo && !body.phone) {
      const phoneMatch = text.match(/\b\d{10,12}\b/);
      if (phoneMatch) {
        body.extractedPhone = phoneMatch[0].slice(-10); // Take last 10 digits
      }
    }

    return body;
  } catch (e) {
    console.error('[SafeBody Parser Error]:', e);
    return {};
  }
}
