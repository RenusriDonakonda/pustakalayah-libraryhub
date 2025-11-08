// --- CONFIG ---
// Set API_BASE to the backend server URL for production.
// Main frontend script for Pustakalayah LibraryHub
// Clean, consolidated version with API and demo fallback

// --- CONFIG ---
// Set API_BASE to the backend server URL for production.
const API_BASE = 'http://localhost:8000';

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (API_BASE) return API_BASE.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
  return path.startsWith('/') ? path.slice(1) : path;
}

function navigateTo(filename) {
  if (window.location.pathname.includes('/pages/')) {
    window.location.href = `./${filename}`;
  } else {
    window.location.href = `pages/${filename}`;
  }
}

const DEFAULT_AVATARS = ['avatar1.svg','avatar2.svg','avatar3.svg','avatar4.svg','avatar5.svg','avatar7.svg','avatar8.svg'];

// Demo API fallback when API_BASE is empty
async function api(path, options = {}) {
  // Debug: log API calls to help diagnose 'Failed to fetch' issues when running from file://
  try { console.debug('api()', { path, apiBase: API_BASE, method: (options.method || 'GET') }); } catch (e) {}

  // Treat explicit empty string (or all-whitespace) as "no backend" (demo mode)
  if (typeof API_BASE === 'string' && API_BASE.trim() === '') {
    // Prevent automatic persistent login in demo mode
    // (we only authenticate when user submits the login form)
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : undefined;
    function loadDemoUsers() { try { return JSON.parse(localStorage.getItem('demo_users') || '[]'); } catch(e) { return []; } }
    function saveDemoUsers(list) { localStorage.setItem('demo_users', JSON.stringify(list)); }
    function loadDemoBooks() {
      try {
        const books = JSON.parse(localStorage.getItem('demo_books') || '[]');
        if (!books.length) {
          const defaultBooks = [
            { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'fiction', description: 'A story of decadence and excess.' },
            { id: 2, title: 'Harry Potter', author: 'J.K. Rowling', category: 'fiction', description: 'A young wizard\'s adventures.' },
            { id: 3, title: 'Clean Code', author: 'Robert C. Martin', category: 'technology', description: 'A handbook of agile software craftsmanship.' }
          ];
          localStorage.setItem('demo_books', JSON.stringify(defaultBooks));
          return defaultBooks;
        }
        return books;
      } catch(e) { return []; }
    }
    function saveDemoBooks(list) { localStorage.setItem('demo_books', JSON.stringify(list)); }
    function loadDemoBorrowings() { try { return JSON.parse(localStorage.getItem('demo_borrowings') || '[]'); } catch(e) { return []; } }
    function saveDemoBorrowings(list) { localStorage.setItem('demo_borrowings', JSON.stringify(list)); }

    if (path.includes('/api/users/login') && method === 'POST') {
      const { username, password } = body || {};
      const users = loadDemoUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) throw new Error('Invalid username or password');
      const respUser = { ...user }; delete respUser.password;
      return { token: 'demo-token', user: respUser };
    }

    if (path.includes('/api/users/register') && method === 'POST') {
      const { username, email, password, avatar } = body || {};
      if (!username || !email || !password) throw new Error('Missing fields');
      const users = loadDemoUsers();
      if (users.find(u => u.username === username)) throw new Error('Username already exists');
      if (users.find(u => u.email === email)) throw new Error('Email already exists');
      
      // Get pending avatar if exists
      const pendingAvatar = localStorage.getItem('pendingAvatarFile') || localStorage.getItem('pendingAvatarChoice');
      
      const newUser = { 
        id: Date.now(), 
        username, 
        email, 
        password,
        avatar: pendingAvatar || avatar || null,
        role: 'member', 
        member_since: new Date().toISOString() 
      };
      users.push(newUser); 
      saveDemoUsers(users);
      
      // Clear pending avatars after successful registration
      localStorage.removeItem('pendingAvatarFile');
      localStorage.removeItem('pendingAvatarChoice');
      
      const { password: _, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword, token: 'demo-token-' + Date.now() };
    }

    if (path.includes('/api/users') && method === 'GET') {
      return loadDemoUsers().map(u => { const { password, ...rest } = u; return rest; });
    }
    
    if (path.match(/\/api\/users\/\d+\/avatar/) && method === 'POST') {
      const userId = path.match(/\/api\/users\/(\d+)\/avatar/)[1];
      const { avatarUrl } = body || {};
      if (!avatarUrl) throw new Error('Avatar URL is required');
      
      const users = loadDemoUsers();
      const userIndex = users.findIndex(u => u.id === parseInt(userId));
      if (userIndex === -1) throw new Error('User not found');
      
      users[userIndex].avatar = avatarUrl;
      saveDemoUsers(users);
      
      const user = users[userIndex];
      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    }

    // Demo: support PUT /api/users/:id to update profile (name, email, avatar)
    if (path.match(/\/api\/users\/\d+(?:$|\?)/) && method === 'PUT') {
      const userId = path.match(/\/api\/users\/(\d+)/)[1];
      const { name, email, avatar } = body || {};
      const users = loadDemoUsers();
      const idx = users.findIndex(u => u.id === parseInt(userId));
      if (idx === -1) throw new Error('User not found');
      if (name !== undefined) users[idx].name = name;
      if (email !== undefined) users[idx].email = email;
      if (avatar !== undefined) users[idx].avatar = avatar;
      saveDemoUsers(users);
      const { password: _, ...userWithoutPassword } = users[idx];
      return userWithoutPassword;
    }
        // Demo book catalog
        if (path === '/api/books' && method === 'GET') {
          return loadDemoBooks();
        }

        // Demo borrowing system
        if (path === '/api/borrowing/borrow' && method === 'POST') {
          const { user_id, book_id, book_title, book_author } = body || {};
          const borrowings = loadDemoBorrowings();
          const newBorrowing = {
            id: Date.now(),
            user_id,
            book_id,
            book_title,
            book_author,
            borrow_date: new Date().toISOString()
          };
          borrowings.push(newBorrowing);
          saveDemoBorrowings(borrowings);
          return newBorrowing;
        }

        if (path.startsWith('/api/borrowing/return/') && method === 'PUT') {
          const borrowId = parseInt(path.split('/').pop());
          const borrowings = loadDemoBorrowings();
          const index = borrowings.findIndex(b => b.id === borrowId);
          if (index === -1) throw new Error('Borrow record not found');
          borrowings.splice(index, 1);
          saveDemoBorrowings(borrowings);
          return { success: true };
        }

        if (path.includes('/api/borrowing/user/') && method === 'GET') {
          const userId = parseInt(path.split('/').pop());
          const borrowings = loadDemoBorrowings();
          return borrowings.filter(b => b.user_id === userId);
        }

    throw new Error('No backend configured for this endpoint in demo mode');
  }

  // Real backend path
  try {
    const token = localStorage.getItem('token');
    const url = buildUrl(path);
    console.debug('api -> fetch', { url });
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) , ...(options.headers || {}) },
      ...options
    });
    if (!res.ok) {
      let data; try { data = await res.json(); } catch(e) { throw new Error('Request failed'); }
      throw new Error(data.error || data.detail || JSON.stringify(data));
    }
    try { return await res.json(); } catch { return null; }
  } catch (err) {
    console.error('API error', err);
    // Normalize network errors so UI shows clearer message
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Network error: failed to reach backend. If you intended to run without a backend, ensure API_BASE is empty.');
    }
    throw err;
  }
}

// --- STATE ---
let activeUser = null;
let books = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let borrowRecords = [];

// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  // IMPORTANT: in demo mode clear any lingering token/user so we don't auto-login
  if (!API_BASE) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginError = document.getElementById('loginError');
  const mainContent = document.getElementById('mainContent');
  const loginSection = document.getElementById('login');
  const signupSection = document.getElementById('signup');

  const profileNameInput = document.getElementById('profileName');
  const profileEmailInput = document.getElementById('profileEmail');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const profileAvatar = document.getElementById('profileAvatar');
  const avatarInput = document.getElementById('avatarInput');
  const chooseFromGalleryBtn = document.getElementById('chooseFromGalleryBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const avatarGalleryOverlay = document.getElementById('avatarGalleryOverlay');
  const avatarGallery = document.getElementById('avatarGallery');
  const closeAvatarGallery = document.getElementById('closeAvatarGallery');
  const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');

  function updateLocalStorage() { localStorage.setItem('cart', JSON.stringify(cart)); }

  // Minimal helper UI functions used by auth flows
  function showMainForUser(user) {
    activeUser = user;
    if (loginSection) loginSection.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    updateProfileFields(user);
    // Apply any avatar the user picked while logged-out (persist to backend)
    applyPendingAvatarForUser(user).catch(e => console.debug('applyPendingAvatarForUser:', e));
    // If the user has no avatar, optionally persist a generated initials image so it's consistent across devices
    (async function ensureInitials() {
      try {
        if (user && !user.avatar) {
          const initialsDataUrl = generateInitialsAvatar(user.name || user.username || 'U', 128);
          // Persist generated initials to backend so all devices show same placeholder
          const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: initialsDataUrl }) });
          if (updated) {
            activeUser = updated;
            localStorage.setItem('user', JSON.stringify(activeUser));
            updateProfileFields(activeUser);
          }
        }
      } catch (err) {
        // non-fatal
        console.debug('Could not persist initials avatar:', err);
      }
    })();
  }

  function updateProfileFields(user) {
    if (!user) return;
    if (profileNameInput) profileNameInput.value = user.name || user.username || '';
    if (profileEmailInput) profileEmailInput.value = user.email || '';
    // Always use avatar from user object (stored in backend per user)
    // Clear the image first to force refresh and avoid showing wrong avatar
    if (profileAvatar) {
      if (user.avatar) {
        // Add cache-busting parameter to force browser to reload the image
        const separator = user.avatar.includes('?') ? '&' : '?';
        profileAvatar.src = user.avatar + separator + '_t=' + Date.now();
      } else {
        // Reset to default if no avatar
        profileAvatar.src = profileAvatar.src.split('?')[0].split('&')[0]; // Clear any cache params
      }
    }
  }

  // Convert repo-relative or manifest-relative paths to a stable absolute URL
  function toAbsoluteAvatarUrl(src) {
    try {
      // If it's already an absolute URL (http/https/data), return as-is
      if (/^data:|^https?:\/\//i.test(src)) return src;
      // Use current document location as base so hosting under a subpath resolves correctly
      return new URL(src, window.location.href).href;
    } catch (e) {
      return src;
    }
  }

  // Convert a dataURL -> Blob (used for uploading pending avatar file after login)
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  // Hash a password using SHA-256 and return hex string
  async function hashPassword(password) {
    if (!password) return '';
    try {
      const enc = new TextEncoder();
      const data = enc.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (err) {
      // In case crypto.subtle not available, fallback to sending plaintext (not ideal)
      console.warn('Web Crypto unavailable, sending plaintext password');
      return password;
    }
  }

  // Resize an image File to a max dimension and return a dataURL
  function resizeImageFile(file, maxDim = 512, mime = 'image/jpeg', quality = 0.85) {
    return new Promise((resolve, reject) => {
      // SVGs: keep original as dataURL
      if (file.type === 'image/svg+xml') {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w <= maxDim && h <= maxDim) {
            // No resize needed
            resolve(reader.result);
            return;
          }
          const ratio = Math.max(w, h) / maxDim;
          const nw = Math.round(w / ratio);
          const nh = Math.round(h / ratio);
          const canvas = document.createElement('canvas');
          canvas.width = nw;
          canvas.height = nh;
          const ctx = canvas.getContext('2d');
          // draw with smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, nw, nh);
          try {
            const out = canvas.toDataURL(mime, quality);
            resolve(out);
          } catch (err) {
            // Fallback: return original
            resolve(reader.result);
          }
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Centralized handler for avatar file inputs (resizes, stores pending or uploads)
  async function handleAvatarFile(file) {
    if (!file) return;
    try {
      const resizedDataUrl = await resizeImageFile(file, 512, 'image/jpeg', 0.85);
      profileAvatar.src = resizedDataUrl;

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user && user.id) {
        // Upload resized image as multipart to backend
        const blob = dataURLtoBlob(resizedDataUrl);
        const form = new FormData();
        form.append('avatar', blob, file.name || `avatar-${Date.now()}.jpg`);
        const token = localStorage.getItem('token');
        const res = await fetch(buildUrl(`/api/users/${user.id}/avatar`), { method: 'POST', body: form, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (res.ok) {
          const updated = await res.json();
          activeUser = updated;
          try { localStorage.setItem('user', JSON.stringify(activeUser)); } catch (e) {}
          // Update avatar from backend response (user-specific) with cache-busting
          if (updated.avatar) {
            const separator = updated.avatar.includes('?') ? '&' : '?';
            profileAvatar.src = updated.avatar + separator + '_t=' + Date.now();
          }
        }
      } else {
        // Not logged in: save the resized data URL and apply on next login
        try { localStorage.setItem('pendingAvatarFile', resizedDataUrl); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.warn('Failed to process avatar image', err);
    }
  }

  // Apply any avatar the user picked while logged-out (gallery or uploaded file)
  async function applyPendingAvatarForUser(user) {
    if (!user || !user.id) return;
    const pendingChoice = localStorage.getItem('pendingAvatarChoice');
    const pendingFile = localStorage.getItem('pendingAvatarFile');
    const token = localStorage.getItem('token');
    try {
      // If user uploaded a file while logged out, upload it now as multipart/form-data
      if (pendingFile) {
        try {
          // Use the PUT user route to persist dataURL avatars (works in demo & real backends)
          const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: pendingFile }) });
          if (updated) {
            activeUser = updated;
            localStorage.setItem('user', JSON.stringify(activeUser));
            localStorage.removeItem('pendingAvatarFile');
            localStorage.removeItem('profileAvatar');
            localStorage.removeItem('userAvatar');
          }
        } catch (err) {
          console.warn('Failed to persist pending avatar file after login', err);
        }
      }

      // If user picked a gallery choice while logged out, persist it now
      if (pendingChoice) {
        try {
          // Use PUT /api/users/:id to set avatar to the stable absolute URL or data URL
          const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: pendingChoice }) });
          if (updated) {
            activeUser = updated;
            localStorage.setItem('user', JSON.stringify(activeUser));
            localStorage.removeItem('pendingAvatarChoice');
            localStorage.removeItem('profileAvatar');
            localStorage.removeItem('userAvatar');
          }
        } catch (err) {
          console.warn('Failed to persist pending gallery avatar after login', err);
        }
      }
    } catch (err) {
      console.warn('Error applying pending avatar for user', err);
    }
  }

  // Login
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (loginError) loginError.classList.add('hidden');
    
    // Hide any verification message
    const verificationMessage = document.getElementById('verificationMessage');
    const resendVerificationBtn = document.getElementById('resendVerificationBtn');
    if (verificationMessage) verificationMessage.classList.add('hidden');
    if (resendVerificationBtn) resendVerificationBtn.classList.add('hidden');
    
    try {
      // Hash password client-side for extra protection in transit
      const hashed = await hashPassword(password);
      const res = await api('/api/users/login', { method: 'POST', body: JSON.stringify({ username, password: hashed }) });
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        showMainForUser(res.user);
      } else if (res && res.user) {
        showMainForUser(res.user);
      }
    } catch (err) {
      // Check if error is due to unverified email
      if (err.message && err.message.includes('Email not verified')) {
        if (loginError) {
          loginError.textContent = err.message;
          loginError.classList.remove('hidden');
        }
        
        // Show verification message and resend button
        if (verificationMessage) {
          verificationMessage.textContent = 'Please verify your email before logging in.';
          verificationMessage.classList.remove('hidden');
        }
        if (resendVerificationBtn) {
          resendVerificationBtn.classList.remove('hidden');
          // Store username for resend
          resendVerificationBtn.dataset.username = username;
        }
      } else {
        if (loginError) { 
          loginError.textContent = err.message || 'Login failed'; 
          loginError.classList.remove('hidden'); 
        }
      }
    }
  });

  // Signup
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameEl = document.getElementById('newUsername');
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('newPassword');
    const username = usernameEl.value.trim();
    const email = (emailEl && emailEl.value || '').trim();
    const password = passwordEl && passwordEl.value;
    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const signupError = document.getElementById('signupError');
    const signupSpinner = document.getElementById('signupSpinner');
    // clear errors
    [usernameError, emailError, passwordError, signupError].forEach(el => { if (el) el.classList.add('hidden'); el && (el.textContent = ''); });

  // Basic client-side validation with stronger password rules
  let hasErr = false;
  if (!username) { usernameError && (usernameError.textContent = 'Please enter a username'); usernameError && usernameError.classList.remove('hidden'); hasErr = true; }
  if (!email || !email.includes('@') || email.length < 6) { emailError && (emailError.textContent = 'Please enter a valid email'); emailError && emailError.classList.remove('hidden'); hasErr = true; }
  // Stronger password rules: min 8, upper, lower, digit, special
  const pwdRules = [/.{8,}/, /[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const pwdMsgs = ['at least 8 characters', 'a lowercase letter', 'an uppercase letter', 'a number', 'a special character'];
  const failed = pwdRules.map((r,i)=>r.test(password)?null:pwdMsgs[i]).filter(Boolean);
  if (failed.length) { passwordError && (passwordError.textContent = 'Password must contain ' + failed.join(', ')); passwordError && passwordError.classList.remove('hidden'); hasErr = true; }
    if (hasErr) return;

    try {
      signupSpinner && signupSpinner.classList.remove('hidden');
      // If running in demo mode, check local demo_users for uniqueness first
      if (!API_BASE) {
        try {
          const demoList = JSON.parse(localStorage.getItem('demo_users') || '[]');
          if (demoList.find(u=>u.username && u.username.toLowerCase()===username.toLowerCase())) {
            throw new Error('Username already exists (demo)');
          }
          if (demoList.find(u=>u.email && u.email.toLowerCase()===email.toLowerCase())) {
            throw new Error('Email already exists (demo)');
          }
        } catch (e) { throw e; }
      }

      // Hash the password client-side before sending
      const hashed = await hashPassword(password);

      // Get mobile number if available
      const mobileEl = document.getElementById('mobile');
      const mobile = mobileEl ? mobileEl.value.trim() : '';
      
      // Call register endpoint
      const reg = await api('/api/users/register', { method: 'POST', body: JSON.stringify({ username, email, password: hashed, mobile }) });
      
      // Registration successful - show verification message
      if (reg && reg.success) {
        let message = reg.message || 'Registration successful! Please check your email to verify your account.';
        
        // In development mode, show verification link
        if (reg.verificationUrl) {
          message += `\n\nDevelopment Mode - Verification Link:\n${reg.verificationUrl}`;
          alert(message);
          // Also log to console for easy copy
          console.log('Email Verification Link:', reg.verificationUrl);
        } else {
          alert(message);
        }
        
        // Clear form and redirect to login
        if (usernameEl) usernameEl.value = '';
        if (emailEl) emailEl.value = '';
        if (passwordEl) passwordEl.value = '';
        if (mobileEl) mobileEl.value = '';
        
        // Show login page
        if (signupSection) signupSection.classList.add('hidden');
        if (loginSection) loginSection.classList.remove('hidden');
        return;
      }
      
      // Legacy fallback: try auto-login (shouldn't happen with email verification)
      try {
        const loginRes = await api('/api/users/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        if (loginRes && loginRes.token) {
          localStorage.setItem('token', loginRes.token);
          localStorage.setItem('user', JSON.stringify(loginRes.user));
          showMainForUser(loginRes.user);
          return;
        }
      } catch (loginErr) {
        // ignore auto-login failure; fall back to redirect to login page
        console.debug('Auto-login after register failed', loginErr);
      }
      // fallback: go to login page so user can sign in
      navigateTo('login.html');
    } catch (err) {
      signupSpinner && signupSpinner.classList.add('hidden');
      const signupError = document.getElementById('signupError');
      if (signupError) { signupError.textContent = err.message || 'Signup failed'; signupError.classList.remove('hidden'); }
      else alert(err.message || 'Signup failed');
    } finally {
      signupSpinner && signupSpinner.classList.add('hidden');
    }
  });

  // Avatar gallery handlers (uses manifest or fallback)
  chooseFromGalleryBtn?.addEventListener('click', async () => {
    if (!avatarGallery || !avatarGalleryOverlay) return;
    avatarGalleryOverlay.classList.remove('hidden');
    try {
      const manifestPath = window.location.pathname.includes('/pages/') ? './assets/avatars.json' : 'pages/assets/avatars.json';
      const res = await fetch(manifestPath, { cache: 'no-cache' });
      const list = res.ok ? await res.json() : DEFAULT_AVATARS;
      avatarGallery.innerHTML = '';
      const avatarBase = manifestPath.replace(/avatars\.json$/, '');
      list.forEach(file => {
        const img = document.createElement('img');
        img.src = `${avatarBase}${file}`;
        img.className = 'w-20 h-20 rounded-full cursor-pointer';
        img.addEventListener('click', async () => {
          const selected = toAbsoluteAvatarUrl(img.src);
          profileAvatar.src = selected;
          // persist to backend if user logged in; otherwise store pending choice for next login
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.id) {
              const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: selected }) });
              if (updated) {
                // update activeUser and local copy - avatar is now stored per user in backend
                activeUser = updated;
                try { localStorage.setItem('user', JSON.stringify(activeUser)); } catch (e) {}
                // Update avatar from backend response (user-specific) with cache-busting
                if (updated.avatar) {
                  const separator = updated.avatar.includes('?') ? '&' : '?';
                  profileAvatar.src = updated.avatar + separator + '_t=' + Date.now();
                }
              }
            } else {
              try { localStorage.setItem('pendingAvatarChoice', selected); } catch (e) { /* ignore */ }
            }
          } catch (err) {
            console.warn('Failed to persist chosen avatar to backend, stored locally only', err);
          }
          avatarGalleryOverlay.classList.add('hidden');
        });
        avatarGallery.appendChild(img);
      });
    } catch (err) {
      console.warn('Avatar gallery failed', err);
    }
  });
  closeAvatarGallery?.addEventListener('click', () => avatarGalleryOverlay?.classList.add('hidden'));
  uploadAvatarBtn?.addEventListener('click', () => avatarInput?.click());
  avatarInput?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await handleAvatarFile(file);
  });

  // Initial UI state: show login, hide main content
  if (mainContent) mainContent.classList.add('hidden');
  if (loginSection) loginSection.classList.remove('hidden');

  // Mobile menu: slide-in drawer with overlay, focus trap and accessibility
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileMenuButtons = mobileMenu ? Array.from(mobileMenu.querySelectorAll('[data-target]')) : [];
  let _lastFocused = null;

  function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    _lastFocused = document.activeElement;
    mobileMenu.classList.add('open');
    mobileMenu.classList.remove('-translate-x-full');
    mobileMenuOverlay?.classList.add('show');
    mobileMenuOverlay?.classList.remove('hidden');
    mobileMenu.classList.remove('hidden');
    mobileMenuBtn?.setAttribute('aria-expanded', 'true');

    // focus trap setup
    const focusable = getFocusableElements(mobileMenu);
    if (focusable.length) focusable[0].focus();

    document.addEventListener('keydown', trapKeyDown);
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.classList.add('-translate-x-full');
    mobileMenuOverlay?.classList.remove('show');
    mobileMenuOverlay?.classList.add('hidden');
    // add a small timeout to allow animation to complete then hide
    setTimeout(() => { mobileMenu.classList.add('hidden'); }, 300);
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', trapKeyDown);
    if (_lastFocused) try { _lastFocused.focus(); } catch (e) {}
  }

  function trapKeyDown(e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusableElements(mobileMenu);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMobileMenu);
  }
  if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
  if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);

  // wire menu buttons (data-target) to navigation and close menu
  mobileMenuButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = btn.getAttribute('data-target');
      if (target) showPage(target);
      closeMobileMenu();
    });
  });

  // Logout mobile button
  const logoutBtnMobile = document.getElementById('logoutBtnMobile');
  if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', () => { closeMobileMenu(); logoutBtn?.click(); });

  // Keep mobile cart count in sync
  function syncMobileCartCount() {
    const navCountMobile = document.getElementById('navCartCountMobile');
    const navCount = document.getElementById('navCartCount');
    if (navCount && navCountMobile) {
      navCountMobile.textContent = navCount.textContent;
      navCountMobile.classList.toggle('hidden', navCount.classList.contains('hidden'));
    }
  }
  // initial sync
  syncMobileCartCount();
  // watch cart changes via existing functions by calling sync after cart updates
  const originalUpdateLocalStorage = updateLocalStorage;
  updateLocalStorage = function () { originalUpdateLocalStorage(); syncMobileCartCount(); };

  // Back-to-top button behavior
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (!backToTop) return;
    if (window.scrollY > 300) backToTop.classList.add('show'); else backToTop.classList.remove('show');
  });
  backToTop?.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Handle signup page initialization and submission
  if (document.getElementById('signupForm')) {
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarImage = document.getElementById('avatarImage');
    const avatarInitials = document.getElementById('avatarInitials');
    const avatarInput = document.getElementById('avatarInput');
    const signupForm = document.getElementById('signupForm');
    const signupError = document.getElementById('signupError');
    const signupSpinner = document.getElementById('signupSpinner');

    // Handle avatar preview click
    if (avatarPreview) {
      avatarPreview.addEventListener('click', () => avatarInput.click());
    }

    // Handle avatar file selection
    if (avatarInput) {
      avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const resizedDataUrl = await resizeImageFile(file, 512, 'image/jpeg', 0.85);
            avatarImage.src = resizedDataUrl;
            avatarImage.classList.remove('hidden');
            avatarInitials.classList.add('hidden');
            localStorage.setItem('pendingAvatarFile', resizedDataUrl);
          } catch (err) {
            console.warn('Failed to process avatar image', err);
            signupError.textContent = 'Failed to process avatar image. Please try a different image.';
            signupError.classList.remove('hidden');
          }
        }
      });
    }

    // Handle form submission
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('newUsername').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('newPassword').value;
      
      // Clear previous errors
      signupError.classList.add('hidden');
      document.getElementById('usernameError').classList.add('hidden');
      document.getElementById('emailError').classList.add('hidden');
      document.getElementById('passwordError').classList.add('hidden');
      
      // Validate fields
      let hasError = false;
      if (!username) {
        document.getElementById('usernameError').textContent = 'Username is required';
        document.getElementById('usernameError').classList.remove('hidden');
        hasError = true;
      }
      if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        document.getElementById('emailError').classList.remove('hidden');
        hasError = true;
      }
      if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        document.getElementById('passwordError').classList.remove('hidden');
        hasError = true;
      }
      
      if (hasError) return;
      
      // Show loading spinner
      signupSpinner.classList.remove('hidden');
      
      try {
        // Get the pending avatar if exists
        const pendingAvatar = localStorage.getItem('pendingAvatarFile');
        
        // Get mobile number
        const mobileEl = document.getElementById('mobile');
        const mobile = mobileEl ? mobileEl.value.trim() : '';
        
        // Register user
        const response = await api('/api/users/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            email,
            password,
            mobile,
            avatar: pendingAvatar || null
          })
        });
        
        if (response.success) {
          // Store user data and token
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          activeUser = response.user;
          
          // Clear any pending avatar data
          localStorage.removeItem('pendingAvatarFile');
          localStorage.removeItem('pendingAvatarChoice');
          
          // Redirect to dashboard
          navigateTo('dashboard.html');
        }
      } catch (err) {
        console.error('Signup error:', err);
        signupError.textContent = err.message || 'Failed to register user. Please try again.';
        signupError.classList.remove('hidden');
      } finally {
        signupSpinner.classList.add('hidden');
      }
    });
  }
});
//             </button>
//           </td>
//         </tr>
//       `;
//     });
//     updateCartCountDisplay();
//   }

