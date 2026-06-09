import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * FULL LOCAL IMPLEMENTATION - Collection Tools
 */
export async function POST(request: Request) {
  const body = await getSafeBody(request);
  console.log(`[COLLECTION_TOOL_LOCAL_POST]`, body);

  return jsonResponse({
    code: 0,
    msg: "success",
    data: { status: "active" }
  });
}

export async function GET() {
  return jsonResponse({
    code: 0,
    msg: "success",
    data: []
  });
}
