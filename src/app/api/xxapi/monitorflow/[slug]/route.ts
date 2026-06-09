import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * FULL LOCAL IMPLEMENTATION - Handles single segment monitorflow paths
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await getSafeBody(request);
  
  console.log(`[MONITORFLOW_SINGLE_LOCAL_POST] Path: ${slug}`, body);

  if (slug === 'one') {
    return jsonResponse({ pk: "ybNu1wFRq0ShgoT" });
  }

  if (slug === 'check') {
    return jsonResponse({
      code: 2052,
      msg: "Ct Not Exist",
      data: null
    });
  }

  return jsonResponse({ code: 0, msg: "success" });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  console.log(`[MONITORFLOW_SINGLE_LOCAL_GET] Path: ${slug}`);

  return jsonResponse({ code: 0, msg: "success", data: [] });
}