//   function updateBorrowCountDisplay() {
//     const countEl = document.getElementById('borrowCountDisplay');
//     const emptyMsg = document.getElementById('emptyBorrowMessage');
//     if (countEl) countEl.textContent = (borrowRecords || []).length;
//     if (emptyMsg) emptyMsg.classList.toggle('hidden', (borrowRecords || []).length > 0);
//   }

//   function renderBorrowList() {
//     if (!borrowList) return;
//     borrowList.innerHTML = '';
//     borrowRecords.forEach((b) => {
//       borrowList.innerHTML += `
//         <tr class='border-b hover:bg-gray-50'>
//           <td class='p-4 font-semibold text-gray-800'>${b.book_title}</td>
//           <td class='p-4 text-gray-600'>${b.book_author}</td>
//           <td class='p-4'>
//             <button class='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md' onclick='returnBook(${b.id})'>
//               Return ↩️
//             </button>
//           </td>
//         </tr>
//       `;
//     });
//     updateBorrowCountDisplay();
//   }

//   function updateProfileFields(user) {
//     if (!user) return;
//     profileNameInput.value = user.name || user.username;
//     profileEmailInput.value = user.email;
//     originalProfile = { name: profileNameInput.value, email: profileEmailInput.value };
//   }

//   function toggleEditMode(isEditing) {
//     profileNameInput.readOnly = !isEditing;
//     profileEmailInput.readOnly = !isEditing;
//     profileNameInput.classList.toggle('bg-white', isEditing);
//     profileEmailInput.classList.toggle('bg-white', isEditing);
//     profileNameInput.classList.toggle('bg-gray-50', !isEditing);
//     profileEmailInput.classList.toggle('bg-gray-50', !isEditing);

