// ========== কনফিগ ==========
const API_URL = 'https://script.google.com/macros/s/AKfycbx8MmDVlPAPP9bshzY9hJOftK-meqpQn7giI2Q2RSqHTOqRXQ23u5WyvcW7PgjArsFebA/exec'; // ← অ্যাপস স্ক্রিপ্ট ডিপ্লয় URL দিন
const NAGAD_NUMBER = '9856001145305185';

// ========== স্টেট ==========
let currentUser = null;
let servicesConfig = [];
let noticeText = '';

// ========== ইউটিলিটি ==========
function $(id) { return document.getElementById(id); }
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function setCookie(n, v, d) { let e = new Date(); e.setTime(e.getTime() + d * 864e5); document.cookie = n + '=' + v + ';expires=' + e.toUTCString() + ';path=/'; }
function getCookie(n) { let m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return m ? m.pop() : null; }
function formatDate(d) { return new Date(d).toLocaleString('bn-BD'); }

// ========== API ==========
async function apiCall(action, data = {}) {
  const fd = new FormData(); fd.append('action', action);
  for (let k in data) fd.append(k, data[k]);
  const res = await fetch(API_URL, { method: 'POST', body: fd });
  return res.json();
}

// ========== অথ ==========
async function doRegister() {
  const name = document.getElementById('regName')?.value.trim();
  const phone = document.getElementById('regPhone')?.value.trim();
  const whatsapp = document.getElementById('regWhatsapp')?.value.trim();
  const pass = document.getElementById('regPass')?.value.trim();
  if (!name || !phone || !pass) return toast('সব তথ্য পূরণ করুন');
  const hash = await sha256(pass);
  const res = await apiCall('register', { name, phone, whatsapp, passwordHash: hash });
  if (res.success) { toast('রেজিস্ট্রেশন সফল! লগইন করুন'); showLoginForm(); }
  else toast(res.message || 'ত্রুটি');
}
async function doLogin() {
  const phone = document.getElementById('loginPhone')?.value.trim();
  const pass = document.getElementById('loginPass')?.value.trim();
  if (!phone || !pass) return toast('ফোন ও পাসওয়ার্ড দিন');
  const hash = await sha256(pass);
  const res = await apiCall('login', { phone, passwordHash: hash });
  if (res.success) {
    currentUser = res;
    setCookie('userId', res.userId, 7); setCookie('userName', res.name, 7);
    setCookie('userPhone', res.phone, 7); updateNav(); renderHome();
  } else toast(res.message || 'লগইন ব্যর্থ');
}
async function doAdminLogin() {
  const user = document.getElementById('adminUser')?.value.trim();
  const pass = document.getElementById('adminPass')?.value.trim();
  if (!user || !pass) return toast('ইউজারনেম ও পাসওয়ার্ড দিন');
  const hash = await sha256(pass);
  const res = await apiCall('adminLogin', { username: user, passwordHash: hash });
  if (res.success) {
    currentUser = { role: 'admin', name: 'Admin' };
    setCookie('adminLogged', '1', 1); updateNav(); renderAdminPanel();
  } else toast(res.message || 'অ্যাডমিন লগইন ব্যর্থ');
}
function logout() {
  currentUser = null;
  ['userId', 'userName', 'userPhone', 'adminLogged'].forEach(c => setCookie(c, '', -1));
  updateNav(); renderHome();
}
function updateNav() {
  const greet = $('userGreet'), homeBtn = $('homeBtn'), myOrdersBtn = $('myOrdersBtn'),
        loginBtn = $('loginBtn'), registerBtn = $('registerBtn'), logoutBtn = $('logoutBtn');
  if (currentUser) {
    greet.style.display = 'inline'; greet.textContent = '👋 ' + (currentUser.name || currentUser.phone || '');
    homeBtn.style.display = 'inline-block'; myOrdersBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none'; registerBtn.style.display = 'none'; logoutBtn.style.display = 'inline-block';
    if (currentUser.role === 'admin') { homeBtn.style.display = 'none'; myOrdersBtn.style.display = 'none'; }
  } else {
    greet.style.display = 'none'; homeBtn.style.display = 'inline-block'; myOrdersBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block'; registerBtn.style.display = 'inline-block'; logoutBtn.style.display = 'none';
  }
}

