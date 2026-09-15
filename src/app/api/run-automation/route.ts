import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

/**
 * @fileOverview Hybrid Engine v15.0 - Multi-Step Stealth Master
 * RSWallet: Fresh identity per request (Strict Python Signature Logic)
 * DTPay: Static Auth (acebce0aa2f64ddd945b5bcb6bc9c089) - Multi-Step OTP/Bind/History
 */

const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

// DTPay Static Auth - Provided by User
const DT_STATIC_TOKEN = "acebce0aa2f64ddd945b5bcb6bc9c089";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, loginToken, Signature, X-Device-ID, X-Android-ID, X-Real-IP, Client-IP, X-Runner-Token, X-App-Version, X-App-Version-Code, X-App-Platform, Accept',
};

// --- UTILITIES ---

function getRandomHex(len: number) {
  return crypto.randomBytes(len).toString('hex');
}

/**
 * Stealth Header Generator - Strictly aligned with v1.1.17/21 original logs
 */
function getStealthHeaders(token?: string, isDt = false, isForm = false) {
  const ip = `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
  
  if (isDt) {
    return {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": isForm ? "application/x-www-form-urlencoded" : "application/json;charset=UTF-8",
      "X-Forwarded-For": ip,
      "X-Real-IP": ip,
      "Client-IP": ip,
      "X-Runner-Token": token || DT_STATIC_TOKEN,
      "X-App-Version": "1.1.17",
      "X-App-Version-Code": "21",
      "X-App-Platform": "android",
      "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36"
    };
  }

  return {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": `Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36`,
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
    "Client-IP": ip,
    "X-Device-ID": getRandomHex(8),
    "X-Android-ID": getRandomHex(8),
    "token": token || "",
    "loginToken": token || ""
  };
}

function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

// --- RSWALLET POOL LOGIC ---

async function provisionRSAccount(logs: any[]) {
  for (let attempt = 1; attempt <= 15; attempt++) {
    const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + crypto.randomInt(100000000, 999999999).toString().substring(0, 9);
    const botPassword = "Ritik" + getRandomHex(2) + "@1";
    
    try {
      const stealthHeaders = getStealthHeaders();
      await fetch(`${RS_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: stealthHeaders,
        body: JSON.stringify({ phone: botPhone, password: botPassword, referralCode: FIXED_REFERRAL })
      });
      
      const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: stealthHeaders,
        body: JSON.stringify({ phone: botPhone, password: botPassword })
      }).then(r => r.json());

      if (loginResp?.code === 200) {
        const { userId, loginToken, sessionKey } = loginResp.data;
        const ts1 = Date.now();
        const pinPayload = { pinCode: DEFAULT_PIN, ts: ts1, userId: parseInt(userId) };
        const sig1 = generateRSSignature(pinPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig1 },
          body: JSON.stringify(pinPayload)
        });

        const ts2 = Date.now();
        const verifyPayload = { pinCode: DEFAULT_PIN, ts: ts2, userId: parseInt(userId) };
        const sig2 = generateRSSignature(verifyPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/verify`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig2 },
          body: JSON.stringify(verifyPayload)
        });

        return { userId: parseInt(userId), loginToken, sessionKey, phone: botPhone };
      }
    } catch (e) { }
    await new Promise(r => setTimeout(r, 400 * attempt));
  }
  return null;
}

// --- MAIN HANDLERS ---

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
      const phone = body.phone;
      let type = parseInt(body.channelType);
      
      // DTPay Engine Targets: PhonePe(1), Mobi(2), FC(3), Paytm(9), Amazon(33->18)
      const isDt = [1, 2, 3, 9, 33].includes(type);

      if (isDt) {
        if (type === 33) type = 18; 
        
        const otpUrl = `${DT_BASE_URL}/provider/sendOtp?ctType=${type}&account=${phone}`;
        logs.push({ "Step 0: Engine Selection": `DTPay (New) | Mapping ${body.channelType} -> ${type}` });

        const otpResp = await fetch(otpUrl, {
          method: 'POST',
          headers: getStealthHeaders(DT_STATIC_TOKEN, true),
          body: JSON.stringify({}) 
        }).then(r => r.json());

        logs.push({ "Step 1: DTPay OTP Send": otpResp });
        
        if (otpResp.code === 0 || otpResp.ok) {
          const sessionId = "DT_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ 
            sessionId, 
            token: DT_STATIC_TOKEN, 
            engine: 'DTPay', 
            ctType: type, 
            phone, 
            createdAt: new Date() 
          });
          return NextResponse.json({ 
            code: 200, 
            message: otpResp.msg || "OTP Sequence Initiated (Active Session)", 
            sessionId, 
            logs 
          }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "DTPay Dispatch Error", logs }, { status: 200, headers: CORS_HEADERS });
      } else {
        // RSWallet Legacy Flow (Navi, SuperMoney, etc.)
        let acc = await provisionRSAccount(logs);
        if (!acc) return NextResponse.json({ code: 500, message: "RS Provisioning Failed", logs }, { status: 200, headers: CORS_HEADERS });

        const ts = Date.now();
        const otpPayload = { mobile: phone, type: type, accountType: "1", ts, userId: acc.userId };
        const sig = generateRSSignature(otpPayload, acc.sessionKey);
        
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(acc.loginToken), Signature: sig },
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());

        logs.push({ "Step 4: Legacy OTP Dispatch": otpResp });
        
        if (otpResp.code === 200) {
          const sessionId = "RS_" + getRandomHex(4).toUpperCase();
          await db.collection('automation_sessions').insertOne({ 
            sessionId, 
            userId: acc.userId, 
            sessionKey: acc.sessionKey, 
            token: acc.loginToken, 
            requestId: otpResp.data.requestId, 
            ctType: type,
            phone,
            engine: 'Legacy', 
            createdAt: new Date() 
          });
          return NextResponse.json({ code: 200, message: "OTP Sent (Legacy)", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.message || "Legacy Dispatch Error", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const { sessionId, otp } = body;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Invalid Session" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        // 1. Verify OTP strictly as per original request format
        const verifyUrl = `${DT_BASE_URL}/provider/verifyOtp?ctType=${session.ctType}&account=${session.phone}&otp=${otp}`;
        const verifyResp = await fetch(verifyUrl, {
          method: 'POST',
          headers: getStealthHeaders(session.token, true),
          body: JSON.stringify({})
        }).then(r => r.json());
        
        logs.push({ "Step 1: DTPay Verify OTP": verifyResp });

        if (verifyResp.code === 0 || verifyResp.ok) {
          // 2. Fetch UPI Info
          const infoUrl = `${DT_BASE_URL}/provider/upiInfo?ctType=${session.ctType}&account=${session.phone}&noAutoBind=true`;
          const infoResp = await fetch(infoUrl, {
            method: 'POST',
            headers: getStealthHeaders(session.token, true),
            body: JSON.stringify({})
          }).then(r => r.json());
          
          logs.push({ "Step 2: DTPay UPI Info": infoResp });

          if (infoResp.code === 0 && infoResp.data?.vpa) {
            // 3. Bind UPI (Form Encoded)
            const bindUrl = `${DT_BASE_URL}/provider/bindUpi?ctType=${session.ctType}&account=${session.phone}&upiAccount=${encodeURIComponent(infoResp.data.vpa)}`;
            const bindResp = await fetch(bindUrl, {
              method: 'POST',
              headers: getStealthHeaders(session.token, true, true),
              body: ""
            }).then(r => r.json());
            
            logs.push({ "Step 3: DTPay Bind UPI": bindResp });

            return NextResponse.json({ 
              code: 200, 
              message: "Success", 
              vpaList: infoResp.data?.upiList?.map((u: string) => ({ vpa: u, status: "ACTIVE" })) || [{ vpa: infoResp.data.vpa, status: "ACTIVE" }], 
              logs 
            }, { status: 200, headers: CORS_HEADERS });
          }
          
          return NextResponse.json({ code: 200, message: "Verified (Link Pending)", vpaList: [], logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: verifyResp.msg || "Invalid OTP", logs }, { status: 200, headers: CORS_HEADERS });
      } else {
        // Legacy Verify
        const checkPayload = { code: String(otp), type: session.ctType, requestId: session.requestId, ts: Date.now(), userId: session.userId };
        const sig = generateRSSignature(checkPayload, session.sessionKey);
        
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(session.token), Signature: sig },
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());
        
        if (checkResp.code === 200) return NextResponse.json({ code: 200, message: "Success", vpaList: checkResp.data?.upiInfos || [], logs: [{ "Legacy_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
        return NextResponse.json({ code: 400, message: checkResp.message || "Invalid OTP", logs: [{ "Legacy_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "fetch-by-phone") {
      let type = parseInt(body.channelType);
      if (type === 33) type = 18; 
      const phone = body.phone;
      
      const dtHeaders = getStealthHeaders(DT_STATIC_TOKEN, true);
      let runnerUpiId = null;

      // PROVIDER FILTERING: Map ctType to original provider name to avoid PhonePe/Paytm history mismatch
      const providerMap: Record<number, string> = {
        1: "PHONEPE",
        2: "MOBIKWIK",
        3: "FREECHARGE",
        9: "PAYTM",
        18: "AMAZON"
      };
      const targetProvider = providerMap[type];

      try {
        const listUrl = `${DT_BASE_URL}/upi/list`;
        const listRes = await fetch(listUrl, { method: "GET", headers: dtHeaders }).then(r => r.json());
        if (listRes && (listRes.code === 0 || listRes.ok) && listRes.data) {
          const upiItems = Array.isArray(listRes.data) ? listRes.data : (listRes.data.list || []);
          
          // Filter by Phone AND Provider Name strictly
          const matched = upiItems.find((item: any) => 
            (String(item.walletPhone) === String(phone) || String(item.upiAccount).includes(String(phone))) &&
            (targetProvider ? String(item.provider).toUpperCase() === targetProvider : true)
          );

          if (matched) {
            runnerUpiId = matched.runnerUpiId;
            logs.push({ "Identity_Resolution": `Found runnerUpiId: ${runnerUpiId} for ${targetProvider} | Phone: ${phone}` });
          }
        }
      } catch (e) {
        logs.push({ "Identity_Resolution_Error": (e as Error).message });
      }

      if (!runnerUpiId) {
        return NextResponse.json({ 
          code: 400, 
          message: `Could not resolve Ledger Identity for ${targetProvider}. Please trigger OTP first.`, 
          vpaList: [], 
          logs 
        }, { status: 200, headers: CORS_HEADERS });
      }

      // Fetch History using upi/detail exactly as original app
      const detailUrl = `${DT_BASE_URL}/upi/detail?runnerUpiId=${runnerUpiId}&limit=5`;
      const detailRes = await fetch(detailUrl, {
        method: 'GET',
        headers: dtHeaders
      }).then(r => r.json());

      logs.push({ "History_Fetch_Response": detailRes });

      if (detailRes && (detailRes.code === 0 || detailRes.ok) && detailRes.data) {
        const recentBills = detailRes.data.recentBills || [];
        const mappedVpaList = recentBills.map((bill: any) => ({
          vpa: `UTR: ${bill.utr} | Amount: ₹${bill.amount} | Status: ${bill.billStatus}`,
          upiAccount: detailRes.data.upi?.upiAccount || phone,
          provider: bill.provider,
          status: bill.billStatus
        }));

        if (mappedVpaList.length === 0 && detailRes.data.upi) {
          mappedVpaList.push({
            vpa: detailRes.data.upi.upiAccount,
            upiAccount: detailRes.data.upi.upiAccount,
            provider: detailRes.data.upi.provider,
            status: "ACTIVE (No recent bills)"
          });
        }

        return NextResponse.json({ code: 200, message: "History Synced Successfully", vpaList: mappedVpaList, logs }, { status: 200, headers: CORS_HEADERS });
      }
      
      return NextResponse.json({ code: 400, message: detailRes?.msg || "History scan failed", vpaList: [], logs }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
