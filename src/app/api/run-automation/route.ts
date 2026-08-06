import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-response';
import { runAutomation } from '@/app/actions/vantage-actions';

/**
 * REST API Endpoint for Automation.
 * Handles sequential API integration with global error catching.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, accountType } = body;
    
    const result = await runAutomation(phone, accountType);
    return jsonResponse(result);
  } catch (error: any) {
    console.error('[GLOBAL ERROR HANDLER]:', error);
    return errorResponse(error.message || "Endpoint Execution Failed", 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