// ========== পেজ রেন্ডারিং ==========
async function renderHome() {
  const app = $('app'); app.innerHTML = '<h2 class="page-title">আমাদের সেবাসমূহ</h2>';
  await loadConfig();
  const parents = [
    { id: 'nid_card', name: 'এনআইডি কার্ড সার্ভিস', icon: 'fa-id-card' },
    { id: 'sim_biometric', name: 'সিম বায়োমেট্রিক সার্ভিস', icon: 'fa-sim-card' },
    { id: 'sim_location', name: 'সিম নাম্বার লোকেশন', icon: 'fa-map-marker-alt', direct: true },
    { id: 'lost_id', name: 'হারানো আইডি কার্ড সার্ভিস', icon: 'fa-search', direct: true },
    { id: 'nid_to_sim', name: 'এনআইডি টু সকল সিম নাম্বার', icon: 'fa-link', direct: true },
    { id: 'lost_etin', name: 'হারানো ই-টিন সার্টিফিকেট', icon: 'fa-file-invoice', direct: true },
    { id: 'imei_active', name: 'IMEI To Active Number', icon: 'fa-mobile-alt', direct: true },
    { id: 'lost_nid_form', name: 'হারানো এনআইডি আবেদন ফরম', icon: 'fa-file-alt' },
    { id: 'birth_reg', name: 'নতুন জন্ম নিবন্ধন সার্ভিস', icon: 'fa-baby' }
  ];
  const grid = document.createElement('div'); grid.className = 'service-grid';
  parents.forEach(s => {
    const card = document.createElement('div'); card.className = 'service-card';
    card.innerHTML = `<i class="fas ${s.icon}"></i><h4>${s.name}</h4>`;
    card.onclick = () => {
      if (s.direct) openOrderForm(s.id);
      else if (s.id === 'lost_nid_form') renderSubServices('lost_nid_form', 'হারানো এনআইডি আবেদন ফরম', [
        { id: 'lost_nid_form_nid', name: 'এনআইডি নাম্বার দিয়ে' },
        { id: 'lost_nid_form_user', name: 'ইউজার নেম এবং পাসওয়ার্ড দিয়ে' }
      ]);
      else if (s.id === 'birth_reg') renderSubServices('birth_reg', 'নতুন জন্ম নিবন্ধন সার্ভিস', [
        { id: 'birth_normal', name: 'নরমাল নিবন্ধন' },
        { id: 'birth_minister', name: 'মিনিস্টার নিবন্ধন' }
      ]);
      else if (s.id === 'nid_card') renderSubServices('nid_card', 'এনআইডি কার্ড সার্ভিস', [
        { id: 'nid_number', name: 'এনআইডি নম্বর' }, { id: 'voter_slip', name: 'ভোটার স্লিপ নম্বর' },
        { id: 'voter_number', name: 'ভোটার নম্বর' }, { id: 'server_copy', name: 'সার্ভার কপি' },
        { id: 'smart_card', name: 'স্মার্ট কার্ড' }
      ]);
      else if (s.id === 'sim_biometric') renderSubServices('sim_biometric', 'সিম বায়োমেট্রিক সার্ভিস', [
        { id: 'bl_bio', name: 'বাংলালিংক' }, { id: 'gp_bio', name: 'গ্রামীণ' },
        { id: 'robi_bio', name: 'রবি/এয়ারটেল' }, { id: 'teletalk_bio', name: 'টেলিটক' }
      ]);
    };
    grid.appendChild(card);
  });
  app.appendChild(grid);
}

