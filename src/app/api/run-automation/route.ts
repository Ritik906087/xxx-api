import { NextResponse } from 'next/server';

/**
 * Standardized CORS Headers
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, packageId, lang, channel, PAY',
};

const TARGET_BASE_URL = "https://jcoinpay.vip";

/**
 * Throttling Helper
 */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Safe Fetch Helper for JCoinPay
 */
async function jFetch(url: string, method: string, headers: any, body?: any) {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'packageId': '2',
        'lang': 'en',
        'channel': 'h5',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { code: res.status, msg: "Invalid JSON", raw: text.substring(0, 200) };
    }
  } catch (err: any) {
    return { code: 500, msg: "Connection Fault", error: err.message };
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const logs: any[] = [];
  
  try {
    const body = await request.json().catch(() => ({}));
    const targetPhone = body.phone;

    if (!targetPhone || targetPhone.length < 10) {
      return NextResponse.json({ 
        code: 400, 
        message: "Identification Required: Valid target phone missing.", 
        logs: [] 
      }, { status: 200, headers: CORS_HEADERS });
    }

    // Step 1: Login to JCoinPay
    const loginPayload = { phone: "7870873927", pwd: "Ritik123" };
    const loginJson = await jFetch(`${TARGET_BASE_URL}/app/user/login/pwd`, 'POST', {}, loginPayload);
    logs.push({ "Step 1: Identity Auth (Login)": loginJson });

    if (loginJson.code !== "200" || !loginJson.data?.tokenValue) {
      return NextResponse.json({ code: 400, message: "Auth Sequence Failed: Invalid Identity Credentials", logs }, { status: 200, headers: CORS_HEADERS });
    }

    const payToken = loginJson.data.tokenValue;
    const authHeaders = { 'PAY': payToken };

    // Step 2: Sync Home Environment
    await sleep(1500);
    const homeJson = await jFetch(`${TARGET_BASE_URL}/app/home`, 'GET', authHeaders);
    logs.push({ "Step 2: Environment Sync (Home)": homeJson });

    // Step 3: Check Tool Support
    await sleep(1500);
    const supportJson = await jFetch(`${TARGET_BASE_URL}/app/tool/support`, 'GET', authHeaders);
    logs.push({ "Step 3: Tool Integrity Check": supportJson });

    // Step 4: Verify Security PIN
    await sleep(1500);
    const pinPayload = { pin: "954073" };
    const pinJson = await jFetch(`${TARGET_BASE_URL}/app/user/checkPin`, 'POST', authHeaders, pinPayload);
    logs.push({ "Step 4: PIN Verification": pinJson });

    if (pinJson.code !== "200") {
      return NextResponse.json({ code: 400, message: "Security Fault: PIN rejected by upstream", logs }, { status: 200, headers: CORS_HEADERS });
    }

    // Step 5: Final Mobikwik OTP Dispatch
    await sleep(1500);
    const otpPayload = { phone: targetPhone, platform: 2 }; // Platform 2 = Mobikwik
    const otpJson = await jFetch(`${TARGET_BASE_URL}/app/tool/mobikwikAuth/step1/sendOtp`, 'POST', authHeaders, otpPayload);
    logs.push({ "Step 5: Mobikwik Action Trigger": otpJson });

    return NextResponse.json({ 
      code: 200, 
      message: "JCoinPay Orchestration processed.", 
      logs 
    }, { status: 200, headers: CORS_HEADERS });

  } catch (err: any) {
    return NextResponse.json({ 
      code: 500, 
      message: `System Integrity Fault: ${err.message}`, 
      logs: logs 
    }, { status: 200, headers: CORS_HEADERS });
  }
}
