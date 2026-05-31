// ------------------- SHA256 -------------------
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzrf26vxAen9pqBmt41R8wXQbmCW8qM0ADNs79Ah8DVkRhnz8c3nF0e6sVkzX82PDuO/exec';
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
    parsed.forEach(u => { 
      if (u.balance === undefined) { 
        u.balance = u.role === 'admin' ? 1000000 : 0; 
        updated = true; 
      } 
    });
    if (updated) localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    return parsed;
  }
  const list = [{ 
    userId: 1, 
    name: 'সন্তুষ্ট অ্যাডমিন', 
    phone: '01951775777', 
    passwordHash: 'e59005a3068e64c39129dfcf5617bf1dbdfef9f9393e25b0451cf280c2f2c8ec', 
    whatsapp: '01951775777', 
    isBlocked: false, 
    role: 'admin', 
    balance: 1000000 
  }];
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list));
  return list;
}

function getLocalRechargesList() { 
  const stored = localStorage.getItem(LOCAL_RECHARGES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function getLocalOrdersList() { 
  const stored = localStorage.getItem(LOCAL_ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalRecharges(recharges) { 
  localStorage.setItem(LOCAL_RECHARGES_KEY, JSON.stringify(recharges)); 
}

function saveLocalUsers(users) { 
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users)); 
}

function saveLocalOrders(orders) { 
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders)); 
}