//     editProfileBtn.classList.toggle('hidden', isEditing);
//     saveProfileBtn.classList.toggle('hidden', !isEditing);
//     cancelProfileBtn.classList.toggle('hidden', !isEditing);
//     changeAvatarBtn.disabled = !isEditing;
//   }

//   // --- NAVIGATION LOGIC ---
//   window.showPage = function (id) {
//     const pages = ['home', 'dashboard', 'catalog', 'bookDetails', 'borrowing', 'cart', 'members', 'profile'];
//     pages.forEach(p => {
//       const el = document.getElementById(p);
//       if (el) el.classList.add('hidden');
//     });
//     const current = document.getElementById(id);
//     if (current) {
//       current.classList.remove('hidden');
//       current.classList.add('page-section');
//     }
//     window.scrollTo(0, 0);

//     if (id === 'cart') renderCart();
//     if (id === 'borrowing') renderBorrowList();
//     if (id === 'members') loadMembers();
//   };

//   // --- AUTH ---
//   loginForm?.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const username = document.getElementById('username').value.trim();
//     const password = document.getElementById('password').value.trim();
//     try {
//       const user = await api('/api/users/login', {
//         method: 'POST',
//         body: JSON.stringify({ username, password })
//       });
//       activeUser = user;
//       loginSection.classList.add('hidden');
//       mainContent.classList.remove('hidden');
//       showPage('home');
//       loginError.classList.add('hidden');

//       await loadBooks();
//       await loadBorrowRecords();
//       renderCart();
//       renderBorrowList();
//       await loadMembers();
//       updateProfileFields(activeUser);
//     } catch (err) {
//       loginError.classList.remove('hidden');
//     }
//   });

//   signupForm?.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const payload = {
//       username: document.getElementById('newUsername').value.trim(),
//       password: document.getElementById('newPassword').value.trim(),
//       email: document.getElementById('email').value.trim(),
//       name: document.getElementById('newUsername').value.trim(),
//     };
//     try {
//       await api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
//       alert('Signup successful! You can login now');
//       document.getElementById('newUsername').value = '';
//       document.getElementById('email').value = '';
//       document.getElementById('newPassword').value = '';
//       signupSection.classList.add('hidden');
//       loginSection.classList.remove('hidden');
//     } catch (err) {
//       alert((err && err.message) || 'Signup failed');
//     }
//   });

//   logoutBtn?.addEventListener('click', () => {
//     activeUser = null;
//     mainContent.classList.add('hidden');
//     loginSection.classList.remove('hidden');
//     document.getElementById('username').value = '';
//     document.getElementById('password').value = '';
//   });

//   document.getElementById('showSignup')?.addEventListener('click', () => {
//     loginSection.classList.add('hidden');
//     signupSection.classList.remove('hidden');
//   });

//   document.getElementById('showLogin')?.addEventListener('click', () => {
//     signupSection.classList.add('hidden');
//     loginSection.classList.remove('hidden');
//   });

//   // --- CATALOG & BOOK DETAILS ---
//   window.viewBook = function (title) {
//     const book = books.find(b => b.title === title);
//     if (!book) return;

//     document.getElementById('bookImage').src = book.image || '';
//     document.getElementById('bookTitle').textContent = book.title;
//     document.getElementById('bookAuthor').textContent = `By ${book.author}`;
//     document.getElementById('bookDescription').textContent = book.description || '';
//     document.getElementById('bookCategory').textContent = `Category: ${book.category.charAt(0).toUpperCase() + book.category.slice(1)}`;

//     showPage('bookDetails');
//   };

