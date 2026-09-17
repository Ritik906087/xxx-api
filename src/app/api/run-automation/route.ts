import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

/**
 * @fileOverview Hybrid Engine v16.0 - RSWallet Pool Edition
 * RSWallet: Uses MongoDB pool (automation_accounts) for 24/7 identity rotation.
 * DTPay: Static Auth (acebce0aa2f64ddd945b5bcb6bc9c089) - Untouched.
 */

const RS_BASE_URL = "https://api.rswallet-api.com/app";
const DT_BASE_URL = "https://dtpay.app/runner-api/runner/api/v1";
const FIXED_REFERRAL = "0ealuckpbyno";
const DEFAULT_PIN = "954073";

// DTPay Static Auth - Untouched
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

  const headers: any = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": `Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36`,
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
    "Client-IP": ip,
    "X-Device-ID": getRandomHex(8),
    "X-Android-ID": getRandomHex(8),
  };

  if (token) {
    headers["token"] = token;
    headers["loginToken"] = token;
  }

  return headers;
}

function generateRSSignature(payload: Record<string, any>, sessionKey: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys.map(key => `${key}=${payload[key]}`).join('&');
  const rawString = `${queryString}&${sessionKey}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

// --- RSWALLET POOL & PROVISIONING LOGIC ---

/**
 * Background Provisioner: Ensures the account pool stays healthy.
 * Runs asynchronously to fulfill the "24/7" requirement.
 */
async function backgroundProvisioning() {
  try {
    const db = await getDb();
    const activeCount = await db.collection('automation_accounts').countDocuments({ status: 'active' });
    
    // Maintain a pool of at least 15 active accounts continuously
    if (activeCount < 15) {
      console.log(`[RS_PROVISIONER] Pool current active: ${activeCount}. Generating fresh authenticated identity...`);
      
      const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + crypto.randomInt(100000000, 999999999).toString().substring(0, 9);
      const botPassword = "Ritik" + getRandomHex(2) + "@1";
      
      const regResp = await fetch(`${RS_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getStealthHeaders(),
        body: JSON.stringify({ phone: botPhone, password: botPassword, referralCode: FIXED_REFERRAL })
      }).then(r => r.json()).catch(() => null);

      if (regResp && (regResp.code === 200 || regResp.success || regResp.msg === "success")) {
        // Validate with immediate test login to ensure no 'auth info' crashes exist
        const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: getStealthHeaders(),
          body: JSON.stringify({ phone: botPhone, password: botPassword })
        }).then(r => r.json()).catch(() => null);

        if (loginResp && loginResp.code === 200 && loginResp.data?.loginToken) {
          await db.collection('automation_accounts').insertOne({
            phone: botPhone,
            password: botPassword,
            status: 'active',
            createdAt: new Date(),
            lastChecked: new Date()
          });
          console.log(`[RS_PROVISIONER] Successfully registered and pooled working account: ${botPhone}`);
        }
      }
    }
  } catch (e) {
    console.error('[RS_PROVISIONER_ERROR]', e);
  }
}