async function apiCall(action, data = {}) {
  try {
    const urlObj = new URL(DEFAULT_API_URL);
    urlObj.searchParams.set('action', action);
    for (const [k, v] of Object.entries(data)) if (v !== undefined) urlObj.searchParams.set(k, String(v));
    const res = await fetch(urlObj.toString(), { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.log('Using local storage fallback for:', action);
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
    users.push({ 
      userId: newUserId, 
      name: p.name, 
      phone: p.phone, 
      whatsapp: p.whatsapp || '', 
      passwordHash: p.passwordHash, 
      isBlocked: false, 
      role: 'user', 
      balance: 0, 
      createdAt: new Date().toISOString() 
    });
    saveLocalUsers(users);
    return { success: true, userId: newUserId, name: p.name, phone: p.phone, role: 'user', balance: 0 };
  }
  
  if (action === 'login') {
    const user = users.find(u => u.phone === p.phone && u.passwordHash === p.passwordHash);
    if (!user) return { success: false, message: 'ভুল ফোন বা পাসওয়ার্ড' };
    if (user.isBlocked) return { success: false, message: 'আপনার অ্যাকাউন্ট ব্লক করা হয়েছে' };
    return { 
      success: true, 
      userId: user.userId, 
      name: user.name, 
      phone: user.phone, 
      balance: user.balance ?? 0, 
      role: user.role || 'user' 
    };
  }
  
  if (action === 'placeOrder') {
    const idx = users.findIndex(u => String(u.userId) === String(p.userId));
    if (idx === -1) return { success: false, message: 'ইউজার পাওয়া যায়নি' };
    const rate = Number(p.rate) || 0;
    if ((users[idx].balance || 0) < rate) return { success: false, message: 'পর্যাপ্ত ব্যালেন্স নেই' };
    users[idx].balance -= rate;
    saveLocalUsers(users);
    const newOrderId = orders.length + 1;
    orders.push({ 
      orderId: newOrderId, 
      userId: p.userId, 
      serviceId: p.serviceId, 
      formData: p.formData, 
      amount: rate, 
      status: 'pending', 
      deliveryText: '', 
      deliveryLink: '', 
      createdAt: new Date().toISOString() 
    });
    saveLocalOrders(orders);
    return { success: true, orderId: newOrderId, updatedBalance: users[idx].balance };
  }
  
  if (action === 'getOrders') {
    return { success: true, orders: orders.filter(o => String(o.userId) === String(p.userId)).reverse() };
  }
  
  if (action === 'adminGetOrders') {
    return { success: true, orders: [...orders].reverse() };
  }
  
  if (action === 'updateOrder') {
    const oidx = orders.findIndex(o => String(o.orderId) === String(p.orderId));
    if (oidx !== -1) {
      if (p.status) orders[oidx].status = p.status;
      if (p.deliveryText !== undefined) orders[oidx].deliveryText = p.deliveryText;
      if (p.deliveryLink !== undefined) orders[oidx].deliveryLink = p.deliveryLink;
      saveLocalOrders(orders);
      return { success: true };
    }
    return { success: false };
  }
  
  if (action === 'getNotice') {
    return { success: true, notice: localStorage.getItem(LOCAL_NOTICE_KEY) || 'আমাদের সেবা পোর্টাল-এ স্বাগতম!' };
  }
  
  if (action === 'updateNotice') { 
    localStorage.setItem(LOCAL_NOTICE_KEY, p.text); 
    return { success: true }; 
  }
  
  if (action === 'getUsers') {
    return { 
      success: true, 
      users: users.map(u => ({ 
        userId: u.userId, 
        name: u.name, 
        phone: u.phone, 
        isBlocked: u.isBlocked, 
        role: u.role || 'user', 
        balance: u.balance ?? 0 
      })) 
    };
  }
  
  if (action === 'blockUser') {
    const idx = users.findIndex(u => String(u.userId) === String(p.userId));
    if (idx !== -1) { 
      users[idx].isBlocked = (p.block === 'true' || p.block === true); 
      saveLocalUsers(users); 
      return { success: true }; 
    }
    return { success: false };
  }
  
  if (action === 'updateUserBalance') {
    const idx = users.findIndex(u => String(u.userId) === String(p.userId));
    if (idx !== -1) { 
      users[idx].balance = Number(p.balance) || 0; 
      saveLocalUsers(users); 
      return { success: true }; 
    }
    return { success: false };
  }
  
  if (action === 'submitRecharge') {
    const amount = Number(p.amount) || 0;
    if (amount < 300) return { success: false, message: 'সর্বনিম্ন ৩০০ টাকা রিচার্জ করা আবশ্যক' };
    const newId = recharges.length + 1;
    recharges.push({ 
      rechargeId: newId, 
      userId: p.userId, 
      phone: p.phone, 
      name: p.name || 'Unknown', 
      amount: amount, 
      transactionId: (p.transactionId || '').trim(), 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    });
    saveLocalRecharges(recharges);
    return { success: true, rechargeId: newId };
  }
  
  if (action === 'getUserRecharges') {
    const filtered = recharges.filter(r => String(r.userId) === String(p.userId));
    return { success: true, recharges: [...filtered].reverse() };
  }
  
  if (action === 'adminGetRecharges') {
    return { success: true, recharges: [...recharges].reverse() };
  }
  
  if (action === 'updateRechargeStatus') {
    const idx = recharges.findIndex(r => String(r.rechargeId) === String(p.rechargeId));
    if (idx !== -1) {
      const oldStatus = recharges[idx].status;
      const newStatus = p.status;
      recharges[idx].status = newStatus;
      saveLocalRecharges(recharges);
      
      // 🔥 CRITICAL FIX: এডমিন এপ্রুভালে ব্যালেন্স অ্যাড করা
      if (oldStatus !== 'approved' && newStatus === 'approved') {
        const userIdx = users.findIndex(u => String(u.userId) === String(recharges[idx].userId));
        if (userIdx !== -1) {
          const addAmount = Number(recharges[idx].amount) || 0;
          users[userIdx].balance = (Number(users[userIdx].balance) || 0) + addAmount;
          saveLocalUsers(users);
          console.log(`✅ ব্যালেন্স অ্যাড করা হয়েছে: ${addAmount} টাকা, নতুন ব্যালেন্স: ${users[userIdx].balance}`);
        }
      }
      return { success: true };
    }
    return { success: false, message: 'রিচার্জ রেকর্ড পাওয়া যায়নি' };
  }
  
  if (action === 'getAdminStats') {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const revenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (Number(o.amount) || 0), 0);
    return { success: true, total, pending, delivered, cancelled, revenue };
  }
  
  return { success: false, message: 'অ্যাকশন ভুল: ' + action };
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

const allServices = [
  { id: 'sim_location', name: 'সিম নাম্বার লোকেশন', icon: 'MapPin' },
  { id: 'lost_id', name: 'হারানো আইডি কার্ড', icon: 'Search' },
  { id: 'nid_to_sim', name: 'এনআইডি টু সকল সিম', icon: 'Share2' },
  { id: 'lost_etin', name: 'হারানো ই-টিন', icon: 'FileText' },
  { id: 'imei_active', name: 'IMEI To Active', icon: 'Smartphone' }
];

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
  const [loginPhone, setLoginPhone] = React.useState('');
  const [loginPass, setLoginPass] = React.useState('');
  const [regName, setRegName] = React.useState('');
  const [regPhone, setRegPhone] = React.useState('');
  const [regPass, setRegPass] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState('');

  const showToast = (msg) => { 
    setToastMessage(msg); 
    setTimeout(() => setToastMessage(''), 3000); 
  };
  
  const copyText = (txt) => { 
    navigator.clipboard.writeText(txt); 
    showToast('কপি করা হয়েছে!'); 
  };

  // 🔥 ইউজারের ব্যালেন্স রিফ্রেশ করার ফাংশন
  const refreshUserBalance = async () => {
    if (!currentUser) return;
    console.log('Refreshing balance for user:', currentUser.userId);
    const res = await apiCall('getUsers');
    if (res?.success && res.users) {
      const match = res.users.find(u => String(u.userId) === String(currentUser.userId));
      if (match) {
        console.log('New balance found:', match.balance);
        setCurrentUser(prev => ({ ...prev, balance: match.balance }));
        // localStorage এও আপডেট করে রাখি
        localStorage.setItem('am_user_balance', match.balance);
      }
    }
  };

  const loadAdminRecharges = async () => { 
    setLoading(true); 
    const res = await apiCall('adminGetRecharges'); 
    if (res?.success) setAdminRecharges(res.recharges || []); 
    setLoading(false); 
  };
  
  const loadUserRecharges = async () => { 
    if (!currentUser) return; 
    const res = await apiCall('getUserRecharges', { userId: currentUser.userId }); 
    if (res?.success) setUserRecharges(res.recharges || []); 
  };
  
  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(rechargeAmount);
    if (amount < 300) return showToast('রিচার্জের পরিমাণ সর্বনিম্ন ৩০০ টাকা হতে হবে।');
    if (!rechargeTxnId.trim()) return showToast('ট্রানজেকশন আইডি দিন');
    setLoading(true);
    const res = await apiCall('submitRecharge', { 
      userId: currentUser.userId, 
      phone: currentUser.phone, 
      name: currentUser.name, 
      amount, 
      transactionId: rechargeTxnId.trim() 
    });
    if (res?.success) { 
      showToast('রিচার্জ রিকোয়েস্ট জমা হয়েছে!'); 
      setRechargeAmount(''); 
      setRechargeTxnId(''); 
      await loadUserRecharges(); 
    } else showToast(res?.message || 'ব্যর্থ');
    setLoading(false);
  };

  // 🔥 এডমিন রিচার্জ স্ট্যাটাস আপডেট করার ফাংশন - এখান থেকেই ব্যালেন্স রিফ্রেশ করা হচ্ছে
  const handleUpdateRechargeStatus = async (rechargeId, nextStatus) => {
    setLoading(true);
    const res = await apiCall('updateRechargeStatus', { rechargeId, status: nextStatus });
    if (res?.success) { 
      showToast(nextStatus === 'approved' ? '✅ রিচার্জ অনুমোদিত ও ব্যালেন্স যুক্ত হয়েছে!' : '❌ রিচার্জ ব্যর্থ'); 
      await loadAdminRecharges();
      // 🔥 গুরুত্বপূর্ণ: ব্যালেন্স রিফ্রেশ করা
      await refreshUserBalance();
      if (currentUser?.role !== 'admin') {
        await loadUserRecharges();
      }
    } else showToast(res?.message);
    setLoading(false);
  };

  const fetchNotice = async () => { 
    const res = await apiCall('getNotice'); 
    if (res?.success) { 
      setNotice(res.notice); 
      setAdminNoticeInput(res.notice); 
    } 
  };
  
  React.useEffect(() => {
    const uid = localStorage.getItem('am_user_id');
    const name = localStorage.getItem('am_user_name');
    const phone = localStorage.getItem('am_user_phone');
    const role = localStorage.getItem('am_user_role');
    const savedBalance = localStorage.getItem('am_user_balance');
    
    if (uid && name) { 
      setCurrentUser({ 
        userId: uid, 
        name, 
        phone, 
        role: role || 'user', 
        balance: savedBalance ? Number(savedBalance) : 0 
      }); 
      refreshUserBalance(); 
      if (role === 'admin') setCurrentScreen('admin'); 
      else setCurrentScreen('home'); 
    }
    fetchNotice();
  }, []);

  // প্রতি 10 সেকেন্ড পর পর ব্যালেন্স চেক করে
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      const interval = setInterval(() => {
        refreshUserBalance();
        if (currentScreen === 'recharge') loadUserRecharges();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, currentScreen]);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    if (!loginPhone || !loginPass) return showToast('মোবাইল ও পাসওয়ার্ড দিন');
    setLoading(true); 
    const hash = await sha256(loginPass); 
    const res = await apiCall('login', { phone: loginPhone, passwordHash: hash });
    if (res?.success) {
      const user = { 
        userId: res.userId, 
        name: res.name, 
        phone: res.phone, 
        role: res.role || 'user', 
        balance: res.balance ?? 0 
      };
      setCurrentUser(user); 
      localStorage.setItem('am_user_id', String(res.userId)); 
      localStorage.setItem('am_user_name', res.name); 
      localStorage.setItem('am_user_phone', res.phone); 
      localStorage.setItem('am_user_role', res.role || 'user');
      localStorage.setItem('am_user_balance', res.balance ?? 0);
      showToast('লগইন সফল!'); 
      setLoginPhone(''); 
      setLoginPass('');
      if (user.role === 'admin') { 
        setCurrentScreen('admin'); 
        loadAdminStats(); 
        loadAdminOrders(); 
        loadAdminUsers(); 
        loadAdminRecharges(); 
      } else setCurrentScreen('home');
    } else showToast(res?.message || 'লগইন ব্যর্থ');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); 
    if (!regName || !regPhone || !regPass) return showToast('সব তথ্য পূরণ করুন');
    setLoading(true); 
    const hash = await sha256(regPass); 
    const res = await apiCall('register', { name: regName, phone: regPhone, whatsapp: '', passwordHash: hash });
    if (res?.success) { 
      showToast('রেজিস্ট্রেশন সফল! লগইন করুন'); 
      setRegName(''); 
      setRegPhone(''); 
      setRegPass(''); 
      setCurrentScreen('login'); 
    } else showToast(res?.message || 'ব্যর্থ');
    setLoading(false);
  };
  
  const handleLogout = () => { 
    setCurrentUser(null); 
    localStorage.clear(); 
    showToast('লগআউট সম্পন্ন'); 
    setCurrentScreen('landing'); 
  };
  
  const fetchUserOrders = async () => { 
    if (!currentUser) return; 
    const res = await apiCall('getOrders', { userId: currentUser.userId }); 
    if (res?.success) setMyOrdersList(res.orders || []); 
  };
  
  const openParentGroup = (gid) => { 
    if (currentUser && currentUser.role !== 'admin' && (currentUser.balance === undefined || currentUser.balance < 1)) { 
      showToast('ব্যালেন্স নেই! রিচার্জ করুন'); 
      navigateTo('recharge'); 
      return; 
    } 
    setSelectedParentGroupId(gid); 
    setSelectedServiceId(''); 
    setFormData({}); 
    setCurrentScreen('subservices'); 
    fetchSubGroupOrders(parentGroups[gid].children); 
  };
  
  const openDirectService = (sid) => { 
    if (currentUser && currentUser.role !== 'admin' && (currentUser.balance === undefined || currentUser.balance < 1)) { 
      showToast('ব্যালেন্স নেই! রিচার্জ করুন'); 
      navigateTo('recharge'); 
      return; 
    } 
    setSelectedServiceId(sid); 
    setFormData({}); 
    setCurrentScreen('direct_service'); 
    fetchDirectServiceOrders(sid); 
  };
  
  const fetchSubGroupOrders = async (childrenIds) => { 
    if (!currentUser) return; 
    const res = await apiCall('getOrders', { userId: currentUser.userId }); 
    if (res?.success) setSubGroupOrdersList(res.orders.filter(o => childrenIds.includes(o.serviceId))); 
  };
  
  const fetchDirectServiceOrders = async (sid) => { 
    if (!currentUser) return; 
    const res = await apiCall('getOrders', { userId: currentUser.userId }); 
    if (res?.success) setSubGroupOrdersList(res.orders.filter(o => o.serviceId === sid)); 
  };
  
  const handlePlaceOrder = async (e, sid) => {
    e.preventDefault(); 
    const meta = serviceForms[sid]; 
    if (!meta) return showToast('সার্ভিস ত্রুটি'); 
    if ((currentUser.balance || 0) < meta.rate) return showToast(`পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন ৳${meta.rate}`);
    for (let f of meta.fields) if (f.required && !formData[f.id]) return showToast(`${f.name} পূরণ করুন`);
    setLoading(true);
    const res = await apiCall('placeOrder', { 
      userId: currentUser.userId, 
      serviceId: sid, 
      formData: JSON.stringify(formData), 
      rate: meta.rate 
    });
    if (res?.success) { 
      showToast('অর্ডার সফল!'); 
      setFormData({}); 
      if (selectedParentGroupId) fetchSubGroupOrders(parentGroups[selectedParentGroupId].children); 
      else fetchDirectServiceOrders(sid); 
      await refreshUserBalance(); 
    } else showToast(res?.message || 'অর্ডার ব্যর্থ');
    setLoading(false);
  };
  
  const navigateTo = (screen) => { 
    setHamburgerOpen(false); 
    if (!currentUser && (screen === 'home' || screen === 'orders' || screen === 'subservices' || screen === 'admin')) { 
      setCurrentScreen('landing'); 
      return; 
    } 
    if (currentUser && currentUser.role !== 'admin' && screen === 'admin') return; 
    setCurrentScreen(screen); 
    if (screen === 'home') { 
      fetchNotice(); 
      refreshUserBalance(); 
    } else if (screen === 'orders') fetchUserOrders(); 
    else if (screen === 'recharge') { 
      loadUserRecharges(); 
      refreshUserBalance(); 
    } 
  };
  
  const loadAdminStats = async () => { 
    const res = await apiCall('getAdminStats'); 
    if (res?.success) setAdminStats(res); 
  };
  
  const loadAdminOrders = async () => { 
    setLoading(true); 
    const res = await apiCall('adminGetOrders'); 
    if (res?.success) setAdminOrders(res.orders || []); 
    setLoading(false); 
  };
  
  const loadAdminUsers = async () => { 
    const res = await apiCall('getUsers'); 
    if (res?.success) setAdminUsers(res.users || []); 
  };
  
  const handleDeliverOrder = (oid) => { 
    setDeliveryOrderId(oid); 
    setDeliveryDataType('text'); 
    setDeliveryInputVal(''); 
    setDeliveryModalOpen(true); 
  };
  
  const submitCustomDelivery = async () => { 
    if (!deliveryOrderId || !deliveryInputVal.trim()) return showToast('তথ্য দিন'); 
    setLoading(true); 
    const payload = { orderId: deliveryOrderId, status: 'delivered' }; 
    if (deliveryDataType === 'text') payload.deliveryText = deliveryInputVal; 
    else payload.deliveryLink = deliveryInputVal; 
    const res = await apiCall('updateOrder', payload); 
    if (res?.success) { 
      showToast('ডেলিভারি সম্পন্ন'); 
      loadAdminOrders(); 
    } else showToast('ব্যর্থ'); 
    setLoading(false); 
    setDeliveryModalOpen(false); 
  };
  
  const handleCancelOrder = async (oid) => { 
    if (!confirm('বাতিল করবেন?')) return; 
    setLoading(true); 
    const res = await apiCall('updateOrder', { orderId: oid, status: 'cancelled' }); 
    if (res?.success) { 
      showToast('বাতিল করা হয়েছে'); 
      loadAdminOrders(); 
    } 
    setLoading(false); 
  };
  
  const handleToggleBlockUser = async (uid, blocked) => { 
    if (!confirm(`${blocked ? 'আনব্লক' : 'ব্লক'} করবেন?`)) return; 
    setLoading(true); 
    await apiCall('blockUser', { userId: uid, block: !blocked }); 
    showToast('আপডেট হয়েছে'); 
    loadAdminUsers(); 
    setLoading(false); 
  };
  
  const handleUpdateNoticeSubmit = async () => { 
    if (!adminNoticeInput) return; 
    setLoading(true); 
    await apiCall('updateNotice', { text: adminNoticeInput }); 
    showToast('নোটিশ আপডেট!'); 
    setNotice(adminNoticeInput); 
    setLoading(false); 
  };
  
  const openOrderDetailsModal = (fdata) => { 
    setModalTitle('অর্ডার তথ্য'); 
    try { 
      const obj = JSON.parse(fdata); 
      let str = ''; 
      Object.entries(obj).forEach(([k,v]) => str += `${k}: ${v}\n`); 
      setModalContent(str || 'কোন তথ্য নেই'); 
    } catch(e) { setModalContent(fdata); } 
    setModalOpen(true); 
  };
  
  const openDeliveryMessageModal = (msg) => { 
    setModalTitle('ডেলিভারি মেসেজ'); 
    setModalContent(msg); 
    setModalOpen(true); 
  };

  // UI রেন্ডারিং (সংক্ষেপে দেখানোর জন্য - পুরো UI আগের মতই থাকবে)
  return React.createElement('div', { className: 'min-h-screen bg-slate-50' },
    // Toast Message
    toastMessage && React.createElement('div', { className: 'fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full z-[99999] text-sm font-bold animate-slide-up' }, toastMessage),
    
    // Navbar (সংক্ষেপে - আগের মতই)
    React.createElement('nav', { className: 'sticky top-0 z-50 bg-[#0a2e1f] text-white shadow-md' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4' },
        React.createElement('div', { className: 'flex justify-between h-16 items-center' },
          React.createElement('div', { className: 'flex items-center gap-2 cursor-pointer', onClick: () => navigateTo(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'home') : 'landing') },
            React.createElement('div', { className: 'p-2 bg-emerald-800 rounded-lg' }, React.createElement('span', { className: 'text-2xl' }, '🤲')),
            React.createElement('div', null, React.createElement('span', { className: 'font-extrabold text-xl block' }, 'Amader Seba'), React.createElement('span', { className: 'text-[10px] text-emerald-400 block' }, 'সেবাই মূল লক্ষ্য'))
          ),
          React.createElement('div', { className: 'hidden md:flex gap-3 items-center' },
            currentUser ? (
              React.createElement(React.Fragment, null,
                currentUser.role === 'admin' ? 
                  React.createElement('button', { onClick: () => navigateTo('admin'), className: 'px-4 py-2 rounded-full bg-white text-[#0a2e1f] text-sm font-medium' }, 'অ্যাডমিন ড্যাশবোর্ড') : 
                  React.createElement(React.Fragment, null,
                    React.createElement('button', { onClick: () => navigateTo('home'), className: 'px-4 py-2 rounded-full bg-white text-[#0a2e1f]' }, 'হোম'),
                    React.createElement('button', { onClick: () => navigateTo('recharge'), className: 'px-4 py-2 rounded-full bg-amber-500 text-white' }, 'রিচার্জ')
                  ),
                React.createElement('button', { onClick: refreshUserBalance, className: 'bg-amber-500 px-4 py-2 rounded-full text-white font-black' }, '৳' + (currentUser.balance ?? 0) + ' টাকা'),
                React.createElement('span', { className: 'bg-emerald-800 px-4 py-2 rounded-full text-emerald-300' }, '👋 ' + currentUser.name),
                React.createElement('button', { onClick: handleLogout, className: 'border border-red-800 px-4 py-2 rounded-full text-red-100' }, 'লগআউট')
              )
            ) : (
              React.createElement(React.Fragment, null,
                React.createElement('button', { onClick: () => navigateTo('landing'), className: 'px-3 py-2' }, 'পরিচিতি'),
                React.createElement('button', { onClick: () => navigateTo('login'), className: 'bg-emerald-700 px-5 py-2 rounded-full' }, 'লগইন'),
                React.createElement('button', { onClick: () => navigateTo('register'), className: 'border px-5 py-2 rounded-full' }, 'রেজিস্টার')
              )
            )
          ),
          React.createElement('button', { onClick: () => setHamburgerOpen(!hamburgerOpen), className: 'md:hidden p-1 bg-emerald-950/40 rounded' }, hamburgerOpen ? '✕' : '☰')
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
            React.createElement('button', { onClick: () => navigateTo('landing'), className: 'w-full text-left py-2' }, 'পরিচিতি'),
            React.createElement('button', { onClick: () => navigateTo('login'), className: 'w-full text-left py-2' }, 'লগইন'),
            React.createElement('button', { onClick: () => navigateTo('register'), className: 'w-full text-left py-2' }, 'রেজিস্টার')
          )
        )
      )
    ),
    
    // Sub-nav
    React.createElement('div', { className: 'bg-[#1a4a38] py-2' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 flex justify-center gap-3' },
        React.createElement('button', { onClick: () => navigateTo(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'home') : 'landing'), className: 'bg-[#2c6b52] px-3 py-1 rounded-full text-white text-sm' }, 'হোম'),
        currentUser && currentUser.role !== 'admin' && React.createElement(React.Fragment, null,
          React.createElement('button', { onClick: () => navigateTo('recharge'), className: 'bg-[#e05e1a] px-3 py-1 rounded-full text-white text-sm' }, 'রিচার্জ করুন'),
          React.createElement('button', { onClick: refreshUserBalance, className: 'bg-amber-500 px-3 py-1 rounded-full text-white font-black text-sm' }, '৳' + (currentUser.balance ?? 0) + ' টাকা')
        )
      )
    ),
    
    // Notice
    notice && React.createElement('div', { className: 'bg-amber-50 border-b border-amber-200 py-2.5' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 flex gap-3' },
        React.createElement('span', { className: 'bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase text-xs font-bold' }, '📢 নোটিশ'),
        React.createElement('marquee', { className: 'font-semibold text-sm text-amber-950' }, notice)
      )
    ),
    
    // Loading
    loading && React.createElement('div', { className: 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex justify-center items-center' },
      React.createElement('div', { className: 'bg-white p-6 rounded-2xl text-center' }, 
        React.createElement('div', { className: 'w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto' }),
        React.createElement('p', { className: 'font-bold mt-2' }, 'লোড হচ্ছে...')
      )
    ),
    
    // Main Content - Landing Page
    currentScreen === 'landing' && React.createElement('div', { className: 'space-y-8' },
      React.createElement('div', { className: 'rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-10 text-center' },
        React.createElement('h1', { className: 'text-4xl md:text-5xl font-black' }, 'Amader Seba'),
        React.createElement('p', { className: 'text-emerald-400 text-lg mt-2' }, 'ডিজিটাল সেবা পোর্টাল'),
        React.createElement('div', { className: 'flex gap-4 justify-center mt-6' },
          React.createElement('button', { onClick: () => navigateTo('login'), className: 'bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-full font-bold' }, 'লগইন'),
          React.createElement('button', { onClick: () => navigateTo('register'), className: 'bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 rounded-full font-bold' }, 'রেজিস্টার')
        )
      )
    ),
    
    // Login Screen
    currentScreen === 'login' && React.createElement('div', { className: 'max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg' },
      React.createElement('h2', { className: 'text-2xl font-black text-center text-[#0a2e1f]' }, 'লগইন'),
      React.createElement('form', { onSubmit: handleLogin, className: 'space-y-4 mt-6' },
        React.createElement('input', { type: 'tel', placeholder: 'মোবাইল নম্বর', value: loginPhone, onChange: e => setLoginPhone(e.target.value), className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', required: true }),
        React.createElement('input', { type: 'password', placeholder: 'পাসওয়ার্ড', value: loginPass, onChange: e => setLoginPass(e.target.value), className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', required: true }),
        React.createElement('button', { type: 'submit', className: 'w-full bg-emerald-700 hover:bg-emerald-600 py-3 rounded-full text-white font-bold' }, 'লগইন')
      ),
      React.createElement('p', { className: 'text-center mt-6 text-slate-500' }, 'নতুন? ', React.createElement('button', { onClick: () => navigateTo('register'), className: 'text-emerald-700 font-bold' }, 'রেজিস্টার করুন'))
    ),
    
    // Register Screen
    currentScreen === 'register' && React.createElement('div', { className: 'max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg' },
      React.createElement('h2', { className: 'text-2xl font-black text-center text-[#0a2e1f]' }, 'রেজিস্টার'),
      React.createElement('form', { onSubmit: handleRegister, className: 'space-y-4 mt-6' },
        React.createElement('input', { type: 'text', placeholder: 'আপনার নাম', value: regName, onChange: e => setRegName(e.target.value), className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', required: true }),
        React.createElement('input', { type: 'tel', placeholder: 'মোবাইল নম্বর', value: regPhone, onChange: e => setRegPhone(e.target.value), className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', required: true }),
        React.createElement('input', { type: 'password', placeholder: 'পাসওয়ার্ড', value: regPass, onChange: e => setRegPass(e.target.value), className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', required: true }),
        React.createElement('button', { type: 'submit', className: 'w-full bg-emerald-700 hover:bg-emerald-600 py-3 rounded-full text-white font-bold' }, 'রেজিস্টার')
      ),
      React.createElement('p', { className: 'text-center mt-6 text-slate-500' }, 'ইতিমধ্যে অ্যাকাউন্ট আছে? ', React.createElement('button', { onClick: () => navigateTo('login'), className: 'text-emerald-700 font-bold' }, 'লগইন করুন'))
    ),
    
    // Recharge Screen
    currentScreen === 'recharge' && currentUser && React.createElement('div', { className: 'max-w-2xl mx-auto space-y-5' },
      React.createElement('div', { className: 'bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white text-center' },
        React.createElement('h2', { className: 'font-black text-xl' }, 'নগদ রিচার্জ'),
        React.createElement('p', { className: 'text-lg font-mono mt-2' }, NAGAD_NUMBER),
        React.createElement('button', { onClick: () => copyText(NAGAD_NUMBER), className: 'bg-amber-700 hover:bg-amber-800 px-4 py-1 rounded-full text-xs mt-2' }, '📋 কপি করুন')
      ),
      React.createElement('form', { onSubmit: handleRechargeSubmit, className: 'bg-white p-5 rounded-xl shadow-md space-y-4' },
        React.createElement('input', { type: 'number', placeholder: 'পরিমাণ (মিনিমাম ৩০০ টাকা)', value: rechargeAmount, onChange: e => setRechargeAmount(e.target.value), className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none', required: true }),
        React.createElement('input', { type: 'text', placeholder: 'নগদ ট্রানজেকশন আইডি', value: rechargeTxnId, onChange: e => setRechargeTxnId(e.target.value), className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none', required: true }),
        React.createElement('button', { type: 'submit', className: 'w-full bg-amber-500 hover:bg-amber-600 py-3 rounded-full text-white font-black' }, 'রিচার্জ রিকোয়েস্ট পাঠান')
      ),
      React.createElement('div', { className: 'bg-white p-4 rounded-xl shadow-md' },
        React.createElement('div', { className: 'flex justify-between items-center mb-3' },
          React.createElement('h3', { className: 'font-bold text-slate-800' }, '📄 আপনার রিচার্জ হিস্ট্রি'),
          React.createElement('button', { onClick: loadUserRecharges, className: 'text-xs text-emerald-600 hover:text-emerald-700' }, '↻ রিফ্রেশ')
        ),
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'w-full text-sm' },
            React.createElement('thead', null,
              React.createElement('tr', { className: 'bg-slate-50 border-b' },
                React.createElement('th', { className: 'p-2 text-left' }, 'ID'),
                React.createElement('th', { className: 'p-2 text-left' }, 'পরিমাণ'),
                React.createElement('th', { className: 'p-2 text-left' }, 'Txn ID'),
                React.createElement('th', { className: 'p-2 text-left' }, 'স্ট্যাটাস')
              )
            ),
            React.createElement('tbody', null, 
              userRecharges.length === 0 ? 
                React.createElement('tr', null, React.createElement('td', { colSpan: 4, className: 'p-4 text-center text-slate-400' }, 'কোনো রিচার্জ ইতিহাস নেই')) :
                userRecharges.map(rc => React.createElement('tr', { key: rc.rechargeId, className: 'border-b hover:bg-slate-50' },
                  React.createElement('td', { className: 'p-2' }, '#' + rc.rechargeId),
                  React.createElement('td', { className: 'p-2 font-bold text-emerald-700' }, '৳' + rc.amount),
                  React.createElement('td', { className: 'p-2 font-mono text-xs' }, rc.transactionId),
                  React.createElement('td', { className: 'p-2' }, 
                    rc.status === 'pending' ? React.createElement('span', { className: 'bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs' }, '⏳ পেন্ডিং') :
                    rc.status === 'approved' ? React.createElement('span', { className: 'bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs' }, '✅ অনুমোদিত') :
                    React.createElement('span', { className: 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs' }, '❌ ব্যর্থ')
                  )
                ))
            )
          )
        )
      )
    ),
    
    // Home Screen - Services Grid
    currentScreen === 'home' && React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'text-center' }, React.createElement('h2', { className: 'text-xl font-bold text-[#0a2e1f]' }, 'আমাদের সেবাসমূহ')),
      React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
        Object.keys(parentGroups).map(gid => 
          React.createElement('div', { key: gid, onClick: () => openParentGroup(gid), className: 'service-card' },
            React.createElement('div', { className: 'service-card-icon' }, gid === 'nid_card' ? '🪪' : (gid === 'sim_biometric' ? '📱' : (gid === 'lost_nid_form' ? '📄' : '👶'))),
            React.createElement('h4', { className: 'service-card-title' }, parentGroups[gid].name)
          )
        )
      ),
      React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-5 gap-4' },
        allServices.map(svc => 
          React.createElement('div', { key: svc.id, onClick: () => openDirectService(svc.id), className: 'service-card' },
            React.createElement('div', { className: 'service-card-icon' }, svc.icon === 'MapPin' ? '📍' : (svc.icon === 'Search' ? '🔍' : (svc.icon === 'Share2' ? '📤' : (svc.icon === 'FileText' ? '📄' : '📱')))),
            React.createElement('h4', { className: 'service-card-title' }, svc.name)
          )
        )
      )
    ),
    
    // Sub Services Screen
    currentScreen === 'subservices' && selectedParentGroupId && React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'flex items-center justify-between border-b pb-3' },
        React.createElement('h2', { className: 'text-lg font-bold text-[#0a2e1f]' }, parentGroups[selectedParentGroupId].name),
        React.createElement('button', { onClick: () => setCurrentScreen('home'), className: 'text-emerald-600 text-sm' }, '← পেছনে')
      ),
      React.createElement('div', { className: 'grid grid-cols-3 gap-2' }, 
        parentGroups[selectedParentGroupId].children.map(cid => 
          React.createElement('div', { key: cid, onClick: () => setSelectedServiceId(cid), className: 'p-3 rounded-xl text-center cursor-pointer transition ' + (selectedServiceId === cid ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700') },
            React.createElement('div', { className: 'font-semibold text-sm' }, serviceForms[cid]?.name),
            React.createElement('div', { className: 'text-xs mt-1' }, '💰 ' + serviceForms[cid]?.rate + ' টাকা')
          )
        )
      ),
      selectedServiceId && serviceForms[selectedServiceId] && React.createElement('form', { onSubmit: e => handlePlaceOrder(e, selectedServiceId), className: 'bg-white p-5 rounded-xl shadow-md space-y-4' },
        serviceForms[selectedServiceId].fields.map(f => 
          React.createElement('div', { key: f.id, className: 'space-y-1' },
            React.createElement('label', { className: 'text-xs font-bold text-slate-600' }, f.name),
            React.createElement('input', { type: f.type || 'text', placeholder: f.name, value: formData[f.id] || '', onChange: e => setFormData({ ...formData, [f.id]: e.target.value }), className: 'w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none', required: f.required })
          )
        ),
        React.createElement('button', { type: 'submit', className: 'w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg text-white font-bold' }, 'অর্ডার সাবমিট করুন')
      )
    ),
    
    // Admin Panel (সংক্ষেপে)
    currentScreen === 'admin' && React.createElement('div', { className: 'space-y-6' },
      React.createElement('div', { className: 'border-b pb-4' },
        React.createElement('h2', { className: 'text-2xl font-black text-[#0a2e1f]' }, '⚙️ অ্যাডমিন প্যানেল'),
        React.createElement('p', { className: 'text-slate-500 text-sm' }, 'ইউজার অর্ডার ম্যানেজমেন্ট, রিচার্জ এপ্রুভাল ও কন্ট্রোল সেন্টার')
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-2 bg-slate-100 p-2 rounded-xl' },
        React.createElement('button', { onClick: () => { setAdminActiveTab('dashboard'); loadAdminStats(); }, className: 'px-4 py-2 rounded-lg text-sm font-medium transition ' + (adminActiveTab === 'dashboard' ? 'bg-white shadow text-emerald-700' : 'hover:bg-slate-200') }, '📊 ড্যাশবোর্ড'),
        React.createElement('button', { onClick: () => { setAdminActiveTab('orders'); loadAdminOrders(); }, className: 'px-4 py-2 rounded-lg text-sm font-medium transition ' + (adminActiveTab === 'orders' ? 'bg-white shadow text-emerald-700' : 'hover:bg-slate-200') }, '📦 অর্ডার'),
        React.createElement('button', { onClick: () => { setAdminActiveTab('users'); loadAdminUsers(); }, className: 'px-4 py-2 rounded-lg text-sm font-medium transition ' + (adminActiveTab === 'users' ? 'bg-white shadow text-emerald-700' : 'hover:bg-slate-200') }, '👥 ইউজার'),
        React.createElement('button', { onClick: () => { setAdminActiveTab('recharges'); loadAdminRecharges(); }, className: 'px-4 py-2 rounded-lg text-sm font-medium transition ' + (adminActiveTab === 'recharges' ? 'bg-white shadow text-emerald-700' : 'hover:bg-slate-200') }, '💰 রিচার্জ'),
        React.createElement('button', { onClick: () => setAdminActiveTab('notice'), className: 'px-4 py-2 rounded-lg text-sm font-medium transition ' + (adminActiveTab === 'notice' ? 'bg-white shadow text-emerald-700' : 'hover:bg-slate-200') }, '📢 নোটিশ')
      ),
      
      adminActiveTab === 'dashboard' && React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-5 gap-4' },
        React.createElement('div', { className: 'bg-white p-5 rounded-2xl text-center shadow-sm' }, React.createElement('h3', { className: 'text-slate-400 text-xs uppercase' }, 'মোট অর্ডার'), React.createElement('p', { className: 'text-3xl font-bold text-slate-800' }, adminStats.total)),
        React.createElement('div', { className: 'bg-white p-5 rounded-2xl text-center shadow-sm' }, React.createElement('h3', { className: 'text-amber-500 text-xs uppercase' }, 'পেন্ডিং'), React.createElement('p', { className: 'text-3xl font-bold text-amber-500' }, adminStats.pending)),
        React.createElement('div', { className: 'bg-white p-5 rounded-2xl text-center shadow-sm' }, React.createElement('h3', { className: 'text-emerald-600 text-xs uppercase' }, 'সম্পন্ন'), React.createElement('p', { className: 'text-3xl font-bold text-emerald-600' }, adminStats.delivered)),
        React.createElement('div', { className: 'bg-white p-5 rounded-2xl text-center shadow-sm' }, React.createElement('h3', { className: 'text-red-500 text-xs uppercase' }, 'বাতিল'), React.createElement('p', { className: 'text-3xl font-bold text-red-500' }, adminStats.cancelled)),
        React.createElement('div', { className: 'bg-emerald-900 p-5 rounded-2xl text-center shadow-sm' }, React.createElement('h3', { className: 'text-emerald-400 text-xs uppercase' }, 'রেভিনিউ'), React.createElement('p', { className: 'text-3xl font-bold text-emerald-300' }, '৳' + adminStats.revenue))
      ),
      
      adminActiveTab === 'recharges' && React.createElement('div', { className: 'bg-white p-4 rounded-2xl shadow-md' },
        React.createElement('div', { className: 'flex justify-between items-center mb-4' }, React.createElement('h3', { className: 'font-bold' }, 'রিচার্জ রিকোয়েস্টসমূহ'), React.createElement('button', { onClick: loadAdminRecharges, className: 'text-xs text-emerald-600' }, '↻ রিফ্রেশ')),
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'w-full text-sm' },
            React.createElement('thead', null, React.createElement('tr', { className: 'bg-slate-100' }, 
              React.createElement('th', { className: 'p-2 text-left' }, 'ID'),
              React.createElement('th', { className: 'p-2 text-left' }, 'ইউজার'),
              React.createElement('th', { className: 'p-2 text-left' }, 'পরিমাণ'),
              React.createElement('th', { className: 'p-2 text-left' }, 'Txn ID'),
              React.createElement('th', { className: 'p-2 text-left' }, 'স্ট্যাটাস'),
              React.createElement('th', { className: 'p-2 text-left' }, 'অ্যাকশন')
            )),
            React.createElement('tbody', null, adminRecharges.map(rc => 
              React.createElement('tr', { key: rc.rechargeId, className: 'border-b hover:bg-slate-50' },
                React.createElement('td', { className: 'p-2 font-mono' }, '#' + rc.rechargeId),
                React.createElement('td', { className: 'p-2' }, rc.name),
                React.createElement('td', { className: 'p-2 font-bold' }, '৳' + rc.amount),
                React.createElement('td', { className: 'p-2 font-mono text-xs' }, rc.transactionId),
                React.createElement('td', { className: 'p-2' }, rc.status === 'pending' ? React.createElement('span', { className: 'bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs' }, '⏳ পেন্ডিং') : (rc.status === 'approved' ? React.createElement('span', { className: 'bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs' }, '✅ অনুমোদিত') : React.createElement('span', { className: 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs' }, '❌ ব্যর্থ'))),
                React.createElement('td', { className: 'p-2' }, rc.status === 'pending' && React.createElement(React.Fragment, null, 
                  React.createElement('button', { onClick: () => handleUpdateRechargeStatus(rc.rechargeId, 'approved'), className: 'bg-emerald-600 text-white px-2 py-1 rounded text-xs mr-1' }, 'অনুমোদন'),
                  React.createElement('button', { onClick: () => handleUpdateRechargeStatus(rc.rechargeId, 'failed'), className: 'bg-red-600 text-white px-2 py-1 rounded text-xs' }, 'রিজেক্ট')
                ))
              )
            ))
          )
        )
      ),
      
      adminActiveTab === 'notice' && React.createElement('div', { className: 'bg-white p-6 rounded-2xl shadow-md max-w-lg mx-auto' },
        React.createElement('h3', { className: 'font-bold text-lg mb-2' }, '📢 নোটিশ বোর্ড'),
        React.createElement('p', { className: 'text-slate-500 text-sm mb-4' }, 'সকল ইউজারের জন্য স্ক্রলিং নোটিশ'),
        React.createElement('textarea', { className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', rows: 4, value: adminNoticeInput, onChange: e => setAdminNoticeInput(e.target.value), placeholder: 'নোটিশ লিখুন...' }),
        React.createElement('button', { onClick: handleUpdateNoticeSubmit, className: 'mt-4 w-full bg-emerald-700 hover:bg-emerald-600 py-2 rounded-full text-white font-bold' }, 'নোটিশ আপডেট করুন')
      )
    ),
    
    // Modals
    modalOpen && React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]' },
      React.createElement('div', { className: 'bg-white p-6 rounded-2xl max-w-md w-full mx-4' },
        React.createElement('h3', { className: 'font-bold text-lg' }, modalTitle),
        React.createElement('pre', { className: 'mt-3 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-lg max-h-96 overflow-auto' }, modalContent),
        React.createElement('button', { onClick: () => setModalOpen(false), className: 'mt-4 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg w-full font-medium' }, 'বন্ধ করুন')
      )
    ),
    
    deliveryModalOpen && React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]' },
      React.createElement('div', { className: 'bg-white p-6 rounded-2xl w-96 max-w-full mx-4' },
        React.createElement('h3', { className: 'font-bold text-lg mb-4' }, 'ডেলিভারি তথ্য (অর্ডার #' + deliveryOrderId + ')'),
        React.createElement('div', { className: 'flex gap-2 mb-4' },
          React.createElement('button', { onClick: () => { setDeliveryDataType('text'); setDeliveryInputVal(''); }, className: 'flex-1 py-2 rounded-lg text-sm font-medium transition ' + (deliveryDataType === 'text' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600') }, 'টেক্সট মেসেজ'),
          React.createElement('button', { onClick: () => { setDeliveryDataType('link'); setDeliveryInputVal(''); }, className: 'flex-1 py-2 rounded-lg text-sm font-medium transition ' + (deliveryDataType === 'link' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600') }, 'ডাউনলোড লিংক')
        ),
        deliveryDataType === 'text' ?
          React.createElement('textarea', { className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', rows: 4, value: deliveryInputVal, onChange: e => setDeliveryInputVal(e.target.value), placeholder: 'ডেলিভারি মেসেজ লিখুন...' }) :
          React.createElement('input', { type: 'url', className: 'w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none', value: deliveryInputVal, onChange: e => setDeliveryInputVal(e.target.value), placeholder: 'https://drive.google.com/...' }),
        React.createElement('div', { className: 'flex gap-3 mt-5' },
          React.createElement('button', { onClick: submitCustomDelivery, className: 'flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg text-white font-bold' }, 'জমা দিন'),
          React.createElement('button', { onClick: () => setDeliveryModalOpen(false), className: 'flex-1 bg-slate-200 hover:bg-slate-300 py-2 rounded-lg font-medium' }, 'বাতিল')
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));