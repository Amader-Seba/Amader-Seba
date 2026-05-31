// ------------------- SHA256 -------------------
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxPXTAFcqFvvrQbi9fccdyrVquaY_mceDZ46CIqIuTdq8c6E9O1FeTaxc9s3YPhXVc6/exec';
const NAGAD_NUMBER = '01750077399';

// Local DB Keys
const LOCAL_USERS_KEY = 'amader_seba_local_users';
const LOCAL_ORDERS_KEY = 'amader_seba_local_orders';
const LOCAL_NOTICE_KEY = 'amader_seba_local_notice';
const LOCAL_RECHARGES_KEY = 'amader_seba_local_recharges';

function getLocalUsersList() {
  const stored = localStorage.getItem(LOCAL_USERS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    let updated = false;
    parsed.forEach(u => { if (u.balance === undefined) { u.balance = u.role === 'admin' ? 1000000 : 0; updated = true; } });
    if (updated) localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    return parsed;
  }
  const list = [{ userId: 1, name: 'সন্তুষ্ট অ্যাডমিন', phone: '01951775777', passwordHash: 'e59005a3068e64c39129dfcf5617bf1dbdfef9f9393e25b0451cf280c2f2c8ec', whatsapp: '01951775777', isBlocked: false, role: 'admin', balance: 1000000 }];
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list));
  return list;
}

function getLocalRechargesList() { return JSON.parse(localStorage.getItem(LOCAL_RECHARGES_KEY) || '[]'); }
function getLocalOrdersList() { return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]'); }

