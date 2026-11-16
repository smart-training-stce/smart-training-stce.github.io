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
    status.insertAdjacentElement('afterend', btn);
    btn.insertAdjacentElement('afterend', box);
    btn.addEventListener('click', () => run(btn, box));
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
      res.items.forEach(it => { const [ic, tx] = LBL[it.status] || LBL.error; html += `<div style="padding:3px 0;border-bottom:1px solid #f1f3f6;">${ic} ${it.n}. ${esc(it.title)} <span style="color:#6c747d;">— ${tx}</span></div>`; });
      html += '</div>';
      box.innerHTML = html;
    }catch(e){
      console.error('tts status failed', e);
      box.textContent = 'حصلت مشكلة في الفحص. جرّب تاني.';
    }finally{ btn.disabled = false; }
  }

  if(!mount()){
    const obs = new MutationObserver(() => { if(mount()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
