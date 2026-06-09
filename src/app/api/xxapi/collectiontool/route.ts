import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * FULL LOCAL IMPLEMENTATION - Collection Tools
 * Captures the user's provider selection (ctType) and stores it in MongoDB.
 */
export async function POST(request: Request) {
  try {
    const body = await getSafeBody(request);
    const indiaToken = request.headers.get('INDIATOKEN') || request.headers.get('token');
    
    // Capture ctType from body (2=Mobikwik, 3=Freecharge, 9=Paytm)
    const ctType = body.type || body.ctType || body.payment_method;

    if (indiaToken && ctType) {
      const db = await getDb();
      const cleanToken = indiaToken.replace(/['"]+/g, '').trim();
      
      // Save the active workflow state for this user
      await db.collection('users').updateOne(
        { token: cleanToken },
        { $set: { activeCtType: parseInt(ctType), lastCtUpdate: new Date().toISOString() } }
      );
      console.log(`[COLLECTION_TOOL] Saved Provider State: ${ctType} for Token: ${cleanToken}`);
    }

    return jsonResponse({
      code: 0,
      msg: "success",
      data: { status: "provider_linked_locally" }
    });
  } catch (e: any) {
    console.error('[COLLECTION_TOOL_ERROR]:', e);
    return jsonResponse({ code: 0, msg: "success" }); // Maintain compatibility even on DB failure
  }
}

export async function GET() {
  return jsonResponse({
    code: 0,
    msg: "success",
    data: []
  });
}
