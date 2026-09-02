import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

// API Endpoints
const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";

// DTPay Master Credentials
const DT_MASTER_PHONE = "7870873927";
const DT_MASTER_PWD = "123456";

// Provider Mapping for DTPay History Probe
const DTPAY_PROVIDERS: Record<number, string> = {
  18: "AMAZON",
  2: "MOBIKWIK",
  3: "FREECHARGE",
  9: "PAYTM"
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Runner-Token, X-App-Version, X-App-Version-Code, X-Device-ID, X-Android-ID, X-Real-IP, Client-IP',
};

function getRandomIP() {
  const range = [Math.floor(Math.random() * 220) + 10, Math.floor(Math.random() * 254), Math.floor(Math.random() * 254), Math.floor(Math.random() * 254)];
  return range.join('.');
}

function getRandomUserAgent() {
  const versions = ["13", "12", "14", "13"];
  const models = ["SM-S918B", "Pixel 6", "OnePlus 11", "SM-A546B"];
  const chrome = ["118.0.0.0", "119.0.0.0", "120.0.0.0", "121.0.0.0"];
  
  const idx = Math.floor(Math.random() * versions.length);
  return `Mozilla/5.0 (Linux; Android ${versions[idx]}; ${models[idx]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome[idx]} Mobile Safari/537.36`;
}

function getRandomHex(len: number) {
  return crypto.randomBytes(len).toString('hex');
}

function sanitizePhone(phone: string): string {
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
}

/**
 * Generates MD5 signature for RSWallet Legacy strictly matching Python logic.
 * Format: sorted(key=value)&sessionKey
 */
function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

/**
 * Stealth Header Generator.
 * Aligned with DTPay and RSWallet requirements.
 */
