import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * FULL LOCAL IMPLEMENTATION - Buy IToken Flow
 */
export async function POST(request: Request) {
  const body = await getSafeBody(request);
  console.log(`[BUY_ITOKEN_LOCAL_POST]`, body);

  // Simulate success for APK flow
  return jsonResponse({
    code: 0,
    msg: "success",
    data: {
      orderId: "ORD_" + Date.now(),
      status: "pending",
      payUrl: "#/payment-simulation"
    }
  });
}

export async function GET() {
  return jsonResponse({
    code: 0,
    msg: "success",
    data: {
      sysOpenPay: "1",
      methods: [
        { id: 1, name: "UPI-FAST", status: 1 },
        { id: 16, name: "USDT", status: 1 }
      ]
    }
  });
}
