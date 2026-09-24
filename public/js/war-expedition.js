(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString('en-US');
  const labels={
    swordsman:'🗡 شمشیرزن',archer:'🏹 کماندار',spearman:'🔱 نیزه‌دار',cavalry:'🏇 سواره‌نظام',
    ranger:'🥷 رنجر',winter_soldier:'🐺 سرباز زمستان',vale_knight:'⚔️ شوالیه ویل',crossbowman:'🏹 کراسبو‌دار',
    red_cloak:'🩸 ردا سرخ',dragon_knight:'🐉 شوالیه اژدها',axeman:'🪓 تبر‌دار',flower_knight:'🏵 شوالیه گل',
    hammer_wielder:'🔨 پتک‌دار',dornish_spearman:'🔱 نیزه‌دار دورنیش',
    ladder:'🪜 نردبان',ram:'🔩 دژکوب',catapult:'☄ منجنیق',scorpion:'🦂 اسکورپین',siege_tower:'🏗 برج محاصره',
    transport:'🚢 کشتی ترابری',warship:'⚔️ کشتی جنگی'
  };
  const api=async(url,options={})=>{const h=new Headers(options.headers||{});if(options.body&&!h.has('Content-Type'))h.set('Content-Type','application/json');const r=await fetch(url,{cache:'no-store',...options,headers:h});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطایی رخ داد.');return d;};
  let houses=[], assets=null, type='', fake=false, values={}, fakeAvailable=false;

  function reset(){houses=[];assets=null;type='';fake=false;values={};fakeAvailable=false;$('weTypeStep').classList.add('active');$('weFormStep').classList.remove('active');$('weConfirmStep').classList.remove('active');}
  function castlesOptions(selected=''){
    return houses.map(r=>'<optgroup label="'+esc(r.icon+' '+r.region)+'">'+r.castles.map(c=>'<option value="'+esc(c.castle)+'" '+(c.castle===selected?'selected':'')+'>'+esc(c.castle)+' — '+esc(c.house)+'</option>').join('')+'</optgroup>').join('');
  }
  function assetRows(group,kind){
    return Object.entries(group||{}).map(([key,count])=>'<div class="we-asset"><div class="we-asset-head"><strong>'+esc(labels[key]||key)+'</strong><small>موجودی: '+fmt(count)+'</small></div><input type="number" min="0" max="'+Number(count||0)+'" value="0" data-kind="'+kind+'" data-key="'+esc(key)+'"></div>').join('');
  }
  function timeOptions(){return '<div class="we-time-picker"><input id="weDuration" type="number" min="1" max="10080" value="60" placeholder="مدت به دقیقه"><span>دقیقه</span></div>'; }
  function getDuration(){return Math.floor(Number($('weDuration')?.value||0));}
  function renderForm(){
    const source=assets?.castle||'';
    $('weFormStep').innerHTML='<h3>انتخاب نیرو و مسیر</h3><div class="we-note">مدت رسیدن را وارد کن؛ ساعت دقیق رسیدن فقط به‌صورت زمان تقریبی نمایش داده می‌شود.</div><label class="we-lord-presence"><input id="weLordPresent" type="checkbox"> حضور لرد در این لشکرکشی</label><div id="weFakeBox">'+(fakeAvailable?'<button id="weFake" class="we-btn">⚔️ لشکرکشی فیک این هفته</button><div class="we-note">لشکرکشی فیک بدون کسر نیرو انجام می‌شود و هر پلیر فقط یک بار در هفته می‌تواند آن را انجام دهد.</div>':'<div class="we-note">لشکرکشی فیک این هفته قبلاً استفاده شده است.</div>')+'</div><div class="we-fields"><div class="we-field"><label>مبدا</label><select id="weSource">'+castlesOptions(source)+'</select></div><div class="we-field"><label>مقصد</label><select id="weDestination"><option value="">انتخاب مقصد</option>'+castlesOptions()+'</select></div></div><div class="we-assets">'+assetRows(assets?.army,'army')+assetRows(assets?.equipment,'equipment')+(type==='sea'?assetRows(assets?.fleet,'fleet'):'')+'</div><div class="we-field"><label>مدت رسیدن</label>'+timeOptions()+'</div><div class="we-actions"><button id="weBackType" class="we-btn">بازگشت</button><button id="weToConfirm" class="we-btn primary">ادامه و تأیید نهایی</button></div><div id="weError" class="we-error"></div>';
    $('weFake')?.addEventListener('click',()=>{fake=!fake;$('weFake').textContent=fake?'✓ لشکرکشی فیک انتخاب شد':'⚔️ لشکرکشی فیک این هفته';document.querySelectorAll('#weFormStep input[type=number]').forEach(x=>{x.disabled=fake;x.value='0';});});
    $('weBackType').onclick=()=>{$('weFormStep').classList.remove('active');$('weTypeStep').classList.add('active');};
    $('weToConfirm').onclick=toConfirm;
  }
  function collect(){
    const out={};document.querySelectorAll('#weFormStep input[data-kind]').forEach(x=>{const n=Math.floor(Number(x.value||0));if(n>0){out[x.dataset.kind]??={};out[x.dataset.kind][x.dataset.key]=n;}});return out;
  }
  function toConfirm(){
    const err=$('weError');err.textContent='';
    const destination=$('weDestination').value, duration=getDuration(), source=$('weSource').value;
    if(!source||!destination||!duration){err.textContent='مبدا، مقصد و مدت رسیدن را کامل کن.';return;}
    if(!fake){values=collect();const total=Object.values(values).flatMap(x=>Object.values(x)).reduce((a,b)=>a+b,0);if(!total){err.textContent='برای لشکرکشی واقعی حداقل یک نیرو، ادوات یا کشتی انتخاب کن.';return;}}
    values=fake?{}:collect();
    const parts=[];for(const [kind,obj] of Object.entries(values))for(const [key,n] of Object.entries(obj))parts.push((labels[key]||key)+' × '+fmt(n));
    $('weConfirmStep').innerHTML='<h3>نظر نهایی؟</h3><div class="we-summary"><div>نوع: <b>'+esc(type==='land'?'زمینی':'دریایی')+'</b></div><div>مبدا: <b>'+esc(source)+'</b></div><div>مقصد: <b>'+esc(destination)+'</b></div><div>مدت رسیدن: <b>'+fmt(duration)+' دقیقه</b></div><div>نیرو و تجهیزات: <b>'+(fake?'لشکرکشی فیک — بدون کسر دارایی':esc(parts.join(' · ')||'بدون مقدار'))+'</b></div></div><div class="we-actions"><button id="weFinalNo" class="we-btn negative">منفی — لغو</button><button id="weFinalYes" class="we-btn positive">مثبت — انجام لشکرکشی</button></div><div id="weConfirmError" class="we-error"></div>';
    $('weFormStep').classList.remove('active');$('weConfirmStep').classList.add('active');
    $('weFinalNo').onclick=()=>{$('weConfirmStep').classList.remove('active');$('weFormStep').classList.add('active');};
    $('weFinalYes').onclick=submit;
  }
  async function submit(){
    const b=$('weFinalYes');b.disabled=true;$('weConfirmError').textContent='';
    try{
      const result=await api('/api/war-expeditions',{method:'POST',body:JSON.stringify({type,source:$('weSource').value,destination:$('weDestination').value,durationMinutes:getDuration(),lordPresent:!!$('weLordPresent')?.checked,fake,assets:values})});
      close();await loadWarLog();await window.khataRefreshMyCastles?.();alert('لشکرکشی با موفقیت ثبت شد.');
    }catch(e){$('weConfirmError').textContent=e.message;b.disabled=false;}
  }
  async function loadWarLog(){
    const d=await api('/api/war-logs');const root=$('warLogList');if(!root)return;
    root.innerHTML=d.logs?.length?d.logs.map(x=>'<article class="we-log-banner '+(Number(x.cancelled)?'cancelled':'')+'"><strong>⚔️ '+esc(x.attackerUsername)+' از '+esc(x.sourceCastle)+' به '+esc(x.destinationCastle)+' · '+fmt(Math.ceil(Number(x.remainingSeconds||0)/60))+' دقیقه باقی‌مانده</strong><div>لرد: '+(x.lordPresent?esc(x.lordName||'—'):'بدون حضور لرد')+(x.fake?' · لشکرکشی فیک':'')+(Number(x.cancelled)?' · <b class="we-cancelled-mark">✓ لغو شده</b>':'')+'</div><small>'+(x.type==='sea'?'دریایی':'زمینی')+'</small></article>').join(''):'<div class="war-log-empty">هنوز لشکرکشی‌ای ثبت نشده است.</div>';
  }
  async function open(){
    $('warExpeditionModal').classList.remove('hidden');document.body.classList.add('modal-open');reset();
    try{
      [assets,houses]=await Promise.all([api('/api/my-castle/assets'),api('/api/houses')]);
      const st=await api('/api/war-expeditions/status');fakeAvailable=!!st.fakeAvailable;
      $('weTypeStep').innerHTML='<h3>لشکرکشی شما زمینی است یا دریایی؟</h3><div class="we-types"><button class="we-type" data-we-type="land">⚔️ لشکرکشی زمینی</button><button class="we-type" data-we-type="sea">⚓ لشکرکشی دریایی</button></div><div class="we-note">لشکرکشی دریایی فقط برای قلعه‌های دارای اسکله فعال است.</div>';
      document.querySelectorAll('[data-we-type]').forEach(b=>b.onclick=()=>{type=b.dataset.weType;renderForm();$('weTypeStep').classList.remove('active');$('weFormStep').classList.add('active');});
    }catch(e){$('weTypeStep').innerHTML='<div class="we-error">❌ '+esc(e.message)+'</div>';}
  }
  function close(){ $('warExpeditionModal').classList.add('hidden');document.body.classList.remove('modal-open');}
  document.addEventListener('click',e=>{if(e.target.id==='warExpeditionModal'||e.target.id==='weClose')close();});
  $('weClose')?.addEventListener('click',close);
  window.khataOpenWarExpedition=open;
  window.khataLoadWarLog=loadWarLog;
  document.addEventListener('DOMContentLoaded',loadWarLog);
})();