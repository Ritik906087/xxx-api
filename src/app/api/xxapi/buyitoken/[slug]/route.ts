import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * FULL LOCAL IMPLEMENTATION - Sub-paths for Buy IToken
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await getSafeBody(request);
  console.log(`[BUY_ITOKEN_SUB_LOCAL_POST] Path: ${slug}`, body);

  return jsonResponse({
    code: 0,
    msg: "success",
    data: { orderId: "ORD_" + slug + "_" + Date.now() }
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  console.log(`[BUY_ITOKEN_SUB_LOCAL_GET] Path: ${slug}`);

  if (slug === 'waitconfirm') {
    return jsonResponse({
      waitconfirm: [],
      sysOpenPay: "1"
    });
  }

  return jsonResponse({ code: 0, msg: "success", data: [] });
}