async function provisionRSAccount(logs: any[]) {
  const db = await getDb();
  
  // Trigger background check async to keep the machine running 24/7
  backgroundProvisioning();

  // Try to find a valid active account from pool
  const poolAccounts = await db.collection('automation_accounts')
    .find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  for (const acc of poolAccounts) {
    try {
      const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getStealthHeaders(),
        body: JSON.stringify({ phone: acc.phone, password: acc.password })
      }).then(r => r.json()).catch(() => null);

      if (loginResp && loginResp.code === 200 && loginResp.data?.loginToken) {
        const { userId, loginToken, sessionKey } = loginResp.data;
        
        // Setup PIN
        const ts1 = Date.now();
        const pinPayload = { pinCode: DEFAULT_PIN, ts: ts1, userId: parseInt(userId) };
        const sig1 = generateRSSignature(pinPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/bind`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig1 },
          body: JSON.stringify(pinPayload)
        }).catch(() => null);

        const ts2 = Date.now();
        const verifyPayload = { pinCode: DEFAULT_PIN, ts: ts2, userId: parseInt(userId) };
        const sig2 = generateRSSignature(verifyPayload, sessionKey);
        await fetch(`${RS_BASE_URL}/secure/pin/verify`, {
          method: 'POST',
          headers: { ...getStealthHeaders(loginToken), Signature: sig2 },
          body: JSON.stringify(verifyPayload)
        }).catch(() => null);

        return { userId: parseInt(userId), loginToken, sessionKey, phone: acc.phone };
      } else {
        // Mark explicitly as expired and instantly rotate to the next account in loop
        await db.collection('automation_accounts').updateOne(
          { _id: acc._id },
          { $set: { status: 'expired', lastChecked: new Date() } }
        );
        logs.push({ "RS_POOL_HEAL": `Pooled Account ${acc.phone} invalidated by server. Marked as expired.` });
      }
    } catch (e) {
      logs.push({ "RS_POOL_ERROR": `Failed checking pooled account ${acc.phone}` });
    }
  }

  // Backup loop: If pool is dry, loop synchronously until an account registers and logs in cleanly
  logs.push({ "RS_POOL_STATUS": "Pool dry or unverified. Provisioning fresh authenticated identity on the fly..." });
  for (let attempt = 1; attempt <= 5; attempt++) {
    const botPhone = ["6", "7", "8", "9"][Math.floor(Math.random() * 4)] + crypto.randomInt(100000000, 999999999).toString().substring(0, 9);
    const botPassword = "Ritik" + getRandomHex(2) + "@1";
    
    const regResp = await fetch(`${RS_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getStealthHeaders(),
      body: JSON.stringify({ phone: botPhone, password: botPassword, referralCode: FIXED_REFERRAL })
    }).then(r => r.json()).catch(() => null);

    const loginResp = await fetch(`${RS_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getStealthHeaders(),
      body: JSON.stringify({ phone: botPhone, password: botPassword })
    }).then(r => r.json()).catch(() => null);

    if (loginResp && loginResp.code === 200 && loginResp.data?.loginToken) {
      const { userId, loginToken, sessionKey } = loginResp.data;
      
      await db.collection('automation_accounts').insertOne({
        phone: botPhone,
        password: botPassword,
        status: 'active',
        createdAt: new Date(),
        lastChecked: new Date()
      });

      const ts1 = Date.now();
      const pinPayload = { pinCode: DEFAULT_PIN, ts: ts1, userId: parseInt(userId) };
      const sig1 = generateRSSignature(pinPayload, sessionKey);
      await fetch(`${RS_BASE_URL}/secure/pin/bind`, {
        method: 'POST',
        headers: { ...getStealthHeaders(loginToken), Signature: sig1 },
        body: JSON.stringify(pinPayload)
      }).catch(() => null);

      return { userId: parseInt(userId), loginToken, sessionKey, phone: botPhone };
    }
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
      
      const isDt = [1, 2, 3, 9, 33].includes(type);

      if (isDt) {
        if (type === 33) type = 18; 
        const otpUrl = `${DT_BASE_URL}/provider/sendOtp?ctType=${type}&account=${phone}`;
        const otpResp = await fetch(otpUrl, {
          method: 'POST',
          headers: getStealthHeaders(DT_STATIC_TOKEN, true),
          body: JSON.stringify({}) 
        }).then(r => r.json());

        logs.push({ "DTPay_Action": otpResp });
        
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
          return NextResponse.json({ code: 200, message: "OTP Initiated", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.msg || "DTPay Error", logs }, { status: 200, headers: CORS_HEADERS });
      } else {
        // RSWallet Pooled Flow
        let acc = await provisionRSAccount(logs);
        if (!acc) return NextResponse.json({ code: 500, message: "RS Provisioning Failed: Server busy", logs }, { status: 200, headers: CORS_HEADERS });

        const ts = Date.now();
        const otpPayload = { mobile: phone, type: type, accountType: "1", ts, userId: acc.userId };
        const sig = generateRSSignature(otpPayload, acc.sessionKey);
        
        const otpResp = await fetch(`${RS_BASE_URL}/bind/send/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(acc.loginToken), Signature: sig },
          body: JSON.stringify(otpPayload)
        }).then(r => r.json());

        logs.push({ "RS_Action": otpResp });
        
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
          return NextResponse.json({ code: 200, message: "OTP Sent", sessionId, logs }, { status: 200, headers: CORS_HEADERS });
        }
        return NextResponse.json({ code: 400, message: otpResp.message || "RS Error", logs }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "verify-otp") {
      const { sessionId, otp } = body;
      const session = await db.collection('automation_sessions').findOne({ sessionId });
      if (!session) return NextResponse.json({ code: 400, message: "Invalid Session" }, { status: 200, headers: CORS_HEADERS });

      if (session.engine === 'DTPay') {
        const verifyUrl = `${DT_BASE_URL}/provider/verifyOtp?ctType=${session.ctType}&account=${session.phone}&otp=${otp}`;
        const verifyResp = await fetch(verifyUrl, {
          method: 'POST',
          headers: getStealthHeaders(session.token, true),
          body: JSON.stringify({})
        }).then(r => r.json());
        
        if (verifyResp.code === 0 || verifyResp.ok) {
          const infoUrl = `${DT_BASE_URL}/provider/upiInfo?ctType=${session.ctType}&account=${session.phone}&noAutoBind=true`;
          const infoResp = await fetch(infoUrl, {
            method: 'POST',
            headers: getStealthHeaders(session.token, true),
            body: JSON.stringify({})
          }).then(r => r.json());

          if (infoResp.code === 0 && infoResp.data?.vpa) {
            const bindUrl = `${DT_BASE_URL}/provider/bindUpi?ctType=${session.ctType}&account=${session.phone}&upiAccount={infoResp.data.vpa}`;
            await fetch(bindUrl, {
              method: 'POST',
              headers: getStealthHeaders(session.token, true, true),
              body: ""
            });
            return NextResponse.json({ 
              code: 200, 
              message: "Success", 
              vpaList: infoResp.data?.upiList?.map((u: string) => ({ vpa: u, status: "ACTIVE" })) || [{ vpa: infoResp.data.vpa, status: "ACTIVE" }], 
              logs: [{ "Verify": verifyResp, "Info": infoResp }] 
            }, { status: 200, headers: CORS_HEADERS });
          }
        }
        return NextResponse.json({ code: 400, message: verifyResp.msg || "Invalid OTP", logs: [{ "Verify": verifyResp }] }, { status: 200, headers: CORS_HEADERS });
      } else {
        const checkPayload = { code: String(otp), type: session.ctType, requestId: session.requestId, ts: Date.now(), userId: session.userId };
        const sig = generateRSSignature(checkPayload, session.sessionKey);
        
        const checkResp = await fetch(`${RS_BASE_URL}/bind/check/otp`, {
          method: 'POST',
          headers: { ...getStealthHeaders(session.token), Signature: sig },
          body: JSON.stringify(checkPayload)
        }).then(r => r.json());
        
        if (checkResp.code === 200) return NextResponse.json({ code: 200, message: "Success", vpaList: checkResp.data?.upiInfos || [], logs: [{ "RS_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
        return NextResponse.json({ code: 400, message: checkResp.message || "Invalid OTP", logs: [{ "RS_Verify": checkResp }] }, { status: 200, headers: CORS_HEADERS });
      }
    }

    if (action === "fetch-by-phone") {
      let type = parseInt(body.channelType);
      if (type === 33) type = 18; 
      const phone = body.phone;
      
      const detailUrl = `${DT_BASE_URL}/upi/detail?account=${phone}&ctType=${type}&limit=5`;
      const detailRes = await fetch(detailUrl, {
        method: 'GET',
        headers: getStealthHeaders(DT_STATIC_TOKEN, true)
      }).then(r => r.json());

      if (detailRes?.code === 0 && detailRes.data) {
        const recentBills = detailRes.data.recentBills || [];
        const mappedVpaList = recentBills.map((bill: any) => ({
          vpa: `UTR: ${bill.utr} | Amount: ₹${bill.amount} | Status: ${bill.billStatus}`,
          upiAccount: detailRes.data.upi?.upiAccount || phone,
          provider: bill.provider,
          status: bill.billStatus
        }));
        return NextResponse.json({ code: 200, message: "History Synced", vpaList: mappedVpaList, logs: [{ "History": detailRes }] }, { status: 200, headers: CORS_HEADERS });
      }
      return NextResponse.json({ code: 400, message: detailRes?.msg || "History failed", logs: [{ "History": detailRes }] }, { status: 200, headers: CORS_HEADERS });
    }

  } catch (err: any) {
    return NextResponse.json({ code: 500, message: err.message, logs }, { status: 200, headers: CORS_HEADERS });
  }
}
