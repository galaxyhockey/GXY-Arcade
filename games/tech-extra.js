/* Technology Empire add-on: 🎤 product-launch keynotes and 📰 tech review scores.
   After each launch you present it on stage (three choices), then five outlets review it. Reviews move hype,
   reputation and long-run sales (via the device's loyalty multiplier the sales sim already uses).
   Uses the page's G, ERAS, DEVICES, launchDevice, showModal, closeModal, log, renderAll, money, esc, clamp. */
(function(){
  const OUTLETS = [
    { name:'TechPulse', bias:0, likes:'quality' }, { name:'The Byte', bias:-.4, likes:'value' }, { name:'GadgetLab', bias:.3, likes:'design' },
    { name:'Pixel Weekly', bias:0, likes:'hype' }, { name:'DeviceRadar', bias:-.2, likes:'quality' },
  ];
  const BEATS = [
    { title:'How do you open the show?', opts:[
      { t:'🎬 Cinematic sizzle video', d:'Safe and polished.', score:[8,14], hype:4 },
      { t:'🧑‍💻 Live on-stage demo', d:'Huge if it works. It might not.', score:[-12,26], hype:7, risky:true },
      { t:'📊 Straight to the numbers', d:'Analysts love it, fans are bored.', score:[4,10], hype:1, analyst:true } ] },
    { title:'What\'s the centerpiece?', opts:[
      { t:'⚡ Benchmark showdown vs rivals', d:'Best when your specs are actually better.', specs:true },
      { t:'🎨 Design and materials tour', d:'Makes it feel premium.', score:[6,14], hype:3 },
      { t:'🌱 Sustainability story', d:'Earns respect, quiet buzz.', score:[4,10], hype:2, rep:3 } ] },
    { title:'How do you close?', opts:[
      { t:'💡 "One more thing…" surprise', d:'Tease a secret feature. Fans go wild, or roll their eyes.', score:[-6,22], hype:8, risky:true },
      { t:'💸 Launch-day discount', d:'10% off for early buyers. Strong reviews on value.', score:[6,12], hype:4, discount:true },
      { t:'🎤 Celebrity cameo ($)', d:'Costs money, guaranteed buzz.', score:[12,18], hype:10, cost:true } ] },
  ];
  let K = null;
  const r = (a, b) => a + Math.random() * (b - a);

  const origLaunch = window.launchDevice;
  window.launchDevice = function(){
    const before = G.devices[0] && G.devices[0].id;
    origLaunch.apply(this, arguments);
    const d = G.devices[0];
    if(!d || d.id === before) return;                 // launch was refused
    K = { d, beat:0, show:50, notes:[] };
    stage();
  };
  function stage(){
    window._allowClose = false;
    const b = BEATS[K.beat], d = K.d;
    showModal(`<div style="text-align:center"><div style="font-size:.75rem;letter-spacing:.2em;color:var(--dim);text-transform:uppercase">🎤 Launch event · ${K.beat + 1}/3</div>
      <div style="font-size:3rem;margin:.3rem 0">${d.emoji || '📱'}</div><h2 style="margin:0">${esc(d.name)}</h2>
      <div style="height:8px;border-radius:5px;background:#1f2937;margin:.7rem 0;overflow:hidden"><div style="height:100%;width:${K.show}%;background:linear-gradient(90deg,#a855f7,#22d3ee)"></div></div>
      <div style="font-size:.8rem;color:var(--dim)">Crowd energy ${Math.round(K.show)}%</div>
      ${K.notes.length ? `<p style="margin:.5rem 0;font-size:.88rem">${K.notes[K.notes.length - 1]}</p>` : ''}</div>
      <h3 style="margin:.8rem 0 .4rem">${b.title}</h3>
      ${b.opts.map((o, i) => `<button class="btn ghost" style="display:block;width:100%;text-align:left;margin-bottom:.4rem" onclick="tkPick(${i})"><b>${o.t}</b><br><span style="font-size:.8rem;color:var(--dim)">${o.d}${o.cost ? ' · ' + money(cameo()) : ''}</span></button>`).join('')}`);
  }
  const cameo = () => Math.max(20000, Math.round((G.cash || 0) * 0.04 / 1000) * 1000);
  window.tkPick = function(i){
    const o = BEATS[K.beat].opts[i], d = K.d, era = ERAS[G.era];
    let s, note;
    if(o.specs){ const edge = d.quality - era.expect; s = clamp(edge * 1.2, -15, 24); note = edge > 5 ? '📈 The benchmarks crush the competition. The crowd roars.' : edge > -5 ? '🤷 The charts are… fine. Polite applause.' : '😬 The rival comparison backfires. Someone in the back laughs.'; }
    else { s = r(o.score[0], o.score[1]); }
    if(o.risky && !note) note = s < 0 ? (K.beat === 0 ? '💥 The demo freezes on stage. Awkward silence.' : '🙄 The "one more thing" is a new color. Groans.') : (K.beat === 0 ? '✨ The live demo is flawless. Jaws drop.' : '🤯 The surprise feature steals the show!');
    if(o.cost){ const c = cameo(); G.cash -= c; note = `🌟 A superstar walks out to present it (${money(c)}).`; }
    if(o.discount){ d.price = Math.round(d.price * .9); K.value = 1; note = note || `💸 Early buyers get ${money(d.price)} launch pricing.`; }
    if(o.rep) G.rep = clamp(G.rep + o.rep, 0, 100);
    if(o.analyst) K.analyst = 1;
    K.show = clamp(K.show + s, 0, 100); G.hype = clamp(G.hype + (o.hype || 0) * (s > 0 ? 1 : .3), 0, 100);
    K.notes.push(note || (s > 10 ? '👏 Big cheers.' : s > 0 ? '🙂 Solid reaction.' : '😐 The room goes quiet.'));
    K.beat++;
    if(K.beat < BEATS.length) return stage();
    reviews();
  };
  function reviews(){
    const d = K.d, era = ERAS[G.era], t = DEVICES.find(x => x.key === d.type);
    const fair = t.base * (0.5 + d.quality / 100 * 1.1), value = clamp((fair / d.price - 1) * 6, -3, 3);
    const quality = clamp((d.quality - era.expect) / 8, -4, 4), show = (K.show - 50) / 20;
    const rs = OUTLETS.map(o => {
      let s = 6.2 + quality * .9 + value * (o.likes === 'value' ? .8 : .35) + show * (o.likes === 'hype' ? .8 : .3) + (o.likes === 'design' ? (G.upgrades.design || 0) * .15 : 0) + o.bias + r(-.6, .6) + (K.value && o.likes === 'value' ? .5 : 0) + (K.analyst && o.likes === 'quality' ? .3 : 0);
      return { o:o.name, s:Math.round(clamp(s, 1, 10) * 10) / 10 };
    });
    const avg = rs.reduce((a, x) => a + x.s, 0) / rs.length;
    d.reviews = rs; d.reviewAvg = Math.round(avg * 10) / 10;
    // reviews keep pushing sales every quarter through the existing loyalty multiplier
    d.loyaltyBonus = Math.max(-60, (d.loyaltyBonus || 0) + (avg - 6) * 9);   // floor keeps the sales multiplier positive
    G.hype = clamp(G.hype + (avg - 6) * 3, 0, 100); G.rep = clamp(G.rep + (avg - 6.5) * 1.5, 0, 100);
    const verdict = avg >= 8.5 ? '🏆 Universal acclaim' : avg >= 7.5 ? '🌟 Glowing reviews' : avg >= 6 ? '👍 Mostly positive' : avg >= 4.5 ? '😐 Mixed reviews' : '👎 Panned by critics';
    const quote = avg >= 8 ? '"The device to beat this year."' : avg >= 6.5 ? '"A confident step forward."' : avg >= 5 ? '"Good, not great."' : '"Hard to recommend at this price."';
    log(`📰 <b>${esc(d.name)}</b> reviews: <b>${d.reviewAvg}/10</b> (${verdict.replace(/^\S+ /, '')}).`, avg >= 6 ? 'good' : 'bad');
    if(window.GXY){ GXY.event('gxy-tech-empire', 'launches'); GXY.event('gxy-tech-empire', 'review', Math.round(avg * 10)); }
    window._allowClose = true;
    showModal(`<div style="text-align:center"><div style="font-size:.75rem;letter-spacing:.2em;color:var(--dim);text-transform:uppercase">📰 The reviews are in</div>
      <h2 style="margin:.3rem 0">${esc(d.name)}</h2><div style="font:800 3rem monospace;color:${avg >= 7 ? 'var(--green,#22c55e)' : avg >= 5 ? 'var(--gold,#facc15)' : 'var(--red,#ef4444)'}">${d.reviewAvg}</div>
      <div style="font-weight:800">${verdict}</div><p style="font-style:italic;color:var(--dim);margin:.3rem 0 .8rem">${quote}</p></div>
      ${rs.map(x => `<div style="display:flex;justify-content:space-between;align-items:center;padding:.45rem 0;border-bottom:1px solid var(--line,#24365a)"><b>${x.o}</b><span style="display:flex;align-items:center;gap:.5rem"><span style="display:inline-block;width:90px;height:7px;border-radius:4px;background:#1f2937;overflow:hidden"><i style="display:block;height:100%;width:${x.s * 10}%;background:${x.s >= 7 ? '#22c55e' : x.s >= 5 ? '#facc15' : '#ef4444'}"></i></span><b style="font-family:monospace">${x.s.toFixed(1)}</b></span></div>`).join('')}
      <p style="font-size:.82rem;color:var(--dim);margin:.7rem 0">Crowd energy at the keynote: ${Math.round(K.show)}%. ${avg >= 6 ? 'Good reviews will keep sales strong for quarters to come.' : 'Weak reviews will drag on sales. A strong sequel can win fans back.'}</p>
      <button class="btn big" style="width:100%" onclick="closeModal();renderAll()">Back to HQ</button>`);
    K = null;
  }
})();
