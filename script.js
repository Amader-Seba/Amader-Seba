// ==================== কনফিগ ====================
const API_URL = 'https://script.google.com/macros/s/AKfycbx0ICSjhNfYhRgABFEDocJohx8KzT_3rylA0QV5u_KsCeY2SwADIFCnYB_slTN47alrGA/exec'; // এখানে বসান ডিপ্লয়মেন্ট URL
const NAGAD_NUMBER = '9856001145305185';

// ==================== স্ট্যাটিক সার্ভিস ডেফিনেশন (কার্ড ও ফর্ম) ====================
const serviceForms = {
  nid_number: {
    name: 'এনআইডি নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 300,
    fields: [
      {name:'নাম *', id:'name', required:true},
      {name:'এনআইডি নম্বর *', id:'nid', required:true},
      {name:'জন্ম তারিখ', id:'dob', type:'date'}
    ]
  },
  voter_slip: {
    name: 'ভোটার স্লিপ নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 350,
    fields: [
      {name:'নাম *', id:'name', required:true},
      {name:'ভোটার স্লিপ নম্বর *', id:'voter_slip', required:true},
      {name:'জন্ম তারিখ', id:'dob', type:'date'}
    ]
  },
  voter_number: {
    name: 'ভোটার নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 400,
    fields: [
      {name:'নাম *', id:'name', required:true},
      {name:'ভোটার নম্বর *', id:'voter_no', required:true},
      {name:'জন্ম তারিখ', id:'dob', type:'date'}
    ]
  },
  server_copy: {
    name: 'সার্ভার কপি', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 150,
    fields: [
      {name:'এনআইডি নম্বর *', id:'nid', required:true},
      {name:'জন্ম তারিখ *', id:'dob', type:'date', required:true}
    ]
  },
  smart_card: {
    name: 'স্মার্ট কার্ড', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 400,
    fields: [
      {name:'নাম *', id:'name', required:true},
      {name:'এনআইডি নম্বর *', id:'nid', required:true},
      {name:'জন্ম তারিখ', id:'dob', type:'date'}
    ]
  },
  bl_bio: {
    name: 'বাংলালিংক', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 600,
    fields: [{name:'নাম্বার *', id:'number', required:true}]
  },
  gp_bio: {
    name: 'গ্রামীণ', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 650,
    fields: [{name:'নাম্বার *', id:'number', required:true}]
  },
  robi_bio: {
    name: 'রবি/এয়ারটেল', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 700,
    fields: [{name:'নাম্বার *', id:'number', required:true}]
  },
  teletalk_bio: {
    name: 'টেলিটক', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 550,
    fields: [{name:'নাম্বার *', id:'number', required:true}]
  },
  sim_location: {
    name: 'সিম নাম্বার লোকেশন', icon: 'fa-map-marker-alt', parent: null, rate: 850,
    fields: [{name:'নাম্বার *', id:'number', required:true}]
  },
  lost_id: {
    name: 'হারানো আইডি কার্ড', icon: 'fa-search', parent: null, rate: 2000,
    fields: [
      {name:'নাম *', id:'name', required:true}, {name:'পিতার নাম *', id:'father', required:true},
      {name:'মাতার নাম *', id:'mother', required:true}, {name:'জন্ম নিবন্ধন নাম্বার', id:'birth_reg_no'},
      {name:'বিভাগের নাম *', id:'division', required:true}, {name:'জেলার নাম *', id:'district', required:true},
      {name:'উপজেলার নাম *', id:'upazila', required:true}, {name:'ইউনিয়নের নাম *', id:'union', required:true},
      {name:'ওয়ার্ড নম্বর *', id:'ward', required:true}, {name:'গ্রামের নাম *', id:'village', required:true}
    ]
  },
  nid_to_sim: {
    name: 'এনআইডি টু সকল সিম', icon: 'fa-link', parent: null, rate: 900,
    fields: [{name:'এনআইডি নাম্বার *', id:'nid', required:true}]
  },
  lost_etin: {
    name: 'হারানো ই-টিন', icon: 'fa-file-invoice', parent: null, rate: 200,
    fields: [{name:'NID/e-TIN/Passport/Mobile *', id:'identifier', required:true}]
  },
  imei_active: {
    name: 'IMEI To Active Number', icon: 'fa-mobile-alt', parent: null, rate: 900,
    fields: [
      {name:'IMEI 1 *', id:'imei1', required:true}, {name:'IMEI 2', id:'imei2'},
      {name:'হারানোর তারিখ *', id:'lost_date', type:'date', required:true},
      {name:'সর্বশেষ ব্যবহৃত মোবাইল নং *', id:'last_number', required:true}
    ]
  },
  lost_nid_form_nid: {
    name: 'হারানো এনআইডি (এনআইডি)', icon: 'fa-file-alt', parent: 'হারানো এনআইডি আবেদন ফরম', rate: 500,
    fields: [
      {name:'এনআইডি নম্বর *', id:'nid', required:true},
      {name:'জন্ম তারিখ *', id:'dob', type:'date', required:true}
    ]
  },
  lost_nid_form_user: {
    name: 'হারানো এনআইডি (ইউজার)', icon: 'fa-file-alt', parent: 'হারানো এনআইডি আবেদন ফরম', rate: 300,
    fields: [
      {name:'ইউজার নেম *', id:'username', required:true},
      {name:'পাসওয়ার্ড *', id:'password', type:'password', required:true}
    ]
  },
  birth_normal: {
    name: 'নরমাল নিবন্ধন', icon: 'fa-baby', parent: 'নতুন জন্ম নিবন্ধন সার্ভিস', rate: 2400,
    fields: [
      {section:'ব্যক্তিগত তথ্য'},{name:'নাম (বাংলা) *', id:'name_bn', required:true},
      {name:'নাম (ইংরেজি) *', id:'name_en', required:true},{name:'লিঙ্গ *', id:'gender', type:'select', options:['পুরুষ','মহিলা'], required:true},
      {name:'জন্ম তারিখ *', id:'dob', type:'date', required:true},{name:'জন্মস্থান *', id:'birth_place', required:true},
      {section:'পিতার তথ্য'},{name:'পিতার নাম (বাংলা) *', id:'father_bn', required:true},
      {name:'পিতার নাম (ইংরেজি) *', id:'father_en', required:true},{section:'মাতার তথ্য'},
      {name:'মাতার নাম (বাংলা) *', id:'mother_bn', required:true},{name:'মাতার নাম (ইংরেজি) *', id:'mother_en', required:true},
      {name:'মোবাইল নম্বর *', id:'mobile', required:true},{section:'স্থায়ী ঠিকানা'},
      {name:'বিভাগ *', id:'division', required:true},{name:'জেলা *', id:'district', required:true},
      {name:'উপজেলা *', id:'upazila', required:true},{name:'ইউনিয়ন *', id:'union', required:true},
      {name:'পোস্ট অফিস *', id:'post_office', required:true},{name:'ওয়ার্ড নম্বর *', id:'ward', required:true},
      {name:'গ্রাম *', id:'village', required:true}
    ]
  },
  birth_minister: {
    name: 'মিনিস্টার নিবন্ধন', icon: 'fa-baby', parent: 'নতুন জন্ম নিবন্ধন সার্ভিস', rate: 3200,
    fields: [
      {section:'ব্যক্তিগত তথ্য'},{name:'নাম (বাংলা) *', id:'name_bn', required:true},
      {name:'নাম (ইংরেজি) *', id:'name_en', required:true},{name:'লিঙ্গ *', id:'gender', type:'select', options:['পুরুষ','মহিলা'], required:true},
      {name:'জন্ম তারিখ *', id:'dob', type:'date', required:true},{name:'জন্মস্থান *', id:'birth_place', required:true},
      {section:'পিতার তথ্য'},{name:'পিতার নাম (বাংলা) *', id:'father_bn', required:true},
      {name:'পিতার নাম (ইংরেজি) *', id:'father_en', required:true},{section:'মাতার তথ্য'},
      {name:'মাতার নাম (বাংলা) *', id:'mother_bn', required:true},{name:'মাতার নাম (ইংরেজি) *', id:'mother_en', required:true},
      {name:'মোবাইল নম্বর *', id:'mobile', required:true},{section:'স্থায়ী ঠিকানা'},
      {name:'বিভাগ *', id:'division', required:true},{name:'জেলা *', id:'district', required:true},
      {name:'উপজেলা *', id:'upazila', required:true},{name:'ইউনিয়ন *', id:'union', required:true},
      {name:'পোস্ট অফিস *', id:'post_office', required:true},{name:'ওয়ার্ড নম্বর *', id:'ward', required:true},
      {name:'গ্রাম *', id:'village', required:true}
    ]
  }
};

