// 海外期貨紅綠燈 App
// 完整市場行情 API V3
// Yahoo Finance 延遲參考行情

const MARKETS = [
  { id: "NQ",  name: "小那斯達克", yahoo: "NQ=F", category: "指數" },
  { id: "YM",  name: "小道瓊", yahoo: "YM=F", category: "指數" },

  // 暫時使用日經225指數參考，不冒充小日經期貨
  { id: "NK225", name: "日經225參考", yahoo: "^N225", category: "指數" },

  { id: "EUR", name: "歐元", yahoo: "6E=F", category: "外匯" },
  { id: "JPY", name: "日圓", yahoo: "6J=F", category: "外匯" },
  { id: "GBP", name: "英鎊", yahoo: "6B=F", category: "外匯" },
  { id: "AUD", name: "澳幣", yahoo: "6A=F", category: "外匯" },
  { id: "NZD", name: "紐幣", yahoo: "6N=F", category: "外匯" },

  { id: "GC", name: "黃金", yahoo: "GC=F", category: "金屬" },
  { id: "SI", name: "白銀", yahoo: "SI=F", category: "金屬" },
  { id: "HG", name: "高級銅", yahoo: "HG=F", category: "金屬" },

  { id: "ZS", name: "黃豆", yahoo: "ZS=F", category: "穀物" },
  { id: "ZL", name: "黃豆油", yahoo: "ZL=F", category: "穀物" },
  { id: "ZM", name: "黃豆粉", yahoo: "ZM=F", category: "穀物" },
  { id: "ZW", name: "小麥", yahoo: "ZW=F", category: "穀物" },
  { id: "ZC", name: "玉米", yahoo: "ZC=F", category: "穀物" },

  { id: "CL", name: "原油", yahoo: "CL=F", category: "能源" },
  { id: "BZ", name: "布蘭特原油", yahoo: "BZ=F", category: "能源" },
  { id: "NG", name: "天然氣", yahoo: "NG=F", category: "能源" }
];

async function getQuote(item) {
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.yahoo)}?interval=1d&range=3mo;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
    throw new Error("HTTP " + response.status);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) {
      throw new Error("沒有行情資料");
    }
const q = result?.indicators?.quote?.[0];

const daily = (result?.timestamp ?? []).map((time, i) => ({
  time,
  high: q?.high?.[i],
  low: q?.low?.[i],
  close: q?.close?.[i]
})).filter(d =>
  Number.isFinite(d.high) &&
  Number.isFinite(d.low) &&
  Number.isFinite(d.close)
);

if (daily.length < 20) {
  throw new Error("歷史日線資料不足");
}

const closes = daily.map(d => d.close);
// ===== 計算 MA5 / MA10 / MA20 =====
const avg = (arr) => {
  return arr.reduce((sum, value) => sum + value, 0) / arr.length;
};

const ma5 = avg(closes.slice(-5));
const ma10 = avg(closes.slice(-10));
const ma20 = avg(closes.slice(-20));

// ===== 計算 RSI 14 =====
let gains = 0;
let losses = 0;

for (let i = closes.length - 14; i < closes.length; i++) {
  const change = closes[i] - closes[i - 1];

  if (change > 0) {
    gains += change;
  } else {
    losses += Math.abs(change);
  }
}

const avgGain = gains / 14;
const avgLoss = losses / 14;

const rsi14 = avgLoss === 0
  ? 100
  : 100 - (100 / (1 + avgGain / avgLoss));

  // ===== 計算 Bollinger Bands 20日 =====
const last20 = closes.slice(-20);
const bbMiddle = avg(last20);

const variance = last20.reduce((sum, value) => {
  return sum + Math.pow(value - bbMiddle, 2);
}, 0) / last20.length;

const stdDev = Math.sqrt(variance);

const bbUpper = bbMiddle + (2 * stdDev);
const bbLower = bbMiddle - (2 * stdDev);

// ===== 計算 Pivot 樞紐線 =====
// 使用前一個交易日的 High / Low / Close
const prevDay = daily[daily.length - 2];

const prevHigh = prevDay.high;
const prevLow = prevDay.low;
const prevClose = prevDay.close;

const pivot = (prevHigh + prevLow + prevClose) / 3;

const r1 = (2 * pivot) - prevLow;
const s1 = (2 * pivot) - prevHigh;

const r2 = pivot + (prevHigh - prevLow);
const s2 = pivot - (prevHigh - prevLow);

const r3 = prevHigh + 2 * (pivot - prevLow);
const s3 = prevLow - 2 * (prevHigh - pivot);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      yahoo: item.yahoo,
      ok: true,
      price: meta.regularMarketPrice ?? null,
      previousClose:
        meta.previousClose ??
        meta.chartPreviousClose ??
        null,
      currency: meta.currency ?? null,
      marketTime: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null,
        ma5: ma5,
ma10: ma10,
ma20: ma20,
rsi14: rsi14,
bbUpper: bbUpper,
bbMiddle: bbMiddle,
bbLower: bbLower,
pivot: pivot,
r1: r1,
r2: r2,
r3: r3,
s1: s1,
s2: s2,
s3: s3
    };

  } catch (error) {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      yahoo: item.yahoo,
      ok: false,
      price: null,
      error: error.message
    };
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const quotes = await Promise.all(
      MARKETS.map(item => getQuote(item))
    );

    return res.status(200).json({
      ok: true,
      source: "Yahoo Finance 延遲參考行情",
      delayed: true,
      updatedAt: new Date().toISOString(),
      count: quotes.length,
      quotes
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "市場行情取得失敗",
      error: error.message
    });
  }
}
}
