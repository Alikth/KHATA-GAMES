(() => {
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const labels={peasants:'👥 رعیت',coins:'💰 سکه',wood:'🪵 چوب',stone:'🪨 سنگ',iron:'⛓ آهن',meat:'🥩 گوشت',fish:'🐟 ماهی',grain:'🌾 غلات',horses:'🐎 اسب',dragon_glass:'🌑 شیشه اژدها',wildfire:'🧪 وایلدفایر',tar:'🛢 قیر',grapes:'🍇 انگور'};
  const $=id=>document.getElementById(id);
  let currentData=null,pendingAction=null;
  async function api(url,options={}){const h=new Headers(options.headers||{});if(options.body&&!h.has('Content-Type'))h.set('Content-Type','application/json');const r=await fetch(url,{cache:'no-store',...options,headers:h});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطایی رخ داد.');return d;}
  const fmt=n=>Number(n||0).toLocaleString('en-US');
  const cost=c=>Object.entries(c||{}).map(x=>'<span>'+esc(labels[x[0]]||x[0])+': <b>'+fmt(x[1])+'</b></span>').join(' + ');
  const btn=(a,k,t,dis)=>'<button class="cm-upgrade" data-cm-action="'+a+'" data-cm-key="'+esc(k||'')+'" '+(dis?'disabled':'')+'>'+t+'</button>';
  function prod(k,d,special){var lv=Number(d.level||0),mx=Number(d.max||50),gain=(k==='farm'&&lv===1)?300:lv*Number(d.yield||0);return '<article class="cm-card"><div class="cm-card-head"><div><strong>'+esc(d.label)+'</strong><small>LEVEL '+lv+' / '+mx+'</small></div>'+(lv<mx?btn(special?'special-production':'production',k,'⬆ ارتقا'): '<span class="cm-max">MAX</span>')+'</div><div class="cm-card-meta"><span>بازده هفتگی: <b>'+fmt(gain)+'</b></span><span>هزینه هر سطح: '+cost(d.cost)+'</span></div></article>';}
  function camp(k,d,s){var lv=Number(d.level||0),mx=Number(d.max||(s?50:20));return '<article class="cm-card"><div class="cm-card-head"><div><strong>'+esc(d.label)+'</strong><small>LEVEL '+lv+' / '+mx+'</small></div>'+(lv<mx?btn(s?'special-camp':'camp',k,'⬆ ارتقا'):'<span class="cm-max">MAX</span>')+'</div><div class="cm-card-meta"><span>بازده هفتگی: <b>'+fmt(lv*Number(d.yield||0))+'</b></span><span>هزینه: '+cost(d.cost)+'</span></div></article>';}
  function render(d){currentData=d;var r=d.resources||{};var p='';Object.keys(d.production||{}).filter(k=>['farm','lumber','stone','iron','recreation','village','market','stable','slaughterhouse'].indexOf(k)>=0).forEach(k=>p+=prod(k,d.production[k]));var sp=d.specialProduction;if(sp)p+=prod(sp.key,sp,true);var camps='';Object.keys(d.camps||{}).forEach(k=>camps+=camp(k,d.camps[k],false));var sc='';Object.keys(d.specialCamps||{}).forEach(k=>sc+=camp(k,d.specialCamps[k],true));var eq='';var em={ladder:['🪜 نردبان',1,'70🪵','روزانه 10'],ram:['🔩 دژکوب',2,'500🪵 + 50⛓','روزانه 3'],catapult:['☄ منجنیق',3,'700🪵 + 75🪨','روزانه 3'],scorpion:['🦂 اسکورپین',4,'1200🪵 + 90⛓','روزانه 1'],siege_tower:['🏗 برج محاصره',5,'1500🪵 + 120🪨 + 120⛓','هفتگی 2']};Object.keys(d.equipment||{}).forEach(k=>{var x=em[k];eq+='<article class="cm-card"><div class="cm-card-head"><div><strong>'+x[0]+'</strong><small>تعداد: '+fmt(d.equipment[k])+'</small></div>'+btn('equipment',k,'ساخت',d.workshop.level<x[1])+'</div><div class="cm-card-meta"><span>هزینه ساخت: '+x[2]+'</span></div></article>';});var res='';Object.keys(labels).forEach(k=>res+='<div><span>'+labels[k]+'</span><b>'+fmt(r[k])+'</b></div>');var army='';Object.keys(d.army||{}).forEach(k=>army+='<span>'+esc(k)+': <b>'+fmt(d.army[k])+'</b></span>');var fleet='';Object.keys(d.fleet||{}).forEach(k=>fleet+='<span>'+esc(k)+': <b>'+fmt(d.fleet[k])+'</b></span>');$('castleManagementRoot').innerHTML='<div class="cm-header"><div><span class="cm-kicker">'+esc(d.region)+'</span><h2>🏰 '+esc(d.castle)+'</h2><p>هفته بازی: '+esc(d.gameWeek)+'</p></div><button id="cmClose" class="cm-close">×</button></div><div class="cm-week-note">⏱ همه بازدهی‌ها فقط در <b>آپدیت هفتگی بازی</b> اعمال می‌شوند؛ ارتقای امروز فوراً نیروی جدید اضافه نمی‌کند.</div><section class="cm-section"><h3>📜 لیست دارایی</h3><div class="cm-resources">'+res+'</div><div class="cm-army"><h4>⚔️ ارتش</h4>'+army+'</div><div class="cm-army"><h4>⚓ ناوگان</h4>'+fleet+'</div></section><section class="cm-section"><h3>🏗️ تولیدی‌ها</h3><div class="cm-grid">'+p+'</div></section><section class="cm-section"><h3>⛺ کمپ نظامی</h3><div class="cm-grid">'+camps+'</div><h4 class="cm-subtitle">کمپ‌های ویژه اقلیم</h4><div class="cm-grid">'+(sc||'<p class="cm-muted">برای این اقلیم کمپ ویژه تعریف نشده است.</p>')+'</div></section><section class="cm-section"><h3>🪜 ادوات</h3><div class="cm-workshop"><b>کارگاه ادوات: '+d.workshop.level+' / 5</b><span>هزینه ارتقا: 6000💰</span>'+btn('workshop','','⬆ ارتقا',d.workshop.level>=5)+'</div><div class="cm-grid">'+eq+'</div></section><section class="cm-section"><h3>⚓ اسکله</h3>'+(d.port.enabled?'<div class="cm-port"><b>سطح '+d.port.level+' / 15</b><span>تولید هفتگی: '+d.port.weeklyYieldPerShipType+' از هر نوع کشتی</span>'+btn('port','','⬆ ارتقا',d.port.level>=15)+'</div>':'<p class="cm-muted">این قلعه فعلاً بندری تعیین نشده است.</p>')+'</section><section class="cm-section"><h3>⚔️ لشکرکشی</h3><div id="cmWarCommands" class="cm-war-commands"><div class="cm-placeholder">در حال بررسی لشکرکشی‌های رسیده...</div></div></section>'+(d.specialItem?'<section class="cm-section"><h3>🎁 آیتم ویژه</h3><pre class="cm-item">'+esc(JSON.stringify(d.specialItem,null,2))+'</pre></section>':'');}
  async function load(castle){try{var d=await api('/api/my-castle/assets?castle='+encodeURIComponent(castle||''));render(d);await loadWarCommands(d.castle);}catch(e){$('castleManagementRoot').innerHTML='<div class="cm-error">❌ '+esc(e.message)+'</div>';}}
  async function loadWarCommands(castle){
    const root = $('cmWarCommands');
    if (!root) return;
    try {
      const active = await api('/api/my-war-expeditions/active');
      const mine = (active.expeditions || []).filter(x => x.sourceCastle === castle && x.active === true);
      const activeHtml = mine.map(x =>
        '<article class="cm-command-card cm-active-expedition">' +
          '<strong>⚔️ لشکرکشی در مسیر</strong>' +
          '<p>به ' + esc(x.destinationCastle) + ' · رسیدن ' + esc(x.arrivalTime) + '</p>' +
          '<small>' + esc(x.type === 'sea' ? 'دریایی' : 'زمینی') + ' · ' + (x.lordPresent ? 'لرد حاضر' : 'لرد غایب') + '</small>' +
          '<button class="cm-command-btn cancel" data-cm-cancel-war-id="' + esc(x.id) + '">لغو لشکرکشی</button>' +
        '</article>'
      ).join('');
      root.innerHTML = activeHtml || '<div class="cm-placeholder">لشکرکشی فعالی وجود ندارد.</div>';

      try {
        const arrived = await api('/api/my-war-expeditions/commands?castle=' + encodeURIComponent(castle));
        const incoming = arrived.commands || [];
        const arrivedHtml = incoming.length ? incoming.map(x =>
          '<article class="cm-command-card">' +
            '<strong>دستور خود را وارد کنید</strong>' +
            '<p>⚔️ ' + esc(x.attackerUsername) + ' از ' + esc(x.sourceCastle) + ' به ' + esc(x.destinationCastle) + ' رسیده است.</p>' +
            '<small>' + esc(x.type === 'sea' ? 'دریایی' : 'زمینی') + ' · ' + (x.lordPresent ? 'لرد حاضر' : 'لرد غایب') + '</small>' +
            '<div class="cm-command-actions">' +
              '<button class="cm-command-btn attack" data-cm-war-command="attack" data-cm-war-id="' + esc(x.id) + '">حمله</button>' +
              '<button class="cm-command-btn" data-cm-war-command="deploy" data-cm-war-id="' + esc(x.id) + '">استقرار</button>' +
              '<button class="cm-command-btn siege" data-cm-war-command="siege" data-cm-war-id="' + esc(x.id) + '">محاصره</button>' +
            '</div>' +
          '</article>'
        ).join('') : '';
        root.innerHTML = activeHtml + arrivedHtml;
        if (!activeHtml && !arrivedHtml) root.innerHTML = '<div class="cm-placeholder">لشکرکشی فعالی وجود ندارد.</div>';
      } catch (e) {
        // A problem with arrived-command data must not hide active expeditions.
        if (!activeHtml) root.innerHTML = '<div class="cm-error">❌ ' + esc(e.message) + '</div>';
      }
    } catch (e) {
      root.innerHTML = '<div class="cm-error">❌ ' + esc(e.message) + '</div>';
    }
  }
  function actionInfo(a,k){
    var d=currentData||{},def=null,label='',before=0,after=0,cost={};
    if(a==='production'){def=d.production?.[k];label=def?.label||k;before=Number(def?.level||0);after=before+1;cost=def?.cost||{};}
    else if(a==='camp'){def=d.camps?.[k];label=def?.label||k;before=Number(def?.level||0);after=before+1;cost=def?.cost||{};}
    else if(a==='special-camp'){def=d.specialCamps?.[k];label=def?.label||k;before=Number(def?.level||0);after=before+1;cost=def?.cost||{};}
    else if(a==='special-production'){def=d.specialProduction;label=def?.label||k;before=Number(def?.level||0);after=before+1;cost=def?.cost||{};}
    else if(a==='workshop'){label='🪜 کارگاه ادوات';before=Number(d.workshop?.level||0);after=before+1;cost={coins:6000};}
    else if(a==='port'){label='⚓ اسکله';before=Number(d.port?.level||0);after=before+1;cost={coins:1500,wood:1000};}
    else if(a==='equipment'){var names={ladder:['🪜 نردبان',{wood:70}],ram:['🔩 دژکوب',{wood:500,iron:50}],catapult:['☄ منجنیق',{wood:700,stone:75}],scorpion:['🦂 اسکورپین',{wood:1200,iron:90}],siege_tower:['🏗 برج محاصره',{wood:1500,stone:120,iron:120}]};var x=names[k]||[k,{}];label=x[0];before=Number(d.equipment?.[k]||0);after=before+1;cost=x[1];}
    return {label,before,after,cost};
  }
  function openUpgradeConfirm(a,k){
    var info=actionInfo(a,k);if(!info.label)return;
    pendingAction={a,k};
    var r=currentData?.resources||{},costRows=Object.entries(info.cost||{}).map(([key,val])=>'<div class="cm-confirm-row"><span>'+esc(labels[key]||key)+'</span><span>'+fmt(r[key])+' → <b>'+fmt(Math.max(0,Number(r[key]||0)-Number(val||0)))+'</b></span></div>').join('');
    $('castleManagementRoot').insertAdjacentHTML('beforeend','<div class="cm-confirm-overlay" id="cmConfirm"><div class="cm-confirm-card"><span class="cm-kicker">CONFIRM UPGRADE</span><h3>'+esc(info.label)+'</h3><div class="cm-confirm-level">'+(a==='equipment'?'تعداد':'سطح')+': <b>'+info.before+'</b> → <b>'+info.after+'</b></div><div class="cm-confirm-cost"><strong>دارایی مربوطه قبل و بعد از ارتقا</strong>'+costRows+'</div><div class="cm-confirm-actions"><button class="cm-confirm-ok" id="cmConfirmOk">تأیید</button><button class="cm-confirm-cancel" id="cmConfirmCancel">انصراف</button></div></div></div>');
    $('cmConfirmOk').onclick=()=>{var p=pendingAction;pendingAction=null;closeConfirm();action(p.a,p.k);};
    $('cmConfirmCancel').onclick=()=>{pendingAction=null;closeConfirm();};
  }
  function closeConfirm(){$('cmConfirm')?.remove();}
  async function action(a,k){var map={production:'/api/my-castle/production/upgrade',camp:'/api/my-castle/camp/upgrade','special-camp':'/api/my-castle/special-camp/upgrade','special-production':'/api/my-castle/special-production/upgrade',workshop:'/api/my-castle/workshop/upgrade',equipment:'/api/my-castle/equipment/build',port:'/api/my-castle/port/upgrade'};if(!map[a])return;try{await api(map[a],{method:'POST',body:JSON.stringify(Object.assign({castle:currentData?.castle||''},k?{key:k}:{}))});await load(currentData?.castle);}catch(e){alert(e.message);}}
  document.addEventListener('click',async e=>{
    var cancel=e.target.closest('[data-cm-cancel-war-id]');
    if(cancel){
      var id=cancel.dataset.cmCancelWarId;if(!id)return;
      if(!confirm('آیا از لغو این لشکرکشی مطمئن هستید؟\\nنیروها و ادوات به قلعه مبدا برمی‌گردند.'))return;
      cancel.disabled=true;cancel.textContent='در حال لغو...';
      try{await api('/api/war-expeditions/'+encodeURIComponent(id)+'/cancel',{method:'POST'});await load(currentData?.castle);alert('لشکرکشی لغو شد و نیروها و ادوات به قلعه مبدا برگشتند.');}
      catch(err){cancel.disabled=false;cancel.textContent='لغو لشکرکشی';alert(err.message);}
      return;
    }
    var command=e.target.closest('[data-cm-war-command]');
    if(command){
      var id=command.dataset.cmWarId,commandName=command.dataset.cmWarCommand;
      if(!id||!commandName)return;
      var card=command.closest('.cm-command-card'),buttons=card?card.querySelectorAll('[data-cm-war-command]'):[];
      buttons.forEach(x=>{x.disabled=true;});
      try{
        await api('/api/war-expeditions/'+encodeURIComponent(id)+'/command',{method:'POST',body:JSON.stringify({command:commandName})});
        await load(currentData?.castle);
        alert(commandName==='attack'?'دستور حمله ثبت شد.':commandName==='siege'?'دستور محاصره ثبت شد.':'دستور استقرار ثبت شد.');
      }catch(err){
        buttons.forEach(x=>{x.disabled=false;});
        alert(err.message);
      }
      return;
    }
    var b=e.target.closest('[data-cm-action]');if(b)openUpgradeConfirm(b.dataset.cmAction,b.dataset.cmKey);
    if(e.target.id==='cmClose'||e.target.id==='castleManagementModal'){$('castleManagementModal').classList.add('hidden');document.body.classList.remove('modal-open');}
  });
  window.khataOpenCastleManagement=async(castle)=>{$('castleManagementModal').classList.remove('hidden');document.body.classList.add('modal-open');await load(castle);};
})();