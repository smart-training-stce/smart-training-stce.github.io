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
  window.__stceOpenTraineeDelete = openDelete;
  new MutationObserver(mountOrphanBtn).observe(document.documentElement, { childList: true, subtree: true });
  mountOrphanBtn();
})();
