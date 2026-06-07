import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function GET() {
  return jsonResponse([]);
}

export async function OPTIONS() {
  return handleOptions();
}
