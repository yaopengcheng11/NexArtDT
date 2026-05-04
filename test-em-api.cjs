async function test() {
  try {
    // 1. 沪深京A股涨幅榜 Top 10
    const stocksRes = await fetch('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&fields=f2,f3,f4,f12,f14');
    const stocksData = await stocksRes.json();
    console.log("Stocks:", stocksData.data.diff.slice(0, 2));

    // 2. 行业板块涨幅榜 Top 5
    const sectorsRes = await fetch('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=5&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f4,f12,f14');
    const sectorsData = await sectorsRes.json();
    console.log("Sectors:", sectorsData.data.diff.slice(0, 2));

    // 3. 大盘资金流向/成交额 (上证+深证)
    const shRes = await fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&fields=f2,f3,f4,f6');
    const shData = await shRes.json();
    console.log("Indices:", shData.data.diff);
  } catch (e) {
    console.error(e);
  }
}
test();
