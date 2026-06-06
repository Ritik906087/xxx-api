
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

export async function OPTIONS() {
  return handleOptions();
}
