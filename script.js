// ==================== কনফিগ ====================
const API_URL = 'https://script.google.com/macros/s/AKfycbyPR_uB6-JG6YG6du21nhADFWpYmKh9G8IysHF6pe-y-NS9bSwUFRXz0L5rHX5pEsr_/exec'; // এখানে আপনার ডেপ্লয় URL বসান
const NAGAD_NUMBER = '9856001145305185';
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61589008568972';

// ==================== সার্ভিস ডেটা ====================
const serviceForms = {
  // ... (আগের মতো সব সার্ভিস রাখুন, স্থান সীমাবদ্ধতার জন্য সংক্ষেপে দেখালাম)
  nid_number: { name: 'এনআইডি নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 300, fields: [{name:'নাম *',id:'name',required:true},{name:'এনআইডি নম্বর *',id:'nid',required:true}] },
  voter_slip: { name: 'ভোটার স্লিপ নম্বর', icon: 'fa-id-card', parent: 'এনআইডি কার্ড সার্ভিস', rate: 350, fields: [{name:'নাম *',id:'name',required:true},{name:'ভোটার স্লিপ *',id:'voter_slip',required:true}] },
  sim_location: { name: 'সিম লোকেশন', icon: 'fa-map-marker-alt', parent: null, rate: 850, fields: [{name:'নাম্বার *',id:'number',required:true}] },
  lost_id: { name: 'হারানো আইডি', icon: 'fa-search', parent: null, rate: 2000, fields: [{name:'নাম *',id:'name',required:true},{name:'পিতার নাম',id:'father'}] }
  // অন্যান্য সার্ভিস আগের মতো যোগ করুন (স্থানের জন্য সংক্ষেপ)
};

const parentGroups = {
  nid_card: ['nid_number','voter_slip'],
  others: ['sim_location','lost_id']
};

// ==================== গ্লোবাল ভেরিয়েবল ====================
let currentUser = null;
let noticeText = '';
let currentServiceId = null;
let allOrders = []; // অর্ডার ক্যাশ

// ==================== ডম এলিমেন্টস ====================
function $(id) { return document.getElementById(id); }
function showSpinner() { $('loadingSpinner').style.display = 'flex'; }
function hideSpinner() { $('loadingSpinner').style.display = 'none'; }
function toast(msg) { let t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }

// ==================== API কল (নতুন করে Config শীট প্রয়োজনীয়তা হ্যান্ডেল) ====================
async function apiCall(action, data = {}) {
  showSpinner();
  const fd = new FormData();
  fd.append('action', action);
  for (let k in data) fd.append(k, data[k]);
  try {
    const res = await fetch(API_URL, { method: 'POST', body: fd });
    const json = await res.json();
    hideSpinner();
    return json;
  } catch (e) {
    hideSpinner();
    toast('নেটওয়ার্ক সমস্যা');
    return { success: false, message: 'Network error' };
  }
}

// ==================== অথেনটিকেশন ====================
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function setCookie(n, v, d) { let e = new Date(); e.setTime(e.getTime() + d * 864e5); document.cookie = n + '=' + v + ';expires=' + e.toUTCString() + ';path=/'; }
function getCookie(n) { let m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return m ? m.pop() : null; }

async function doLogin() {
  const phone = document.getElementById('loginPhone')?.value.trim();
  const pass = document.getElementById('loginPass')?.value.trim();
  if (!phone || !pass) return toast('ফোন ও পাসওয়ার্ড দিন');
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
  } else toast(res.message);
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
  const greetSpan = $('userGreet');
  const btns = { home: $('homeBtn'), myOrders: $('myOrdersBtn'), login: $('loginBtn'), register: $('registerBtn'), logout: $('logoutBtn') };
  if (currentUser) {
    greetSpan.textContent = `👋 ${currentUser.name}`;
    btns.home.style.display = 'inline-block';
    btns.myOrders.style.display = 'inline-block';
    btns.login.style.display = 'none';
    btns.register.style.display = 'none';
    btns.logout.style.display = 'inline-block';
    if (currentUser.role === 'admin') btns.home.style.display = 'none';
  } else {
    greetSpan.textContent = '';
    btns.home.style.display = 'none';
    btns.myOrders.style.display = 'none';
    btns.login.style.display = 'inline-block';
    btns.register.style.display = 'inline-block';
    btns.logout.style.display = 'none';
  }
}

// ==================== ল্যান্ডিং পেজ (হিরো সেকশন) ====================
function renderLandingPage() {
  const app = $('app');
  app.innerHTML = `
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-tag"><i class="fas fa-leaf"></i> সেবাই আমাদের মূল লক্ষ্য</div>
        <h1 class="hero-title">Amader Seba</h1>
        <p class="hero-desc">আমরা আছি আপনার পাশে, আপনার প্রয়োজনের সেবায় দ্রুত, নির্ভরযোগ্য এবং আন্তরিকতার সাথে।</p>
        <div class="hero-buttons">
          <button class="btn-login" onclick="showLoginForm()"><i class="fas fa-sign-in-alt"></i> লগইন করুন →</button>
          <button class="btn-register" onclick="showRegisterForm()"><i class="fas fa-user-plus"></i> রেজিস্টার করুন →</button>
        </div>
      </div>
    </div>
  `;
  $('noticeBanner').style.display = 'none';
}

