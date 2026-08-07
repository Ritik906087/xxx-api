import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

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
 * Master Identities Registry
 */
const MASTER_DB: Record<string, { pwd: string, pin: string }> = {
  "7870873927": { pwd: "Ritik123", pin: "954073" },
  "9060873927": { pwd: "Ritik123", pin: "954073" }, // Added as per user instruction
  "8431549953": { pwd: "Ritik123", pin: "954073" },
  "9579390488": { pwd: "Ritik123", pin: "954073" },
  "7892941854": { pwd: "Ritik123", pin: "954073" },
  "8099636920": { pwd: "Ritik123", pin: "954073" },
  "8792533303": { pwd: "Ritik123", pin: "954073" },
};

/**
 * Throttling Helper
 */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Platform URL Mapping
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
    const action = body.action || "send-otp";
    const targetPhone = body.phone;
    const platformId = body.platform || 2;
    const otp = body.otp;
    let masterPhone = body.masterPhone || "7870873927";

    if (!targetPhone || targetPhone.length < 10) {
      return NextResponse.json({ 
        code: 400, 
        message: "Identification Required: Valid target phone missing.", 
        logs: [] 
      }, { status: 200, headers: CORS_HEADERS });
    }

    // --- STICKY IDENTITY LOGIC ---
    const db = await getDb();
    const mappingsCollection = db.collection('identity_mappings');
    
    // Check if this target phone already has a mapped Master ID
    const existingMapping = await mappingsCollection.findOne({ targetPhone });
    if (existingMapping) {
      masterPhone = existingMapping.masterPhone;
      logs.push({ "Identity Policy": `Sticky identity detected. Forcing Master ID: ${masterPhone}` });
    }

    const masterCreds = MASTER_DB[masterPhone] || MASTER_DB["7870873927"];
    const platformPath = PLATFORM_PATH_MAP[platformId] || "mobikwikAuth";

    // Step 1: Login to JCoinPay
    const loginPayload = { phone: masterPhone, pwd: masterCreds.pwd };
    const loginJson = await jFetch(`${TARGET_BASE_URL}/app/user/login/pwd`, 'POST', {}, loginPayload);
    logs.push({ [`Step 1: Identity Auth (Login: ${masterPhone})`]: loginJson });

    if (loginJson.code !== "200" || !loginJson.data?.tokenValue) {
      return NextResponse.json({ code: 400, message: "Auth Sequence Failed: Invalid Identity Credentials", logs }, { status: 200, headers: CORS_HEADERS });
    }

    // If login is successful and no mapping exists, save it now
    if (!existingMapping) {
      await mappingsCollection.insertOne({
        targetPhone,
        masterPhone,
        createdAt: new Date().toISOString()
      });
      logs.push({ "Identity Policy": `New mapping established: ${targetPhone} -> ${masterPhone}` });
    }

    const payToken = loginJson.data.tokenValue;
    const authHeaders = { 'PAY': payToken };

    if (action === "send-otp") {
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
      const pinPayload = { pin: masterCreds.pin };
      const pinJson = await jFetch(`${TARGET_BASE_URL}/app/user/checkPin`, 'POST', authHeaders, pinPayload);
      logs.push({ "Step 4: PIN Verification": pinJson });

      if (pinJson.code !== "200") {
        return NextResponse.json({ code: 400, message: "Security Fault: PIN rejected by upstream", logs }, { status: 200, headers: CORS_HEADERS });
      }

      // Step 5: Final OTP Dispatch
      await sleep(1500);
      const otpPayload = { phone: targetPhone, platform: platformId };
      const otpJson = await jFetch(`${TARGET_BASE_URL}/app/tool/${platformPath}/step1/sendOtp`, 'POST', authHeaders, otpPayload);
      logs.push({ [`Step 5: ${platformPath.replace('Auth', '')} Action Trigger`]: otpJson });

      return NextResponse.json({ 
        code: 200, 
        message: "OTP Dispatch sequence processed.", 
        logs 
      }, { status: 200, headers: CORS_HEADERS });

    } else if (action === "verify-otp") {
      if (!otp) {
        return NextResponse.json({ code: 400, message: "OTP required for verification", logs }, { status: 200, headers: CORS_HEADERS });
      }

      // Step 2: OTP Verification
      await sleep(1500);
      const verifyPayload = { 
        phone: targetPhone, 
        cookie: otp, 
        txnParams: null, 
        platform: platformId 
      };
      
      const verifyJson = await jFetch(`${TARGET_BASE_URL}/app/tool/${platformPath}/step2/2`, 'POST', authHeaders, verifyPayload);
      logs.push({ [`Step 2: ${platformPath.replace('Auth', '')} Verification Result`]: verifyJson });

      if (verifyJson.code === "200") {
        return NextResponse.json({ 
          code: 200, 
          message: "Verification successful", 
          upis: verifyJson.data?.upis,
          logs 
        }, { status: 200, headers: CORS_HEADERS });
      } else {
        return NextResponse.json({ 
          code: 400, 
          message: verifyJson.msg || "Verification failed", 
          logs 
        }, { status: 200, headers: CORS_HEADERS });
      }
    }

    return NextResponse.json({ code: 400, message: "Invalid Action", logs }, { status: 200, headers: CORS_HEADERS });

  } catch (err: any) {
    return NextResponse.json({ 
      code: 500, 
      message: `System Integrity Fault: ${err.message}`, 
      logs: logs 
    }, { status: 200, headers: CORS_HEADERS });
  }
}
