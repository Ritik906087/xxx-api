
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse({
    success: true,
    settings: {
      notifications: true,
      biometrics: false,
      theme: "light"
    }
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