//   const addToCartBtn = document.getElementById('addToCartBtn');
//   addToCartBtn?.addEventListener('click', () => {
//     const title = document.getElementById('bookTitle').textContent;
//     const author = document.getElementById('bookAuthor').textContent.replace('By ', '');
//     const book = books.find(b => b.title === title && b.author === author);
//     if (!book) return;

//     if (cart.find(item => item.id === book.id)) {
//       alert(`${title} is already in your cart!`);
//       return;
//     }

//     cart.push({ id: book.id, title: book.title, author: book.author });
//     updateLocalStorage();
//     renderCart();
//     alert(`${title} added to cart!`);
//   });

//   // Fetch and render books list
//   async function renderBooks(category = 'all') {
//     if (!books.length) await loadBooks();
//     const bookCatalog = document.getElementById('bookCatalog');
//     if (!bookCatalog) return;
//     bookCatalog.innerHTML = '';

//     const filteredBooks = category === 'all' ? books : books.filter(book => book.category === category);

//     filteredBooks.forEach(book => {
//       const bookCard = `
//         <div class="bg-white p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-105 border-t-4 border-indigo-200">
//           <img src="${book.image || ''}" alt="${book.title}" class="w-full h-64 object-cover rounded-lg mb-4 shadow-md">
//           <div class="space-y-2">
//             <h3 class="font-bold text-xl text-gray-800">${book.title}</h3>
//             <p class="text-gray-600">${book.author}</p>
//             <p class="text-sm text-indigo-500 italic font-medium">${book.category.charAt(0).toUpperCase() + book.category.slice(1)}</p>
//             <p class="text-sm text-gray-700 line-clamp-2">${book.description || ''}</p>
//             <button class="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md" 
//               onclick="viewBook('${book.title}')">View Details</button>
//           </div>
//         </div>
//       `;
//       bookCatalog.innerHTML += bookCard;
//     });
//   }

//   window.filterBooks = function (category, clickedButton) {
//     document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
//     clickedButton.classList.add('active');
//     renderBooks(category);
//   };

//   // --- CART & BORROWING ---
//   window.emptyCart = function () {
//     if (confirm('Are you sure you want to empty your cart?')) {
//       cart = [];
//       updateLocalStorage();
//       renderCart();
//       alert('Cart emptied!');
//     }
//   }

//   window.borrowBook = async function (index) {
//     if (!activeUser) { alert('Please login first.'); return; }
//     const item = cart[index];
//     if (!item) return;

//     try {
//       await api('/api/borrowing/borrow', {
//         method: 'POST',
//         body: JSON.stringify({
//           user_id: activeUser.id,
//           book_id: item.id,
//           book_title: item.title,
//           book_author: item.author,
//         })
//       });
//       cart.splice(index, 1);
//       updateLocalStorage();
//       renderCart();
//       await loadBorrowRecords();
//       renderBorrowList();
//       alert(`${item.title} borrowed successfully! Happy reading!`);
//     } catch (err) {
//       alert((err && err.message) || 'Failed to borrow');
//     }
//   };

//   window.returnBook = async function (borrowId) {
//     if (!activeUser) { alert('Please login first.'); return; }
//     try {
//       await api(`/api/borrowing/return/${borrowId}`, { method: 'PUT' });
//       await loadBorrowRecords();
//       renderBorrowList();
//       alert('Returned successfully!');
//     } catch (err) {
//       alert((err && err.message) || 'Failed to return');
//     }
//   };

//   // --- PROFILE ---
//   editProfileBtn?.addEventListener('click', () => {
//     originalProfile = { name: profileNameInput.value, email: profileEmailInput.value };
//     toggleEditMode(true);
//   });

//   cancelProfileBtn?.addEventListener('click', () => {
//     profileNameInput.value = originalProfile.name;
//     profileEmailInput.value = originalProfile.email;
//     toggleEditMode(false);
//   });

//   saveProfileBtn?.addEventListener('click', async () => {
//     if (!activeUser) return;

//     const newName = profileNameInput.value.trim();
//     const newEmail = profileEmailInput.value.trim();
//     if (!newName || !newEmail) { alert('Name and Email cannot be empty.'); return; }

//     try {
//       const updated = await api(`/api/users/${activeUser.id}`, {
//         method: 'PUT',
//         body: JSON.stringify({ name: newName, email: newEmail })
//       });
//       activeUser = updated;
//       alert('Profile updated successfully!');
//       toggleEditMode(false);
//       await loadMembers();
//     } catch (err) {
//       alert((err && err.message) || 'Failed to update profile');
//     }
//   });

//   changeAvatarBtn?.addEventListener('click', () => {
//     const randomSeed = Math.floor(Math.random() * 1000);
//     profileAvatar.src = `https://picsum.photos/seed/${randomSeed}/120/120`;
//     alert('Avatar updated! (Simulated)');
//   });

//   // --- INITIAL RENDER (unauthenticated) ---
//   renderBooks();
//   renderCart();
//   renderBorrowList();

//   // Toggle Add Book form display
//   window.toggleAddBookForm = function () {
//     const form = document.getElementById('addBookForm');
//     form.classList.toggle('hidden');
//   };

//   // Add Book form submit handler
//   window.handleAddBook = async function (e) {
//     e.preventDefault();
//     const API_BASE = "http://localhost:8000";
//     const data = {
//       title: document.getElementById('bookTitle').value.trim(),
//       author: document.getElementById('bookAuthor').value.trim(),
//       category: document.getElementById('bookCategory').value.trim(),
//       image: document.getElementById('bookImage').value.trim(),
//       isbn: document.getElementById('bookISBN').value.trim() || undefined,
//       published_year: parseInt(document.getElementById('bookYear').value) || undefined,
//       description: document.getElementById('bookDesc').value.trim(),
//       available: true
//     };
//     try {
//       const res = await fetch(`${API_BASE}/api/books`, {
//         method: 'POST',
//         headers: {'Content-Type':'application/json'},
//         body: JSON.stringify(data)
//       });
//       if (!res.ok) throw new Error((await res.json()).detail || "Add failed.");
//       alert("Book added!");
//       toggleAddBookForm();
//       await loadBooks();
//       renderBooks();
//       e.target.reset();
//     } catch (err) {
//       alert(`Failed to add book: ${err.message}`);
//     }
//     return false;
//   };

//   // Show Add Book section if admin user
//   function showAddBookForAdmin() {
//     const section = document.getElementById('addBookSection');
//     if (activeUser && activeUser.role === 'admin') {
//       section.classList.remove('hidden');
//     } else {
//       section.classList.add('hidden');
//     }
//   }

//   // Call after login/signup
//   const _prevLogin = loginForm.onsubmit;
//   loginForm?.addEventListener('submit', async function(e) {
//     setTimeout(showAddBookForAdmin, 50);
//   });
//   signupForm?.addEventListener('submit', async function(e) {
//     setTimeout(showAddBookForAdmin, 300);
//   });
//   logoutBtn?.addEventListener('click', showAddBookForAdmin);
//   // Call also on page load
//   showAddBookForAdmin();
// });



