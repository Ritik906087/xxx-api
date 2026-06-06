
import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  return jsonResponse({
    success: true,
    config: {
      brandName: "Vantage Engine",
      version: "2.4.0-Enterprise",
      api_base: "/xxapi",
      maintenance: false,
      features: {
        upi_linking: true,
        blockchain_sync: true,
        ai_fraud_detection: true
      },
      limits: {
        min_deposit: 100,
        max_withdrawal: 50000
      }
    }
  });
}
