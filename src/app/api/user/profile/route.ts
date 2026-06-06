
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse({
    success: true,
    profile: {
      fullName: "Vantage User",
      verified: true,
      tier: "Enterprise"
    }
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