// ==================== হোম (লগইন পর সার্ভিস গ্রিড) ====================
async function renderHome() {
  if (!currentUser) return renderLandingPage();
  const app = $('app');
  app.innerHTML = '<h2 class="page-title">আমাদের সেবাসমূহ</h2><div class="service-grid" id="serviceGrid"></div>';
  // নোটিশ লোড
  const noticeRes = await apiCall('getNotice');
  if (noticeRes.success && noticeRes.notice) {
    noticeText = noticeRes.notice;
    const banner = $('noticeBanner');
    banner.textContent = noticeText;
    banner.style.display = 'block';
  }
  const parents = [
    { id: 'nid_card', name: 'এনআইডি কার্ড সার্ভিস', icon: 'fa-id-card', children: parentGroups.nid_card },
    { id: 'sim_location', name: 'সিম লোকেশন', icon: 'fa-map-marker-alt', direct: true, serviceId: 'sim_location' },
    { id: 'lost_id', name: 'হারানো আইডি কার্ড', icon: 'fa-search', direct: true, serviceId: 'lost_id' }
  ];
  const grid = $('serviceGrid');
  parents.forEach(p => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `<i class="fas ${p.icon}"></i><h4>${p.name}</h4>`;
    card.onclick = () => {
      if (p.direct) openServicePage(p.serviceId);
      else renderSubServices(p.id, p.name, p.children);
    };
    grid.appendChild(card);
  });
}

