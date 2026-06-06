
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse({
    status: "ok",
    initialized: true,
    session_id: "init_" + Math.random().toString(36).substr(2, 9)
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
