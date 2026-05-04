async function test() {
  const res = await fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.600519&fields=f2,f3,f4,f12,f14');
  const data = await res.json();
  console.log(data.data.diff);
}
test();