function renderSubServices(parentId, title, subs) {
  const app = $('app');
  app.innerHTML = `<button class="back-btn" onclick="renderHome()">← ফিরে যান</button>
    <h2 class="page-title">${title}</h2><div class="sub-service-grid" id="subGrid"></div>`;
  const grid = $('subGrid');
  subs.forEach(s => {
    const card = document.createElement('div'); card.className = 'service-card';
    card.innerHTML = `<h4>${s.name}</h4><span class="checkmark"><i class="fas fa-check"></i></span>`;
    card.onclick = () => {
      // আগের সিলেকশন সরিয়ে নতুন কার্ডে সবুজ টিক
      document.querySelectorAll('.service-card.selected').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      openOrderForm(s.id);
    };
    grid.appendChild(card);
  });
}

// ========== অর্ডার ফর্ম ==========
const serviceForms = {
  nid_number: { fields: [
    { name: 'নাম *', id: 'name', required: true }, { name: 'এনআইডি নম্বর *', id: 'nid', required: true },
    { name: 'জন্ম তারিখ', id: 'dob', type: 'date' }
  ], rate: 300 },
  voter_slip: { fields: [
    { name: 'নাম *', id: 'name', required: true }, { name: 'ভোটার স্লিপ নম্বর *', id: 'voter_slip', required: true },
    { name: 'জন্ম তারিখ', id: 'dob', type: 'date' }
  ], rate: 350 },
  voter_number: { fields: [
    { name: 'নাম *', id: 'name', required: true }, { name: 'ভোটার নম্বর *', id: 'voter_no', required: true },
    { name: 'জন্ম তারিখ', id: 'dob', type: 'date' }
  ], rate: 400 },
  server_copy: { fields: [
    { name: 'এনআইডি নম্বর *', id: 'nid', required: true }, { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }
  ], rate: 150 },
  smart_card: { fields: [
    { name: 'নাম *', id: 'name', required: true }, { name: 'এনআইডি নম্বর *', id: 'nid', required: true },
    { name: 'জন্ম তারিখ', id: 'dob', type: 'date' }
  ], rate: 400 },
  bl_bio: { fields: [{ name: 'নাম্বার *', id: 'number', required: true }], rate: 600 },
  gp_bio: { fields: [{ name: 'নাম্বার *', id: 'number', required: true }], rate: 650 },
  robi_bio: { fields: [{ name: 'নাম্বার *', id: 'number', required: true }], rate: 700 },
  teletalk_bio: { fields: [{ name: 'নাম্বার *', id: 'number', required: true }], rate: 550 },
  sim_location: { fields: [{ name: 'নাম্বার *', id: 'number', required: true }], rate: 850 },
  lost_id: { fields: [
    { name: 'নাম *', id: 'name', required: true }, { name: 'পিতার নাম *', id: 'father', required: true },
    { name: 'মাতার নাম *', id: 'mother', required: true }, { name: 'জন্ম নিবন্ধন নাম্বার', id: 'birth_reg_no' },
    { name: 'বিভাগের নাম *', id: 'division', required: true }, { name: 'জেলার নাম *', id: 'district', required: true },
    { name: 'উপজেলার নাম *', id: 'upazila', required: true }, { name: 'ইউনিয়নের নাম *', id: 'union', required: true },
    { name: 'ওয়ার্ড নম্বর *', id: 'ward', required: true }, { name: 'গ্রামের নাম *', id: 'village', required: true }
  ], rate: 2000 },
  nid_to_sim: { fields: [{ name: 'এনআইডি নাম্বার *', id: 'nid', required: true }], rate: 900 },
  lost_etin: { fields: [{ name: 'NID/e-TIN/Passport/Mobile *', id: 'identifier', required: true }], rate: 200 },
  imei_active: { fields: [
    { name: 'IMEI 1 *', id: 'imei1', required: true }, { name: 'IMEI 2', id: 'imei2' },
    { name: 'হারানোর তারিখ *', id: 'lost_date', type: 'date', required: true },
    { name: 'সর্বশেষ ব্যবহৃত মোবাইল নং *', id: 'last_number', required: true }
  ], rate: 900 },
  lost_nid_form_nid: { fields: [
    { name: 'এনআইডি নম্বর *', id: 'nid', required: true }, { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }
  ], rate: 500 },
  lost_nid_form_user: { fields: [
    { name: 'ইউজার নেম *', id: 'username', required: true }, { name: 'পাসওয়ার্ড *', id: 'password', type: 'password', required: true }
  ], rate: 300 },
  birth_normal: { fields: [
    { section: 'ব্যক্তিগত তথ্য' },
    { name: 'নাম (বাংলা) *', id: 'name_bn', required: true }, { name: 'নাম (ইংরেজি) *', id: 'name_en', required: true },
    { name: 'লিঙ্গ *', id: 'gender', type: 'select', options: ['পুরুষ', 'মহিলা'], required: true },
    { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }, { name: 'জন্মস্থান *', id: 'birth_place', required: true },
    { section: 'পিতার তথ্য' },
    { name: 'পিতার নাম (বাংলা) *', id: 'father_bn', required: true }, { name: 'পিতার নাম (ইংরেজি) *', id: 'father_en', required: true },
    { section: 'মাতার তথ্য' },
    { name: 'মাতার নাম (বাংলা) *', id: 'mother_bn', required: true }, { name: 'মাতার নাম (ইংরেজি) *', id: 'mother_en', required: true },
    { name: 'মোবাইল নম্বর *', id: 'mobile', required: true },
    { section: 'স্থায়ী ঠিকানা' },
    { name: 'বিভাগ *', id: 'division', required: true }, { name: 'জেলা *', id: 'district', required: true },
    { name: 'উপজেলা *', id: 'upazila', required: true }, { name: 'ইউনিয়ন *', id: 'union', required: true },
    { name: 'পোস্ট অফিস *', id: 'post_office', required: true }, { name: 'ওয়ার্ড নম্বর *', id: 'ward', required: true },
    { name: 'গ্রাম *', id: 'village', required: true }
  ], rate: 2400 },
  birth_minister: { fields: [
    { section: 'ব্যক্তিগত তথ্য' },
    { name: 'নাম (বাংলা) *', id: 'name_bn', required: true }, { name: 'নাম (ইংরেজি) *', id: 'name_en', required: true },
    { name: 'লিঙ্গ *', id: 'gender', type: 'select', options: ['পুরুষ', 'মহিলা'], required: true },
    { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }, { name: 'জন্মস্থান *', id: 'birth_place', required: true },
    { section: 'পিতার তথ্য' },
    { name: 'পিতার নাম (বাংলা) *', id: 'father_bn', required: true }, { name: 'পিতার নাম (ইংরেজি) *', id: 'father_en', required: true },
    { section: 'মাতার তথ্য' },
    { name: 'মাতার নাম (বাংলা) *', id: 'mother_bn', required: true }, { name: 'মাতার নাম (ইংরেজি) *', id: 'mother_en', required: true },
    { name: 'মোবাইল নম্বর *', id: 'mobile', required: true },
    { section: 'স্থায়ী ঠিকানা' },
    { name: 'বিভাগ *', id: 'division', required: true }, { name: 'জেলা *', id: 'district', required: true },
    { name: 'উপজেলা *', id: 'upazila', required: true }, { name: 'ইউনিয়ন *', id: 'union', required: true },
    { name: 'পোস্ট অফিস *', id: 'post_office', required: true }, { name: 'ওয়ার্ড নম্বর *', id: 'ward', required: true },
    { name: 'গ্রাম *', id: 'village', required: true }
  ], rate: 3200 }
};

