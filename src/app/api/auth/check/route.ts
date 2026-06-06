
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse({
    authenticated: true,
    user: {
      role: "user",
      status: "verified"
    },
    message: "Session active"
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
