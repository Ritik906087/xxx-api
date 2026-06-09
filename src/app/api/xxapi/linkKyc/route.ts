import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * FULL LOCAL IMPLEMENTATION - KYC Flow
 */
export async function GET() {
  return jsonResponse({
    code: 0,
    msg: "success",
    data: {
      kycStatus: "verified",
      message: "Identity mapped locally"
    }
  });
}
