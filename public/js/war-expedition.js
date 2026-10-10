(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString('en-US');
  const labels={swordsman:'🗡 شمشیرزن',archer:'🏹 کماندار',spearman:'🔱 نیزه‌دار',cavalry:'🏇 سواره‌نظام',ranger:'🥷 رنجر',winter_soldier:'🐺 سرباز زمستان',vale_knight:'⚔️ شوالیه ویل',crossbowman:'🏹 کراسبو‌دار',red_cloak:'🩸 ردا سرخ',dragon_knight:'🐉 شوالیه اژدها',axeman:'🪓 تبر‌دار',flower_knight:'🏵 شوالیه گل',hammer_wielder:'🔨 پتک‌دار',dornish_spearman:'🔱 نیزه‌دار دورنیش',ladder:'🪜 نردبان',ram:'🔩 دژکوب',catapult:'☄ منجنیق',scorpion:'🦂 اسکورپین',siege_tower:'🏗 برج محاصره',transport:'🚢 کشتی ترابری',warship:'⚔️ کشتی جنگی'};
  const api=async(url,options={})=>{const h=new Headers(options.headers||{});if(options.body&&!h.has('Content-Type'))h.set('Content-Type','application/json');const r=await fetch(url,{cache:'no-store',...options,headers:h});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطایی رخ داد.');return d;};
  let houses=[],myCastles=[],assets=null,type='',fake=false,values={},fakeAvailable=false,lordPresent=true;

  function reset(){houses=[];myCastles=[];assets=null;type='';fake=false;values={};fakeAvailable=false;lordPresent=true;$('weTypeStep').classList.add('active');$('weFormStep').classList.remove('active');$('weConfirmStep').classList.remove('active');}
  function castlesOptions(selected='',navalOnly=false,exclude=''){
  return houses.map(r=>'<optgroup label="'+esc(r.icon+' '+r.region)+'">'+r.castles.filter(c=>(!navalOnly||c.naval)&&c.castle!==exclude).map(c=>'<option value="'+esc(c.castle)+'" '+(c.castle===selected?'selected':'')+'>'+esc(c.castle)+(c.naval?' ⚓':'')+'</option>').join('')+'</optgroup>').join('');
}
function sourceOptions(selected='',navalOnly=false){
  const rows=myCastles.filter(c=>!navalOnly||houses.some(r=>r.castles.some(x=>x.castle===c.castle&&x.naval)));
  return rows.map(c=>'<option value="'+esc(c.castle)+'" '+(c.castle===selected?'selected':'')+'>'+esc(c.castle)+(houses.some(r=>r.castles.some(x=>x.castle===c.castle&&x.naval))?' ⚓':'')+'</option>').join('');
}
async function changeSource(){
  const source=$('weSource')?.value||'';
  if(!source)return;
  try{
    assets=await api('/api/my-castle/assets?castle='+encodeURIComponent(source));
    if(type==='sea' && !houses.some(r=>r.castles.some(c=>c.castle===source&&c.naval))) type='land';
    renderForm();
  }catch(e){$('weFormStep').insertAdjacentHTML('afterbegin','<div class="we-error">❌ '+esc(e.message)+'</div>');}
}
  function assetRows(group,kind){return Object.entries(group||{}).map(([key,count])=>'<div class="we-asset"><div class="we-asset-head"><strong>'+esc(labels[key]||key)+'</strong><small>موجودی: '+fmt(count)+'</small></div><input type="number" min="0" max="'+Number(count||0)+'" value="0" data-kind="'+kind+'" data-key="'+esc(key)+'"></div>').join('');}
  function durationMinutes(){const h=Math.max(0,Math.floor(Number($('weDurationHours')?.value||0))),m=Math.max(0,Math.floor(Number($('weDurationMinutes')?.value||0)));return h*60+m;}
  function arrivalText(mins){if(!mins)return '';const d=new Date(Date.now()+mins*60000),now=new Date();const t=d.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});const start=new Date(now);start.setHours(0,0,0,0);const target=new Date(d);target.setHours(0,0,0,0);const days=Math.round((target-start)/86400000);const label=days===0?'امروز':days===1?'فردا':days>1?days+' روز دیگر':'گذشته';return '('+t+' · '+label+')';}
  function renderForm(){
    const source=assets?.castle||'',navalSource=houses.some(r=>r.castles.some(c=>c.castle===source&&c.naval));
    $('weFormStep').innerHTML='<h3>انتخاب نیرو و مسیر</h3><div class="we-note">مدت زمان مهم است؛ زمان رسیدن فقط برای نمایش محاسبه می‌شود. هنگام توقف بازی، زمان باقی‌مانده لشکرکشی‌ها ثابت می‌ماند.</div><div id="weFakeBox">'+(fakeAvailable?'<button id="weFake" class="we-btn">⚔️ لشکرکشی فیک این هفته</button><div class="we-note">فیک بدون کسر دارایی است و هر پلیر فقط یک بار در هفته می‌تواند آن را ثبت کند.</div>':'<div class="we-note">لشکرکشی فیک این هفته قبلاً استفاده شده است.</div>')+'</div><div class="we-fields"><div class="we-field"><label>مبدا</label><select id="weSource">'+sourceOptions(source,type==='sea')+'</select></div><div class="we-field"><label>مقصد</label><select id="weDestination"><option value="">انتخاب مقصد</option>'+castlesOptions('',type==='sea',source)+'</select></div></div><div class="we-assets">'+assetRows(assets?.army,'army')+assetRows(assets?.equipment,'equipment')+(type==='sea'?assetRows(assets?.fleet,'fleet'):'')+'</div><label class="we-check"><input id="weLordPresent" type="checkbox" '+(lordPresent?'checked':'')+'> لرد در لشکرکشی حضور دارد</label><div class="we-duration"><div class="we-field"><label>مدت سفر — ساعت</label><input id="weDurationHours" type="number" min="0" max="168" value="1"></div><div class="we-field"><label>دقیقه</label><input id="weDurationMinutes" type="number" min="0" max="59" value="0"></div></div><div id="weArrivalPreview" class="we-arrival-preview">زمان رسیدن: —</div><div class="we-actions"><button id="weBackType" class="we-btn">بازگشت</button><button id="weToConfirm" class="we-btn primary">ادامه و تأیید نهایی</button></div><div id="weError" class="we-error"></div>';
    $('weSource')?.addEventListener('change',changeSource);
    const updateArrival=()=>{$('weArrivalPreview').textContent='زمان رسیدن: '+(arrivalText(durationMinutes())||'—');};
    $('weDurationHours').oninput=updateArrival;$('weDurationMinutes').oninput=updateArrival;updateArrival();
    $('weFake')?.addEventListener('click',()=>{fake=!fake;$('weFake').textContent=fake?'✓ لشکرکشی فیک انتخاب شد':'⚔️ لشکرکشی فیک این هفته';document.querySelectorAll('#weFormStep input[data-kind]').forEach(x=>{x.disabled=fake;x.value='0';});});
    $('weLordPresent').onchange=()=>lordPresent=$('weLordPresent').checked;
    $('weBackType').onclick=()=>{$('weFormStep').classList.remove('active');$('weTypeStep').classList.add('active');};
    $('weToConfirm').onclick=toConfirm;
    if(type==='sea'&&!navalSource)$('weError').textContent='این قلعه بندر ندارد.';
  }
  function collect(){const out={};document.querySelectorAll('#weFormStep input[data-kind]').forEach(x=>{const n=Math.floor(Number(x.value||0));if(n>0){out[x.dataset.kind]??={};out[x.dataset.kind][x.dataset.key]=n;}});return out;}
  function toConfirm(){
    const err=$('weError');err.textContent='';const source=$('weSource').value,destination=$('weDestination').value,duration=durationMinutes();
    if(!source||!destination||!duration){err.textContent='مبدا، مقصد و مدت سفر را کامل کن.';return;}
    if(duration>10080){err.textContent='مدت سفر نمی‌تواند بیشتر از 7 روز باشد.';return;}
    if(!fake){
      values=collect();
      const total=Object.values(values).flatMap(x=>Object.values(x)).reduce((a,b)=>a+b,0);
      if(!total){err.textContent='برای لشکرکشی واقعی حداقل یک نیرو، ادوات یا کشتی انتخاب کن.';return;}
    }else values={};
    if(type==='sea'){
      const src=houses.some(r=>r.castles.some(c=>c.castle===source&&c.naval)),dst=houses.some(r=>r.castles.some(c=>c.castle===destination&&c.naval));
      if(!src||!dst){err.textContent='لشکرکشی دریایی فقط بین قلعه‌های دریایی امکان‌پذیر است.';return;}
      const fleet=values.fleet||{},transport=Math.floor(Number(fleet.transport||0)),warship=Math.floor(Number(fleet.warship||0));
      const capacity=transport*600+warship*400;
      const army=values.army||{};
      const required=Object.entries(army).reduce((sum,[key,n])=>sum+(key==='cavalry'?2:1)*Math.floor(Number(n)||0),0);
      if(transport+warship<1){err.textContent='لشکرکشی دریایی حداقل به یک کشتی نیاز دارد.';return;}
      if(required>capacity){err.textContent='ظرفیت ناوگان کافی نیست. ظرفیت '+capacity+' و ظرفیت موردنیاز نیروها '+required+' است.';return;}
    }
    $('weConfirmStep').innerHTML='<h3>نظر نهایی؟</h3><div class="we-summary"><div>نوع: <b>'+esc(type==='land'?'زمینی':'دریایی')+'</b></div><div>مبدا: <b>'+esc(source)+'</b></div><div>مقصد: <b>'+esc(destination)+'</b></div><div>مدت سفر: <b>'+esc(Math.floor(duration/60)+' ساعت و '+(duration%60)+' دقیقه')+'</b></div><div>زمان رسیدن تقریبی: <b>'+esc(arrivalText(duration))+'</b></div><div>لرد: <b>'+esc(lordPresent?'حاضر':'غایب')+'</b></div><div>دارایی: <b>'+(fake?'لشکرکشی فیک — بدون کسر دارایی':esc(Object.entries(values).flatMap(([kind,obj])=>Object.entries(obj).map(([k,n])=>(labels[k]||k)+' × '+fmt(n))).join(' · ')))+'</b></div></div><div class="we-actions"><button id="weFinalNo" class="we-btn negative">منفی — لغو</button><button id="weFinalYes" class="we-btn positive">مثبت — انجام لشکرکشی</button></div><div id="weConfirmError" class="we-error"></div>';
    $('weFormStep').classList.remove('active');$('weConfirmStep').classList.add('active');$('weFinalNo').onclick=()=>{$('weConfirmStep').classList.remove('active');$('weFormStep').classList.add('active');};$('weFinalYes').onclick=submit;
  }
  async function submit(){const b=$('weFinalYes');b.disabled=true;$('weConfirmError').textContent='';try{const duration=durationMinutes(),arrival=new Date(Date.now()+duration*60000),hh=String(arrival.getHours()).padStart(2,'0'),mm=String(arrival.getMinutes()).padStart(2,'0');await api('/api/war-expeditions',{method:'POST',body:JSON.stringify({type,source:$('weSource').value,destination:$('weDestination').value,durationMinutes:duration,arrivalTime:hh+':'+mm,lordPresent,fake,assets:values})});close();await loadWarLog();await window.khataRefreshMyCastles?.();alert('لشکرکشی با موفقیت ثبت شد.');}catch(e){$('weConfirmError').textContent=e.message;b.disabled=false;}}
  function formatTehranDateTime(value){
    const ms=Date.parse(value||'');
    if(!Number.isFinite(ms))return '—';
    return new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));
  }
  function scenarioState(label,done){return '<span class="we-scenario-state">'+esc(label)+' '+(done?'✓ ارسال شد':'⏳ منتظر ارسال')+'</span>';}
  async function loadWarList(){
    const root=$('warListRoot');if(!root)return;
    try{
      const d=await api('/api/war-list'),wars=d.wars||[];root.innerHTML=(wars.length?wars.map(x=>{
        const deadline=x.scenarioDeadlineAt?formatTehranDateTime(x.scenarioDeadlineAt):'—';
        const status=x.outcome?(x.outcome==='attacker'?'🏆 نتیجه: پیروزی مهاجم':'🛡️ نتیجه: پیروزی مدافع'):'⚔️ نبرد در جریان';
        return '<article class="we-war-card"><div class="we-war-card-head"><div><span class="we-war-kicker">WAR #'+esc(x.id)+'</span><h3>⚔️ '+esc(x.sourceCastle)+' → '+esc(x.destinationCastle)+'</h3></div><strong>'+status+'</strong></div><div class="we-war-sides"><div class="we-war-side attacker"><span>مهاجم</span><b>'+esc(x.attackerUsername||'—')+'</b><small>لرد: '+esc(x.lordName||'—')+'</small><small>Player ID: '+esc(x.attackerAccountId||'—')+'</small><small>قلعه: '+esc(x.sourceCastle)+'</small></div><div class="we-war-side defender"><span>مدافع</span><b>'+esc(x.defenderUsername||'بدون لرد')+'</b><small>لرد: '+esc(x.defenderLordName||'—')+'</small><small>Player ID: '+esc(x.defenderAccountId||'—')+'</small><small>قلعه: '+esc(x.destinationCastle)+'</small></div></div><div class="we-war-deadline"><strong>⏳ مهلت ارسال سناریو</strong><span>'+esc(deadline)+' · ساعت ۱۵:۰۰ روز بعد از ثبت حمله</span></div><div class="we-war-scenarios">'+scenarioState('سناریوی مهاجم:',!!x.attackerScenarioSubmitted)+scenarioState('سناریوی مدافع:',!!x.defenderScenarioSubmitted)+'</div><small class="we-war-meta">ثبت دستور: '+esc(formatTehranDateTime(x.commandAt||x.createdAt))+'</small></article>';
      }).join(''):'<div class="war-log-empty">هنوز دستوری با عنوان «حمله» ثبت نشده است.</div>');
    }catch(e){root.innerHTML='<div class="war-log-empty">'+esc(e.message||'لیست جنگ دریافت نشد.')+'</div>';}
  }
  async function loadWarLog(){
    const d=await api('/api/war-logs');const root=$('warLogList');if(!root)return;const announcements=d.gameAnnouncements||[];const announcementHtml=announcements.map(a=>'<article class="we-announcement-banner"><strong>⚔️ اطلاعیه رسمی بازی ⚔️</strong><div class="we-announcement-text">'+esc(a.body||a.title)+'</div><small>⚔ ثبت‌شده در '+esc(formatTehranDateTime(a.createdAt))+' ⚔</small></article>').join('');
    let arrivals=[],transfers=[];try{const [a,t]=await Promise.all([api('/api/my-war-expeditions/active'),api('/api/my-troop-transfers')]);arrivals=(a.expeditions||[]).filter(x=>x.arrived&&!x.cancelled&&(!x.command||(x.command==='deploy'&&(!x.arrivalChoice||x.arrivalChoice==='deploy'))));transfers=t.requests||[];}catch{}
    const arrivalHtml=arrivals.length?'<section class="we-arrival-actions"><h3>🏰 لشکرهای رسیده</h3>'+arrivals.map(x=>'<article class="we-log-banner"><strong>'+esc(x.sourceCastle)+' → '+esc(x.destinationCastle)+'</strong><div>'+(x.arrivalChoice==='deploy'?'استقرار انتخاب شده؛ حالا وضعیت ارتش را مشخص کن.':'لشکر به مقصد رسیده؛ دستور بعدی را انتخاب کن.')+'</div><div class="we-actions">'+(x.arrivalChoice==='deploy'?'<button class="we-btn" data-arrival-choice="garrison" data-war-id="'+esc(x.id)+'">استقرار</button><button class="we-btn" data-arrival-choice="alliance" data-war-id="'+esc(x.id)+'">اتحاد</button><button class="we-btn" data-arrival-choice="transfer" data-war-id="'+esc(x.id)+'">انتقال مالکیت</button>':(x.command?'<span>دستور '+esc(x.command==='siege'?'محاصره':'حمله')+' ثبت شده است.</span>':'<button class="we-btn" data-war-command="siege" data-war-id="'+esc(x.id)+'">محاصره</button><button class="we-btn" data-war-command="attack" data-war-id="'+esc(x.id)+'">حمله</button><button class="we-btn" data-war-command="deploy" data-war-id="'+esc(x.id)+'">استقرار</button>'))+'</div></article>').join('')+'</section>':'';
    const transferHtml=transfers.length?'<section class="we-arrival-actions"><h3>📨 درخواست‌های انتقال نیرو</h3>'+transfers.map(x=>'<article class="we-log-banner"><strong>'+esc(x.sourceCastle)+' → '+esc(x.destinationCastle)+'</strong><div>مالک ارتش درخواست انتقال نیرو داده است. با پذیرش، نیروها به موجودی قلعه مقصد اضافه می‌شوند.</div><div class="we-actions"><button class="we-btn positive" data-transfer-response="accept" data-war-id="'+esc(x.warId)+'">تأیید انتقال</button><button class="we-btn negative" data-transfer-response="reject" data-war-id="'+esc(x.warId)+'">رد درخواست</button></div></article>').join('')+'</section>':'';

    root.innerHTML=arrivalHtml+transferHtml+announcementHtml+(d.logs?.length?d.logs.map(x=>{
      const siege=x.command==='siege',attack=x.command==='attack';
      const title=siege?'🏰 '+esc(x.attackerUsername)+' از '+esc(x.sourceCastle)+'، '+esc(x.destinationCastle)+' را محاصره کرد.':attack?'⚔️ '+esc(x.attackerUsername)+' از '+esc(x.sourceCastle)+'، '+esc(x.destinationCastle)+' را مورد حمله قرار داد.':'⚔️ '+esc(x.attackerUsername)+' از '+esc(x.sourceCastle)+' به '+esc(x.destinationCastle)+' لشکر کشید.';
      return '<article class="we-log-banner '+(Number(x.cancelled)?'cancelled':'')+'"><strong>'+title+'</strong><div>لرد مهاجم: '+esc(x.lordName||'—')+' · لرد مدافع: '+esc(x.defenderLordName||'—')+(x.outcome?' · نتیجه: '+(x.outcome==='attacker'?'پیروزی مهاجم':'پیروزی مدافع'):'')+(Number(x.cancelled)?' · <b class="we-cancelled-mark">✓ لغو شده</b>':'')+'</div><small>'+esc(x.type==='sea'?'دریایی':'زمینی')+' · ثبت دستور '+esc(formatTehranDateTime(x.commandAt||x.createdAt))+'</small></article>';
    }).join(''):'<div class="war-log-empty">هنوز لاگ جنگی ثبت نشده است.</div>');
  }
  async function open(sourceCastle){ $('warExpeditionModal').classList.remove('hidden');document.body.classList.add('modal-open');reset();try{[assets,houses,myCastles]=await Promise.all([api('/api/my-castle/assets?castle='+encodeURIComponent(sourceCastle||'')),api('/api/houses'),api('/api/my-castles')]);const st=await api('/api/war-expeditions/status');fakeAvailable=!!st.fakeAvailable;$('weTypeStep').innerHTML='<h3>لشکرکشی شما زمینی است یا دریایی؟</h3><div class="we-types"><button class="we-type" data-we-type="land">⚔️ لشکرکشی زمینی</button><button class="we-type" data-we-type="sea" '+(assets&&houses.some(r=>r.castles.some(c=>c.castle===assets.castle&&c.naval))?'':'disabled')+'>⚓ لشکرکشی دریایی</button></div><div class="we-note">'+(st.gameRunning?'بازی فعال است.':'بازی متوقف است.')+'</div>';document.querySelectorAll('[data-we-type]').forEach(b=>b.onclick=()=>{type=b.dataset.weType;renderForm();$('weTypeStep').classList.remove('active');$('weFormStep').classList.add('active');});}catch(e){$('weTypeStep').innerHTML='<div class="we-error">❌ '+esc(e.message)+'</div>';}}
  function close(){$('warExpeditionModal').classList.add('hidden');document.body.classList.remove('modal-open');}
  document.addEventListener('click',e=>{if(e.target.id==='warExpeditionModal'||e.target.id==='weClose')close();});
  $('weClose')?.addEventListener('click',close);
  document.addEventListener('click',async e=>{
    const choice=e.target.closest('[data-arrival-choice]'),response=e.target.closest('[data-transfer-response]'),command=e.target.closest('[data-war-command]');
    if(!choice&&!response&&!command)return;
    const button=choice||response||command,warId=button.dataset.warId;button.disabled=true;
    try{
      if(command){
        await api('/api/war-expeditions/'+encodeURIComponent(warId)+'/command',{method:'POST',body:JSON.stringify({command:command.dataset.warCommand})});
      } else {
        const selected=choice.dataset.arrivalChoice;
        const payload={choice:selected==='garrison'?'deploy':selected};
        await api('/api/war-expeditions/'+encodeURIComponent(warId)+'/arrival-choice',{method:'POST',body:JSON.stringify(payload)});
      }
      await loadWarLog();
      alert(command?'دستور لشکرکشی ثبت شد.':(choice?'گزینه ثبت شد.':(response.dataset.transferResponse==='accept'?'انتقال نیرو پذیرفته شد.':'درخواست انتقال رد شد.')));
    }catch(err){alert(err.message);button.disabled=false;}
  });

  window.khataOpenWarExpedition=open;window.khataLoadWarLog=loadWarLog;window.khataLoadWarList=loadWarList;document.addEventListener('DOMContentLoaded',loadWarLog);
})();