// প্যারেন্ট সার্ভিস ম্যাপিং (গ্রুপিং)
const parentGroups = {
  'nid_card': ['nid_number','voter_slip','voter_number','server_copy','smart_card'],
  'sim_biometric': ['bl_bio','gp_bio','robi_bio','teletalk_bio'],
  'lost_nid_form': ['lost_nid_form_nid','lost_nid_form_user'],
  'birth_reg': ['birth_normal','birth_minister']
};

// ==================== স্টেট ====================
let currentUser = null;
let noticeText = '';

// ==================== ইউটিলিটি ====================
function $(id){return document.getElementById(id);}
function showSpinner(){ $('loadingSpinner').style.display='flex'; }
function hideSpinner(){ $('loadingSpinner').style.display='none'; }
function toast(msg){
  const t=$('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
async function sha256(str){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function setCookie(n,v,d){let e=new Date();e.setTime(e.getTime()+d*864e5);document.cookie=n+'='+v+';expires='+e.toUTCString()+';path=/';}
function getCookie(n){let m=document.cookie.match('(^|;)\\s*'+n+'\\s*=\\s*([^;]+)');return m?m.pop():null;}

// ==================== API কল ====================
async function apiCall(action, data={}){
  showSpinner();
  const fd=new FormData(); fd.append('action',action);
  for(let k in data) fd.append(k,data[k]);
  try{
    const res=await fetch(API_URL,{method:'POST',body:fd});
    const json=await res.json();
    hideSpinner();
    return json;
  }catch(e){
    hideSpinner();
    toast('নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন');
    return {success:false, message:'Network error'};
  }
}

// ==================== অথেনটিকেশন ====================
async function doRegister(){
  const name=document.getElementById('regName')?.value.trim();
  const phone=document.getElementById('regPhone')?.value.trim();
  const whatsapp=document.getElementById('regWhatsapp')?.value.trim();
  const pass=document.getElementById('regPass')?.value.trim();
  if(!name||!phone||!pass) return toast('সব তথ্য পূরণ করুন');
  const hash=await sha256(pass);
  const res=await apiCall('register',{name,phone,whatsapp,passwordHash:hash});
  if(res.success){toast('রেজিস্ট্রেশন সফল! লগইন করুন');showLoginForm();}
  else toast(res.message||'ত্রুটি');
}
async function doLogin(){
  const phone=document.getElementById('loginPhone')?.value.trim();
  const pass=document.getElementById('loginPass')?.value.trim();
  if(!phone||!pass) return toast('ফোন ও পাসওয়ার্ড দিন');
  const hash=await sha256(pass);
  const res=await apiCall('login',{phone,passwordHash:hash});
  if(res.success){
    currentUser=res; setCookie('userId',res.userId,7); setCookie('userName',res.name,7);
    setCookie('userPhone',res.phone,7); updateNav(); renderHome();
  }else toast(res.message||'লগইন ব্যর্থ');
}
async function doAdminLogin(){
  const user=document.getElementById('adminUser')?.value.trim();
  const pass=document.getElementById('adminPass')?.value.trim();
  if(!user||!pass) return toast('ইউজারনেম ও পাসওয়ার্ড দিন');
  const hash=await sha256(pass);
  const res=await apiCall('adminLogin',{username:user,passwordHash:hash});
  if(res.success){
    currentUser={role:'admin',name:'Admin'}; setCookie('adminLogged','1',1);
    updateNav(); renderAdminPanel();
  }else toast(res.message||'অ্যাডমিন লগইন ব্যর্থ');
}
function logout(){
  currentUser=null;
  ['userId','userName','userPhone','adminLogged'].forEach(c=>setCookie(c,'',-1));
  updateNav(); renderHome();
}
function updateNav(){
  const greet=$('userGreet'), homeBtn=$('homeBtn'), myOrdersBtn=$('myOrdersBtn'),
        loginBtn=$('loginBtn'), registerBtn=$('registerBtn'), logoutBtn=$('logoutBtn');
  if(currentUser){
    greet.style.display='inline'; greet.textContent='👋 '+(currentUser.name||currentUser.phone||'');
    homeBtn.style.display='inline-block'; myOrdersBtn.style.display='inline-block';
    loginBtn.style.display='none'; registerBtn.style.display='none'; logoutBtn.style.display='inline-block';
    if(currentUser.role==='admin'){homeBtn.style.display='none'; myOrdersBtn.style.display='none';}
  }else{
    greet.style.display='none'; homeBtn.style.display='inline-block'; myOrdersBtn.style.display='none';
    loginBtn.style.display='inline-block'; registerBtn.style.display='inline-block'; logoutBtn.style.display='none';
  }
}

// ==================== ল্যান্ডিং পেজ (লগইনহীন) ====================
function renderLandingPage(){
  let html=`<div style="text-align:center;padding:20px 0">
    <h2 style="font-size:2rem;color:#1a73e8;">Amader-Seba তে স্বাগতম</h2>
    <p style="color:#555;margin:10px 0 25px;">সকল সরকারি ও প্রাইভেট সেবা এখন এক জায়গায়</p>
    <div class="landing-grid">`;
  // সমস্ত সার্ভিস দেখাও কিন্তু লক আইকনসহ
  for(let key in serviceForms){
    const s=serviceForms[key];
    html+=`<div class="landing-card">
      <span class="lock-icon"><i class="fas fa-lock" style="color:#aaa;"></i></span>
      <i class="fas ${s.icon}"></i>
      <h4>${s.name}</h4>
      <div class="price">${s.rate} টাকা</div>
    </div>`;
  }
  html+=`</div>
    <button class="btn-primary" style="width:auto;padding:12px 30px;margin-top:20px" onclick="showLoginForm()">লগইন করে অর্ডার করুন</button>
    <p style="margin-top:15px">নতুন? <a href="#" onclick="showRegisterForm()">রেজিস্টার করুন</a></p>
  </div>`;
  $('app').innerHTML=html;
}

// ==================== হোম পেজ (লগইন পর) ====================
async function renderHome(){
  if(!currentUser) return renderLandingPage();
  const app=$('app');
  app.innerHTML='<h2 class="page-title">আমাদের সেবাসমূহ</h2>';
  // বিজ্ঞপ্তি লোড
  const noticeRes=await apiCall('getNotice');
  if(noticeRes.success && noticeRes.notice){
    noticeText=noticeRes.notice;
    $('noticeBanner').textContent=noticeText;
    $('noticeBanner').style.display='block';
  }else{$('noticeBanner').style.display='none';}
  // প্যারেন্ট সার্ভিস গ্রুপ
  const parents=[
    {id:'nid_card',name:'এনআইডি কার্ড সার্ভিস',icon:'fa-id-card',children:parentGroups['nid_card']},
    {id:'sim_biometric',name:'সিম বায়োমেট্রিক সার্ভিস',icon:'fa-sim-card',children:parentGroups['sim_biometric']},
    {id:'sim_location',name:'সিম নাম্বার লোকেশন',icon:'fa-map-marker-alt',direct:true,serviceId:'sim_location'},
    {id:'lost_id',name:'হারানো আইডি কার্ড',icon:'fa-search',direct:true,serviceId:'lost_id'},
    {id:'nid_to_sim',name:'এনআইডি টু সকল সিম',icon:'fa-link',direct:true,serviceId:'nid_to_sim'},
    {id:'lost_etin',name:'হারানো ই-টিন',icon:'fa-file-invoice',direct:true,serviceId:'lost_etin'},
    {id:'imei_active',name:'IMEI To Active Number',icon:'fa-mobile-alt',direct:true,serviceId:'imei_active'},
    {id:'lost_nid_form',name:'হারানো এনআইডি আবেদন ফরম',icon:'fa-file-alt',children:parentGroups['lost_nid_form']},
    {id:'birth_reg',name:'নতুন জন্ম নিবন্ধন',icon:'fa-baby',children:parentGroups['birth_reg']}
  ];
  const grid=document.createElement('div'); grid.className='service-grid';
  parents.forEach(p=>{
    const card=document.createElement('div'); card.className='service-card';
    card.innerHTML=`<i class="fas ${p.icon}"></i><h4>${p.name}</h4>`;
    card.onclick=()=>{
      if(p.direct) openOrderForm(p.serviceId);
      else renderSubServices(p.id, p.name, p.children);
    };
    grid.appendChild(card);
  });
  app.appendChild(grid);
}

function renderSubServices(parentId, title, childIds){
  const app=$('app');
  app.innerHTML=`<button class="back-btn" onclick="renderHome()">← ফিরে যান</button>
    <h2 class="page-title">${title}</h2><div class="sub-service-grid" id="subGrid"></div>`;
  const grid=$('subGrid');
  childIds.forEach(sid=>{
    const s=serviceForms[sid];
    if(!s) return;
    const card=document.createElement('div'); card.className='service-card';
    card.innerHTML=`<h4>${s.name}</h4><div class="price">${s.rate} টাকা</div><span class="checkmark"><i class="fas fa-check"></i></span>`;
    card.onclick=()=>{
      document.querySelectorAll('.service-card.selected').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      openOrderForm(sid);
    };
    grid.appendChild(card);
  });
}

// ==================== অর্ডার ফর্ম (সার্ভিস-হিস্ট্রিসহ) ====================
function openOrderForm(serviceId){
  if(!currentUser) return toast('লগইন করুন'),showLoginForm();
  const s=serviceForms[serviceId];
  if(!s) return toast('সার্ভিস খুঁজে পাওয়া যায়নি');
  const app=$('app');
  let html=`<button class="back-btn" onclick="renderHome()">← ফিরে যান</button>
    <h2 class="page-title">${s.name}</h2>
    <div class="charge-box">💰 সার্ভিস চার্জ: ${s.rate} টাকা</div>
    <div class="copy-row">
      <span>📱 নগদ নাম্বার: <strong>${NAGAD_NUMBER}</strong></span>
      <button onclick="copyText('${NAGAD_NUMBER}')"><i class="far fa-copy"></i></button>
      <button onclick="copyText('${NAGAD_NUMBER}')"><i class="far fa-clipboard"></i></button>
    </div>
    <form id="orderForm" onsubmit="submitOrder(event, '${serviceId}')">`;
  s.fields.forEach(f=>{
    if(f.section){html+=`<h4 style="margin-top:15px;color:#1a73e8;">${f.section}</h4>`;return;}
    html+=`<div class="form-group"><label>${f.name} ${f.required?'<span class="req-star">*</span>':''}</label>`;
    if(f.type==='select'){
      html+=`<select id="field_${f.id}" ${f.required?'required':''}><option value="">নির্বাচন করুন</option>`;
      f.options.forEach(o=>html+=`<option value="${o}">${o}</option>`);
      html+='</select>';
    }else{
      html+=`<input type="${f.type||'text'}" id="field_${f.id}" placeholder="${f.name.replace(' *','')} লিখুন" ${f.required?'required':''}>`;
    }
    html+='</div>';
  });
  html+=`<div class="form-group"><label>ট্রানজেকশন আইডি <span class="req-star">*</span></label>
      <input type="text" id="txnId" placeholder="নগদ Send Money ট্রানজেকশন আইডি লিখুন" required>
    </div>
    <button type="submit" class="btn-primary" id="submitOrderBtn">✅ অর্ডার সাবমিট করুন</button></form>
    <div class="order-section"><h3>📋 এই সার্ভিসে আপনার পূর্বের অর্ডার</h3><div id="serviceOrdersList">লোড হচ্ছে...</div></div>`;
  app.innerHTML=html;
  loadServiceOrders(serviceId);
}

async function loadServiceOrders(serviceId){
  const container=$('serviceOrdersList');
  if(!container) return;
  const res=await apiCall('getOrders',{userId:currentUser.userId});
  const orders=(res.orders||[]).filter(o=>o.serviceId===serviceId);
  if(!orders.length){container.innerHTML='<p>কোনো অর্ডার নেই</p>';return;}
  let html='<table><thead><tr><th>SL</th><th>তথ্য</th><th>টাকা</th><th>স্ট্যাটাস</th><th>ডেলিভারি</th></tr></thead><tbody>';
  orders.forEach((o,i)=>{
    let deliveryHtml='';
    if(o.status==='delivered'){
      if(o.deliveryLink) deliveryHtml=`<a href="${o.deliveryLink}" target="_blank">ডাউনলোড</a>`;
      else if(o.deliveryText) deliveryHtml=`<span style="cursor:pointer;color:#1a73e8" onclick="alert('${o.deliveryText.replace(/'/g,"\\'")}')">তথ্য দেখুন</span>`;
      else deliveryHtml='সম্পন্ন';
    }else if(o.status==='cancelled') deliveryHtml='বাতিল';
    else deliveryHtml='⏳ পেন্ডিং';
    html+=`<tr><td>${i+1}</td><td><span style="cursor:pointer;color:#1a73e8" onclick="showOrderDetail('${o.formData.replace(/'/g,"\\'")}')">দেখুন</span></td>
      <td>${o.amount}৳</td><td>${o.status==='pending'?'পেন্ডিং':o.status==='delivered'?'সম্পন্ন':'বাতিল'}</td>
      <td>${deliveryHtml}</td></tr>`;
  });
  html+='</tbody></table>';
  container.innerHTML=html;
}

function copyText(txt){navigator.clipboard.writeText(txt).then(()=>toast('কপি করা হয়েছে')).catch(()=>toast('কপি ব্যর্থ'));}
function showOrderDetail(jsonStr){
  try{
    const obj=JSON.parse(jsonStr); let text='';
    for(let k in obj) text+=`${k}: ${obj[k]}\n`;
    alert(text||'কোন তথ্য নেই');
  }catch(e){alert(jsonStr);}
}

async function submitOrder(e,serviceId){
  e.preventDefault();
  const btn=$('submitOrderBtn'); btn.disabled=true; btn.textContent='⏳ জমা হচ্ছে...';
  const s=serviceForms[serviceId];
  const txnId=document.getElementById('txnId')?.value.trim();
  if(!txnId){btn.disabled=false; btn.textContent='✅ অর্ডার সাবমিট করুন'; return toast('ট্রানজেকশন আইডি দিন');}
  const formData={};
  s.fields.forEach(f=>{
    if(f.section) return;
    const el=document.getElementById('field_'+f.id);
    if(el) formData[f.id]=el.value.trim();
  });
  for(let f of s.fields){
    if(f.required && !formData[f.id]){
      btn.disabled=false; btn.textContent='✅ অর্ডার সাবমিট করুন';
      return toast(`"${f.name.replace(' *','')}" পূরণ করুন`);
    }
  }
  const res=await apiCall('placeOrder',{
    userId:currentUser.userId,serviceId,formData:JSON.stringify(formData),transactionId:txnId
  });
  btn.disabled=false; btn.textContent='✅ অর্ডার সাবমিট করুন';
  if(res.success){
    toast('অর্ডার সফল!');
    document.getElementById('txnId').value='';
    loadServiceOrders(serviceId);
  }else toast(res.message||'অর্ডার ব্যর্থ');
}

// ==================== গ্লোবাল অর্ডার হিস্টরি (সব অর্ডার) ====================
async function renderMyOrders(){
  if(!currentUser) return toast('লগইন করুন'),showLoginForm();
  const app=$('app'); app.innerHTML='<h2 class="page-title">আমার সব অর্ডার</h2><div id="ordersTable"></div>';
  const res=await apiCall('getOrders',{userId:currentUser.userId});
  const orders=res.orders||[];
  if(!orders.length){$('ordersTable').innerHTML='<p>কোনো অর্ডার নেই</p>';return;}
  let html='<table><thead><tr><th>SL</th><th>সার্ভিস</th><th>তথ্য</th><th>টাকা</th><th>স্ট্যাটাস</th><th>ডেলিভারি</th></tr></thead><tbody>';
  orders.forEach((o,i)=>{
    let deliveryHtml='';
    if(o.status==='delivered'){
      if(o.deliveryLink) deliveryHtml=`<a href="${o.deliveryLink}" target="_blank">ডাউনলোড</a>`;
      else if(o.deliveryText) deliveryHtml=`<span style="cursor:pointer;color:#1a73e8" onclick="alert('${o.deliveryText.replace(/'/g,"\\'")}')">তথ্য দেখুন</span>`;
      else deliveryHtml='সম্পন্ন';
    }else if(o.status==='cancelled') deliveryHtml='বাতিল';
    else deliveryHtml='⏳ পেন্ডিং';
    html+=`<tr><td>${i+1}</td><td>${serviceForms[o.serviceId]?.name||o.serviceId}</td>
      <td><span style="cursor:pointer;color:#1a73e8" onclick="showOrderDetail('${o.formData.replace(/'/g,"\\'")}')">দেখুন</span></td>
      <td>${o.amount}৳</td><td>${o.status==='pending'?'পেন্ডিং':o.status==='delivered'?'সম্পন্ন':'বাতিল'}</td>
      <td>${deliveryHtml}</td></tr>`;
  });
  html+='</tbody></table>'; $('ordersTable').innerHTML=html;
}

// ==================== অ্যাডমিন প্যানেল ====================
async function renderAdminPanel(){
  if(!currentUser||currentUser.role!=='admin') return toast('অ্যাক্সেস নেই');
  const app=$('app');
  app.innerHTML=`<h2 class="page-title">অ্যাডমিন প্যানেল</h2>
    <div class="admin-tabs">
      <button class="active" onclick="adminTab('dashboard')">ড্যাশবোর্ড</button>
      <button onclick="adminTab('orders')">অর্ডার</button>
      <button onclick="adminTab('services')">সার্ভিস</button>
      <button onclick="adminTab('notice')">নোটিশ</button>
      <button onclick="adminTab('users')">ইউজার</button>
    </div><div id="adminContent"></div>`;
  adminTab('dashboard');
}
async function adminTab(tab){
  const content=$('adminContent');
  document.querySelectorAll('.admin-tabs button').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  if(tab==='dashboard'){
    const stats=await apiCall('getAdminStats');
    content.innerHTML=`<div class="stat-cards">
      <div class="stat-card"><h3>মোট অর্ডার</h3><div class="num">${stats.total||0}</div></div>
      <div class="stat-card"><h3>পেন্ডিং</h3><div class="num">${stats.pending||0}</div></div>
      <div class="stat-card"><h3>সম্পন্ন</h3><div class="num">${stats.delivered||0}</div></div>
      <div class="stat-card"><h3>বাতিল</h3><div class="num">${stats.cancelled||0}</div></div>
      <div class="stat-card"><h3>মোট আয়</h3><div class="num">${stats.revenue||0}৳</div></div>
    </div>`;
  }else if(tab==='orders'){
    const res=await apiCall('adminGetOrders');
    let html='<table><thead><tr><th>ID</th><th>ইউজার</th><th>সার্ভিস</th><th>টাকা</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead><tbody>';
    (res.orders||[]).forEach(o=>{
      html+=`<tr><td>${o.orderId}</td><td>${o.userId}</td><td>${serviceForms[o.serviceId]?.name||o.serviceId}</td>
        <td>${o.amount}৳</td><td>${o.status}</td>
        <td><button onclick="deliverOrder(${o.orderId})">ডেলিভার</button>
        <button onclick="cancelOrder(${o.orderId})">বাতিল</button></td></tr>`;
    });
    html+='</tbody></table>'; content.innerHTML=html;
  }else if(tab==='services'){
    const res=await apiCall('getConfig');
    let html='<table><thead><tr><th>সার্ভিস</th><th>রেট</th><th>স্ট্যাটাস</th><th>টগল</th></tr></thead><tbody>';
    (res.config||[]).forEach(c=>{
      html+=`<tr><td>${c.serviceName||c.serviceId}</td><td>${c.rate}৳</td>
        <td>${c.isActive?'✅ চালু':'❌ বন্ধ'}</td>
        <td><button onclick="toggleService('${c.serviceId}',${!c.isActive})">${c.isActive?'বন্ধ করুন':'চালু করুন'}</button></td></tr>`;
    });
    html+='</tbody></table>'; content.innerHTML=html;
  }else if(tab==='notice'){
    content.innerHTML=`<textarea id="noticeInput" style="width:100%;height:80px">${noticeText}</textarea>
      <button class="btn-primary" onclick="updateNotice()">আপডেট নোটিশ</button>`;
  }else if(tab==='users'){
    const res=await apiCall('getUsers');
    let html='<table><thead><tr><th>ID</th><th>নাম</th><th>ফোন</th><th>হোয়াটসঅ্যাপ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead><tbody>';
    (res.users||[]).forEach(u=>{
      html+=`<tr><td>${u.userId}</td><td>${u.name}</td><td>${u.phone}</td><td>${u.whatsapp||'-'}</td>
        <td>${u.isBlocked?'🚫 ব্লক':'✅ সক্রিয়'}</td>
        <td><button onclick="blockUser('${u.userId}',${!u.isBlocked})">${u.isBlocked?'আনব্লক':'ব্লক'}</button></td></tr>`;
    });
    html+='</tbody></table>'; content.innerHTML=html;
  }
}
async function deliverOrder(orderId){
  const type=prompt('ডেলিভারি টাইপ: "text" অথবা "link"');
  if(type==='text'){
    const text=prompt('টেক্সট দিন');
    if(text){await apiCall('updateOrder',{orderId,status:'delivered',deliveryText:text});adminTab('orders');}
  }else if(type==='link'){
    const link=prompt('লিংক দিন');
    if(link){await apiCall('updateOrder',{orderId,status:'delivered',deliveryLink:link});adminTab('orders');}
  }
}
async function cancelOrder(orderId){
  if(confirm('অর্ডার বাতিল করবেন?')){await apiCall('updateOrder',{orderId,status:'cancelled'});adminTab('orders');}
}
async function toggleService(sid,active){await apiCall('updateConfig',{serviceId:sid,isActive:active});adminTab('services');}
async function updateNotice(){
  const txt=document.getElementById('noticeInput')?.value||'';
  await apiCall('updateNotice',{text:txt});noticeText=txt;
  $('noticeBanner').textContent=txt;$('noticeBanner').style.display=txt?'block':'none';toast('নোটিশ আপডেট হয়েছে');
}
async function blockUser(userId,block){await apiCall('blockUser',{userId,block});adminTab('users');}

// ==================== লগইন/রেজিস্টার ফর্ম ====================
function showLoginForm(){
  $('app').innerHTML=`<h2 class="page-title">লগইন</h2>
    <div class="form-group"><label>মোবাইল নাম্বার</label><input id="loginPhone" placeholder="01xxxxxxxxx"></div>
    <div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="loginPass" placeholder="পাসওয়ার্ড লিখুন"></div>
    <button class="btn-primary" onclick="doLogin()">লগইন</button>
    <p style="margin-top:10px;text-align:center">অথবা <a href="#" onclick="showRegisterForm()">নতুন অ্যাকাউন্ট খুলুন</a></p>
    <hr style="margin:20px 0"><p style="text-align:center"><a href="#" onclick="showAdminLoginForm()">অ্যাডমিন লগইন</a></p>`;
}
function showRegisterForm(){
  $('app').innerHTML=`<h2 class="page-title">নতুন অ্যাকাউন্ট</h2>
    <div class="form-group"><label>নাম <span class="req-star">*</span></label><input id="regName" placeholder="আপনার নাম লিখুন"></div>
    <div class="form-group"><label>মোবাইল নাম্বার <span class="req-star">*</span></label><input id="regPhone" placeholder="01xxxxxxxxx"></div>
    <div class="form-group"><label>হোয়াটসঅ্যাপ নাম্বার</label><input id="regWhatsapp" placeholder="01xxxxxxxxx (ঐচ্ছিক)"></div>
    <div class="form-group"><label>পাসওয়ার্ড <span class="req-star">*</span></label><input type="password" id="regPass" placeholder="পাসওয়ার্ড লিখুন"></div>
    <button class="btn-primary" onclick="doRegister()">রেজিস্টার</button>
    <p style="margin-top:10px;text-align:center">ইতিমধ্যে অ্যাকাউন্ট আছে? <a href="#" onclick="showLoginForm()">লগইন</a></p>`;
}
function showAdminLoginForm(){
  $('app').innerHTML=`<h2 class="page-title">অ্যাডমিন লগইন</h2>
    <div class="form-group"><label>ইউজারনেম</label><input id="adminUser" placeholder="ইউজারনেম লিখুন"></div>
    <div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="adminPass" placeholder="পাসওয়ার্ড লিখুন"></div>
    <button class="btn-primary" onclick="doAdminLogin()">লগইন</button>`;
}

// ==================== ইনিশিয়াল ====================
(async function init(){
  const uid=getCookie('userId'),uname=getCookie('userName'),uphone=getCookie('userPhone'),admin=getCookie('adminLogged');
  if(admin==='1') currentUser={role:'admin',name:'Admin'};
  else if(uid) currentUser={userId:uid,name:uname,phone:uphone};
  updateNav();
  if(currentUser?.role==='admin') renderAdminPanel();
  else renderHome(); // লগইন থাকলে হোম, না থাকলে ল্যান্ডিং
  $('homeBtn').addEventListener('click',renderHome);
  $('myOrdersBtn').addEventListener('click',renderMyOrders);
  $('loginBtn').addEventListener('click',showLoginForm);
  $('registerBtn').addEventListener('click',showRegisterForm);
  $('logoutBtn').addEventListener('click',logout);
})();