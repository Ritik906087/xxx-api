import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Verification endpoint. APK calls this via POST.
 */
export async function POST(request: Request) {
  const body = await getSafeBody(request);
  console.log('[CHECKSMSNEW POST DATA]:', body);
  
  // Based on logs, sometimes this returns a specific business code
  // If we want to skip OTP (No Need Send Otp), we use 2085
  // For now, we return 0 success to allow login to proceed
  return jsonResponse({
    code: 0,
    msg: "success",
    data: "Verification Processed"
  });
}

export async function GET() {
  return jsonResponse({
    code: 0,
    msg: "SMS system active"
  });
}