async function apiCall(action, data = {}) {
  try {
    const urlObj = new URL(DEFAULT_API_URL);
    urlObj.searchParams.set('action', action);
    for (const [k, v] of Object.entries(data)) if (v !== undefined) urlObj.searchParams.set(k, String(v));
    const res = await fetch(urlObj.toString(), { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return simulateLocalApi(action, data);
  }
}

function simulateLocalApi(action, p) {
  const users = getLocalUsersList();
  const orders = getLocalOrdersList();
  let recharges = getLocalRechargesList();
  
  if (action === 'register') {
    if (users.some(u => u.phone === p.phone)) return { success: false, message: 'এই নাম্বার ইতিমধ্যে নিবন্ধিত' };
    const newUserId = users.length + 1;
    users.push({ userId: newUserId, name: p.name, phone: p.phone, whatsapp: p.whatsapp || '', passwordHash: p.passwordHash, isBlocked: false, role: 'user', balance: 0, createdAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    return { success: true, userId: newUserId, name: p.name, phone: p.phone, role: 'user', balance: 0 };
  }
  if (action === 'login') {
    const user = users.find(u => u.phone === p.phone && u.passwordHash === p.passwordHash);
    if (!user) return { success: false, message: 'ভুল ফোন বা পাসওয়ার্ড' };
    if (user.isBlocked) return { success: false, message: 'আপনার অ্যাকাউন্ট ব্লক করা হয়েছে' };
    return { success: true, userId: user.userId, name: user.name, phone: user.phone, balance: user.balance ?? 0, role: user.role || 'user' };
  }
  if (action === 'placeOrder') {
    const idx = users.findIndex(u => String(u.userId) === String(p.userId));
    if (idx === -1) return { success: false, message: 'ইউজার পাওয়া যায়নি' };
    const rate = Number(p.rate) || 0;
    if ((users[idx].balance || 0) < rate) return { success: false, message: 'পর্যাপ্ত ব্যালেন্স নেই' };
    users[idx].balance -= rate;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    const newOrderId = orders.length + 1;
    orders.push({ orderId: newOrderId, userId: p.userId, serviceId: p.serviceId, formData: p.formData, amount: rate, status: 'pending', deliveryText: '', deliveryLink: '', createdAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    return { success: true, orderId: newOrderId, updatedBalance: users[idx].balance };
  }
  if (action === 'getOrders') return { success: true, orders: orders.filter(o => String(o.userId) === String(p.userId)).reverse() };
  if (action === 'adminGetOrders') return { success: true, orders: [...orders].reverse() };
  if (action === 'updateOrder') {
    const oidx = orders.findIndex(o => String(o.orderId) === String(p.orderId));
    if (oidx !== -1) {
      if (p.status) orders[oidx].status = p.status;
      if (p.deliveryText !== undefined) orders[oidx].deliveryText = p.deliveryText;
      if (p.deliveryLink !== undefined) orders[oidx].deliveryLink = p.deliveryLink;
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
      return { success: true };
    }
    return { success: false };
  }
  if (action === 'getNotice') return { success: true, notice: localStorage.getItem(LOCAL_NOTICE_KEY) || 'আমাদের সেবা পোর্টাল-এ স্বাগতম!' };
  if (action === 'updateNotice') { localStorage.setItem(LOCAL_NOTICE_KEY, p.text); return { success: true }; }
  if (action === 'getUsers') return { success: true, users: users.map(u => ({ userId: u.userId, name: u.name, phone: u.phone, isBlocked: u.isBlocked, role: u.role || 'user', balance: u.balance ?? 0 })) };
  if (action === 'blockUser') {
    const idx = users.findIndex(u => String(u.userId) === String(p.userId));
    if (idx !== -1) { users[idx].isBlocked = (p.block === 'true' || p.block === true); localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users)); return { success: true }; }
    return { success: false };
  }
  if (action === 'updateUserBalance') {
    const idx = users.findIndex(u => String(u.userId) === String(p.userId));
    if (idx !== -1) { users[idx].balance = Number(p.balance) || 0; localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users)); return { success: true }; }
    return { success: false };
  }
  if (action === 'submitRecharge') {
    const amount = Number(p.amount) || 0;
    if (amount < 300) return { success: false, message: 'সর্বনিম্ন ৩০০ টাকা রিচার্জ করা আবশ্যক' };
    const newId = recharges.length + 1;
    recharges.push({ rechargeId: newId, userId: p.userId, phone: p.phone, name: p.name || 'Unknown', amount, transactionId: (p.transactionId || '').trim(), status: 'pending', createdAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_RECHARGES_KEY, JSON.stringify(recharges));
    return { success: true, rechargeId: newId };
  }
  if (action === 'getUserRecharges') return { success: true, recharges: recharges.filter(r => String(r.userId) === String(p.userId)).reverse() };
  if (action === 'adminGetRecharges') return { success: true, recharges: [...recharges].reverse() };
  if (action === 'updateRechargeStatus') {
    const idx = recharges.findIndex(r => String(r.rechargeId) === String(p.rechargeId));
    if (idx !== -1) {
      const oldStatus = recharges[idx].status;
      const newStatus = p.status;
      recharges[idx].status = newStatus;
      localStorage.setItem(LOCAL_RECHARGES_KEY, JSON.stringify(recharges));
      if (oldStatus !== 'approved' && newStatus === 'approved') {
        const userIdx = users.findIndex(u => String(u.userId) === String(recharges[idx].userId));
        if (userIdx !== -1) {
          users[userIdx].balance = (Number(users[userIdx].balance) || 0) + Number(recharges[idx].amount);
          localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
        }
      }
      return { success: true };
    }
    return { success: false };
  }
  if (action === 'getAdminStats') {
    const total = orders.length, pending = orders.filter(o => o.status === 'pending').length, delivered = orders.filter(o => o.status === 'delivered').length, cancelled = orders.filter(o => o.status === 'cancelled').length;
    const revenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (Number(o.amount) || 0), 0);
    return { success: true, total, pending, delivered, cancelled, revenue };
  }
  return { success: false, message: 'অ্যাকশন ভুল' };
}

function toBanglaDigits(numStr) {
  const digits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return String(numStr).replace(/[0-9]/g, w => digits[w] || w);
}

const serviceForms = {
  nid_number: { id: 'nid_number', name: 'এনআইডি নাম্বার', rate: 300, fields: [{ name: 'নাম *', id: 'name', required: true }, { name: 'এনআইডি নম্বর *', id: 'nid', required: true }, { name: 'জন্ম তারিখ', id: 'dob', type: 'date', required: true }] },
  voter_slip: { id: 'voter_slip', name: 'ভোটার স্লিপ নম্বর', rate: 350, fields: [{ name: 'নাম *', id: 'name', required: true }, { name: 'ভোটার স্লিপ নম্বর *', id: 'voter_slip', required: true }, { name: 'জন্ম তারিখ', id: 'dob', type: 'date', required: true }] },
  voter_number: { id: 'voter_number', name: 'ভোটার নম্বর', rate: 400, fields: [{ name: 'নাম *', id: 'name', required: true }, { name: 'ভোটার নম্বর *', id: 'voter_no', required: true }, { name: 'জন্ম তারিখ', id: 'dob', type: 'date', required: true }] },
  server_copy: { id: 'server_copy', name: 'সার্ভার কপি', rate: 150, fields: [{ name: 'এনআইডি নম্বর *', id: 'nid', required: true }, { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }] },
  smart_card: { id: 'smart_card', name: 'স্মার্ট কার্ড', rate: 400, fields: [{ name: 'নাম *', id: 'name', required: true }, { name: 'এনআইডি নম্বর *', id: 'nid', required: true }, { name: 'জন্ম তারিখ', id: 'dob', type: 'date', required: true }] },
  bl_bio: { id: 'bl_bio', name: 'বাংলালিংক', rate: 600, fields: [{ name: 'নাম্বার *', id: 'number', required: true }] },
  gp_bio: { id: 'gp_bio', name: 'গ্রামীণ', rate: 650, fields: [{ name: 'নাম্বার *', id: 'number', required: true }] },
  robi_bio: { id: 'robi_bio', name: 'রবি/এয়ারটেল', rate: 700, fields: [{ name: 'নাম্বার *', id: 'number', required: true }] },
  teletalk_bio: { id: 'teletalk_bio', name: 'টেলিটক', rate: 550, fields: [{ name: 'নাম্বার *', id: 'number', required: true }] },
  sim_location: { id: 'sim_location', name: 'সিম নাম্বার লোকেশন', rate: 850, fields: [{ name: 'সিম নাম্বার *', id: 'number', required: true }] },
  lost_id: { id: 'lost_id', name: 'হারানো আইডি কার্ড', rate: 2000, fields: [{ name: 'নাম *', id: 'name', required: true }, { name: 'পিতার নাম *', id: 'father', required: true }, { name: 'মাতার নাম *', id: 'mother', required: true }, { name: 'জন্ম নিবন্ধন নাম্বার', id: 'birth_reg_no', required: false }, { name: 'বিভাগের নাম *', id: 'division', required: true }, { name: 'জেলার নাম *', id: 'district', required: true }, { name: 'উপজেলার নাম *', id: 'upazila', required: true }, { name: 'ইউনিয়নের নাম *', id: 'union', required: true }, { name: 'ওয়ার্ড নম্বর *', id: 'ward', required: true }, { name: 'গ্রামের নাম *', id: 'village', required: true }] },
  nid_to_sim: { id: 'nid_to_sim', name: 'এনআইডি টু সকল সিম', rate: 900, fields: [{ name: 'এনআইডি নাম্বার *', id: 'nid', required: true }] },
  lost_etin: { id: 'lost_etin', name: 'হারানো ই-টিন', rate: 200, fields: [{ name: 'Nid No/e-Tin No/Passport No/Mobile No *', id: 'identifier', required: true }] },
  imei_active: { id: 'imei_active', name: 'IMEI To Active', rate: 900, fields: [{ name: 'IMEI 1 *', id: 'imei1', required: true }, { name: 'IMEI 2', id: 'imei2', required: false }, { name: 'হারানোর তারিখ *', id: 'lost_date', type: 'date', required: true }, { name: 'সর্বশেষ ব্যবহৃত মোবাইল নং *', id: 'last_mobile', required: true }] },
  lost_nid_form_nid: { id: 'lost_nid_form_nid', name: 'এনআইডি নাম্বার দিয়ে', rate: 500, fields: [{ name: 'এনআইডি নম্বর *', id: 'nid', required: true }, { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }] },
  lost_nid_form_user: { id: 'lost_nid_form_user', name: 'ইউজার নেম এবং পাসওয়ার্ড দিয়ে', rate: 300, fields: [{ name: 'ইউজার নেম *', id: 'username', required: true }, { name: 'পাসওয়ার্ড *', id: 'password', required: true, type: 'password' }] },
  birth_normal: { id: 'birth_normal', name: 'নরমাল নিবন্ধন', rate: 2400, fields: [{ name: 'নাম (বাংলা)*', id: 'name_bn', required: true }, { name: 'নাম (ইংরেজি)*', id: 'name_en', required: true }, { name: 'লিঙ্গ *', id: 'gender', required: true }, { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }, { name: 'জন্মস্থান *', id: 'birthplace', required: true }, { name: 'পিতার নাম (বাংলা) *', id: 'father_bn', required: true }, { name: 'পিতার নাম (ইংরেজি) *', id: 'father_en', required: true }, { name: 'মাতার নাম (বাংলা) *', id: 'mother_bn', required: true }, { name: 'মাতার নাম (ইংরেজি) *', id: 'mother_en', required: true }, { name: 'মোবাইল নম্বর *', id: 'mobile', required: true }, { name: 'বিভাগ *', id: 'division', required: true }, { name: 'জেলা *', id: 'district', required: true }, { name: 'উপজেলা *', id: 'upazila', required: true }, { name: 'ইউনিয়ন *', id: 'union', required: true }, { name: 'পোস্ট অফিস *', id: 'post_office', required: true }, { name: 'ওয়ার্ড নম্বর *', id: 'ward', required: true }, { name: 'গ্রাম *', id: 'village', required: true }] },
  birth_minister: { id: 'birth_minister', name: 'মিনিস্টার নিবন্ধন', rate: 3200, fields: [{ name: 'নাম (বাংলা)*', id: 'name_bn', required: true }, { name: 'নাম (ইংরেজি)*', id: 'name_en', required: true }, { name: 'লিঙ্গ *', id: 'gender', required: true }, { name: 'জন্ম তারিখ *', id: 'dob', type: 'date', required: true }, { name: 'জন্মস্থান *', id: 'birthplace', required: true }, { name: 'পিতার নাম (বাংলা) *', id: 'father_bn', required: true }, { name: 'পিতার নাম (ইংরেজি) *', id: 'father_en', required: true }, { name: 'মাতার নাম (বাংলা) *', id: 'mother_bn', required: true }, { name: 'মাতার নাম (ইংরেজি) *', id: 'mother_en', required: true }, { name: 'মোবাইল নম্বর *', id: 'mobile', required: true }, { name: 'বিভাগ *', id: 'division', required: true }, { name: 'জেলা *', id: 'district', required: true }, { name: 'উপজেলা *', id: 'upazila', required: true }, { name: 'ইউনিয়ন *', id: 'union', required: true }, { name: 'পোস্ট অফিস *', id: 'post_office', required: true }, { name: 'ওয়ার্ড নম্বর *', id: 'ward', required: true }, { name: 'গ্রাম *', id: 'village', required: true }] }
};

const parentGroups = {
  nid_card: { id: 'nid_card', name: 'এনআইডি কার্ড', icon: 'IdCard', children: ['nid_number', 'voter_slip', 'voter_number', 'server_copy', 'smart_card'] },
  sim_biometric: { id: 'sim_biometric', name: 'সিম বায়োমেট্রিক', icon: 'SimCard', children: ['bl_bio', 'gp_bio', 'robi_bio', 'teletalk_bio'] },
  lost_nid_form: { id: 'lost_nid_form', name: 'হারানো এনআইডি আবেদন ফরম', icon: 'FileUp', children: ['lost_nid_form_nid', 'lost_nid_form_user'] },
  birth_reg: { id: 'birth_reg', name: 'নতুন জন্ম নিবন্ধন', icon: 'Baby', children: ['birth_normal', 'birth_minister'] }
};

// Icons map
function getIcon(name) {
  const icons = { HandHeart: '🤲', HomeIcon: '🏠', Coins: '💰', Settings: '⚙️', Users: '👥', RefreshCw: '🔄', Eye: '👁️', Download: '⬇️', Copy: '📋', Check: '✓', X: '✕', Menu: '☰', LogIn: '🔑', UserPlus: '👤+', LogOut: '🚪', IdCard: '🪪', Smartphone: '📱', MapPin: '📍', FileText: '📄', Baby: '👶', Megaphone: '📢', Info: 'ℹ️' };
  return icons[name] || '📦';
}

// React App
function App() {
  const [currentScreen, setCurrentScreen] = React.useState('landing');
  const [currentUser, setCurrentUser] = React.useState(null);
  const [notice, setNotice] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [hamburgerOpen, setHamburgerOpen] = React.useState(false);
  const [selectedParentGroupId, setSelectedParentGroupId] = React.useState('');
  const [selectedServiceId, setSelectedServiceId] = React.useState('');
  const [formData, setFormData] = React.useState({});
  const [myOrdersList, setMyOrdersList] = React.useState([]);
  const [subGroupOrdersList, setSubGroupOrdersList] = React.useState([]);
  const [adminRecharges, setAdminRecharges] = React.useState([]);
  const [userRecharges, setUserRecharges] = React.useState([]);
  const [rechargeAmount, setRechargeAmount] = React.useState('');
  const [rechargeTxnId, setRechargeTxnId] = React.useState('');
  const [adminActiveTab, setAdminActiveTab] = React.useState('dashboard');
  const [adminOrders, setAdminOrders] = React.useState([]);
  const [adminUsers, setAdminUsers] = React.useState([]);
  const [adminNoticeInput, setAdminNoticeInput] = React.useState('');
  const [adminStats, setAdminStats] = React.useState({ total: 0, pending: 0, delivered: 0, cancelled: 0, revenue: 0 });
  const [deliveryModalOpen, setDeliveryModalOpen] = React.useState(false);
  const [deliveryOrderId, setDeliveryOrderId] = React.useState(null);
  const [deliveryDataType, setDeliveryDataType] = React.useState('text');
  const [deliveryInputVal, setDeliveryInputVal] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalContent, setModalContent] = React.useState('');
  const [modalType, setModalType] = React.useState('text');
  const [loginPhone, setLoginPhone] = React.useState('');
  const [loginPass, setLoginPass] = React.useState('');
  const [regName, setRegName] = React.useState('');
  const [regPhone, setRegPhone] = React.useState('');
  const [regPass, setRegPass] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState('');

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };
  const copyText = (txt) => { navigator.clipboard.writeText(txt); showToast('কপি করা হয়েছে!'); };

  const refreshUserBalance = async (userIdStr) => {
    const target = userIdStr || localStorage.getItem('am_user_id') || currentUser?.userId;
    if (!target) return;
    const res = await apiCall('getUsers');
    if (res?.success && res.users) {
      const match = res.users.find(u => String(u.userId) === String(target));
      if (match) setCurrentUser(prev => prev ? { ...prev, balance: match.balance } : match);
    }
  };

  const loadAdminRecharges = async () => { setLoading(true); const res = await apiCall('adminGetRecharges'); if (res?.success) setAdminRecharges(res.recharges || []); setLoading(false); };
  const loadUserRecharges = async () => { const uid = localStorage.getItem('am_user_id') || currentUser?.userId; if (!uid) return; const res = await apiCall('getUserRecharges', { userId: uid }); if (res?.success) setUserRecharges(res.recharges || []); };
  
  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(rechargeAmount);
    if (amount < 300) return showToast('রিচার্জের পরিমাণ সর্বনিম্ন ৩০০ টাকা হতে হবে।');
    if (!rechargeTxnId.trim()) return showToast('ট্রানজেকশন আইডি দিন');
    setLoading(true);
    const res = await apiCall('submitRecharge', { userId: currentUser?.userId, phone: currentUser?.phone, name: currentUser?.name, amount, transactionId: rechargeTxnId.trim() });
    if (res?.success) { showToast('রিচার্জ রিকোয়েস্ট জমা হয়েছে!'); setRechargeAmount(''); setRechargeTxnId(''); loadUserRecharges(); } else showToast(res?.message || 'ব্যর্থ');
    setLoading(false);
  };

  const handleUpdateRechargeStatus = async (rechargeId, nextStatus) => {
    setLoading(true);
    const res = await apiCall('updateRechargeStatus', { rechargeId, status: nextStatus });
    if (res?.success) { showToast(nextStatus === 'approved' ? 'রিচার্জ অনুমোদিত ও ব্যালেন্স যুক্ত হয়েছে!' : 'রিচার্জ ব্যর্থ'); loadAdminRecharges(); refreshUserBalance(); } else showToast(res?.message);
    setLoading(false);
  };

  const fetchNotice = async () => { const res = await apiCall('getNotice'); if (res?.success) { setNotice(res.notice); setAdminNoticeInput(res.notice); } };
  
  React.useEffect(() => {
    const uid = localStorage.getItem('am_user_id'), name = localStorage.getItem('am_user_name'), phone = localStorage.getItem('am_user_phone'), role = localStorage.getItem('am_user_role');
    if (uid && name) { setCurrentUser({ userId: uid, name, phone, role: role || 'user', balance: 0 }); refreshUserBalance(uid); if (role === 'admin') setCurrentScreen('admin'); else setCurrentScreen('home'); }
    fetchNotice();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); if (!loginPhone || !loginPass) return showToast('মোবাইল ও পাসওয়ার্ড দিন');
    setLoading(true); const hash = await sha256(loginPass); const res = await apiCall('login', { phone: loginPhone, passwordHash: hash });
    if (res?.success) {
      const user = { userId: res.userId, name: res.name, phone: res.phone, role: res.role || 'user', balance: res.balance ?? 0 };
      setCurrentUser(user); localStorage.setItem('am_user_id', String(res.userId)); localStorage.setItem('am_user_name', res.name); localStorage.setItem('am_user_phone', res.phone); localStorage.setItem('am_user_role', res.role || 'user');
      showToast('লগইন সফল!'); setLoginPhone(''); setLoginPass('');
      if (user.role === 'admin') { setCurrentScreen('admin'); loadAdminStats(); } else setCurrentScreen('home');
    } else showToast(res?.message || 'লগইন ব্যর্থ');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); if (!regName || !regPhone || !regPass) return showToast('সব তথ্য পূরণ করুন');
    setLoading(true); const hash = await sha256(regPass); const res = await apiCall('register', { name: regName, phone: regPhone, whatsapp: '', passwordHash: hash });
    if (res?.success) { showToast('রেজিস্ট্রেশন সফল! লগইন করুন'); setRegName(''); setRegPhone(''); setRegPass(''); setCurrentScreen('login'); } else showToast(res?.message || 'ব্যর্থ');
    setLoading(false);
  };
  
  const handleLogout = () => { setCurrentUser(null); localStorage.clear(); showToast('লগআউট সম্পন্ন'); setCurrentScreen('landing'); };
  const fetchUserOrders = async () => { if (!currentUser) return; const res = await apiCall('getOrders', { userId: currentUser.userId }); if (res?.success) setMyOrdersList(res.orders || []); };
  
  const openParentGroup = (gid) => { if (currentUser && currentUser.role !== 'admin' && (currentUser.balance === undefined || currentUser.balance <= 0)) { showToast('ব্যালেন্স নেই! রিচার্জ করুন'); navigateTo('recharge'); return; } setSelectedParentGroupId(gid); setSelectedServiceId(''); setFormData({}); setCurrentScreen('subservices'); fetchSubGroupOrders(parentGroups[gid].children); };
  const openDirectService = (sid) => { if (currentUser && currentUser.role !== 'admin' && (currentUser.balance === undefined || currentUser.balance <= 0)) { showToast('ব্যালেন্স নেই! রিচার্জ করুন'); navigateTo('recharge'); return; } setSelectedServiceId(sid); setFormData({}); setCurrentScreen('direct_service'); fetchDirectServiceOrders(sid); };
  const fetchSubGroupOrders = async (childrenIds) => { if (!currentUser) return; const res = await apiCall('getOrders', { userId: currentUser.userId }); if (res?.success) setSubGroupOrdersList(res.orders.filter(o => childrenIds.includes(o.serviceId))); };
  const fetchDirectServiceOrders = async (sid) => { if (!currentUser) return; const res = await apiCall('getOrders', { userId: currentUser.userId }); if (res?.success) setSubGroupOrdersList(res.orders.filter(o => o.serviceId === sid)); };
  
  const handlePlaceOrder = async (e, sid) => {
    e.preventDefault(); const meta = serviceForms[sid]; if (!meta) return showToast('সার্ভিস ত্রুটি'); if ((currentUser.balance || 0) < meta.rate) return showToast(`পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন ৳${meta.rate}`);
    for (let f of meta.fields) if (f.required && !formData[f.id]) return showToast(`${f.name} পূরণ করুন`);
    setLoading(true);
    const res = await apiCall('placeOrder', { userId: currentUser.userId, serviceId: sid, formData: JSON.stringify(formData), rate: meta.rate });
    if (res?.success) { showToast('অর্ডার সফল!'); setFormData({}); if (selectedParentGroupId) fetchSubGroupOrders(parentGroups[selectedParentGroupId].children); else fetchDirectServiceOrders(sid); refreshUserBalance(); } else showToast('অর্ডার ব্যর্থ');
    setLoading(false);
  };
  
  const navigateTo = (screen) => { setHamburgerOpen(false); if (!currentUser && (screen === 'home' || screen === 'orders' || screen === 'subservices' || screen === 'admin')) { setCurrentScreen('landing'); return; } if (currentUser && currentUser.role !== 'admin' && screen === 'admin') return; setCurrentScreen(screen); if (screen === 'home') { fetchNotice(); refreshUserBalance(); } else if (screen === 'orders') fetchUserOrders(); else if (screen === 'recharge') { loadUserRecharges(); refreshUserBalance(); } };
  
  const loadAdminStats = async () => { const res = await apiCall('getAdminStats'); if (res?.success) setAdminStats(res); };
  const loadAdminOrders = async () => { setLoading(true); const res = await apiCall('adminGetOrders'); if (res?.success) setAdminOrders(res.orders || []); setLoading(false); };
  const loadAdminUsers = async () => { const res = await apiCall('getUsers'); if (res?.success) setAdminUsers(res.users || []); };
  const handleDeliverOrder = (oid) => { setDeliveryOrderId(oid); setDeliveryDataType('text'); setDeliveryInputVal(''); setDeliveryModalOpen(true); };
  const submitCustomDelivery = async () => { if (!deliveryOrderId || !deliveryInputVal.trim()) return showToast('তথ্য দিন'); setLoading(true); const payload = { orderId: deliveryOrderId, status: 'delivered' }; if (deliveryDataType === 'text') payload.deliveryText = deliveryInputVal; else payload.deliveryLink = deliveryInputVal; const res = await apiCall('updateOrder', payload); if (res?.success) { showToast('ডেলিভারি সম্পন্ন'); loadAdminOrders(); } else showToast('ব্যর্থ'); setLoading(false); setDeliveryModalOpen(false); };
  const handleCancelOrder = async (oid) => { if (!confirm('বাতিল করবেন?')) return; setLoading(true); const res = await apiCall('updateOrder', { orderId: oid, status: 'cancelled' }); if (res?.success) { showToast('বাতিল করা হয়েছে'); loadAdminOrders(); } setLoading(false); };
  const handleToggleBlockUser = async (uid, blocked) => { if (!confirm(`${blocked ? 'আনব্লক' : 'ব্লক'} করবেন?`)) return; setLoading(true); await apiCall('blockUser', { userId: uid, block: !blocked }); showToast('আপডেট হয়েছে'); loadAdminUsers(); setLoading(false); };
  const handleUpdateNoticeSubmit = async () => { if (!adminNoticeInput) return; setLoading(true); await apiCall('updateNotice', { text: adminNoticeInput }); showToast('নোটিশ আপডেট!'); setNotice(adminNoticeInput); setLoading(false); };
  const openOrderDetailsModal = (fdata) => { setModalTitle('অর্ডার তথ্য'); setModalType('text'); try { const obj = JSON.parse(fdata); let str = ''; Object.entries(obj).forEach(([k,v]) => str += `${k}: ${v}\n`); setModalContent(str || 'কোন তথ্য নেই'); } catch(e) { setModalContent(fdata); } setModalOpen(true); };
  const openDeliveryMessageModal = (msg) => { setModalTitle('ডেলিভারি মেসেজ'); setModalType('delivered_message'); setModalContent(msg); setModalOpen(true); };

  return React.createElement('div', { className: 'min-h-screen bg-slate-50' },
    toastMessage && React.createElement('div', { className: 'fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full z-[99999] text-sm font-bold animate-slide-up' }, toastMessage),
    React.createElement('nav', { className: 'sticky top-0 z-50 bg-[#0a2e1f] text-white shadow-md' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4' },
        React.createElement('div', { className: 'flex justify-between h-16 items-center' },
          React.createElement('div', { className: 'flex items-center gap-2 cursor-pointer', onClick: () => navigateTo(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'home') : 'landing') },
            React.createElement('div', { className: 'p-2 bg-emerald-800 rounded-lg' }, getIcon('HandHeart')),
            React.createElement('div', null, React.createElement('span', { className: 'font-extrabold text-xl' }, 'Amader Seba'), React.createElement('span', { className: 'text-[10px] text-emerald-400 block' }, 'সেবাই মূল লক্ষ্য'))
          ),
          React.createElement('div', { className: 'hidden md:flex gap-3 items-center' },
            currentUser ? (
              React.createElement(React.Fragment, null,
                currentUser.role === 'admin' ? React.createElement('button', { onClick: () => navigateTo('admin'), className: 'px-4 py-2 rounded-full bg-white text-[#0a2e1f] text-sm font-medium' }, 'অ্যাডমিন ড্যাশবোর্ড') : React.createElement(React.Fragment, null,
                  React.createElement('button', { onClick: () => navigateTo('home'), className: 'px-4 py-2 rounded-full bg-white text-[#0a2e1f]' }, 'হোম'),
                  React.createElement('button', { onClick: () => navigateTo('recharge'), className: 'px-4 py-2 rounded-full bg-amber-500 text-white' }, 'রিচার্জ')
                ),
                React.createElement('button', { onClick: () => refreshUserBalance(), className: 'bg-amber-500 px-4 py-2 rounded-full text-white font-black' }, `৳${currentUser.balance ?? 0} টাকা`),
                React.createElement('span', { className: 'bg-emerald-800 px-4 py-2 rounded-full text-emerald-300' }, `👋 ${currentUser.name}`),
                React.createElement('button', { onClick: handleLogout, className: 'border border-red-800 px-4 py-2 rounded-full text-red-100' }, 'লগআউট')
              )
            ) : (
              React.createElement(React.Fragment, null,
                React.createElement('button', { onClick: () => navigateTo('landing') }, 'পরিচিতি'),
                React.createElement('button', { onClick: () => navigateTo('login'), className: 'bg-emerald-700 px-5 py-2 rounded-full' }, 'লগইন'),
                React.createElement('button', { onClick: () => navigateTo('register'), className: 'border px-5 py-2 rounded-full' }, 'রেজিস্টার')
              )
            )
          ),
          React.createElement('button', { onClick: () => setHamburgerOpen(!hamburgerOpen), className: 'md:hidden p-1 bg-emerald-950/40 rounded' }, hamburgerOpen ? getIcon('X') : getIcon('Menu'))
        )
      ),
      hamburgerOpen && React.createElement('div', { className: 'md:hidden bg-[#0d3b28] p-4 space-y-2' },
        currentUser ? (
          React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'bg-emerald-950 p-3 rounded-xl' }, React.createElement('p', { className: 'text-emerald-400 text-xs' }, 'লগইন:'), React.createElement('p', { className: 'text-white font-bold' }, currentUser.name)),
            React.createElement('button', { onClick: () => navigateTo('home'), className: 'w-full text-left py-2' }, 'হোম'),
            React.createElement('button', { onClick: () => navigateTo('recharge'), className: 'w-full text-left py-2 text-amber-300' }, 'রিচার্জ'),
            React.createElement('button', { onClick: handleLogout, className: 'w-full text-left py-2 bg-red-950/40 rounded' }, 'লগআউট')
          )
        ) : (
          React.createElement(React.Fragment, null,
            React.createElement('button', { onClick: () => navigateTo('landing') }, 'পরিচিতি'),
            React.createElement('button', { onClick: () => navigateTo('login') }, 'লগইন'),
            React.createElement('button', { onClick: () => navigateTo('register') }, 'রেজিস্টার')
          )
        )
      )
    ),
    React.createElement('div', { className: 'bg-[#1a4a38] py-2' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 flex justify-center gap-3' },
        React.createElement('button', { onClick: () => navigateTo(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'home') : 'landing'), className: 'bg-[#2c6b52] px-3 py-1 rounded-full text-white' }, 'হোম'),
        currentUser && currentUser.role !== 'admin' && React.createElement(React.Fragment, null,
          React.createElement('button', { onClick: () => navigateTo('recharge'), className: 'bg-[#e05e1a] px-3 py-1 rounded-full text-white' }, 'রিচার্জ করুন'),
          React.createElement('button', { onClick: () => refreshUserBalance(), className: 'bg-amber-500 px-3 py-1 rounded-full text-white font-black' }, `৳${currentUser.balance ?? 0} টাকা`)
        )
      )
    ),
    notice && React.createElement('div', { className: 'bg-amber-50 py-2.5' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 flex gap-3' },
        React.createElement('span', { className: 'bg-amber-200 px-2 py-0.5 rounded uppercase text-xs' }, 'নোটিশ'),
        React.createElement('marquee', { className: 'font-semibold text-amber-950' }, notice)
      )
    ),
    loading && React.createElement('div', { className: 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex justify-center items-center' },
      React.createElement('div', { className: 'bg-white p-6 rounded-2xl' }, React.createElement('div', { className: 'w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin' }), React.createElement('p', { className: 'font-bold mt-2' }, 'লোড হচ্ছে...'))
    ),
    React.createElement('main', { className: 'max-w-7xl mx-auto px-4 py-8' },
      currentScreen === 'landing' && React.createElement('div', { className: 'space-y-12' },
        React.createElement('div', { className: 'rounded-3xl bg-slate-900 text-white p-10 text-center' },
          React.createElement('h1', { className: 'text-4xl font-black' }, 'Amader Seba'),
          React.createElement('p', { className: 'text-emerald-400' }, 'ডিজিটাল সেবা পোর্টাল'),
          React.createElement('div', { className: 'flex gap-4 justify-center mt-6' },
            React.createElement('button', { onClick: () => navigateTo('login'), className: 'bg-emerald-600 px-8 py-3 rounded-full' }, 'লগইন'),
            React.createElement('button', { onClick: () => navigateTo('register'), className: 'bg-white text-[#0a2e1f] px-8 py-3 rounded-full' }, 'রেজিস্টার')
          )
        )
      ),
      currentScreen === 'login' && React.createElement('div', { className: 'max-w-md mx-auto bg-white p-8 rounded-3xl' },
        React.createElement('h2', { className: 'text-2xl font-black text-center' }, 'লগইন'),
        React.createElement('form', { onSubmit: handleLogin, className: 'space-y-4 mt-4' },
          React.createElement('input', { type: 'tel', placeholder: 'মোবাইল', value: loginPhone, onChange: e => setLoginPhone(e.target.value), className: 'w-full p-3 border rounded-xl', required: true }),
          React.createElement('input', { type: 'password', placeholder: 'পাসওয়ার্ড', value: loginPass, onChange: e => setLoginPass(e.target.value), className: 'w-full p-3 border rounded-xl', required: true }),
          React.createElement('button', { type: 'submit', className: 'w-full bg-emerald-700 py-3 rounded-full text-white font-bold' }, 'লগইন')
        ),
        React.createElement('p', { className: 'text-center mt-4' }, 'নতুন? ', React.createElement('button', { onClick: () => navigateTo('register'), className: 'text-emerald-700 font-bold' }, 'রেজিস্টার'))
      ),
      currentScreen === 'register' && React.createElement('div', { className: 'max-w-md mx-auto bg-white p-8 rounded-3xl' },
        React.createElement('h2', { className: 'text-2xl font-black text-center' }, 'রেজিস্টার'),
        React.createElement('form', { onSubmit: handleRegister, className: 'space-y-4' },
          React.createElement('input', { type: 'text', placeholder: 'নাম', value: regName, onChange: e => setRegName(e.target.value), className: 'w-full p-3 border rounded-xl', required: true }),
          React.createElement('input', { type: 'tel', placeholder: 'মোবাইল', value: regPhone, onChange: e => setRegPhone(e.target.value), className: 'w-full p-3 border rounded-xl', required: true }),
          React.createElement('input', { type: 'password', placeholder: 'পাসওয়ার্ড', value: regPass, onChange: e => setRegPass(e.target.value), className: 'w-full p-3 border rounded-xl', required: true }),
          React.createElement('button', { type: 'submit', className: 'w-full bg-emerald-700 py-3 rounded-full text-white font-bold' }, 'রেজিস্টার')
        )
      ),
      currentScreen === 'recharge' && currentUser && React.createElement('div', { className: 'max-w-2xl mx-auto space-y-5' },
        React.createElement('div', { className: 'bg-amber-500 rounded-2xl p-5 text-white text-center' },
          React.createElement('h2', { className: 'font-black' }, 'নগদ রিচার্জ'),
          React.createElement('p', { className: 'text-sm' }, NAGAD_NUMBER),
          React.createElement('button', { onClick: () => copyText(NAGAD_NUMBER), className: 'bg-amber-700 px-3 py-1 rounded text-xs' }, 'কপি')
        ),
        React.createElement('form', { onSubmit: handleRechargeSubmit, className: 'bg-white p-5 rounded-xl space-y-3' },
          React.createElement('input', { type: 'number', placeholder: 'পরিমাণ (মিন ৩০০)', value: rechargeAmount, onChange: e => setRechargeAmount(e.target.value), className: 'w-full p-3 border rounded-lg', required: true }),
          React.createElement('input', { type: 'text', placeholder: 'ট্রানজেকশন আইডি', value: rechargeTxnId, onChange: e => setRechargeTxnId(e.target.value), className: 'w-full p-3 border rounded-lg', required: true }),
          React.createElement('button', { type: 'submit', className: 'w-full bg-amber-500 py-3 rounded-full font-black' }, 'রিচার্জ রিকোয়েস্ট')
        ),
        React.createElement('div', { className: 'bg-white p-4 rounded-xl' },
          React.createElement('h3', { className: 'font-bold' }, 'হিস্ট্রি'),
          React.createElement('table', { className: 'w-full text-xs' },
            React.createElement('tbody', null, userRecharges.map(rc => React.createElement('tr', { key: rc.rechargeId },
              React.createElement('td', null, `#${rc.rechargeId}`),
              React.createElement('td', null, `৳${rc.amount}`),
              React.createElement('td', null, rc.status === 'pending' ? '⏳ পেন্ডিং' : (rc.status === 'approved' ? '✅ অনুমোদিত' : '❌ ব্যর্থ'))
            )))
          )
        )
      ),
      currentScreen === 'home' && React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
        Object.keys(parentGroups).map(gid => React.createElement('div', { key: gid, onClick: () => openParentGroup(gid), className: 'bg-[#0b3c29] p-4 rounded-xl text-center text-white cursor-pointer' }, React.createElement('h4', { className: 'font-bold' }, parentGroups[gid].name))),
        React.createElement('div', { onClick: () => openDirectService('sim_location'), className: 'bg-[#0b3c29] p-4 rounded-xl text-center text-white cursor-pointer' }, React.createElement('h4', { className: 'font-bold' }, 'সিম লোকেশন')),
        React.createElement('div', { onClick: () => openDirectService('lost_id'), className: 'bg-[#0b3c29] p-4 rounded-xl text-center text-white cursor-pointer' }, React.createElement('h4', { className: 'font-bold' }, 'হারানো আইডি')),
        React.createElement('div', { onClick: () => openDirectService('nid_to_sim'), className: 'bg-[#0b3c29] p-4 rounded-xl text-center text-white cursor-pointer' }, React.createElement('h4', { className: 'font-bold' }, 'এনআইডি টু সিম'))
      ),
      currentScreen === 'subservices' && selectedParentGroupId && React.createElement('div', null,
        React.createElement('h2', { className: 'font-bold text-xl' }, parentGroups[selectedParentGroupId].name),
        React.createElement('div', { className: 'grid grid-cols-3 gap-2 my-4' }, parentGroups[selectedParentGroupId].children.map(cid => React.createElement('div', { key: cid, onClick: () => setSelectedServiceId(cid), className: `p-2 rounded-lg text-center cursor-pointer ${selectedServiceId === cid ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}` }, serviceForms[cid]?.name, React.createElement('br', null), `💰${serviceForms[cid]?.rate}`))),
        selectedServiceId && serviceForms[selectedServiceId] && React.createElement('form', { onSubmit: e => handlePlaceOrder(e, selectedServiceId), className: 'bg-white p-4 rounded-xl space-y-3' },
          serviceForms[selectedServiceId].fields.map(f => React.createElement('input', { key: f.id, type: f.type || 'text', placeholder: f.name, value: formData[f.id] || '', onChange: e => setFormData({ ...formData, [f.id]: e.target.value }), className: 'w-full p-2 border rounded-lg', required: f.required })),
          React.createElement('button', { type: 'submit', className: 'bg-emerald-600 w-full py-2 rounded-lg text-white font-bold' }, 'অর্ডার সাবমিট')
        ),
        React.createElement('div', { className: 'mt-6 bg-white p-3 rounded-xl' },
          React.createElement('h3', { className: 'font-bold' }, 'আগের অর্ডার'),
          React.createElement('table', { className: 'w-full text-xs' },
            React.createElement('tbody', null, subGroupOrdersList.map(o => React.createElement('tr', { key: o.orderId },
              React.createElement('td', null, serviceForms[o.serviceId]?.name),
              React.createElement('td', null, o.status),
              React.createElement('td', null, o.deliveryLink ? React.createElement('a', { href: o.deliveryLink, target: '_blank' }, 'ডাউনলোড') : (o.deliveryText || ''))
            )))
          )
        )
      ),
      currentScreen === 'admin' && React.createElement('div', null,
        React.createElement('div', { className: 'flex gap-2 mb-4' },
          React.createElement('button', { onClick: () => { setAdminActiveTab('dashboard'); loadAdminStats(); }, className: `px-4 py-2 rounded ${adminActiveTab === 'dashboard' ? 'bg-white shadow' : 'bg-slate-100'}` }, 'ড্যাশবোর্ড'),
          React.createElement('button', { onClick: () => { setAdminActiveTab('orders'); loadAdminOrders(); }, className: `px-4 py-2 rounded ${adminActiveTab === 'orders' ? 'bg-white shadow' : 'bg-slate-100'}` }, 'অর্ডার'),
          React.createElement('button', { onClick: () => { setAdminActiveTab('users'); loadAdminUsers(); }, className: `px-4 py-2 rounded ${adminActiveTab === 'users' ? 'bg-white shadow' : 'bg-slate-100'}` }, 'ইউজার'),
          React.createElement('button', { onClick: () => { setAdminActiveTab('recharges'); loadAdminRecharges(); }, className: `px-4 py-2 rounded ${adminActiveTab === 'recharges' ? 'bg-white shadow' : 'bg-slate-100'}` }, 'রিচার্জ'),
          React.createElement('button', { onClick: () => setAdminActiveTab('notice'), className: `px-4 py-2 rounded ${adminActiveTab === 'notice' ? 'bg-white shadow' : 'bg-slate-100'}` }, 'নোটিশ')
        ),
        adminActiveTab === 'dashboard' && React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
          React.createElement('div', { className: 'bg-white p-4 rounded-xl' }, `মোট অর্ডার: ${adminStats.total}`),
          React.createElement('div', { className: 'bg-white p-4 rounded-xl' }, `পেন্ডিং: ${adminStats.pending}`),
          React.createElement('div', { className: 'bg-white p-4 rounded-xl' }, `রেভিনিউ: ৳${adminStats.revenue}`)
        ),
        adminActiveTab === 'orders' && React.createElement('div', { className: 'bg-white p-4 rounded-xl overflow-auto' },
          React.createElement('table', { className: 'w-full text-sm' },
            React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', null, 'ID'), React.createElement('th', null, 'সার্ভিস'), React.createElement('th', null, 'স্ট্যাটাস'), React.createElement('th', null, 'অ্যাকশন'))),
            React.createElement('tbody', null, adminOrders.map(o => React.createElement('tr', { key: o.orderId },
              React.createElement('td', null, `#${o.orderId}`),
              React.createElement('td', null, serviceForms[o.serviceId]?.name),
              React.createElement('td', null, o.status),
              React.createElement('td', null, o.status === 'pending' && React.createElement(React.Fragment, null,
                React.createElement('button', { onClick: () => handleDeliverOrder(o.orderId), className: 'bg-emerald-600 text-white px-2 py-1 rounded text-xs mr-1' }, 'ডেলিভার'),
                React.createElement('button', { onClick: () => handleCancelOrder(o.orderId), className: 'bg-red-600 text-white px-2 py-1 rounded text-xs' }, 'বাতিল')
              ))
            )))
          )
        ),
        adminActiveTab === 'users' && React.createElement('div', { className: 'bg-white p-4 rounded-xl' },
          React.createElement('table', { className: 'w-full text-sm' },
            React.createElement('tbody', null, adminUsers.filter(u => u.role !== 'admin').map(u => React.createElement('tr', { key: u.userId },
              React.createElement('td', null, u.name),
              React.createElement('td', null, u.phone),
              React.createElement('td', null, u.isBlocked ? 'ব্লকড' : 'সক্রিয়'),
              React.createElement('td', null, React.createElement('button', { onClick: () => handleToggleBlockUser(u.userId, u.isBlocked), className: 'bg-red-600 text-white px-2 py-1 rounded text-xs' }, u.isBlocked ? 'আনব্লক' : 'ব্লক'))
            )))
          )
        ),
        adminActiveTab === 'recharges' && React.createElement('div', { className: 'bg-white p-4 rounded-xl overflow-auto' },
          React.createElement('table', { className: 'w-full text-sm' },
            React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', null, 'ID'), React.createElement('th', null, 'ইউজার'), React.createElement('th', null, 'পরিমাণ'), React.createElement('th', null, 'Txn ID'), React.createElement('th', null, 'স্ট্যাটাস'), React.createElement('th', null, 'অ্যাকশン'))),
            React.createElement('tbody', null, adminRecharges.map(rc => React.createElement('tr', { key: rc.rechargeId },
              React.createElement('td', null, `#${rc.rechargeId}`),
              React.createElement('td', null, rc.name),
              React.createElement('td', null, `৳${rc.amount}`),
              React.createElement('td', null, rc.transactionId),
              React.createElement('td', null, rc.status),
              React.createElement('td', null, rc.status === 'pending' && React.createElement(React.Fragment, null,
                React.createElement('button', { onClick: () => handleUpdateRechargeStatus(rc.rechargeId, 'approved'), className: 'bg-emerald-600 text-white px-2 py-1 rounded text-xs mr-1' }, 'অনুমোদন'),
                React.createElement('button', { onClick: () => handleUpdateRechargeStatus(rc.rechargeId, 'failed'), className: 'bg-red-600 text-white px-2 py-1 rounded text-xs' }, 'রিজেক্ট')
              ))
            )))
          )
        ),
        adminActiveTab === 'notice' && React.createElement('div', null,
          React.createElement('textarea', { className: 'w-full p-3 border rounded-xl', rows: 3, value: adminNoticeInput, onChange: e => setAdminNoticeInput(e.target.value) }),
          React.createElement('button', { onClick: handleUpdateNoticeSubmit, className: 'mt-2 bg-emerald-700 px-4 py-2 rounded text-white' }, 'আপডেট নোটিশ')
        )
      )
    ),
    modalOpen && React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex justify-center items-center' },
      React.createElement('div', { className: 'bg-white p-6 rounded-2xl max-w-md' },
        React.createElement('h3', { className: 'font-bold text-lg' }, modalTitle),
        React.createElement('pre', { className: 'mt-2 text-sm whitespace-pre-wrap' }, modalContent),
        React.createElement('button', { onClick: () => setModalOpen(false), className: 'mt-4 bg-slate-200 px-4 py-2 rounded' }, 'বন্ধ')
      )
    ),
    deliveryModalOpen && React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex justify-center items-center' },
      React.createElement('div', { className: 'bg-white p-6 rounded-2xl w-96' },
        React.createElement('h3', { className: 'font-bold' }, 'ডেলিভারি তথ্য'),
        React.createElement('select', { value: deliveryDataType, onChange: e => setDeliveryDataType(e.target.value), className: 'w-full p-2 border rounded my-2' },
          React.createElement('option', { value: 'text' }, 'টেক্সট'),
          React.createElement('option', { value: 'link' }, 'লিংক')
        ),
        React.createElement('textarea', { className: 'w-full p-2 border rounded', rows: 3, value: deliveryInputVal, onChange: e => setDeliveryInputVal(e.target.value), placeholder: deliveryDataType === 'text' ? 'মেসেজ লিখুন' : 'https://...' }),
        React.createElement('div', { className: 'flex gap-2 mt-4' },
          React.createElement('button', { onClick: submitCustomDelivery, className: 'bg-emerald-600 px-4 py-2 rounded text-white' }, 'জমা দিন'),
          React.createElement('button', { onClick: () => setDeliveryModalOpen(false), className: 'bg-slate-200 px-4 py-2 rounded' }, 'বাতিল')
        )
      )
    )
  );
}

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));