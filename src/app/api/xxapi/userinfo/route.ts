import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Robust User Info handler for APK compatibility.
 * Returns the exact nested data structure from RITIK's logs to prevent 403 logout.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobileNo = searchParams.get('mobileNo') || searchParams.get('mobile') || "9060873927";

    const mockUserData = {
      username: mobileNo,
      userType: 3,
      realName: mobileNo,
      gender: 2,
      mobile: mobileNo,
      status: 1,
      crtUser: "9214250307",
      crtDate: 1780204608,
      parentUser: "9214250307",
      platformUser: "vantage",
      level: 12,
      payType: 3,
      payerRewardFixed: 0.00,
      payerRewardRatio: 0.00,
      payeeRewardFixed: 0.00,
      payeeRewardRatio: 0.00,
      trc20Address: "TQJY4yY4ZqjGjpQ9BYg3gPVj8EQjVMDnrf",
      inviteCode: "YKuRy4SQGz",
      agentUser: "earning",
      pageSize: 0,
      net: "mainnet",
      itoken: 14.66,
      frozenItoken: 0.00,
      totalProfit: 14.36,
      todayProfit: 0,
      inPayAmount: 0.00,
      totalSucAmount: 0,
      teamWorkId: 892779815,
      receiveToday: {
        username: mobileNo,
        inTransation: 0,
        todayDeal: 0,
        todaySuccess: 0,
        todayTimes: 0
      },
      recharge: 0,
      reward: 0,
      performance: 299.70,
      safety_code: "1",
      ifFinishNewbieActivity: 0,
      totalTransferValue: 0,
      minSellIToken: 1,
      chargeFlag: 0,
      chargeAmt: "1000,1500,2000,3000,5000,10000,20000",
      activityOpens: {
        today_buy_inr_reward: "1",
        newbie_reward: "1"
      },
      todayLotteryMode: "legacy",
      userSellToken: ",",
      ifFinishInviteStepActivity: -1,
      userBankFlag: 0,
      bankInAmt: 0
    };

    return jsonResponse(mockUserData);
  } catch (e: any) {
    return jsonResponse({ mobile: "9060873927", status: 1 });
  }
}
