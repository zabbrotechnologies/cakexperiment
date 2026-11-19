async function check() {
  const res = await fetch(`https://thecakexperiment.com/?_t=${Date.now()}`);
  const html = await res.text();
  const match = html.match(/\/assets\/index-[a-zA-Z0-9_\-]+\.js/);
  console.log('Live bundle:', match ? match[0] : 'not found');
}
check();
