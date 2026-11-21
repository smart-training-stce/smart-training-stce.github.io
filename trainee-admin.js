/* =====================================================================
   حذف المتدرب بالاختيارات + الطلبات اليتيمة — إضافة منفصلة (للمدرب/الأدمن)
   - زرار «🗑️ حذف المتدرب» بيفتح نافذة فيها:
       1) حذف الحساب بس (طلبات الاشتراك بتفضل)
       2) حذف الحساب والبيانات بالكامل: بيسأل على كل اشتراك لوحده نعم/لا
       3) إلغاء
   - زرار «🧾 طلبات من غير حساب» جنب «تصدير» في شاشة المتدربين: طلبات اشتراك
     لحسابات اتمسحت قبل كده، وتقدر تمسحها واحد واحد أو كلها.
   كل المسح بيحصل عن طريق المنصة نفسها (window.__stce...)، والملف ده شاشات بس.
   ===================================================================== */
(function(){
  'use strict';
  const T = (ar, en) => (typeof window.__stceLang === 'function' && window.__stceLang() === 'en') ? en : ar;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ST = s => ({ approved: T('مقبول', 'Approved'), pending: T('قيد المراجعة', 'Pending'), rejected: T('مرفوض', 'Rejected') }[s] || s || '—');
  const DT = ms => { if(!ms) return ''; try{ return new Date(ms).toLocaleDateString(T('ar-EG', 'en-GB')); }catch(e){ return ''; } };

  /* ---------- نافذة عامة ---------- */
  function modal(){
    let ov = document.getElementById('stceTaModal');
    if(ov) ov.remove();
    ov = document.createElement('div'); ov.id = 'stceTaModal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,20,36,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;color:#1d2128;border-radius:14px;max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.3);font-family:inherit;';
    box.dir = T('rtl', 'ltr');
    ov.appendChild(box); document.body.appendChild(ov);
    ov.addEventListener('click', e => { if(e.target === ov && !ov.dataset.busy) ov.remove(); });
    return { ov, box, close(){ ov.remove(); } };
  }
  const btn = (txt, kind) => `<button type="button" class="btn ${kind === 'danger' ? '' : kind === 'primary' ? 'btn-primary' : 'btn-ghost'}" style="margin:4px;${kind === 'danger' ? 'background:#b3261e;color:#fff;border:none;' : ''}">${txt}</button>`;
  function render(m, html, actions){
    m.box.innerHTML = html + `<div style="display:flex;flex-wrap:wrap;justify-content:flex-end;margin-top:14px;">${actions.map(a => btn(a[0], a[1])).join('')}</div>`;
    const bs = m.box.querySelectorAll(':scope > div:last-child > button');
    actions.forEach((a, i) => bs[i].addEventListener('click', a[2]));
  }
  const subLine = s => `<div style="padding:6px 8px;border:1px solid #e3e8ef;border-radius:8px;margin:4px 0;"><b>${esc(s.program)}</b> — ${ST(s.status)}${s.submittedAt ? ` <span style="color:#6c747d;">(${DT(s.submittedAt)})</span>` : ''}</div>`;

  /* ---------- حذف المتدرب ---------- */
  function openDelete(tid){
    const info = window.__stceTraineeDeleteInfo && window.__stceTraineeDeleteInfo(tid);
    if(!info){ alert(T('مش لاقيين المتدرب ده.', 'Trainee not found.')); return; }
    const m = modal(), name = esc(info.name), subs = info.subs;
    const head = `<h3 style="margin:0 0 8px;">${T('حذف المتدرب', 'Delete trainee')}: ${name}</h3>`;
    const subsHtml = subs.length
      ? `<div style="margin:6px 0;">${T(`عنده ${subs.length} طلب اشتراك:`, `${subs.length} subscription request(s):`)}</div>${subs.map(subLine).join('')}`
      : `<div style="margin:6px 0;color:#6c747d;">${T('ملوش طلبات اشتراك.', 'No subscription requests.')}</div>`;

    function choose(){
      render(m, head + subsHtml + `<div style="margin-top:10px;color:#4a5059;">${T('اختار نوع الحذف:', 'Choose how to delete:')}</div>`, [
        [T('❌ إلغاء', '❌ Cancel'), '', () => m.close()],
        [T('🗑️ حذف الحساب والبيانات بالكامل', '🗑️ Delete account and all data'), 'danger', () => full(0, [])],
        [T('👤 حذف الحساب بس', '👤 Delete account only'), 'primary', accountOnly]
      ]);
    }
    function accountOnly(){
      render(m, head + `<p>${T('هيتمسح الحساب: البيانات الشخصية والتقدم في البرامج.', 'The account will be deleted: personal details and progress in programs.')}</p>`
        + (subs.length ? `<p style="color:#1f7a4a;">${T(`طلبات الاشتراك (${subs.length}) هتفضل محفوظة. لو سجّل تاني من نفس الجهاز، اشتراكاته هترجعله.`, `The ${subs.length} subscription request(s) will be kept. If they register again on the same device, their subscriptions come back.`)}</p>` : ''), [
        [T('رجوع', 'Back'), '', choose],
        [T('تأكيد حذف الحساب', 'Confirm delete account'), 'danger', () => run([], T('اتمسح الحساب. طلبات الاشتراك محفوظة.', 'Account deleted. Subscription requests kept.'))]
      ]);
    }
    // بنسأل على كل اشتراك لوحده
    function full(i, del){
      if(i >= subs.length) return summary(del);
      const s = subs[i];
      render(m, head + `<div style="margin:6px 0;color:#6c747d;">${T(`الاشتراك ${i + 1} من ${subs.length}`, `Subscription ${i + 1} of ${subs.length}`)}</div>` + subLine(s)
        + `<p>${T('تحذف بيانات الاشتراك ده نهائيًا؟ (الطلب وصورة الإيصال)', 'Permanently delete this subscription’s data? (request and receipt image)')}</p>`, [
        [T('إلغاء', 'Cancel'), '', () => m.close()],
        [T('لا، سيبه', 'No, keep it'), 'primary', () => full(i + 1, del)],
        [T('نعم، احذفه', 'Yes, delete it'), 'danger', () => full(i + 1, del.concat([s.rid]))]
      ]);
    }
    function summary(del){
      const gone = subs.filter(s => del.includes(s.rid)), kept = subs.filter(s => !del.includes(s.rid));
      let html = head + `<div style="background:#fbebeb;border-radius:8px;padding:8px 10px;margin:6px 0;"><b>${T('هيتمسح نهائيًا:', 'Will be permanently deleted:')}</b><div>• ${T('الحساب (البيانات الشخصية والتقدم)', 'The account (personal details and progress)')}</div>${gone.map(s => `<div>• ${T('اشتراك', 'Subscription')} ${esc(s.program)}</div>`).join('')}</div>`;
      if(kept.length) html += `<div style="background:#eaf6ef;border-radius:8px;padding:8px 10px;margin:6px 0;"><b>${T('هيفضل:', 'Will be kept:')}</b>${kept.map(s => `<div>• ${T('اشتراك', 'Subscription')} ${esc(s.program)}</div>`).join('')}</div>`;
      html += `<p style="color:#b3261e;">${T('المسح ده ما يرجعش.', 'This cannot be undone.')}</p>`;
      render(m, html, [
        [T('إلغاء', 'Cancel'), '', () => m.close()],
        [T('رجوع', 'Back'), '', choose],
        [T('تأكيد الحذف النهائي', 'Confirm permanent delete'), 'danger', () => run(del, T(`اتمسح الحساب و${gone.length} اشتراك.`, `Account and ${gone.length} subscription(s) deleted.`))]
      ]);
    }
    async function run(rids, okMsg){
      m.ov.dataset.busy = '1';
      render(m, head + `<p>${T('جاري الحذف…', 'Deleting…')}</p>`, []);
      try{
        await window.__stceTraineeDelete(tid, rids, true);
        delete m.ov.dataset.busy;
        render(m, head + `<p style="color:#1f7a4a;">✓ ${okMsg}</p>`, [[T('تمام', 'OK'), 'primary', () => m.close()]]);
      }catch(e){
        console.error('trainee delete failed', e);
        delete m.ov.dataset.busy;
        const msg = (e && e.message === 'request_delete_failed')
          ? T(`ماقدرناش نمسح طلبات الاشتراك (اتمسح ${e.done || 0} منهم). الحساب ما اتمسحش. غالبًا قواعد الأمان في Firebase مش سامحة بمسح الطلبات.`, `Could not delete the subscription requests (${e.done || 0} deleted). The account was NOT deleted. Firebase security rules probably do not allow deleting requests.`)
          : T('حصلت مشكلة في الحذف. جرّب تاني.', 'Delete failed. Please try again.');
        render(m, head + `<p style="color:#b3261e;">${msg}</p>`, [[T('قفل', 'Close'), '', () => m.close()]]);
      }
    }
    choose();
  }

  /* ---------- الطلبات اليتيمة ---------- */
  function openOrphans(){
    const list = window.__stceOrphanRequests && window.__stceOrphanRequests();
    const m = modal();
    const head = `<h3 style="margin:0 0 8px;">${T('طلبات اشتراك من غير حساب', 'Requests without an account')}</h3>`;
    if(list === null || list === undefined){ render(m, head + `<p>${T('قايمة المتدربين لسه ما اتحملتش. افتح شاشة المتدربين وجرّب تاني.', 'The trainee list is not loaded yet. Open the trainees screen and try again.')}</p>`, [[T('قفل', 'Close'), '', () => m.close()]]); return; }
    if(!list.length){ render(m, head + `<p style="color:#1f7a4a;">${T('مفيش طلبات من غير حساب ✓', 'No orphan requests ✓')}</p>`, [[T('قفل', 'Close'), '', () => m.close()]]); return; }
    const html = head + `<p style="color:#4a5059;">${T('دي طلبات لحسابات اتمسحت قبل كده. لو صاحبها سجّل تاني من نفس الجهاز، الطلب بيرجعله.', 'These belong to deleted accounts. If the owner registers again on the same device, the request returns to them.')}</p>`
      + list.map(r => `<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid #e3e8ef;border-radius:8px;margin:4px 0;"><div style="flex:1;"><b>${esc(r.name || T('بدون اسم', 'No name'))}</b> — ${esc(r.program)} — ${ST(r.status)}${r.submittedAt ? ` <span style="color:#6c747d;">(${DT(r.submittedAt)})</span>` : ''}</div><button type="button" class="btn btn-ghost" data-rid="${esc(r.rid)}" style="margin:0;">🗑️</button></div>`).join('');
    render(m, html, [
      [T('قفل', 'Close'), '', () => m.close()],
      [T(`🗑️ حذف الكل (${list.length})`, `🗑️ Delete all (${list.length})`), 'danger', () => del(list.map(r => r.rid), T(`هيتمسح ${list.length} طلب نهائيًا بصور الإيصالات. متأكد؟`, `Permanently delete ${list.length} request(s) with receipt images?`))]
    ]);
    m.box.querySelectorAll('button[data-rid]').forEach(b => b.addEventListener('click', () => { const r = list.find(x => x.rid === b.dataset.rid); del([b.dataset.rid], T(`هيتمسح طلب «${r.name}» في ${r.program} نهائيًا. متأكد؟`, `Permanently delete ${r.name}'s request for ${r.program}?`)); }));
    async function del(rids, q){
      if(!confirm(q)) return;
      m.ov.dataset.busy = '1';
      try{ await window.__stceDeleteRequests(rids); delete m.ov.dataset.busy; refreshBtn(); openOrphans(); }
      catch(e){ console.error(e); delete m.ov.dataset.busy; alert(T(`ماقدرناش نمسح كل الطلبات (اتمسح ${e.done || 0}). غالبًا قواعد الأمان مش سامحة بالمسح.`, `Could not delete all requests (${e.done || 0} deleted). Security rules probably block deletion.`)); refreshBtn(); openOrphans(); }
    }
  }
  function refreshBtn(){
    const b = document.getElementById('stceOrphanBtn'); if(!b) return;
    const list = window.__stceOrphanRequests && window.__stceOrphanRequests();
    b.textContent = T('🧾 طلبات من غير حساب', '🧾 Requests without account') + (list && list.length ? ` (${list.length})` : '');
  }
  function mountOrphanBtn(){
    const exp = document.getElementById('exportTraineesCsvBtn');
    if(!exp || document.getElementById('stceOrphanBtn')) return;
    const b = document.createElement('button'); b.id = 'stceOrphanBtn'; b.type = 'button'; b.className = 'btn btn-ghost'; b.style.marginInlineStart = '6px';
    exp.insertAdjacentElement('afterend', b); b.addEventListener('click', openOrphans); refreshBtn();
  }

  /* ---------- سبب الرفض (تسجيل أو اشتراك) ---------- */
  const REASONS = {
    reg: [T('صورة البطاقة مش واضحة', 'The ID image is not clear'), T('الرقم القومي مش مطابق للبطاقة', 'The national ID does not match the card'), T('الاسم مش مطابق للبطاقة', 'The name does not match the card'), T('البيانات ناقصة', 'Some details are missing')],
    sub: [T('المبلغ المدفوع أقل من سعر البرنامج', 'The amount paid is less than the program price'), T('التحويل مش على حساب المركز', 'The transfer was not made to the center’s account'), T('صورة الإيصال مش واضحة', 'The receipt image is not clear'), T('الإيصال مكرر أو قديم', 'The receipt is a duplicate or old')]
  };
  function askReason(kind, prefill){
    return new Promise(resolve => {
      const m = modal();
      const list = REASONS[kind] || REASONS.sub;
      m.box.innerHTML = `<h3 style="margin:0 0 8px;">${kind === 'reg' ? T('سبب رفض بيانات التسجيل', 'Reason for rejecting the registration') : T('سبب رفض طلب الاشتراك', 'Reason for rejecting the subscription')}</h3>
        <div style="color:#4a5059;margin-bottom:6px;">${T('اختار سبب أو أكتر، أو اكتب بنفسك. المتدرب هيشوف السبب ده.', 'Pick one or more reasons, or write your own. The trainee will see it.')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${list.map((r, i) => `<button type="button" class="btn btn-ghost" data-i="${i}" style="margin:0;font-size:13px;">${esc(r)}</button>`).join('')}</div>
        <textarea id="stceReasonTxt" rows="3" style="width:100%;margin-top:10px;font-family:inherit;" placeholder="${T('اكتب السبب هنا…', 'Write the reason here…')}">${esc(prefill || '')}</textarea>
        <div id="stceReasonMsg" style="color:#b3261e;min-height:1.2em;"></div>
        <div style="display:flex;justify-content:flex-end;flex-wrap:wrap;margin-top:8px;">${btn(T('إلغاء', 'Cancel'), '')}${btn(T('تأكيد الرفض', 'Confirm rejection'), 'danger')}</div>`;
      const ta = m.box.querySelector('#stceReasonTxt');
      m.box.querySelectorAll('button[data-i]').forEach(b => b.addEventListener('click', () => { const r = list[+b.dataset.i]; if(!ta.value.includes(r)) ta.value = ta.value.trim() ? ta.value.trim() + ' — ' + r : r; }));
      const [cancel, ok] = m.box.querySelectorAll(':scope > div:last-child > button');
      const done = v => { m.close(); resolve(v); };
      cancel.addEventListener('click', () => done(null));
      ok.addEventListener('click', () => { const v = ta.value.trim(); if(!v){ m.box.querySelector('#stceReasonMsg').textContent = T('اكتب أو اختار سبب الأول.', 'Choose or write a reason first.'); return; } done(v); });
      m.ov.addEventListener('click', e => { if(e.target === m.ov) resolve(null); });
    });
  }
  window.__stceAskReason = askReason;

  /* ---------- طلبات التسجيل الجديدة (شاشة المتدربين) ---------- */
  function renderRegPanel(){
    const exp = document.getElementById('exportTraineesCsvBtn');
    if(!exp || typeof window.__stceRegList !== 'function') return;
    const list = window.__stceRegList();
    let panel = document.getElementById('stceRegPanel');
    const sig = JSON.stringify((list || []).map(r => [r.id, r.status, r.reason, r.at]));
    if(panel && panel.dataset.sig === sig) return;
    if(!panel){ panel = document.createElement('div'); panel.id = 'stceRegPanel'; const anchor = exp.closest('.row') || exp.parentElement; anchor.parentElement.insertBefore(panel, anchor); }
    panel.dataset.sig = sig;
    if(!list || !list.length){ panel.innerHTML = ''; panel.style.display = 'none'; return; }
    panel.style.display = '';
    const pend = list.filter(r => r.status === 'pending').length;
    panel.innerHTML = `<div class="card" style="margin-bottom:12px;border:2px solid #e8b94a;">
      <h3 style="margin:0 0 8px;">🆕 ${T('طلبات تسجيل جديدة', 'New registrations')} (${pend} ${T('قيد المراجعة', 'pending')}${list.length - pend ? ` · ${list.length - pend} ${T('مرفوض', 'rejected')}` : ''})</h3>
      ${list.map(r => `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px;border:1px solid #e3e8ef;border-radius:10px;margin:6px 0;background:${r.status === 'rejected' ? '#fdf3f2' : '#fff'};">
        ${r.image ? `<img src="${r.image}" data-full="1" style="width:84px;height:56px;object-fit:cover;border-radius:6px;cursor:zoom-in;border:1px solid #ddd;">` : `<div style="width:84px;height:56px;border-radius:6px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#888;">${T('مفيش صورة', 'No image')}</div>`}
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;">${esc(r.name)} ${r.status === 'rejected' ? `<span class="badge rejected">${T('مرفوض', 'Rejected')}</span>` : `<span class="badge pending">${r.resubmitted ? T('اتعدّل واتبعت تاني', 'Resubmitted') : T('قيد المراجعة', 'Pending')}</span>`}</div>
          <div class="hint" style="margin:2px 0;">${esc(r.phone)}${r.nationalId ? ' · ' + esc(r.nationalId) : ''}${r.org ? ' · ' + esc(r.org) : ''}${r.at ? ' · ' + DT(r.at) : ''}</div>
          ${r.status === 'rejected' ? `<div class="hint" style="color:#b3261e;">${T('سبب الرفض:', 'Reason:')} ${esc(r.reason || '—')}</div>` : ''}
          <div style="margin-top:4px;">
            <button type="button" class="btn btn-primary" data-act="ok" data-id="${esc(r.id)}" style="margin:2px;">✅ ${T('قبول', 'Approve')}</button>
            ${r.status === 'pending' ? `<button type="button" class="btn btn-danger" data-act="no" data-id="${esc(r.id)}" style="margin:2px;">❌ ${T('رفض', 'Reject')}</button>` : `<button type="button" class="btn btn-ghost" data-act="del" data-id="${esc(r.id)}" style="margin:2px;">🗑️ ${T('حذف', 'Delete')}</button>`}
          </div></div></div>`).join('')}</div>`;
    panel.querySelectorAll('img[data-full]').forEach(im => im.addEventListener('click', () => { const w = window.open(); if(w) w.document.write(`<img src="${im.src}" style="max-width:100%">`); }));
    panel.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', async () => {
      const id = b.dataset.id, r = list.find(x => x.id === id); b.disabled = true;
      try{
        if(b.dataset.act === 'ok'){ await window.__stceRegDecide(id, 'approved', ''); }
        else if(b.dataset.act === 'no'){ const why = await askReason('reg', ''); if(why === null){ b.disabled = false; return; } await window.__stceRegDecide(id, 'rejected', why); }
        else if(b.dataset.act === 'del'){
          const info = window.__stceTraineeDeleteInfo && window.__stceTraineeDeleteInfo(id);
          const rids = info ? info.subs.map(s2 => s2.rid) : [];
          if(!confirm(T(`هيتمسح تسجيل «${r.name}» المرفوض نهائيًا (بياناته وصورة البطاقة${rids.length ? ` و${rids.length} طلب اشتراك` : ''}). تكمل؟`, `Permanently delete ${r.name}'s rejected registration (details, ID image${rids.length ? ` and ${rids.length} request(s)` : ''})?`))){ b.disabled = false; return; }
          await window.__stceTraineeDelete(id, rids, true);
        }
      }catch(e){ console.error(e); alert(T('حصلت مشكلة. جرّب تاني.', 'Something went wrong. Try again.')); b.disabled = false; }
    }));
  }

  window.__stceOpenTraineeDelete = openDelete;
  const tick = () => { mountOrphanBtn(); renderRegPanel(); };
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
  tick();
})();
