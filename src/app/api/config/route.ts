
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse({
    success: true,
    app_config: {
      maintenance: false,
      update_required: false,
      api_v: "2.0"
    }
  }, 200);
}

export async function OPTIONS() {
  return handleOptions();
}