function openOrderForm(serviceId) {
  if (!currentUser) return toast('প্রথমে লগইন করুন'), showLoginForm();
  const formDef = serviceForms[serviceId];
  if (!formDef) return toast('ফর্ম নেই');
  const app = $('app');
  let html = `<button class="back-btn" onclick="renderHome()">← ফিরে যান</button>
    <h2 class="page-title">${getServiceName(serviceId)}</h2>
    <div class="charge-box">💰 সার্ভিস চার্জ: ${formDef.rate} টাকা</div>
    <div class="copy-row">
      <span>📱 নগদ নাম্বার: <strong>${NAGAD_NUMBER}</strong></span>
      <button onclick="copyText('${NAGAD_NUMBER}')"><i class="far fa-copy"></i></button>
      <button onclick="copyText('${NAGAD_NUMBER}')"><i class="far fa-clipboard"></i></button>
    </div>
    <form id="orderForm" onsubmit="submitOrder(event, '${serviceId}')">`;
  formDef.fields.forEach(f => {
    if (f.section) { html += `<h4 style="margin-top:15px;color:#1a73e8;">${f.section}</h4>`; return; }
    html += `<div class="form-group"><label>${f.name} ${f.required ? '<span class="req-star">*</span>' : ''}</label>`;
    if (f.type === 'select') {
      html += `<select id="field_${f.id}" ${f.required ? 'required' : ''}><option value="">নির্বাচন করুন</option>`;
      f.options.forEach(o => html += `<option value="${o}">${o}</option>`);
      html += '</select>';
    } else {
      html += `<input type="${f.type || 'text'}" id="field_${f.id}" placeholder="${f.name.replace(' *', '')} লিখুন" ${f.required ? 'required' : ''}>`;
    }
    html += '</div>';
  });
  html += `<div class="form-group"><label>ট্রানজেকশন আইডি <span class="req-star">*</span></label>
      <input type="text" id="txnId" placeholder="নগদ থেকে Send Money-র ট্রানজেকশন আইডি লিখুন" required>
    </div>
    <button type="submit" class="btn-primary">✅ অর্ডার সাবমিট করুন</button></form>`;
  app.innerHTML = html;
}

