import { jsonResponse, handleOptions } from '@/lib/api-response';

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Returns configuration strictly excluding Paytm, MobiKwik, Freecharge, Amazon.
 */
export async function GET() {
  const mockConfig = {
    usdtExchangerate: "80",
    currency: "INR",
    registerHost: "https://refer.vantage.top/#/rs/",
    tgChannelLink: "xxxx",
    rewardRules: {
      freeze_comp_reward: { name: "freeze_comp_reward", fixed: 0.00, ratio: 0.00, minCondi: 0, ruleActive: 0, rule: "{}" },
      inr_buy_dividend: { name: "inr_buy_dividend", fixed: 0.00, ratio: 0.00, minCondi: 0, ruleActive: 1, rule: "{\"1\": 0.003, \"2\": 0.002, \"3\": 0.001}" },
      inr_buy_reward: { name: "inr_buy_reward", fixed: 0.00, ratio: 2.50, minCondi: 1, ruleActive: 0, rule: "{\"rate_change\": \"2.0,2.5\", \"fixed_change\": \"0,0\"}" },
      inr_buy_reward_0: { name: "inr_buy_reward_0", fixed: 0.00, ratio: 2.50, minCondi: 0, ruleActive: 1, rule: "{\"rate_change\": \"2.0,2.5\", \"fixed_change\": \"0,0\"}" },
      today_buy_times_reward: { name: "today_buy_times_reward", fixed: 0.00, ratio: 0.00, minCondi: 0, ruleActive: 1, rule: "{\"1\": 10, \"3\": 20, \"5\": 20, \"10\": 50}" },
      usdt_buy_dividend: { name: "usdt_buy_dividend", fixed: 0.00, ratio: 0.00, minCondi: 100, ruleActive: 1, rule: "{\"1\": 0.003, \"2\": 0.001, \"3\": 0.0}" }
    },
    bannerSrcs: [
      "https://picsum.photos/seed/1/800/400",
      "https://picsum.photos/seed/2/800/400",
      "https://picsum.photos/seed/3/800/400"
    ],
    newsList: [
      { id: 32, cover: "", name: "securityupdate", code: "", type: 1, content: "Pool System Active", crtDate: 1779259339, crtUser: "alan", sort: 4 }
    ],
    pinFlag: false,
    ctTypes: [1, 13, 14, 17, 18],
    ctTypesPayType: { "1": 2, "13": 2, "14": 2, "17": 2, "18": 1 },
    ifFinishNewbieActivity: 0,
    rptPaymentMode: 1,
    webLicenseId: "19711455",
    userBalShowReal: 0,
    sevenDayBuyEnabled: 0,
    v: 2040,
    pv: 4
  };

  return jsonResponse(mockConfig);
}
