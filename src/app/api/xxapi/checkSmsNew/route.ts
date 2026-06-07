import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Verification endpoint. Handles both GET and POST for maximum compatibility.
 */
export async function POST(request: Request) {
  const body = await getSafeBody(request);
  console.log('[CHECKSMSNEW POST DATA]:', body);
  
  // Return the specific code 2085 if required by APK logic, 
  // or 0 for standard success. The user log showed 2085 sometimes.
  return jsonResponse({
    code: 0,
    msg: "success",
    data: "Verification Processed"
  });
}

export async function GET() {
  return jsonResponse({
    code: 0,
    msg: "SMS system active",
    data: "Ready"
  });
}