function getServiceName(id) {
  const map = {
    nid_number: 'এনআইডি নম্বর', voter_slip: 'ভোটার স্লিপ নম্বর', voter_number: 'ভোটার নম্বর',
    server_copy: 'সার্ভার কপি', smart_card: 'স্মার্ট কার্ড', bl_bio: 'বাংলালিংক বায়োমেট্রিক',
    gp_bio: 'গ্রামীণ বায়োমেট্রিক', robi_bio: 'রবি/এয়ারটেল বায়োমেট্রিক', teletalk_bio: 'টেলিটক বায়োমেট্রিক',
    sim_location: 'সিম নাম্বার লোকেশন', lost_id: 'হারানো আইডি কার্ড', nid_to_sim: 'এনআইডি টু সকল সিম',
    lost_etin: 'হারানো ই-টিন', imei_active: 'IMEI To Active Number',
    lost_nid_form_nid: 'হারানো এনআইডি (এনআইডি)', lost_nid_form_user: 'হারানো এনআইডি (ইউজার)',
    birth_normal: 'নরমাল নিবন্ধন', birth_minister: 'মিনিস্টার নিবন্ধন'
  };
  return map[id] || id;
}
function copyText(txt) { navigator.clipboard.writeText(txt).then(() => toast('কপি করা হয়েছে')).catch(() => toast('কপি ব্যর্থ')); }
async function submitOrder(e, serviceId) {
  e.preventDefault();
  const formDef = serviceForms[serviceId];
  const txnId = document.getElementById('txnId')?.value.trim();
  if (!txnId) return toast('ট্রানজেকশন আইডি দিন');
  const formData = {};
  formDef.fields.forEach(f => {
    if (f.section) return;
    const el = document.getElementById('field_' + f.id);
    if (el) formData[f.id] = el.value.trim();
  });
  for (let f of formDef.fields) {
    if (f.required && !formData[f.id]) return toast(`"${f.name.replace(' *', '')}" পূরণ করুন`);
  }
  const res = await apiCall('placeOrder', {
    userId: currentUser.userId, serviceId, formData: JSON.stringify(formData), transactionId: txnId
  });
  if (res.success) { toast('অর্ডার সফলভাবে জমা হয়েছে'); renderMyOrders(); }
  else toast(res.message || 'অর্ডার ব্যর্থ');
}

