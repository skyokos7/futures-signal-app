// 海外期貨紅綠燈 App
// 行情 API V1

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    ok: true,
    message: "行情 API 已成功啟動",
    time: new Date().toISOString()
  });
}
