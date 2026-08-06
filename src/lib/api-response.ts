import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, INDIATOKEN, token',
  'Access-Control-Max-Age': '86400',
};

/**
 * Standardized JSON response for Automation Engine.
 * Ensures consistent schema: { code, message, logs, data? }
 */
export function jsonResponse(data: any, status = 200) {
  const body = {
    code: status === 200 ? (data.code || 200) : status,
    message: data.message || "Protocol Executed",
    logs: data.logs || [],
    data: data.data || null
  };

  return NextResponse.json(body, {
    status: 200, // Always return 200 for internal JSON handling, use 'code' for logic
    headers: corsHeaders,
  });
}

/**
 * Global Error Handler for API Routes.
 * Prevents frontend JSON parsing crashes by returning structural errors.
 */
export function errorResponse(message: string, status = 500, logs: any[] = []) {
  return NextResponse.json(
    {
      code: status,
      message: message || "Internal System Fault",
      logs: logs
    },
    {
      status: 200, // Return 200 to ensure client receives valid JSON error packet
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
