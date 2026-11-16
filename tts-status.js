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
    link.insertAdjacentElement('afterend', box);
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
      const res = await window.__stceTtsStatus(pid, (k, n) => { box.textContent = `بيفحص الوحدة ${k} من ${n}…`; });
      if(!res){ box.textContent = 'ماقدرناش نلاقي البرنامج ده.'; return; }
      const c = { cached: 0, missing: 0, noscript: 0, error: 0 };
      res.items.forEach(it => { c[it.status] = (c[it.status] || 0) + 1; });
      const need = c.missing + c.noscript;
      let html = `<div style="font-weight:700;margin-bottom:6px;">${esc(res.program)}: ${c.cached} من ${res.items.length} وحدة صوتها متخزن</div>`;
      html += need
        ? `<div style="margin-bottom:6px;color:#9a3b41;">فيه ${need} وحدة محتاجة تخزين. دوس «توليد وتخزين صوت البرنامج» وهو هيخزّن الناقص بس ويعدّي اللي متخزن.</div>`
        : `<div style="margin-bottom:6px;color:#1f7a4a;">كل الوحدات متخزنة ✓</div>`;
      html += '<div style="max-height:320px;overflow:auto;border:1px solid #e3e8ef;border-radius:8px;padding:6px 8px;background:#fff;">';
      res.items.forEach(it => { const [ic, tx] = LBL[it.status] || LBL.error; html += `<div style="padding:3px 0;border-bottom:1px solid #f1f3f6;">${ic} ${it.n}. ${esc(it.title)} <span style="color:#6c747d;">— ${tx}${it.pinned ? ' (مربوط بالوحدة)' : ''}</span></div>`; });
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

  if(!mount()){
    const obs = new MutationObserver(() => { if(mount()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
