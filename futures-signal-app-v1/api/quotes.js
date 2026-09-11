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
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.yahoo)}?interval=5m&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) {
      throw new Error("沒有行情資料");
    }

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
        : null
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