// ========== আমার অর্ডার ==========
async function renderMyOrders() {
  if (!currentUser) return toast('লগইন করুন'), showLoginForm();
  const app = $('app'); app.innerHTML = '<h2 class="page-title">আমার অর্ডার</h2><div id="ordersTable"></div>';
  const res = await apiCall('getOrders', { userId: currentUser.userId });
  const orders = res.orders || [];
  if (!orders.length) return $('ordersTable').innerHTML = '<p>কোনো অর্ডার নেই</p>';
  let html = '<table><thead><tr><th>SL</th><th>সার্ভিস</th><th>তথ্য</th><th>টাকা</th><th>স্ট্যাটাস</th><th>ডেলিভারি</th></tr></thead><tbody>';
  orders.forEach((o, i) => {
    let deliveryHtml = '';
    if (o.status === 'delivered') {
      if (o.deliveryLink) deliveryHtml = `<a href="${o.deliveryLink}" target="_blank">ডাউনলোড</a>`;
      else if (o.deliveryText) deliveryHtml = `<span class="order-detail-pop" onclick="alert('${o.deliveryText.replace(/'/g, "\\'")}')">তথ্য দেখুন</span>`;
      else deliveryHtml = 'সম্পন্ন';
    } else if (o.status === 'cancelled') deliveryHtml = 'বাতিল';
    else deliveryHtml = '⏳ পেন্ডিং';
    html += `<tr><td>${i + 1}</td><td>${getServiceName(o.serviceId)}</td>
      <td><span class="order-detail-pop" onclick="showOrderDetail('${o.formData}')">দেখুন</span></td>
      <td>${o.amount}৳</td><td>${o.status === 'pending' ? 'পেন্ডিং' : o.status === 'delivered' ? 'সম্পন্ন' : 'বাতিল'}</td>
      <td>${deliveryHtml}</td></tr>`;
  });
  html += '</tbody></table>'; $('ordersTable').innerHTML = html;
}
function showOrderDetail(data) {
  try {
    const obj = JSON.parse(data); let text = '';
    for (let k in obj) text += `${k}: ${obj[k]}\n`;
    alert(text || 'কোন তথ্য নেই');
  } catch (e) { alert(data); }
}

