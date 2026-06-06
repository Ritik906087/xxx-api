
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      db: "mongodb_atlas",
      auth: "supabase",
      sms: "meraotp"
    }
  });
}

export async function OPTIONS() {
  return handleOptions();
}
