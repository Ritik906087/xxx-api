import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * FULL LOCAL IMPLEMENTATION - No more apitez.xyz proxy
 * Handles multi-segment monitorflow paths like /monitorflow/two/check
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  const body = await getSafeBody(request);
  
  console.log(`[MONITORFLOW_LOCAL_POST] Path: ${path}`, body);

  // Identity Handshake
  if (path === 'one') {
    return jsonResponse({ pk: "ybNu1wFRq0ShgoT" });
  }
  
  // UPI / Linking Checks
  if (path.includes('check')) {
    return jsonResponse({
      code: 2052,
      msg: "Ct Not Exist",
      data: null
    });
  }

  // Standard Success for all other paths
  return jsonResponse({
    code: 0,
    msg: "success",
    data: []
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  
  console.log(`[MONITORFLOW_LOCAL_GET] Path: ${path}`);

  if (path.includes('getpreloginresult')) {
    return jsonResponse({
      code: 0,
      msg: "success",
      data: []
    });
  }

  return jsonResponse({ code: 0, msg: "success", data: [] });
}