function getStealthHeaders(token?: string, isDTPay: boolean = false) {
  const ip = getRandomIP();
  
  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": getRandomUserAgent(),
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
    "Client-IP": ip,
    "X-Device-ID": getRandomHex(8),
    "X-Android-ID": getRandomHex(8),
  };

  if (isDTPay) {
    headers["X-App-Version"] = "1.1.18"; // Upgraded version to bypass 30001
    headers["X-App-Version-Code"] = "22";
    if (token) headers["X-Runner-Token"] = token;
  } else if (token) {
    const cleanToken = token.replace(/['"]+/g, '').trim();
    headers["token"] = cleanToken;
    headers["loginToken"] = cleanToken;
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
      const targetMobile = sanitizePhone(body.phone || "");
      const channelType = parseInt(body.channelType);
      const engine = body.engine || "legacy";
      
      const isDTPay = engine === 'dtpay';
      // Amazon Mapping: 33 -> 18 for DTPay as requested
      const effectiveCtType = (isDTPay && channelType === 33) ? 18 : channelType;

      logs.push({ "Step 0: Engine Selection": { ok: true, msg: `Routing to ${isDTPay ? 'DTPay (New)' : 'Legacy (RSWallet)'} Engine for Type ${channelType} -> ${effectiveCtType}` } });

      if (isDTPay) {
        // DTPay Master Auth with Extreme Stealth
        const dtHeaders = getStealthHeaders(undefined, true);
        const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
        }).then(r => r.json());

        logs.push({ "Step 1: DTPay Master Auth": loginResp });

        if (!loginResp.ok) return NextResponse.json({ code: 400, message: "Master Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });

        const runnerToken = loginResp.data.token;
        const otpResp = await fetch(`${DT_BASE_URL}/provider/sendOtp?ctType=${effectiveCtType}&account=${targetMobile}`, {
          method: 'POST',
          headers: getStealthHeaders(runnerToken, true),
          body: JSON.stringify({})
        }).then(r => r.json());

        logs.push({ "Step 2: DTPay OTP Trigger": otpResp });
        if (otpResp.ok) {
          const sessionId = "DT_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ sessionId, runnerToken, channelType: effectiveCtType, targetMobile, engine: 'DTPay', createdAt: new Date() });
          return NextResponse.json({ code: 200, message: "OTP Sent via DTPay", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "DTPay OTP Failed", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        // RSWallet Legacy Flow - 100% Fresh Identity per Request (15 Retries)
        let loginResp: any = null;
        let finalHeaders: any = null;
        let botPhone = "";
        let botPassword = "";

        logs.push({ "Step 1: Generating Fresh Identity": { ok: true } });

        for (let attempt = 1; attempt <= 15; attempt++) {
          botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + crypto.randomInt(100000000, 999999999).toString().substring(0, 9);
          if (botPhone.length < 10) botPhone = botPhone.padEnd(10, '0');
          botPassword = "Ritik" + getRandomHex(2) + "@1";
          
          const attemptHeaders = getStealthHeaders();

          // Register
          await fetch(`${RS_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: attemptHeaders,
            body: JSON.stringify({ phone: botPhone, password: botPassword, referralCode: "0ealuckpbyno" })
          }).catch(() => null);

          // Login
          loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: attemptHeaders,
            body: JSON.stringify({ phone: botPhone, password: botPassword })
          }).then(r => r.json()).catch(() => ({ code: 500 }));

          if (loginResp && loginResp.code === 200) {
            finalHeaders = attemptHeaders;
            logs.push({ "Step 2: Identity Established": { ok: true, phone: botPhone } });
            break;
          }
          await new Promise(r => setTimeout(r, 400 * attempt));
        }

        if (!loginResp || loginResp.code !== 200) {
          return NextResponse.json({ code: 400, message: "Legacy Identity Loop Exhausted", logs }, { status: 200, headers: CORS_HEADERS });
        }

        const { userId, loginToken, sessionKey } = loginResp.data;
        const pinCode = "954073";
        const authHeaders = { ...finalHeaders, token: loginToken, loginToken: loginToken };

        // Sequential Signature Warmup (Python Match)
        let ts = Date.now();
        let pinPayload = { pinCode, ts, userId: parseInt(userId) };
        let sig = generateRSSignature(pinPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, {
          method: 'POST',
          headers: { ...authHeaders, Signature: sig },
          body: JSON.stringify(pinPayload)
        });
        await new Promise(r => setTimeout(r, 1000));

        ts = Date.now();
        const verifyPayload = { pinCode, ts, userId: parseInt(userId) };
        sig = generateRSSignature(verifyPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/verify`, {
          method: 'POST',
          headers: { ...authHeaders, Signature: sig },
          body: JSON.stringify(verifyPayload)
        });
        await new Promise(r => setTimeout(r, 1000));

        // OTP Dispatch
        ts = Date.now();
        const otpPayload = { mobile: targetMobile, type: channelType, accountType: "1", ts, userId: parseInt(userId) };
        sig = generateRSSignature(otpPayload, sessionKey);
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: { ...authHeaders, Signature: sig },
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());

        logs.push({ "Step 3: Legacy OTP Result": otpResp });
        if (otpResp.code === 200) {
          const sessionId = "RS_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ sessionId, userId, loginToken, sessionKey, requestId: otpResp.data.requestId, channelType, engine: 'Legacy', createdAt: new Date() });
          return NextResponse.json({ code: 200, message: "OTP Sent via Legacy", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.message || "Legacy OTP Failed", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const { sessionId, otp } = body;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Session Expired" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        const { runnerToken, channelType, targetMobile } = session;
        const dtHeaders = getStealthHeaders(runnerToken, true);
        const verifyResp = await fetch(`${DT_BASE_URL}/provider/verifyOtp?ctType=${channelType}&account=${targetMobile}&otp=${otp}`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({})
        }).then(r => r.json());

        if (verifyResp.ok) {
          await fetch(`${DT_BASE_URL}/provider/completeLogin?ctType=${channelType}&account=${targetMobile}`, { method: 'POST', headers: dtHeaders, body: JSON.stringify({}) });
          const infoResp = await fetch(`${DT_BASE_URL}/provider/upiInfo?ctType=${channelType}&account=${targetMobile}`, { method: 'POST', headers: dtHeaders, body: JSON.stringify({}) }).then(r => r.json());
          return NextResponse.json({ code: 200, message: "Success", vpaList: infoResp.data?.upiInfos || [], logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });

      } else {
        const { userId, loginToken, sessionKey, requestId, channelType } = session;
        const checkPayload = { code: String(otp), type: parseInt(channelType), requestId: parseInt(requestId), ts: Date.now(), userId: parseInt(userId) };
        const sig = generateRSSignature(checkPayload, sessionKey);
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig },
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());

        if (checkResp.code === 200) {
          return NextResponse.json({ code: 200, message: "Success", vpaList: checkResp.data?.upiInfos || [], logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "fetch-by-phone") {
      const targetMobile = sanitizePhone(body.phone || "");
      const channelType = parseInt(body.channelType);
      const effectiveType = (channelType === 33) ? 18 : channelType;
      const providerName = DTPAY_PROVIDERS[effectiveType];

      if (providerName) {
        const dtHeaders = getStealthHeaders(undefined, true);
        const loginResp = await fetch(`${DT_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: dtHeaders,
          body: JSON.stringify({ phone: DT_MASTER_PHONE, password: DT_MASTER_PWD, countryCode: "+91" })
        }).then(r => r.json());

        if (!loginResp.ok) return NextResponse.json({ code: 400, message: "Master Auth Failed", logs }, { status: 200, headers: CORS_HEADERS });

        const runnerToken = loginResp.data.token;
        const listResp = await fetch(`${DT_BASE_URL}/upi/list`, { method: 'GET', headers: getStealthHeaders(runnerToken, true) }).then(r => r.json());

        if (listResp.ok) {
          const match = listResp.data.find((u: any) => u.upiAccount.includes(targetMobile) && u.provider.toUpperCase() === providerName.toUpperCase());
          if (match) {
            const detailResp = await fetch(`${DT_BASE_URL}/upi/detail?runnerUpiId=${match.runnerUpiId}&limit=5`, { method: 'GET', headers: getStealthHeaders(runnerToken, true) }).then(r => r.json());
            return NextResponse.json({ code: 200, data: detailResp.data, logs }, { status: 200, headers: CORS_HEADERS });
          }
        }
        return NextResponse.json({ code: 404, message: `No linked ${providerName} found.`, logs }, { status: 200, headers: CORS_HEADERS });
      }
      return NextResponse.json({ code: 400, message: "History probe only for DTPay providers.", logs }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
