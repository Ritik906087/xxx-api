import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Filtered channel list for APK.
 */
export async function GET() {
  const mockData = [
    { id: 1, name: "UPI-FAST", type: 1, status: 1 },
    { id: 14, name: "PHONEPE-BIZ", type: 14, status: 1 },
    { id: 18, name: "BHARATPE-BIZ", type: 18, status: 1 }
  ];
  return jsonResponse(mockData);
}