// ========== অ্যাডমিন ==========
async function renderAdminPanel() {
  if (!currentUser || currentUser.role !== 'admin') return toast('অ্যাক্সেস নেই');
  const app = $('app');
  app.innerHTML = `<h2 class="page-title">অ্যাডমিন প্যানেল</h2>
    <div class="admin-tabs">
      <button class="active" onclick="adminTab('dashboard')">ড্যাশবোর্ড</button>
      <button onclick="adminTab('orders')">অর্ডার</button>
      <button onclick="adminTab('services')">সার্ভিস</button>
      <button onclick="adminTab('notice')">নোটিশ</button>
      <button onclick="adminTab('users')">ইউজার</button>
    </div><div id="adminContent"></div>`;
  adminTab('dashboard');
}
async function adminTab(tab) {
  const content = $('adminContent');
  document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (tab === 'dashboard') {
    const stats = await apiCall('getAdminStats');
    content.innerHTML = `<div class="stat-cards">
      <div class="stat-card"><h3>মোট অর্ডার</h3><div class="num">${stats.total || 0}</div></div>
      <div class="stat-card"><h3>পেন্ডিং</h3><div class="num">${stats.pending || 0}</div></div>
      <div class="stat-card"><h3>সম্পন্ন</h3><div class="num">${stats.delivered || 0}</div></div>
      <div class="stat-card"><h3>বাতিল</h3><div class="num">${stats.cancelled || 0}</div></div>
      <div class="stat-card"><h3>মোট আয়</h3><div class="num">${stats.revenue || 0}৳</div></div>
    </div>`;
  } else if (tab === 'orders') {
    const res = await apiCall('adminGetOrders');
    let html = '<table><thead><tr><th>ID</th><th>ইউজার</th><th>সার্ভিস</th><th>টাকা</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead><tbody>';
    (res.orders || []).forEach(o => {
      html += `<tr><td>${o.orderId}</td><td>${o.userId}</td><td>${getServiceName(o.serviceId)}</td>
        <td>${o.amount}৳</td><td>${o.status}</td>
        <td><button onclick="deliverOrder(${o.orderId})">ডেলিভার</button>
        <button onclick="cancelOrder(${o.orderId})">বাতিল</button></td></tr>`;
    });
    html += '</tbody></table>'; content.innerHTML = html;
  } else if (tab === 'services') {
    const res = await apiCall('getConfig');
    let html = '<table><thead><tr><th>সার্ভিস</th><th>রেট</th><th>স্ট্যাটাস</th><th>টগল</th></tr></thead><tbody>';
    (res.config || []).forEach(c => {
      html += `<tr><td>${c.serviceName || c.serviceId}</td><td>${c.rate}৳</td>
        <td>${c.isActive ? '✅ চালু' : '❌ বন্ধ'}</td>
        <td><button onclick="toggleService('${c.serviceId}', ${!c.isActive})">${c.isActive ? 'বন্ধ করুন' : 'চালু করুন'}</button></td></tr>`;
    });
    html += '</tbody></table>'; content.innerHTML = html;
  } else if (tab === 'notice') {
    content.innerHTML = `<textarea id="noticeInput" style="width:100%;height:80px">${noticeText}</textarea>
      <button class="btn-primary" onclick="updateNotice()">আপডেট নোটিশ</button>`;
  } else if (tab === 'users') {
    const res = await apiCall('getUsers');
    let html = '<table><thead><tr><th>ID</th><th>নাম</th><th>ফোন</th><th>হোয়াটসঅ্যাপ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead><tbody>';
    (res.users || []).forEach(u => {
      html += `<tr><td>${u.userId}</td><td>${u.name}</td><td>${u.phone}</td><td>${u.whatsapp || '-'}</td>
        <td>${u.isBlocked ? '🚫 ব্লক' : '✅ সক্রিয়'}</td>
        <td><button onclick="blockUser('${u.userId}', ${!u.isBlocked})">${u.isBlocked ? 'আনব্লক' : 'ব্লক'}</button></td></tr>`;
    });
    html += '</tbody></table>'; content.innerHTML = html;
  }
}
async function deliverOrder(orderId) {
  const type = prompt('ডেলিভারি টাইপ: "text" অথবা "link"');
  if (type === 'text') {
    const text = prompt('টেক্সট দিন');
    if (text) { await apiCall('updateOrder', { orderId, status: 'delivered', deliveryText: text }); adminTab('orders'); }
  } else if (type === 'link') {
    const link = prompt('লিংক দিন');
    if (link) { await apiCall('updateOrder', { orderId, status: 'delivered', deliveryLink: link }); adminTab('orders'); }
  }
}
async function cancelOrder(orderId) {
  if (confirm('অর্ডার বাতিল করবেন?')) { await apiCall('updateOrder', { orderId, status: 'cancelled' }); adminTab('orders'); }
}
async function toggleService(sid, active) { await apiCall('updateConfig', { serviceId: sid, isActive: active }); adminTab('services'); }
async function updateNotice() {
  const txt = document.getElementById('noticeInput')?.value || '';
  await apiCall('updateNotice', { text: txt }); noticeText = txt;
  $('noticeBanner').textContent = txt; $('noticeBanner').style.display = txt ? 'block' : 'none'; toast('নোটিশ আপডেট হয়েছে');
}
async function blockUser(userId, block) { await apiCall('blockUser', { userId, block }); adminTab('users'); }