function renderSubServices(parentId, title, childIds) {
  const app = $('app');
  app.innerHTML = `<button class="back-btn" onclick="renderHome()">← ফিরে যান</button><h2 class="page-title">${title}</h2><div class="sub-service-grid" id="subGrid"></div>`;
  const grid = $('subGrid');
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
    `;
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        document.getElementById(`radio_${sid}`).checked = true;
      }
      // সিলেক্টেড ক্লাস যোগ
      document.querySelectorAll('.service-option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentServiceId = sid;
    });
    grid.appendChild(card);
  });
  // একটি বাটন অর্ডার কন্টিনিউ
  const continueBtn = document.createElement('button');
  continueBtn.textContent = '✅ অর্ডার করুন';
  continueBtn.className = 'btn-primary';
  continueBtn.style.marginTop = '20px';
  continueBtn.onclick = () => {
    const selected = document.querySelector('input[name="serviceRadio"]:checked');
    if (!selected) return toast('একটি সার্ভিস সিলেক্ট করুন');
    openOrderForm(selected.value);
  };
  app.appendChild(continueBtn);
}

// ==================== অর্ডার ফর্ম ও টেবিল ====================
async function openOrderForm(serviceId) {
  if (!currentUser) return toast('লগইন করুন');
  const s = serviceForms[serviceId];
  if (!s) return toast('সার্ভিস খুঁজে পাওয়া যায়নি');
  currentServiceId = serviceId;
  const app = $('app');
  app.innerHTML = `<button class="back-btn" onclick="renderHome()">← ফিরে যান</button>
    <h2 class="page-title">${s.name}</h2>
    <div class="charge-box" style="background:#e0f2e9;padding:12px;border-radius:20px;margin-bottom:20px;">💰 চার্জ: ${s.rate} টাকা</div>
    <div class="copy-row" style="display:flex;gap:10px;align-items:center;margin-bottom:20px;">📞 নগদ: <b>${NAGAD_NUMBER}</b> <button onclick="copyText('${NAGAD_NUMBER}')" class="btn-primary" style="width:auto;">কপি</button></div>
    <form id="orderForm">
      ${s.fields.map(f => `<div class="form-group"><label>${f.name} ${f.required ? '*' : ''}</label><input type="${f.type || 'text'}" id="field_${f.id}" required="${f.required}"></div>`).join('')}
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
  allOrders = orders;
  if (orders.length === 0) { container.innerHTML = '<p>কোনো অর্ডার নেই</p>'; return; }
  let html = `<table><thead><tr><th>SL</th><th>Details</th><th>TYPE</th><th>MESSAGE</th></tr></thead><tbody>`;
  orders.forEach((o, idx) => {
    let detailsBtn = `<button class="detail-btn" data-order='${JSON.stringify(o.formData)}'>তথ্য দেখুন</button>`;
    let typeHtml = `<span class="status-badge status-${o.status === 'pending' ? 'pending' : (o.status === 'delivered' ? 'delivered' : 'cancelled')}">${o.status === 'pending' ? 'পেন্ডিং' : (o.status === 'delivered' ? 'সফল' : 'বাতিল')}</span>`;
    let messageHtml = '';
    if (o.status === 'delivered') {
      if (o.deliveryLink) messageHtml = `<a href="${o.deliveryLink}" target="_blank" class="download-btn">ডাউনলোড</a>`;
      else if (o.deliveryText) messageHtml = `<button class="msg-btn" data-msg="${o.deliveryText.replace(/"/g, '&quot;')}">মেসেজ</button>`;
      else messageHtml = 'সম্পন্ন';
    } else if (o.status === 'cancelled') messageHtml = 'বাতিল';
    else messageHtml = '—';
    html += `<tr><td>${idx+1}</td><td>${detailsBtn}</td><td>${typeHtml}</td><td>${messageHtml}</td></tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
  // ইভেন্ট লিসেনার
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderData = JSON.parse(btn.getAttribute('data-order'));
      let displayText = '';
      try {
        const obj = JSON.parse(orderData);
        for (let [k, v] of Object.entries(obj)) displayText += `${k}: ${v}\n`;
      } catch { displayText = orderData; }
      showModal(displayText, 10000);
    });
  });
  document.querySelectorAll('.msg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.getAttribute('data-msg');
      showModal(msg, 10000, true);
    });
  });
}

function showModal(content, autoCloseMs = 10000, showCopy = false) {
  const modal = $('modal');
  const modalBody = $('modalBody');
  modalBody.innerHTML = `<pre style="white-space:pre-wrap">${content}</pre>${showCopy ? '<button class="copy-modal-btn">কপি করুন</button>' : ''}`;
  modal.style.display = 'flex';
  if (showCopy) {
    modalBody.querySelector('.copy-modal-btn').onclick = () => {
      navigator.clipboard.writeText(content);
      toast('কপি হয়েছে');
    };
  }
  const closeSpan = document.querySelector('.modal-close');
  closeSpan.onclick = () => modal.style.display = 'none';
  if (autoCloseMs) setTimeout(() => modal.style.display = 'none', autoCloseMs);
}
function copyText(txt) { navigator.clipboard.writeText(txt); toast('কপি হয়েছে'); }

// ==================== অন্যান্য ফাংশন ====================
async function renderMyOrders() {
  if (!currentUser) return toast('লগইন করুন');
  const res = await apiCall('getOrders', { userId: currentUser.userId });
  const orders = res.orders || [];
  let html = `<h2 class="page-title">সব অর্ডার</h2><div class="order-table-wrapper"><table><thead><tr><th>SL</th><th>সার্ভিস</th><th>স্ট্যাটাস</th><th>মেসেজ</th></tr></thead><tbody>`;
  orders.forEach((o, i) => {
    let msgHtml = (o.status === 'delivered' && o.deliveryText) ? `<button class="msg-btn" data-msg="${o.deliveryText.replace(/"/g, '&quot;')}">মেসেজ</button>` : (o.deliveryLink ? `<a href="${o.deliveryLink}" class="download-btn">ডাউনলোড</a>` : '—');
    html += `<tr><td>${i+1}</td><td>${serviceForms[o.serviceId]?.name || o.serviceId}</td><td><span class="status-badge status-${o.status}">${o.status}</span></td><td>${msgHtml}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  $('app').innerHTML = html;
  document.querySelectorAll('.msg-btn').forEach(btn => btn.addEventListener('click', () => showModal(btn.getAttribute('data-msg'), 10000, true)));
}

// লগইন/রেজিস্টার ফর্ম
function showLoginForm() {
  $('app').innerHTML = `<h2 class="page-title">লগইন</h2><div class="form-group"><label>মোবাইল</label><input id="loginPhone"></div><div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="loginPass"></div><button class="btn-primary" onclick="doLogin()">লগইন</button><p style="margin-top:10px">নতুন? <a href="#" onclick="showRegisterForm()">রেজিস্টার</a></p>`;
}
function showRegisterForm() {
  $('app').innerHTML = `<h2 class="page-title">রেজিস্টার</h2><div class="form-group"><label>নাম</label><input id="regName"></div><div class="form-group"><label>মোবাইল</label><input id="regPhone"></div><div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="regPass"></div><button class="btn-primary" onclick="doRegister()">রেজিস্টার</button><p>অ্যাকাউন্ট আছে? <a href="#" onclick="showLoginForm()">লগইন</a></p>`;
}

// সাব নেভিগেশন ইভেন্ট
function setupSubNav() {
  document.querySelectorAll('.sub-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.getAttribute('data-action');
      if (action === 'home') currentUser ? renderHome() : renderLandingPage();
      else if (action === 'login') showLoginForm();
      else if (action === 'register') showRegisterForm();
      else if (action === 'contact') window.open(FACEBOOK_URL, '_blank');
    });
  });
}
// হ্যামবার্গার
function toggleHamburger() {
  const hamburger = $('hamburger');
  const navLinks = $('navLinks');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('show'));
}
// ইনিশিয়াল
window.onload = async () => {
  const uid = getCookie('userId'), uname = getCookie('userName'), urole = getCookie('userRole');
  if (uid) currentUser = { userId: uid, name: uname, role: urole || 'user' };
  updateNav();
  if (currentUser) renderHome(); else renderLandingPage();
  setupSubNav();
  toggleHamburger();
  $('homeBtn').onclick = () => currentUser ? renderHome() : renderLandingPage();
  $('myOrdersBtn').onclick = renderMyOrders;
  $('loginBtn').onclick = showLoginForm;
  $('registerBtn').onclick = showRegisterForm;
  $('logoutBtn').onclick = logout;
};