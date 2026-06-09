import { jsonResponse, handleOptions, getSafeBody } from '@/lib/api-response';
import { getDb } from '@/lib/mongodb';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust MonitorFlow Handler
 * Identifies the provider (Paytm/FC/MB) using Architecture 1: Session State from MongoDB.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  const body = await getSafeBody(request);
  const indiaToken = request.headers.get('INDIATOKEN') || request.headers.get('token');
  
  console.log(`[MONITORFLOW_LOG] Path: ${path}, Token: ${indiaToken}`);

  // Resolve Provider State from MongoDB
  let activeProvider = null;
  if (indiaToken) {
    try {
      const db = await getDb();
      const cleanToken = indiaToken.replace(/['"]+/g, '').trim();
      const user = await db.collection('users').findOne({ token: cleanToken });
      if (user && user.activeCtType) {
        activeProvider = user.activeCtType;
        console.log(`[MONITORFLOW_STATE] Resolved Provider: ${activeProvider} (2=MB, 3=FC, 9=Paytm)`);
      }
    } catch (e) {
      console.error('[MONITORFLOW_STATE_ERROR]:', e);
    }
  }

  // Handshake Logic
  if (path === 'one') {
    return jsonResponse({ 
      code: 0,
      msg: "success",
      data: { pk: "0a25DrQI8q3O3Kw" } 
    });
  }
  
  // Status Check Logic
  if (path.includes('check')) {
    // If no provider is linked yet, return the standard 2052
    return jsonResponse({
      code: 2052,
      msg: "Ct Not Exist",
      data: null
    });
  }

  // Multi-step Login/Result Logic
  if (path.includes('getpreloginresult')) {
    return jsonResponse({
      code: 0,
      msg: "success"
    });
  }

  // Standard Success for all other paths (two, etc.)
  return jsonResponse({
    code: 0,
    msg: "success",
    data: path === 'two' ? "0a25DrQI8q3O3Kw" : []
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');
  
  if (path.includes('getpreloginresult')) {
    return jsonResponse({
      code: 0,
      msg: "success"
    });
  }

  return jsonResponse({ code: 0, msg: "success", data: [] });
}
