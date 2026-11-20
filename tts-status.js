/* =====================================================================
   حالة صوت الوحدات — إضافة منفصلة (قراءة بس)
   بتضيف زرار «📋 حالة صوت الوحدات» جوه قسم تخزين الصوت في ⚙️ صوت AI.
   بتبيّن لكل وحدة في البرنامج المختار:
     ✅ صوتها متخزن (المتدرب هيسمع الصوت المتخزن)
     ⚠️ مش متخزن (هيتشغّل بالصوت الاحتياطي لحد ما يتخزن)
     📝 لسه ملهاش نص شرح (هيتكتب ويتخزن مع زرار التوليد)
   مش بتكتب ولا بتمسح أي حاجة، وبتشتغل للأدمن بس.
   ===================================================================== */
(function(){
  'use strict';
  const LBL = {
    cached: ['✅', 'متخزن'],
    missing: ['⚠️', 'مش متخزن: هيتشغّل بالصوت الاحتياطي'],
    noscript: ['📝', 'لسه ملهاش نص شرح'],
    error: ['❔', 'ماقدرناش نتأكد (جرّب تاني)']
  };
  const fmt = sec => { if(!(sec > 0)) return ''; const t = Math.round(sec), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), x = t % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
  const fmtLong = sec => { const t = Math.round(sec / 60), h = Math.floor(t / 60), m = t % 60; return h ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function mount(){
    const status = document.getElementById('ttsCacheStatus');
    if(!status || document.getElementById('ttsStatusBtn')) return !!status;
    const btn = document.createElement('button');
    btn.id = 'ttsStatusBtn'; btn.type = 'button'; btn.className = 'btn btn-ghost';
    btn.style.marginTop = '8px'; btn.textContent = '📋 حالة صوت الوحدات';
    const box = document.createElement('div');
    box.id = 'ttsStatusBox'; box.className = 'hint'; box.style.marginTop = '6px';
    const link = document.createElement('button');
    link.id = 'ttsRelinkBtn'; link.type = 'button'; link.className = 'btn btn-ghost';
    link.style.marginTop = '8px'; link.style.marginInlineStart = '6px'; link.textContent = '🔗 ربط الأصوات المتخزنة';
    status.insertAdjacentElement('afterend', btn);
    btn.insertAdjacentElement('afterend', link);
    const all = document.createElement('button');
    all.id = 'ttsAllDurBtn'; all.type = 'button'; all.className = 'btn btn-ghost';
    all.style.marginTop = '8px'; all.style.marginInlineStart = '6px'; all.textContent = '⏱️ مدة الاستماع لكل البرامج';
    link.insertAdjacentElement('afterend', all);
    all.insertAdjacentElement('afterend', box);
    all.addEventListener('click', () => allDurations(all, box));
    btn.addEventListener('click', () => run(btn, box));
    link.addEventListener('click', () => relink(link, box));
    return true;
  }

  async function run(btn, box){
    if(typeof window.__stceTtsStatus !== 'function' || !window.__stceAdminOK){ box.textContent = 'الشاشة دي للأدمن بس.'; return; }
    const sel = document.getElementById('ttsCacheProgramSelect');
    const pid = sel && sel.value;
    if(!pid){ box.textContent = 'اختار برنامج الأول.'; return; }
    btn.disabled = true;
    try{
      const res = await window.__stceTtsStatus(pid, (k, n) => { box.textContent = `بيفحص الوحدة ${k} من ${n}…`; }, true);
      if(!res){ box.textContent = 'ماقدرناش نلاقي البرنامج ده.'; return; }
      const c = { cached: 0, missing: 0, noscript: 0, error: 0 };
      res.items.forEach(it => { c[it.status] = (c[it.status] || 0) + 1; });
      const need = c.missing + c.noscript;
      const exact = res.items.reduce((a, it) => a + (it.sec || 0), 0), est = res.items.reduce((a, it) => a + (it.est || 0), 0);
      let html = `<div style="font-weight:700;margin-bottom:6px;">${esc(res.program)}: ${c.cached} من ${res.items.length} وحدة صوتها متخزن</div>`;
      html += `<div style="margin-bottom:6px;">⏱️ مدة الاستماع: ${fmtLong(exact + est)}${est ? ` (منها حوالي ${fmtLong(est)} تقديري للوحدات اللي لسه ماتخزنتش)` : ''}</div>`;
      html += need
        ? `<div style="margin-bottom:6px;color:#9a3b41;">فيه ${need} وحدة محتاجة تخزين. دوس «توليد وتخزين صوت البرنامج» وهو هيخزّن الناقص بس ويعدّي اللي متخزن.</div>`
        : `<div style="margin-bottom:6px;color:#1f7a4a;">كل الوحدات متخزنة ✓</div>`;
      html += '<div style="max-height:320px;overflow:auto;border:1px solid #e3e8ef;border-radius:8px;padding:6px 8px;background:#fff;">';
      res.items.forEach(it => { const [ic, tx] = LBL[it.status] || LBL.error; html += `<div style="padding:3px 0;border-bottom:1px solid #f1f3f6;">${ic} ${it.n}. ${esc(it.title)} <span style="color:#6c747d;">— ${tx}${it.pinned ? ' (مربوط بالوحدة)' : ''}</span>${it.sec ? ` <b>⏱️ ${fmt(it.sec)}</b>` : it.est ? ` <span style="color:#6c747d;">⏱️ حوالي ${fmt(it.est)}</span>` : ''}</div>`; });
      html += '</div>';
      box.innerHTML = html;
    }catch(e){
      console.error('tts status failed', e);
      box.textContent = 'حصلت مشكلة في الفحص. جرّب تاني.';
    }finally{ btn.disabled = false; }
  }

  async function relink(btn, box){
    if(typeof window.__stceTtsRelink !== 'function' || !window.__stceAdminOK){ box.textContent = 'الزرار ده للأدمن بس.'; return; }
    const sel = document.getElementById('ttsCacheProgramSelect');
    const pid = sel && sel.value;
    if(!pid){ box.textContent = 'اختار برنامج الأول.'; return; }
    btn.disabled = true;
    try{
      const res = await window.__stceTtsRelink(pid, msg => { box.textContent = msg; });
      if(!res){ box.textContent = 'ماقدرناش نلاقي البرنامج ده.'; return; }
      if(res.error === 'no_token'){ box.textContent = 'محتاج كلمة سر المخزن: دوس «توليد وتخزين صوت البرنامج» مرة والصق كلمة السر، وبعدين جرّب تاني.'; return; }
      const R = { linked: ['🔗', 'اتربط بصوته القديم'], already: ['✅', 'مربوط من قبل'], none: ['⚠️', 'ملوش صوت قديم في المخزن'] };
      let html = `<div style="font-weight:700;margin-bottom:6px;">${esc(res.program)}: اتربط ${res.linked} وحدة من غير أي تخزين جديد، و${res.already} كانت مربوطة، و${res.none} ملهاش صوت قديم.</div>`;
      if(res.none) html += `<div style="margin-bottom:6px;color:#9a3b41;">الوحدات اللي ملهاش صوت قديم بس هي اللي محتاجة «توليد وتخزين صوت البرنامج».</div>`;
      html += '<div style="max-height:320px;overflow:auto;border:1px solid #e3e8ef;border-radius:8px;padding:6px 8px;background:#fff;">';
      res.items.forEach(it => { const [ic, tx] = R[it.r] || R.none; html += `<div style="padding:3px 0;border-bottom:1px solid #f1f3f6;">${ic} ${it.n}. ${esc(it.title)} <span style="color:#6c747d;">— ${tx}</span></div>`; });
      box.innerHTML = html + '</div>';
    }catch(e){
      console.error('tts relink failed', e);
      box.textContent = (e && e.status === 401) ? 'كلمة سر المخزن غلط.' : (e && e.status === 403) ? 'المخزن رفض الطلب: رابط المنصة مش مطابق للمسموح.' : 'حصلت مشكلة في الربط. جرّب تاني.';
    }finally{ btn.disabled = false; }
  }

  // كل البرامج: جدول ملخص + ملف Excel (CSV) فيه كل وحدة ومدتها.
  async function allDurations(btn, box){
    if(typeof window.__stceTtsStatus !== 'function' || !window.__stceAdminOK){ box.textContent = 'الزرار ده للأدمن بس.'; return; }
    const progs = window.__stceTtsStatusPrograms ? window.__stceTtsStatusPrograms() : [];
    if(!progs.length){ box.textContent = 'مفيش برامج.'; return; }
    btn.disabled = true;
    const rows = [['البرنامج', 'رقم الوحدة', 'الوحدة', 'المدة (دقيقة:ثانية)', 'المدة بالدقايق', 'نوع المدة']], sums = [];
    try{
      for(let pi = 0; pi < progs.length; pi++){
        const pg = progs[pi];
        const res = await window.__stceTtsStatus(pg.id, (k, n) => { box.textContent = `البرنامج ${pi + 1} من ${progs.length}: ${pg.title} — الوحدة ${k} من ${n}…`; }, true);
        if(!res) continue;
        let ex = 0, es = 0, none = 0;
        res.items.forEach(it => {
          const sec = it.sec || it.est || 0; if(it.sec) ex += it.sec; else if(it.est) es += it.est; else none++;
          rows.push([res.program, it.n, it.title, sec ? fmt(sec) : '', sec ? (sec / 60).toFixed(1) : '', it.sec ? 'من الصوت المتخزن' : it.est ? 'تقديري من نص الشرح' : 'مفيش نص شرح لسه']);
        });
        sums.push({ title: res.program, units: res.items.length, ex, es, none });
      }
      let html = '<div style="max-height:360px;overflow:auto;border:1px solid #e3e8ef;border-radius:8px;background:#fff;"><table style="width:100%;border-collapse:collapse;font-size:13px;"><tr style="background:#f3f5f8;"><th style="padding:6px;text-align:start;">البرنامج</th><th>الوحدات</th><th>مدة الاستماع</th></tr>';
      let tot = 0;
      sums.forEach(x => { tot += x.ex + x.es; html += `<tr style="border-top:1px solid #f1f3f6;"><td style="padding:6px;">${esc(x.title)}</td><td style="text-align:center;">${x.units}</td><td style="text-align:center;">${fmtLong(x.ex + x.es)}${x.es ? ' *' : ''}${x.none ? ` <span style="color:#9a3b41;">(${x.none} من غير نص)</span>` : ''}</td></tr>`; });
      html += `<tr style="border-top:2px solid #c9d6e8;font-weight:700;"><td style="padding:6px;">الإجمالي</td><td></td><td style="text-align:center;">${fmtLong(tot)}</td></tr></table></div>`;
      html += '<div style="margin-top:4px;color:#6c747d;">* جزء من المدة تقديري للوحدات اللي صوتها لسه ماتخزنش، محسوب من عدد كلمات نص الشرح وسرعة الكلام في نفس البرنامج. الوحدات اللي «من غير نص» لسه ملهاش شرح فمش محسوبة.</div>';
      html += '<button class="btn btn-ghost" id="ttsDurCsv" type="button" style="margin-top:6px;">⬇️ تنزيل مدة كل وحدة (Excel)</button>';
      box.innerHTML = html;
      document.getElementById('ttsDurCsv').addEventListener('click', () => {
        const csv = '\ufeff' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = 'stce-listening-durations.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      });
    }catch(e){
      console.error('durations failed', e);
      box.textContent = 'حصلت مشكلة في الحساب. جرّب تاني.';
    }finally{ btn.disabled = false; }
  }

  if(!mount()){
    const obs = new MutationObserver(() => { if(mount()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
