import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Base MonitorFlow handler - Fully Local
 */
export async function POST(request: Request) {
  const body = await getSafeBody(request);
  console.log(`[MONITORFLOW_BASE_LOCAL_POST]`, body);

  return jsonResponse({
    code: 0,
    msg: "success",
    data: { status: "processed_locally" }
  });
}

export async function GET() {
  return jsonResponse({ code: 0, msg: "success", data: [] });
}
