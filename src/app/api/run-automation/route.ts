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
 * Master Identities Registry - Production Verified
 * Removed demo account 9060873927 as requested.
 */
const MASTER_DB: Record<string, { pwd: string, pin: string }> = {
  "7870873927": { pwd: "Ritik123", pin: "954073" },
  "8431549953": { pwd: "Ritik123", pin: "954073" },
  "9579390488": { pwd: "Ritik123", pin: "954073" },
  "7892941854": { pwd: "Ritik123", pin: "954073" },
  "8099636920": { pwd: "Ritik123", pin: "954073" },
  "8792533303": { pwd: "Ritik123", pin: "954073" },
};

/**
 * Platform Path Mapping - STRICT CASE SENSITIVITY as per Official JCoinPay API
 */
const PLATFORM_PATH_MAP: Record<number, string> = {
  1: "freeChargeAuth", // Capital 'C' required
  2: "mobikwikAuth",   // Standard
  3: "phonePeAuth",    // Capital 'P' required (Verified)
  4: "paytmAuth",      // Standard
  7: "amazonpayAuth",  // Standard
  8: "naviAuth"        // Standard
};

/**
 * Throttling Helper
 */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

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
      return { 
        code: res.status, 
        msg: "Upstream Response Error", 
        raw: text.substring(0, 500),
        url: url
      };
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
    const rawPhone = body.phone;
    const platformId = body.platform || 2;
    const otp = body.otp;
    
    if (!rawPhone || String(rawPhone).length < 10) {
      return NextResponse.json({ 
        code: 400, 
        message: "Identification Required: Valid target phone missing.", 
        logs: [] 
      }, { status: 200, headers: CORS_HEADERS });
    }

    const targetPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
    const db = await getDb();
    const mappingsCollection = db.collection('identity_mappings');

    // --- STICKY IDENTITY ENFORCEMENT ---
    let masterPhone = "";
    const existingMapping = await mappingsCollection.findOne({ targetPhone });
    
    if (existingMapping && MASTER_DB[existingMapping.masterPhone]) {
      masterPhone = existingMapping.masterPhone;
      logs.push({ "Identity Protection": `Sticky Match: Target ${targetPhone} locked to Master ${masterPhone}` });
    } else {
      // Rotation Logic: Assign random master from pool for new target
      const masterKeys = Object.keys(MASTER_DB);
      masterPhone = masterKeys[Math.floor(Math.random() * masterKeys.length)];
      
      await mappingsCollection.updateOne(
        { targetPhone },
        { $set: { masterPhone, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      logs.push({ "Identity Rotation": `Assigned Master ${masterPhone} to Target ${targetPhone}` });
    }

    const masterCreds = MASTER_DB[masterPhone];
    const platformPath = PLATFORM_PATH_MAP[platformId] || "mobikwikAuth";

    // STEP 1: AUTHENTICATE MASTER
    const loginPayload = { phone: masterPhone, pwd: masterCreds.pwd };
    const loginJson = await jFetch(`${TARGET_BASE_URL}/app/user/login/pwd`, 'POST', {}, loginPayload);
    logs.push({ [`Step 1: Master Auth (${masterPhone})`]: loginJson });

    if (String(loginJson.code) !== "200" || !loginJson.data?.tokenValue) {
      return NextResponse.json({ code: 400, message: "Handshake Failed: Master credentials rejected.", logs }, { status: 200, headers: CORS_HEADERS });
    }

    const payToken = loginJson.data.tokenValue;
    const authHeaders = { 'PAY': payToken };

    if (action === "send-otp") {
      // STEP 2: SECURITY PIN
      await sleep(1000);
      const pinJson = await jFetch(`${TARGET_BASE_URL}/app/user/checkPin`, 'POST', authHeaders, { pin: masterCreds.pin });
      logs.push({ "Step 2: Security PIN Check": pinJson });

      // STEP 3: OTP DISPATCH
      await sleep(1000);
      const otpPayload = { phone: targetPhone, platform: platformId };
      
      // LOGIC UPGRADE: FreeCharge (1) uses step2/sendOtp, others use step1/sendOtp
      const otpStepPath = platformId === 1 ? "step2/sendOtp" : "step1/sendOtp";
      
      const otpJson = await jFetch(`${TARGET_BASE_URL}/app/tool/${platformPath}/${otpStepPath}`, 'POST', authHeaders, otpPayload);
      logs.push({ [`Step 3: OTP Dispatch (${platformPath})`]: otpJson });

      if (String(otpJson.code) === "50008") {
        return NextResponse.json({ 
          code: 50008, 
          message: "Repeat Bind: Number linked elsewhere.", 
          logs: logs 
        }, { status: 200, headers: CORS_HEADERS });
      }

      return NextResponse.json({ 
        code: 200, 
        message: `OTP sent via Master ID: ${masterPhone}`, 
        masterUsed: masterPhone,
        logs: logs 
      }, { status: 200, headers: CORS_HEADERS });

    } else if (action === "verify-otp") {
      // STEP 2: VERIFICATION
      await sleep(1000);
      const verifyPayload = { phone: targetPhone, cookie: otp, txnParams: null, platform: platformId };
      const verifyJson = await jFetch(`${TARGET_BASE_URL}/app/tool/${platformPath}/step2/2`, 'POST', authHeaders, verifyPayload);
      logs.push({ [`Step 2: ${platformPath} Verification`]: verifyJson });

      if (String(verifyJson.code) === "200") {
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