window.addEventListener('DOMContentLoaded', () => {
  // --- CONFIG ---
  const API_BASE = 'http://localhost:8000';

  // --- STATE ---
  let activeUser = null;
  let books = [];
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  let borrowRecords = [];

  // --- ELEMENTS ---
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginError = document.getElementById('loginError');
  const mainContent = document.getElementById('mainContent');
  const loginSection = document.getElementById('login');
  const signupSection = document.getElementById('signup');
  const logoutBtn = document.getElementById('logoutBtn');
  const cartItems = document.getElementById('cartItems');
  const borrowList = document.getElementById('borrowList');
  const memberListTable = document.getElementById('memberList');

  // Profile elements
  const profileNameInput = document.getElementById('profileName');
  const profileEmailInput = document.getElementById('profileEmail');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const profileAvatar = document.getElementById('profileAvatar');
  const avatarInput = document.getElementById('avatarInput');
  const avatarGalleryOverlay = document.getElementById('avatarGalleryOverlay');
  const avatarGallery = document.getElementById('avatarGallery');
  const closeAvatarGallery = document.getElementById('closeAvatarGallery');
  const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
  const chooseFromGalleryBtn = document.getElementById('chooseFromGalleryBtn');

  let originalProfile = {};

  // --- HELPERS ---
  const updateLocalStorage = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
  };

  // Use the top-level `api()` defined earlier which handles demo mode and logging.

  async function loadBooks() {
    books = await api('/api/books');
  }

  async function loadBorrowRecords() {
    if (!activeUser) { borrowRecords = []; return; }
    borrowRecords = await api(`/api/borrowing/user/${activeUser.id}`);
  }

  async function loadMembers() {
    const users = await api('/api/users');
    memberListTable.innerHTML = '';
    users.forEach(user => {
      const memberSince = user.member_since ? new Date(user.member_since).toLocaleDateString('en-US') : 'N/A';
      const avatarUrl = user.avatar || user.profileAvatar || null;
      // We'll use data-src for lazy loading and a small inline placeholder
      const placeholder = generateInitialsAvatar(user.name || user.username || 'U', 48);
      const dataSrc = avatarUrl || placeholder;
      memberListTable.innerHTML += `
        <tr class='border-b hover:bg-gray-50 items-center'>
          <td class='p-4'>
            <img data-src="${dataSrc}" src="${placeholder}" alt="${(user.name||user.username)||'User'} avatar" class="member-avatar w-12 h-12 rounded-full object-cover inline-block cursor-pointer" data-full="${avatarUrl || placeholder}">
          </td>
          <td class='p-4 font-semibold text-gray-800'>${user.name || user.username}</td>
          <td class='p-4 text-gray-600'>${user.email || ''}</td>
          <td class='p-4 text-gray-500'>${memberSince}</td>
        </tr>
      `;
    });

    // After rendering, setup lazy-loading and click handlers
    setupLazyAvatars();
  }

  // Generate a circular initials avatar as data URL
  function generateInitialsAvatar(name, size = 64) {
    try {
      const initials = (name || '').split(' ').filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('') || 'U';
      // deterministic background color from name
      let hash = 0; for (let i=0;i<name.length;i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      const hue = Math.abs(hash) % 360;
      const bg = `hsl(${hue} 60% 65%)`;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      // background
      ctx.fillStyle = bg; ctx.fillRect(0,0,size,size);
      // circle mask
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // draw initials
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.floor(size*0.45)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(initials, size/2, size/2);
      return canvas.toDataURL('image/png');
    } catch (e) {
      return 'https://via.placeholder.com/48?text=U';
    }
  }

  // Lazy-load avatars using IntersectionObserver with fallback to loading=lazy
  function setupLazyAvatars() {
    const avatars = Array.from(document.querySelectorAll('img.member-avatar'));
    if (!avatars.length) return;
    // If browser supports loading=lazy, set it as well
    avatars.forEach(img => img.setAttribute('loading','lazy'));

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src && img.src !== src) img.src = src;
          obs.unobserve(img);
        });
      }, { rootMargin: '100px 0px' });
      avatars.forEach(img => io.observe(img));
    } else {
      // Fallback: load all
      avatars.forEach(img => { const src = img.getAttribute('data-src'); if (src) img.src = src; });
    }

    // click handler to open lightbox
    avatars.forEach(img => img.addEventListener('click', () => {
      const full = img.getAttribute('data-full') || img.src;
      openLightbox(full);
    }));
  }

  // Lightbox functions
  function openLightbox(src) {
    let overlay = document.getElementById('avatarLightbox');
    if (!overlay) return;
    const img = overlay.querySelector('img');
    img.src = src;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    // focus trap
    const closeBtn = overlay.querySelector('[data-close]');
    closeBtn.focus();
    // close on overlay click
    overlay.addEventListener('click', function onOverlayClick(e) {
      if (e.target === overlay) { closeLightbox(); overlay.removeEventListener('click', onOverlayClick); }
    });
    // close on escape
    function escHandler(e) { if (e.key === 'Escape') { closeLightbox(); document.removeEventListener('keydown', escHandler); } }
    document.addEventListener('keydown', escHandler);
  }
  function closeLightbox() {
    const overlay = document.getElementById('avatarLightbox');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    const img = overlay.querySelector('img'); img.src = '';
    // return focus to previously focused element
    if (_lastFocused) try { _lastFocused.focus(); } catch(e) {}
  }

  function updateCartCountDisplay() {
    const count = cart.length;
    const navCount = document.getElementById('navCartCount');
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = count;
    if (navCount) {
      navCount.textContent = count;
      navCount.classList.toggle('hidden', count === 0);
    }
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    if (emptyCartMessage) emptyCartMessage.classList.toggle('hidden', count > 0);
  }

  function renderCart() {
    if (!cartItems) return;
    cartItems.innerHTML = '';
    cart.forEach((item, i) => {
      cartItems.innerHTML += `
        <tr class='border-b hover:bg-gray-50'>
          <td class='p-4 font-semibold text-gray-800'>${item.title}</td>
          <td class='p-4 text-gray-600'>${item.author}</td>
          <td class='p-4'>
            <button class='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md' onclick='borrowBook(${i})'>
              Borrow ✅
            </button>
          </td>
        </tr>
      `;
    });
    updateCartCountDisplay();
  }

  function updateBorrowCountDisplay() {
    const countEl = document.getElementById('borrowCountDisplay');
    const emptyMsg = document.getElementById('emptyBorrowMessage');
    if (countEl) countEl.textContent = (borrowRecords || []).length;
    if (emptyMsg) emptyMsg.classList.toggle('hidden', (borrowRecords || []).length > 0);
  }

  function renderBorrowList() {
    if (!borrowList) return;
    borrowList.innerHTML = '';
    borrowRecords.forEach((b) => {
      borrowList.innerHTML += `
        <tr class='border-b hover:bg-gray-50'>
          <td class='p-4 font-semibold text-gray-800'>${b.book_title}</td>
          <td class='p-4 text-gray-600'>${b.book_author}</td>
          <td class='p-4'>
            <button class='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md' onclick='returnBook(${b.id})'>
              Return ↩️
            </button>
          </td>
        </tr>
      `;
    });
    updateBorrowCountDisplay();
  }

  function updateProfileFields(user) {
    if (!user) return;
    profileNameInput.value = user.name || user.username;
    profileEmailInput.value = user.email;
    // Always use avatar from user object (stored per user in backend)
    // Clear the image first to force refresh and avoid showing wrong avatar
    if (profileAvatar) {
      if (user.avatar) {
        // Add cache-busting parameter to force browser to reload the image
        const separator = user.avatar.includes('?') ? '&' : '?';
        profileAvatar.src = user.avatar + separator + '_t=' + Date.now();
      } else {
        // Reset to default if no avatar - clear any cache params
        const currentSrc = profileAvatar.src;
        const baseSrc = currentSrc.split('?')[0].split('&')[0];
        if (!baseSrc.includes('avatar')) {
          // Only reset if it's not already a default avatar
          profileAvatar.src = '';
        }
      }
    }
    originalProfile = { name: profileNameInput.value, email: profileEmailInput.value };
  }

  function toggleEditMode(isEditing) {
    profileNameInput.readOnly = !isEditing;
    profileEmailInput.readOnly = !isEditing;
    profileNameInput.classList.toggle('bg-white', isEditing);
    profileEmailInput.classList.toggle('bg-white', isEditing);
    profileNameInput.classList.toggle('bg-gray-50', !isEditing);
    profileEmailInput.classList.toggle('bg-gray-50', !isEditing);

    editProfileBtn.classList.toggle('hidden', isEditing);
    saveProfileBtn.classList.toggle('hidden', !isEditing);
    cancelProfileBtn.classList.toggle('hidden', !isEditing);
    changeAvatarBtn.disabled = !isEditing;
  }

  

  // --- NAVIGATION LOGIC ---
  window.showPage = function (id) {
    const pages = ['home', 'dashboard', 'catalog', 'bookDetails', 'borrowing', 'cart', 'members', 'profile'];
    pages.forEach(p => {
      const el = document.getElementById(p);
      if (el) el.classList.add('hidden');
    });
    const current = document.getElementById(id);
    if (current) {
      current.classList.remove('hidden');
      current.classList.add('page-section');
    }
    window.scrollTo(0, 0);

    if (id === 'catalog') showAddBookForAdmin(); // <-- Ensure admin sees Add Book on Catalog page

    if (id === 'cart') renderCart();
    if (id === 'borrowing') renderBorrowList();
    if (id === 'members') loadMembers();
    if (id === 'profile' && activeUser) {
      // Refresh profile fields including avatar when navigating to profile page
      updateProfileFields(activeUser);
    }
  };

  // --- AUTH ---
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    try {
      const res = await api('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      // Handle both JWT-style response ({ token, user }) and legacy user object
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        // IMPORTANT: Save user to localStorage to ensure avatar is stored per user
        localStorage.setItem('user', JSON.stringify(res.user));
        activeUser = res.user;
      } else if (res && res.user) {
        // If response has user object
        localStorage.setItem('user', JSON.stringify(res.user));
        activeUser = res.user;
      } else {
        // legacy: entire user object returned
        localStorage.setItem('user', JSON.stringify(res));
        activeUser = res;
      }
      loginSection.classList.add('hidden');
      mainContent.classList.remove('hidden');
      loginError.classList.add('hidden');
      await loadBooks();
      await loadBorrowRecords();
      renderCart();
      renderBorrowList();
      await loadMembers();
      // Force update profile fields with fresh user data from backend
      updateProfileFields(activeUser);
      showAddBookForAdmin(); // <-- Call directly after login
      showPage('home');
    } catch (err) {
      loginError.classList.remove('hidden');
    }
  });

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mobileInput = document.getElementById('mobile');
    const payload = {
      username: document.getElementById('newUsername').value.trim(),
      password: document.getElementById('newPassword').value.trim(),
      email: document.getElementById('email').value.trim(),
      mobile: mobileInput ? mobileInput.value.trim() : '',
      name: document.getElementById('newUsername').value.trim(),
    };
    try {
      await api('/api/users/register', { method: 'POST', body: JSON.stringify(payload) });
      alert('Signup successful! You can login now');
      document.getElementById('newUsername').value = '';
      document.getElementById('email').value = '';
      if (mobileInput) mobileInput.value = '';
      document.getElementById('newPassword').value = '';
      signupSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
      showAddBookForAdmin();
    } catch (err) {
      alert((err && err.message) || 'Signup failed');
    }
  });

  logoutBtn?.addEventListener('click', () => {
    activeUser = null;
    // Clear user data from localStorage to prevent avatar caching
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Clear avatar image to prevent showing previous user's avatar
    if (profileAvatar) {
      profileAvatar.src = '';
    }
    mainContent.classList.add('hidden');
    loginSection.classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showAddBookForAdmin();
  });

  document.getElementById('showSignup')?.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    signupSection.classList.remove('hidden');
    const forgotPasswordSection = document.getElementById('forgotPassword');
    if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
  });

  document.getElementById('showLogin')?.addEventListener('click', () => {
    signupSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    const forgotPasswordSection = document.getElementById('forgotPassword');
    if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
  });

  // --- FORGOT PASSWORD FLOW ---
  let forgotPasswordUsername = '';
  let forgotPasswordOtp = '';

  // Show forgot password section
  document.getElementById('showForgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('hidden');
    signupSection.classList.add('hidden');
    const forgotPasswordSection = document.getElementById('forgotPassword');
    if (forgotPasswordSection) {
      forgotPasswordSection.classList.remove('hidden');
      // Reset to step 1
      document.getElementById('forgotPasswordStep1').classList.remove('hidden');
      document.getElementById('forgotPasswordStep2').classList.add('hidden');
      document.getElementById('forgotPasswordStep3').classList.add('hidden');
      document.getElementById('forgotUsername').value = '';
      forgotPasswordUsername = '';
      forgotPasswordOtp = '';
    }
  });

  // Back to login from forgot password
  [document.getElementById('backToLogin'), document.getElementById('backToLogin2'), document.getElementById('backToLogin3')].forEach(btn => {
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      const forgotPasswordSection = document.getElementById('forgotPassword');
      if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
      // Reset forms
      document.getElementById('forgotPasswordStep1').classList.remove('hidden');
      document.getElementById('forgotPasswordStep2').classList.add('hidden');
      document.getElementById('forgotPasswordStep3').classList.add('hidden');
    });
  });

  // Step 1: Request OTP
  document.getElementById('forgotPasswordForm1')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('forgotUsername').value.trim();
    const errorEl = document.getElementById('forgotPasswordError1');
    
    if (!username) {
      if (errorEl) {
        errorEl.textContent = 'Please enter your username or email';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    try {
      errorEl?.classList.add('hidden');
      const res = await api('/api/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username })
      });

      if (res.success) {
        forgotPasswordUsername = username;
        // Show OTP in development (remove in production)
        if (res.otp) {
          alert(`OTP sent! (Development mode - OTP: ${res.otp})`);
        } else {
          alert('OTP sent to your registered mobile number');
        }
        // Move to step 2
        document.getElementById('forgotPasswordStep1').classList.add('hidden');
        document.getElementById('forgotPasswordStep2').classList.remove('hidden');
        document.getElementById('otpCode').value = '';
        document.getElementById('otpCode').focus();
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to send OTP';
        errorEl.classList.remove('hidden');
      }
    }
  });

  // OTP input - only allow numbers
  const otpInput = document.getElementById('otpCode');
  otpInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });

  // Step 2: Verify OTP
  document.getElementById('forgotPasswordForm2')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otpCode').value.trim();
    const errorEl = document.getElementById('forgotPasswordError2');
    
    if (!otp || otp.length !== 6) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a valid 6-digit OTP';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    try {
      errorEl?.classList.add('hidden');
      const res = await api('/api/users/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ username: forgotPasswordUsername, otp })
      });

      if (res.success) {
        forgotPasswordOtp = otp;
        // Move to step 3
        document.getElementById('forgotPasswordStep2').classList.add('hidden');
        document.getElementById('forgotPasswordStep3').classList.remove('hidden');
        document.getElementById('newPasswordReset').value = '';
        document.getElementById('confirmPasswordReset').value = '';
        document.getElementById('newPasswordReset').focus();
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Invalid OTP';
        errorEl.classList.remove('hidden');
      }
    }
  });

  // Resend OTP
  document.getElementById('resendOtp')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!forgotPasswordUsername) return;
    
    try {
      const res = await api('/api/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username: forgotPasswordUsername })
      });

      if (res.success) {
        if (res.otp) {
          alert(`OTP resent! (Development mode - OTP: ${res.otp})`);
        } else {
          alert('OTP resent to your registered mobile number');
        }
        document.getElementById('otpCode').value = '';
      }
    } catch (err) {
      alert(err.message || 'Failed to resend OTP');
    }
  });

  // Step 3: Reset Password
  document.getElementById('forgotPasswordForm3')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPasswordReset').value;
    const confirmPassword = document.getElementById('confirmPasswordReset').value;
    const errorEl = document.getElementById('forgotPasswordError3');
    
    if (!newPassword || newPassword.length < 6) {
      if (errorEl) {
        errorEl.textContent = 'Password must be at least 6 characters long';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (errorEl) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    try {
      errorEl?.classList.add('hidden');
      const res = await api('/api/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ 
          username: forgotPasswordUsername, 
          otp: forgotPasswordOtp, 
          newPassword 
        })
      });

      if (res.success) {
        alert('Password reset successfully! You can now login with your new password.');
        // Reset and go back to login
        const forgotPasswordSection = document.getElementById('forgotPassword');
        if (forgotPasswordSection) forgotPasswordSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.getElementById('forgotPasswordStep1').classList.remove('hidden');
        document.getElementById('forgotPasswordStep2').classList.add('hidden');
        document.getElementById('forgotPasswordStep3').classList.add('hidden');
        forgotPasswordUsername = '';
        forgotPasswordOtp = '';
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Failed to reset password';
        errorEl.classList.remove('hidden');
      }
    }
  });

  // Resend Verification Email
  document.getElementById('resendVerificationBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const username = e.target.dataset.username;
    if (!username) return;

    try {
      const res = await api('/api/users/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ username })
      });

      if (res.success) {
        let message = res.message || 'Verification email sent. Please check your email.';
        
        // In development mode, show verification link
        if (res.verificationUrl) {
          message += `\n\nDevelopment Mode - Verification Link:\n${res.verificationUrl}`;
          alert(message);
          console.log('Email Verification Link:', res.verificationUrl);
        } else {
          alert(message);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to resend verification email');
    }
  });

  // --- CATALOG & BOOK DETAILS ---
  window.viewBook = function (title) {
    const book = books.find(b => b.title === title);
    if (!book) return;

    document.getElementById('bookImage').src = book.image || '';
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = `By ${book.author}`;
    document.getElementById('bookDescription').textContent = book.description || '';
    document.getElementById('bookCategory').textContent = `Category: ${book.category.charAt(0).toUpperCase() + book.category.slice(1)}`;

    showPage('bookDetails');
  };

  const addToCartBtn = document.getElementById('addToCartBtn');
  addToCartBtn?.addEventListener('click', () => {
    const title = document.getElementById('bookTitle').textContent;
    const author = document.getElementById('bookAuthor').textContent.replace('By ', '');
    const book = books.find(b => b.title === title && b.author === author);
    if (!book) return;

    if (cart.find(item => item.id === book.id)) {
      alert(`${title} is already in your cart!`);
      return;
    }

    cart.push({ id: book.id, title: book.title, author: book.author });
    updateLocalStorage();
    renderCart();
    alert(`${title} added to cart!`);
  });

  // Fetch and render books list
  async function renderBooks(category = 'all') {
    if (!books.length) await loadBooks();
    const bookCatalog = document.getElementById('bookCatalog');
    if (!bookCatalog) return;
    bookCatalog.innerHTML = '';

    const filteredBooks = category === 'all' ? books : books.filter(book => book.category === category);

    filteredBooks.forEach(book => {
      const bookCard = `
        <div class="bg-white p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-105 border-t-4 border-indigo-200">
          <img src="${book.image || ''}" alt="${book.title}" class="w-full h-64 object-cover rounded-lg mb-4 shadow-md">
          <div class="space-y-2">
            <h3 class="font-bold text-xl text-gray-800">${book.title}</h3>
            <p class="text-gray-600">${book.author}</p>
            <p class="text-sm text-indigo-500 italic font-medium">${book.category.charAt(0).toUpperCase() + book.category.slice(1)}</p>
            <p class="text-sm text-gray-700 line-clamp-2">${book.description || ''}</p>
            <button class="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md" 
              onclick="viewBook('${book.title}')">View Details</button>
          </div>
        </div>
      `;
      bookCatalog.innerHTML += bookCard;
    });
  }

  window.filterBooks = function (category, clickedButton) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    renderBooks(category);
  };

  // --- CART & BORROWING ---
  window.emptyCart = function () {
    if (confirm('Are you sure you want to empty your cart?')) {
      cart = [];
      updateLocalStorage();
      renderCart();
      alert('Cart emptied!');
    }
  }

  window.borrowBook = async function (index) {
    if (!activeUser) { alert('Please login first.'); return; }
    const item = cart[index];
    if (!item) return;

    try {
      await api('/api/borrowing/borrow', {
        method: 'POST',
        body: JSON.stringify({
          user_id: activeUser.id,
          book_id: item.id,
          book_title: item.title,
          book_author: item.author,
        })
      });
      cart.splice(index, 1);
      updateLocalStorage();
      renderCart();
      await loadBorrowRecords();
      renderBorrowList();
      alert(`${item.title} borrowed successfully! Happy reading!`);
    } catch (err) {
      alert((err && err.message) || 'Failed to borrow');
    }
  };

  window.returnBook = async function (borrowId) {
    if (!activeUser) { alert('Please login first.'); return; }
    try {
      await api(`/api/borrowing/return/${borrowId}`, { method: 'PUT' });
      await loadBorrowRecords();
      renderBorrowList();
      alert('Returned successfully!');
    } catch (err) {
      alert((err && err.message) || 'Failed to return');
    }
  };

  // --- PROFILE ---
  editProfileBtn?.addEventListener('click', () => {
    originalProfile = { name: profileNameInput.value, email: profileEmailInput.value };
    toggleEditMode(true);
  });

  cancelProfileBtn?.addEventListener('click', () => {
    profileNameInput.value = originalProfile.name;
    profileEmailInput.value = originalProfile.email;
    toggleEditMode(false);
  });

  saveProfileBtn?.addEventListener('click', async () => {
    if (!activeUser) return;

    const newName = profileNameInput.value.trim();
    const newEmail = profileEmailInput.value.trim();
    if (!newName || !newEmail) { alert('Name and Email cannot be empty.'); return; }

    try {
      const updated = await api(`/api/users/${activeUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName, email: newEmail })
      });
      activeUser = updated;
      alert('Profile updated successfully!');
      toggleEditMode(false);
      await loadMembers();
    } catch (err) {
      alert((err && err.message) || 'Failed to update profile');
    }
  });

  // Open file picker to upload custom avatar
  changeAvatarBtn?.addEventListener('click', () => {
    avatarInput?.click();
  });

  // Handle local file selection for avatar
  avatarInput?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await handleAvatarFile(file);
  });

  // Show avatar gallery modal and populate
  chooseFromGalleryBtn?.addEventListener('click', async () => {
    if (!avatarGallery) return;
    avatarGalleryOverlay?.classList.remove('hidden');
    try {
      const manifestPath = window.location.pathname.includes('/pages/') ? './assets/avatars.json' : 'pages/assets/avatars.json';
      const res = await fetch(manifestPath, { cache: 'no-cache' });
      const list = res.ok ? await res.json() : DEFAULT_AVATARS;
      avatarGallery.innerHTML = '';
      const avatarBase = manifestPath.replace(/avatars\.json$/, '');
      list.forEach((file) => {
        const img = document.createElement('img');
        img.src = `${avatarBase}${file}`;
        img.alt = file;
        img.className = 'w-20 h-20 rounded-full cursor-pointer border-2 border-transparent hover:border-indigo-400 object-cover';
        img.addEventListener('click', async () => {
          // Normalize to an absolute URL that respects hosting subpath
          const selected = toAbsoluteAvatarUrl(img.src);
          profileAvatar.src = selected;
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user && user.id) {
              // Persist to backend - avatar is stored per user
              const updated = await api(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ avatar: selected }) });
              if (updated) {
                activeUser = updated;
                try { localStorage.setItem('user', JSON.stringify(activeUser)); } catch (e) {}
                // Update avatar from backend response (user-specific) with cache-busting
                if (updated.avatar) {
                  const separator = updated.avatar.includes('?') ? '&' : '?';
                  profileAvatar.src = updated.avatar + separator + '_t=' + Date.now();
                }
              }
            } else {
              // If logged out, keep a pending choice to apply on next login
              try { localStorage.setItem('pendingAvatarChoice', selected); } catch (e) { /* ignore */ }
            }
          } catch (err) {
            console.warn('Failed to persist chosen avatar to backend, stored locally only', err);
          }
          avatarGalleryOverlay?.classList.add('hidden');
        });
        avatarGallery.appendChild(img);
      });
    } catch (err) {
      console.warn('Avatar gallery failed', err);
    }
  });

  closeAvatarGallery?.addEventListener('click', () => {
    avatarGalleryOverlay?.classList.add('hidden');
  });

  uploadAvatarBtn?.addEventListener('click', () => {
    // Reuse the file input for uploads
    avatarInput?.click();
  });

  // Load stored avatar on profile page load - only use user.avatar from backend
  (function loadStoredAvatar() {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      // Always use avatar from user object (stored per user in backend)
      if (storedUser && storedUser.avatar && profileAvatar) {
        // Add cache-busting to ensure fresh image load
        const separator = storedUser.avatar.includes('?') ? '&' : '?';
        profileAvatar.src = storedUser.avatar + separator + '_t=' + Date.now();
      }
    } catch (err) { /* ignore */ }
  })();

  // --- INITIAL RENDER (unauthenticated) ---
  renderBooks();
  renderCart();
  renderBorrowList();

  // Toggle Add Book form display
  window.toggleAddBookForm = function () {
    const form = document.getElementById('addBookForm');
    form.classList.toggle('hidden');
  };

  // Add Book form submit handler
  window.handleAddBook = async function (e) {
    e.preventDefault();
    const data = {
      title: document.getElementById('bookTitle').value.trim(),
      author: document.getElementById('bookAuthor').value.trim(),
      category: document.getElementById('bookCategory').value.trim(),
      image: document.getElementById('bookImage').value.trim(),
      isbn: document.getElementById('bookISBN').value.trim() || undefined,
      published_year: parseInt(document.getElementById('bookYear').value) || undefined,
      description: document.getElementById('bookDesc').value.trim(),
      available: true
    };
    try {
      const res = await fetch(buildUrl('/api/books'), {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Add failed.");
      alert("Book added!");
      toggleAddBookForm();
      await loadBooks();
      renderBooks();
      e.target.reset();
    } catch (err) {
      alert(`Failed to add book: ${err.message}`);
    }
    return false;
  };

  // Show Add Book section if admin user
  function showAddBookForAdmin() {
    const section = document.getElementById('addBookSection');
    if (!section) return;
    if (activeUser && activeUser.role === 'admin') {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  // Show/hide Add Book section on page load for good measure
  showAddBookForAdmin();
});