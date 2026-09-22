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
  function timeOptions(){
    const hours=Array.from({length:12},(_,i)=>'<option value="'+String(i+1).padStart(2,'0')+'">'+String(i+1).padStart(2,'0')+'</option>').join('');
    const mins=Array.from({length:60},(_,i)=>'<option value="'+String(i).padStart(2,'0')+'">'+String(i).padStart(2,'0')+'</option>').join('');
    return '<div class="we-time-picker"><select id="weHour" aria-label="ساعت">'+hours+'</select><span>:</span><select id="weMinute" aria-label="دقیقه">'+mins+'</select><select id="weAmPm" aria-label="صبح یا عصر"><option value="AM">AM</option><option value="PM">PM</option></select></div>';
  }
  function getArrivalTime(){
    const hour=Number($('weHour')?.value), minute=$('weMinute')?.value, ampm=$('weAmPm')?.value;
    if(!hour || !minute || !ampm) return '';
    let h=hour%12;
    if(ampm==='PM') h+=12;
    return String(h).padStart(2,'0')+':'+minute;
  }
  function renderForm(){
    const source=assets?.castle||'';
    $('weFormStep').innerHTML='<h3>انتخاب نیرو و مسیر</h3><div class="we-note">مقدار هر نیرو/ادوات/کشتی را وارد کن. در تأیید نهایی، دقیقاً همان مقدار از دارایی قلعه کم می‌شود.</div><div id="weFakeBox">'+(fakeAvailable?'<button id="weFake" class="we-btn">⚔️ لشکرکشی فیک این هفته</button><div class="we-note">لشکرکشی فیک بدون کسر نیرو انجام می‌شود و هر پلیر فقط یک بار در هفته می‌تواند آن را انجام دهد.</div>':'<div class="we-note">لشکرکشی فیک این هفته قبلاً استفاده شده است.</div>')+'</div><div class="we-fields"><div class="we-field"><label>مبدا</label><select id="weSource">'+castlesOptions(source)+'</select></div><div class="we-field"><label>مقصد</label><select id="weDestination"><option value="">انتخاب مقصد</option>'+castlesOptions()+'</select></div></div><div class="we-assets">'+assetRows(assets?.army,'army')+assetRows(assets?.equipment,'equipment')+(type==='sea'?assetRows(assets?.fleet,'fleet'):'')+'</div><div class="we-field"><label>تایم رسیدن</label>'+timeOptions()+'</div><div class="we-actions"><button id="weBackType" class="we-btn">بازگشت</button><button id="weToConfirm" class="we-btn primary">ادامه و تأیید نهایی</button></div><div id="weError" class="we-error"></div>';
    $('weFake')?.addEventListener('click',()=>{fake=!fake;$('weFake').textContent=fake?'✓ لشکرکشی فیک انتخاب شد':'⚔️ لشکرکشی فیک این هفته';document.querySelectorAll('#weFormStep input[type=number]').forEach(x=>{x.disabled=fake;x.value='0';});});
    $('weBackType').onclick=()=>{$('weFormStep').classList.remove('active');$('weTypeStep').classList.add('active');};
    $('weToConfirm').onclick=toConfirm;
  }
  function collect(){
    const out={};document.querySelectorAll('#weFormStep input[data-kind]').forEach(x=>{const n=Math.floor(Number(x.value||0));if(n>0){out[x.dataset.kind]??={};out[x.dataset.kind][x.dataset.key]=n;}});return out;
  }
  function toConfirm(){
    const err=$('weError');err.textContent='';
    const destination=$('weDestination').value, arrival=getArrivalTime(), source=$('weSource').value;
    if(!source||!destination||!arrival){err.textContent='مبدا، مقصد و تایم رسیدن را کامل کن.';return;}
    if(!fake){values=collect();const total=Object.values(values).flatMap(x=>Object.values(x)).reduce((a,b)=>a+b,0);if(!total){err.textContent='برای لشکرکشی واقعی حداقل یک نیرو، ادوات یا کشتی انتخاب کن.';return;}}
    values=fake?{}:collect();
    const parts=[];for(const [kind,obj] of Object.entries(values))for(const [key,n] of Object.entries(obj))parts.push((labels[key]||key)+' × '+fmt(n));
    $('weConfirmStep').innerHTML='<h3>نظر نهایی؟</h3><div class="we-summary"><div>نوع: <b>'+esc(type==='land'?'زمینی':'دریایی')+'</b></div><div>مبدا: <b>'+esc(source)+'</b></div><div>مقصد: <b>'+esc(destination)+'</b></div><div>تایم رسیدن: <b>'+esc(arrival)+'</b></div><div>نیرو و تجهیزات: <b>'+(fake?'لشکرکشی فیک — بدون کسر دارایی':esc(parts.join(' · ')||'بدون مقدار'))+'</b></div></div><div class="we-actions"><button id="weFinalNo" class="we-btn negative">منفی — لغو</button><button id="weFinalYes" class="we-btn positive">مثبت — انجام لشکرکشی</button></div><div id="weConfirmError" class="we-error"></div>';
    $('weFormStep').classList.remove('active');$('weConfirmStep').classList.add('active');
    $('weFinalNo').onclick=()=>{$('weConfirmStep').classList.remove('active');$('weFormStep').classList.add('active');};
    $('weFinalYes').onclick=submit;
  }
  async function submit(){
    const b=$('weFinalYes');b.disabled=true;$('weConfirmError').textContent='';
    try{
      const result=await api('/api/war-expeditions',{method:'POST',body:JSON.stringify({type,source:$('weSource').value,destination:$('weDestination').value,arrivalTime:getArrivalTime(),fake,assets:values})});
      close();await loadWarLog();await window.khataRefreshMyCastles?.();alert('لشکرکشی با موفقیت ثبت شد.');
    }catch(e){$('weConfirmError').textContent=e.message;b.disabled=false;}
  }
  async function loadWarLog(){
    const d=await api('/api/war-logs');const root=$('warLogList');if(!root)return;
    root.innerHTML=d.logs?.length?d.logs.map(x=>'<article class="we-log-banner '+(Number(x.cancelled)?'cancelled':'')+'"><strong>⚔️ '+esc(x.attackerUsername)+' از '+esc(x.sourceCastle)+' به '+esc(x.destinationCastle)+' در ساعت '+esc(x.arrivalTime)+' خواهد رسید</strong><div>لرد: '+esc(x.lordName||'—')+(x.fake?' · لشکرکشی فیک':'')+(Number(x.cancelled)?' · <b class="we-cancelled-mark">✓ لغو شده</b>':'')+'</div><small>'+(x.type==='sea'?'دریایی':'زمینی')+'</small></article>').join(''):'<div class="war-log-empty">هنوز لشکرکشی‌ای ثبت نشده است.</div>';
  }
  async function open(){
    $('warExpeditionModal').classList.remove('hidden');document.body.classList.add('modal-open');reset();
    try{
      [assets,houses]=await Promise.all([api('/api/my-castle/assets'),api('/api/houses')]);
      const st=await api('/api/war-expeditions/status');fakeAvailable=!!st.fakeAvailable;
      $('weTypeStep').innerHTML='<h3>لشکرکشی شما زمینی است یا دریایی؟</h3><div class="we-types"><button class="we-type" data-we-type="land">⚔️ لشکرکشی زمینی</button><button class="we-type" data-we-type="sea">⚓ لشکرکشی دریایی</button></div><div class="we-note">در حال حاضر لشکرکشی دریایی برای همه قلعه‌ها فعال است.</div>';
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