// ========== লগইন/রেজিস্টার পেইজ ==========
function showLoginForm() {
  $('app').innerHTML = `<h2 class="page-title">লগইন</h2>
    <div class="form-group"><label>মোবাইল নাম্বার</label><input id="loginPhone" placeholder="01xxxxxxxxx"></div>
    <div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="loginPass" placeholder="পাসওয়ার্ড লিখুন"></div>
    <button class="btn-primary" onclick="doLogin()">লগইন</button>
    <p style="margin-top:10px;text-align:center">অথবা <a href="#" onclick="showRegisterForm()">নতুন অ্যাকাউন্ট খুলুন</a></p>
    <hr style="margin:20px 0"><p style="text-align:center"><a href="#" onclick="showAdminLoginForm()">অ্যাডমিন লগইন</a></p>`;
}
function showRegisterForm() {
  $('app').innerHTML = `<h2 class="page-title">নতুন অ্যাকাউন্ট</h2>
    <div class="form-group"><label>নাম <span class="req-star">*</span></label><input id="regName" placeholder="আপনার নাম লিখুন"></div>
    <div class="form-group"><label>মোবাইল নাম্বার <span class="req-star">*</span></label><input id="regPhone" placeholder="01xxxxxxxxx"></div>
    <div class="form-group"><label>হোয়াটসঅ্যাপ নাম্বার</label><input id="regWhatsapp" placeholder="01xxxxxxxxx (ঐচ্ছিক)"></div>
    <div class="form-group"><label>পাসওয়ার্ড <span class="req-star">*</span></label><input type="password" id="regPass" placeholder="পাসওয়ার্ড লিখুন"></div>
    <button class="btn-primary" onclick="doRegister()">রেজিস্টার</button>
    <p style="margin-top:10px;text-align:center">ইতিমধ্যে অ্যাকাউন্ট আছে? <a href="#" onclick="showLoginForm()">লগইন</a></p>`;
}
function showAdminLoginForm() {
  $('app').innerHTML = `<h2 class="page-title">অ্যাডমিন লগইন</h2>
    <div class="form-group"><label>ইউজারনেম</label><input id="adminUser" placeholder="ইউজারনেম লিখুন"></div>
    <div class="form-group"><label>পাসওয়ার্ড</label><input type="password" id="adminPass" placeholder="পাসওয়ার্ড লিখুন"></div>
    <button class="btn-primary" onclick="doAdminLogin()">লগইন</button>`;
}

// ========== কনফিগ লোড ==========
async function loadConfig() {
  try {
    const res = await apiCall('getConfig'); if (res.config) servicesConfig = res.config;
    const nres = await apiCall('getNotice');
    if (nres.notice) { noticeText = nres.notice; $('noticeBanner').textContent = noticeText; $('noticeBanner').style.display = 'block'; }
  } catch (e) {}
}

// ========== শুরু ==========
(function init() {
  const uid = getCookie('userId'), uname = getCookie('userName'), uphone = getCookie('userPhone'), admin = getCookie('adminLogged');
  if (admin === '1') currentUser = { role: 'admin', name: 'Admin' };
  else if (uid) currentUser = { userId: uid, name: uname, phone: uphone };
  updateNav();
  if (currentUser?.role === 'admin') renderAdminPanel();
  else renderHome();
  $('homeBtn').addEventListener('click', renderHome);
  $('myOrdersBtn').addEventListener('click', renderMyOrders);
  $('loginBtn').addEventListener('click', showLoginForm);
  $('registerBtn').addEventListener('click', showRegisterForm);
  $('logoutBtn').addEventListener('click', logout);
})();