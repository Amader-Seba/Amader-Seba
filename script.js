// ==================== কনফিগ ====================
// ⚠️ IMPORTANT: এখানে YOUR_GOOGLE_APPS_SCRIPT_URL পরিবর্তন করে আপনার ডেপ্লয় URL বসান
const API_URL = 'https://script.google.com/macros/s/AKfycbxUJjaJEniHm_jDH0i0DLuIsBiPJTmUwcxqRSI5QhDR760aSxxapaZraWEEdoi1e_Nx/exec'; // যেমন: 'https://script.google.com/macros/s/.../exec'
const NAGAD_NUMBER = '9856001145305185';
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61589008568972';

// ==================== সার্ভিস ডেটা ====================
const serviceForms = {
  nid_number: { name: 'এনআইডি নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 300, fields: [{name:'নাম *',id:'name',required:true},{name:'এনআইডি নম্বর *',id:'nid',required:true}] },
  voter_slip: { name: 'ভোটার স্লিপ নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 350, fields: [{name:'নাম *',id:'name',required:true},{name:'স্লিপ নম্বর *',id:'voter_slip',required:true}] },
  voter_number: { name: 'ভোটার নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 400, fields: [{name:'নাম *',id:'name',required:true},{name:'ভোটার নম্বর *',id:'voter_no',required:true}] },
  server_copy: { name: 'সার্ভার কপি', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 150, fields: [{name:'এনআইডি *',id:'nid',required:true},{name:'জন্ম তারিখ',id:'dob'}] },
  smart_card: { name: 'স্মার্ট কার্ড', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 400, fields: [{name:'নাম *',id:'name',required:true},{name:'এনআইডি *',id:'nid',required:true}] },
  bl_bio: { name: 'বাংলালিংক', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 600, fields: [{name:'নাম্বার *',id:'number',required:true}] },
  gp_bio: { name: 'গ্রামীণ', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 650, fields: [{name:'নাম্বার *',id:'number',required:true}] },
  robi_bio: { name: 'রবি/এয়ারটেল', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 700, fields: [{name:'নাম্বার *',id:'number',required:true}] },
  teletalk_bio: { name: 'টেলিটক', icon: 'fa-sim-card', parent: 'সিম বায়োমেট্রিক সার্ভিস', rate: 550, fields: [{name:'নাম্বার *',id:'number',required:true}] },
  sim_location: { name: 'সিম নাম্বার লোকেশন', icon: 'fa-map-marker-alt', parent: null, rate: 850, fields: [{name:'নাম্বার *',id:'number',required:true}] },
  lost_id: { name: 'হারানো আইডি কার্ড', icon: 'fa-search', parent: null, rate: 2000, fields: [{name:'নাম *',id:'name',required:true},{name:'পিতার নাম',id:'father'},{name:'মাতার নাম',id:'mother'}] },
  nid_to_sim: { name: 'এনআইডি টু সকল সিম', icon: 'fa-link', parent: null, rate: 900, fields: [{name:'এনআইডি *',id:'nid',required:true}] },
  lost_etin: { name: 'হারানো ই-টিন', icon: 'fa-file-invoice', parent: null, rate: 200, fields: [{name:'আইডি *',id:'identifier',required:true}] },
  imei_active: { name: 'IMEI To Active Number', icon: 'fa-mobile-alt', parent: null, rate: 900, fields: [{name:'IMEI1 *',id:'imei1',required:true},{name:'IMEI2',id:'imei2'}] },
  lost_nid_form_nid: { name: 'হারানো এনআইডি (এনআইডি)', icon: 'fa-file-alt', parent: 'হারানো এনআইডি ফরম', rate: 500, fields: [{name:'এনআইডি *',id:'nid',required:true}] },
  lost_nid_form_user: { name: 'হারানো এনআইডি (ইউজার)', icon: 'fa-file-alt', parent: 'হারানো এনআইডি ফরম', rate: 300, fields: [{name:'ইউজার *',id:'username',required:true},{name:'পাস *',id:'password',type:'password'}] },
  birth_normal: { name: 'নরমাল নিবন্ধন', icon: 'fa-baby', parent: 'জন্ম নিবন্ধন', rate: 2400, fields: [{name:'নাম *',id:'name',required:true},{name:'জন্ম তারিখ',id:'dob'}] },
  birth_minister: { name: 'মিনিস্টার নিবন্ধন', icon: 'fa-baby', parent: 'জন্ম নিবন্ধন', rate: 3200, fields: [{name:'নাম *',id:'name',required:true},{name:'জন্ম তারিখ',id:'dob'}] }
};

const parentGroups = {
  nid_card: ['nid_number','voter_slip','voter_number','server_copy','smart_card'],
  sim_biometric: ['bl_bio','gp_bio','robi_bio','teletalk_bio'],
  lost_nid_form: ['lost_nid_form_nid','lost_nid_form_user'],
  birth_reg: ['birth_normal','birth_minister']
};

// ==================== স্টেট ====================
let currentUser = null;
let noticeText = '';

// ==================== DOM ফাংশন ====================
function $(id) { return document.getElementById(id); }
function showSpinner() { $('loadingSpinner').style.display = 'flex'; }
function hideSpinner() { $('loadingSpinner').style.display = 'none'; }
function toast(msg) { let t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }

// ==================== API কল (নেটওয়ার্ক এরর হ্যান্ডেল) ====================
async function apiCall(action, data = {}) {
  if (!API_URL || API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
    toast('API URL সেট করা হয়নি! script.js-এ API_URL আপডেট করুন।');
    return { success: false, message: 'API URL missing' };
  }
  showSpinner();
  const fd = new FormData();
  fd.append('action', action);
  for (let k in data) fd.append(k, data[k]);
  try {
    const res = await fetch(API_URL, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    hideSpinner();
    return json;
  } catch (e) {
    console.error(e);
    hideSpinner();
    toast('নেটওয়ার্ক সমস্যা! URL চেক করুন বা Apps Script ডেপ্লয় করুন।');
    return { success: false, message: 'Network error: ' + e.message };
  }
}

// ==================== ক্রিপ্টো ====================
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== কুকি ====================
function setCookie(n, v, d) { let e = new Date(); e.setTime(e.getTime() + d * 864e5); document.cookie = n + '=' + v + ';expires=' + e.toUTCString() + ';path=/'; }
function getCookie(n) { let m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return m ? m.pop() : null; }

// ==================== অথেনটিকেশন ====================
async function doLogin() {
  const phone = document.getElementById('loginPhone')?.value.trim();
  const pass = document.getElementById('loginPass')?.value.trim();
  if (!phone || !pass) return toast('ফোন ও পাসওয়ার্ড দিন');
  const hash = await sha256(pass);
  const res = await apiCall('login', { phone, passwordHash: hash });
  if (res.success) {
    currentUser = { userId: res.userId, name: res.name, phone: res.phone, role: res.role || 'user' };
    setCookie('userId', res.userId, 7);
    setCookie('userName', res.name, 7);
    setCookie('userPhone', res.phone, 7);
    setCookie('userRole', res.role || 'user', 7);
    updateNav();
    renderHome();
  } else toast(res.message || 'লগইন ব্যর্থ');
}
async function doRegister() {
  const name = document.getElementById('regName')?.value.trim();
  const phone = document.getElementById('regPhone')?.value.trim();
  const pass = document.getElementById('regPass')?.value.trim();
  if (!name || !phone || !pass) return toast('সব তথ্য দিন');
  const hash = await sha256(pass);
  const res = await apiCall('register', { name, phone, whatsapp: '', passwordHash: hash });
  if (res.success) { toast('রেজিস্ট্রেশন সফল! লগইন করুন'); showLoginForm(); }
  else toast(res.message);
}
function logout() {
  currentUser = null;
  ['userId', 'userName', 'userPhone', 'userRole'].forEach(c => setCookie(c, '', -1));
  updateNav();
  renderLandingPage();
}
function updateNav() {
  const greet = $('userGreet');
  const home = $('homeBtn'), myOrders = $('myOrdersBtn'), login = $('loginBtn'), register = $('registerBtn'), logoutBtn = $('logoutBtn');
  if (currentUser) {
    greet.textContent = `👋 ${currentUser.name}`;
    home.style.display = 'inline-block';
    myOrders.style.display = 'inline-block';
    login.style.display = 'none';
    register.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    if (currentUser.role === 'admin') home.style.display = 'none';
  } else {
    greet.textContent = '';
    home.style.display = 'none';
    myOrders.style.display = 'none';
    login.style.display = 'inline-block';
    register.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

// ==================== ল্যান্ডিং পেজ ====================
function renderLandingPage() {
  $('app').innerHTML = `
    <div class="hero-section" style="background:linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.5)), url('https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=1600') center/cover no-repeat;">
      <div class="hero-content">
        <div class="hero-tag"><i class="fas fa-leaf"></i> সেবাই আমাদের মূল লক্ষ্য</div>
        <h1 class="hero-title">Amader Seba</h1>
        <p class="hero-desc">আমরা আছি আপনার পাশে, আপনার প্রয়োজনের সেবায় দ্রুত, নির্ভরযোগ্য এবং আন্তরিকতার সাথে।</p>
        <div class="hero-buttons">
          <button class="btn-login" onclick="showLoginForm()">লগইন করুন →</button>
          <button class="btn-register" onclick="showRegisterForm()">রেজিস্টার করুন →</button>
        </div>
      </div>
    </div>
  `;
  $('noticeBanner').style.display = 'none';
}

// ==================== হোম (লগইন পর) ====================
async function renderHome() {
  if (!currentUser) return renderLandingPage();
  $('app').innerHTML = '<h2 class="page-title">আমাদের সেবাসমূহ</h2><div class="service-grid" id="serviceGrid"></div>';
  const noticeRes = await apiCall('getNotice');
  if (noticeRes.success && noticeRes.notice) {
    noticeText = noticeRes.notice;
    const banner = $('noticeBanner');
    banner.textContent = noticeText;
    banner.style.display = 'block';
  }
  const parents = [
    { id: 'nid_card', name: 'এনআইডি কার্ড সার্ভিস', icon: 'fa-id-card', children: parentGroups.nid_card },
    { id: 'sim_biometric', name: 'সিম বায়োমেট্রিক সার্ভিস', icon: 'fa-sim-card', children: parentGroups.sim_biometric },
    { id: 'sim_location', name: 'সিম নাম্বার লোকেশন', icon: 'fa-map-marker-alt', direct: true, serviceId: 'sim_location' },
    { id: 'lost_id', name: 'হারানো আইডি কার্ড', icon: 'fa-search', direct: true, serviceId: 'lost_id' },
    { id: 'nid_to_sim', name: 'এনআইডি টু সকল সিম', icon: 'fa-link', direct: true, serviceId: 'nid_to_sim' },
    { id: 'lost_etin', name: 'হারানো ই-টিন', icon: 'fa-file-invoice', direct: true, serviceId: 'lost_etin' },
    { id: 'imei_active', name: 'IMEI To Active Number', icon: 'fa-mobile-alt', direct: true, serviceId: 'imei_active' },
    { id: 'lost_nid_form', name: 'হারানো এনআইডি ফরম', icon: 'fa-file-alt', children: parentGroups.lost_nid_form },
    { id: 'birth_reg', name: 'নতুন জন্ম নিবন্ধন', icon: 'fa-baby', children: parentGroups.birth_reg }
  ];
  const grid = $('serviceGrid');
  grid.innerHTML = '';
  parents.forEach(p => {
    const card = document.createElement('div'); card.className = 'service-card';
    card.innerHTML = `<i class="fas ${p.icon}"></i><h4>${p.name}</h4>`;
    card.onclick = () => { if (p.direct) openOrderForm(p.serviceId); else renderSubServices(p.id, p.name, p.children); };
    grid.appendChild(card);
  });
}

function renderSubServices(parentId, title, childIds) {
  const app = $('app');
  app.innerHTML = `<button class="back-btn" onclick="renderHome()">← ফিরে যান</button><h2 class="page-title">${title}</h2><div class="sub-service-grid" id="subGrid"></div><button id="continueOrderBtn" class="btn-primary" style="margin-top:20px; display:none;">✅ অর্ডার করুন</button>`;
  const grid = $('subGrid');
  let selectedServiceId = null;
  childIds.forEach(sid => {
    const s = serviceForms[sid];
    if (!s) return;
    const card = document.createElement('div');
    card.className = 'service-option-card';
    card.innerHTML = `
      <div class="radio-custom">
        <input type="radio" name="serviceRadio" value="${sid}" id="radio_${sid}">
        <label for="radio_${sid}"><strong>${s.name}</strong></label>
      </div>
      <div class="card-price">💰 ${s.rate} টাকা</div>
      <div class="checkmark-icon"><i class="fas fa-check-circle"></i></div>
    `;
    const radio = card.querySelector('input');
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.service-option-card').forEach(c => c.classList.remove('selected'));
      if (radio.checked) {
        card.classList.add('selected');
        selectedServiceId = sid;
        $('continueOrderBtn').style.display = 'block';
      }
    });
    card.addEventListener('click', (e) => { if (e.target.tagName !== 'INPUT') radio.checked = true; radio.dispatchEvent(new Event('change')); });
    grid.appendChild(card);
  });
  $('continueOrderBtn').onclick = () => { if (selectedServiceId) openOrderForm(selectedServiceId); else toast('একটি সার্ভিস নির্বাচন করুন'); };
}

// ==================== অর্ডার ফর্ম ও টেবিল ====================
async function openOrderForm(serviceId) {
  if (!currentUser) return toast('লগইন করুন');
  const s = serviceForms[serviceId];
  if (!s) return toast('সার্ভিস খুঁজে পাওয়া যায়নি');
  const app = $('app');
  app.innerHTML = `<button class="back-btn" onclick="renderHome()">← ফিরে যান</button>
    <h2 class="page-title">${s.name}</h2>
    <div style="background:#e0f2e9;padding:12px;border-radius:20px;margin-bottom:20px;">💰 চার্জ: ${s.rate} টাকা</div>
    <div style="display:flex; gap:10px; align-items:center; margin-bottom:20px;">📞 নগদ: <b>${NAGAD_NUMBER}</b> <button onclick="copyText('${NAGAD_NUMBER}')" class="btn-primary" style="width:auto; padding:6px 12px;">কপি</button></div>
    <form id="orderForm">
      ${s.fields.map(f => `<div class="form-group"><label>${f.name}</label><input type="${f.type || 'text'}" id="field_${f.id}" ${f.required ? 'required' : ''}></div>`).join('')}
      <div class="form-group"><label>ট্রানজেকশন আইডি *</label><input type="text" id="txnId" required></div>
      <button type="submit" class="btn-primary" id="submitOrderBtn">অর্ডার সাবমিট</button>
    </form>
    <div class="order-table-wrapper"><h3>📋 আপনার অর্ডারসমূহ</h3><div id="ordersTableContainer"></div></div>`;
  loadOrdersTable(serviceId);
  document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('submitOrderBtn');
    btn.disabled = true;
    const txnId = document.getElementById('txnId').value.trim();
    if (!txnId) { toast('ট্রানজেকশন আইডি দিন'); btn.disabled = false; return; }
    const formData = {};
    s.fields.forEach(f => { const el = document.getElementById(`field_${f.id}`); if (el) formData[f.id] = el.value.trim(); });
    for (let f of s.fields) { if (f.required && !formData[f.id]) { toast(`${f.name} পূরণ করুন`); btn.disabled = false; return; } }
    const res = await apiCall('placeOrder', { userId: currentUser.userId, serviceId, formData: JSON.stringify(formData), transactionId: txnId });
    if (res.success) { toast('অর্ডার সফল!'); document.getElementById('txnId').value = ''; loadOrdersTable(serviceId); }
    else toast(res.message || 'অর্ডার ব্যর্থ');
    btn.disabled = false;
  });
}

async function loadOrdersTable(serviceId) {
  const container = document.getElementById('ordersTableContainer');
  if (!container) return;
  const res = await apiCall('getOrders', { userId: currentUser.userId });
  const orders = (res.orders || []).filter(o => o.serviceId === serviceId);
  if (orders.length === 0) { container.innerHTML = '<p>কোনো অর্ডার নেই</p>'; return; }
  let html = `<table><thead><tr><th>SL</th><th>Details</th><th>TYPE</th><th>MESSAGE</th></tr></thead><tbody>`;
  orders.forEach((o, idx) => {
    let detailsBtn = `<button class="detail-btn" data-order='${JSON.stringify(o.formData)}'>তথ্য দেখুন</button>`;
    let statusClass = o.status === 'pending' ? 'status-pending' : (o.status === 'delivered' ? 'status-delivered' : 'status-cancelled');
    let statusText = o.status === 'pending' ? 'পেন্ডিং' : (o.status === 'delivered' ? 'সফল' : 'বাতিল');
    let messageHtml = '';
    if (o.status === 'delivered') {
      if (o.deliveryLink) messageHtml = `<a href="${o.deliveryLink}" target="_blank" class="download-btn">ডাউনলোড</a>`;
      else if (o.deliveryText) messageHtml = `<button class="msg-btn" data-msg="${o.deliveryText.replace(/"/g, '&quot;')}">মেসেজ</button>`;
      else messageHtml = 'সম্পন্ন';
    } else if (o.status === 'cancelled') messageHtml = 'বাতিল';
    else messageHtml = '—';
    html += `<tr><td>${idx+1}</td><td>${detailsBtn}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td>${messageHtml}</td></tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let raw = btn.getAttribute('data-order');
      try { let obj = JSON.parse(raw); raw = Object.entries(obj).map(([k,v])=>`${k}: ${v}`).join('\n'); } catch(e) {}
      showModal(raw, 10000);
    });
  });
  document.querySelectorAll('.msg-btn').forEach(btn => {
    btn.addEventListener('click', () => showModal(btn.getAttribute('data-msg'), 10000, true));
  });
}

function showModal(content, autoCloseMs = 10000, showCopy = false) {
  const modal = $('modal');
  const modalBody = $('modalBody');
  modalBody.innerHTML = `<pre style="white-space:pre-wrap">${content}</pre>${showCopy ? '<button class="copy-modal-btn">কপি করুন</button>' : ''}`;
  modal.style.display = 'flex';
  if (showCopy) modalBody.querySelector('.copy-modal-btn').onclick = () => { navigator.clipboard.writeText(content); toast('কপি হয়েছে'); };
  document.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
  if (autoCloseMs) setTimeout(() => modal.style.display = 'none', autoCloseMs);
}
function copyText(txt) { navigator.clipboard.writeText(txt); toast('কপি হয়েছে'); }

async function renderMyOrders() {
  if (!currentUser) return toast('লগইন করুন');
  const res = await apiCall('getOrders', { userId: currentUser.userId });
  const orders = res.orders || [];
  let html = `<h2 class="page-title">সব অর্ডার</h2><div class="order-table-wrapper"><table><thead><tr><th>SL</th><th>সার্ভিস</th><th>স্ট্যাটাস</th><th>মেসেজ</th></tr></thead><tbody>`;
  orders.forEach((o, i) => {
    let msgHtml = (o.status === 'delivered' && o.deliveryText) ? `<button class="msg-btn" data-msg="${o.deliveryText.replace(/"/g, '&quot;')}">মেসেজ</button>` : (o.deliveryLink ? `<a href="${o.deliveryLink}" class="download-btn">ডাউনলোড</a>` : '—');
    let statusClass = o.status === 'pending' ? 'status-pending' : (o.status === 'delivered' ? 'status-delivered' : 'status-cancelled');
    html += `<tr><td>${i+1}</td><td>${serviceForms[o.serviceId]?.name || o.serviceId}</td><td><span class="status-badge ${statusClass}">${o.status}</span></td><td>${msgHtml}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  $('app').innerHTML = html;
  document.querySelectorAll('.msg-btn').forEach(btn => btn.addEventListener('click', () => showModal(btn.getAttribute('data-msg'), 10000, true)));
}

// ফর্ম শো
function showLoginForm() {
  $('app').innerHTML = `<h2 class="page-title">লগইন</h2><div class="form-group"><label>মোবাইল</label><input id="loginPhone"></div><div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="loginPass"></div><button class="btn-primary" onclick="doLogin()">লগইন</button><p style="margin-top:10px">নতুন? <a href="#" onclick="showRegisterForm()">রেজিস্টার</a></p>`;
}
function showRegisterForm() {
  $('app').innerHTML = `<h2 class="page-title">রেজিস্টার</h2><div class="form-group"><label>নাম</label><input id="regName"></div><div class="form-group"><label>মোবাইল</label><input id="regPhone"></div><div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="regPass"></div><button class="btn-primary" onclick="doRegister()">রেজিস্টার</button><p>অ্যাকাউন্ট আছে? <a href="#" onclick="showLoginForm()">লগইন</a></p>`;
}

// সাব নেভ ও হ্যামবার্গার
function setupEvents() {
  document.querySelectorAll('.sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'home') currentUser ? renderHome() : renderLandingPage();
      else if (action === 'login') showLoginForm();
      else if (action === 'register') showRegisterForm();
      else if (action === 'contact') window.open(FACEBOOK_URL, '_blank');
    });
  });
  const hamburger = $('hamburger');
  const navLinks = $('navLinks');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('show'));
  $('homeBtn').onclick = () => currentUser ? renderHome() : renderLandingPage();
  $('myOrdersBtn').onclick = renderMyOrders;
  $('loginBtn').onclick = showLoginForm;
  $('registerBtn').onclick = showRegisterForm;
  $('logoutBtn').onclick = logout;
}

// ইনিশিয়াল
window.onload = () => {
  const uid = getCookie('userId'), uname = getCookie('userName'), urole = getCookie('userRole');
  if (uid) currentUser = { userId: uid, name: uname, role: urole || 'user' };
  updateNav();
  if (currentUser) renderHome(); else renderLandingPage();
  setupEvents();
};