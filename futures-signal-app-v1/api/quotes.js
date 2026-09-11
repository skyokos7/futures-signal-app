// 海外期貨紅綠燈 App
// 行情 API V2 - 先測試 NQ

const SYMBOL = "NQ=F";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(SYMBOL)}?interval=5m&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error(`行情來源錯誤：${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) {
      throw new Error("沒有取得行情資料");
    }

    return res.status(200).json({
      ok: true,
      symbol: "NQ",
      name: "小那斯達克",
      providerSymbol: SYMBOL,
      price: meta.regularMarketPrice ?? null,
      previousClose:
        meta.previousClose ??
        meta.chartPreviousClose ??
        null,
      currency: meta.currency ?? "USD",
      marketTime: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null,
      source: "Yahoo Finance 延遲參考行情",
      delayed: true
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "行情取得失敗",
      error: error.message
    });
  }
}
