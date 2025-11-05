// --- CONFIG ---
// Leave API_BASE empty so the front-end can run without a localhost backend.
// Main frontend script for Pustakalayah LibraryHub
// Clean, consolidated version with demo API fallback (no auto-login)

// --- CONFIG ---
const API_BASE = '';

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

    if (path.includes('/api/users/login') && method === 'POST') {
      const { username, password } = body || {};
      const users = loadDemoUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) throw new Error('Invalid username or password');
      const respUser = { ...user }; delete respUser.password;
      return { token: 'demo-token', user: respUser };
    }

    if (path.includes('/api/users/register') && method === 'POST') {
      const { username, email, password } = body || {};
      if (!username || !email || !password) throw new Error('Missing fields');
      const users = loadDemoUsers();
      if (users.find(u => u.username === username)) throw new Error('Username already exists');
      const newUser = { id: Date.now(), username, email, password, role: 'member', member_since: new Date().toISOString() };
      users.push(newUser); saveDemoUsers(users);
      return { success: true, user: { id: newUser.id, username: newUser.username, email: newUser.email } };
    }

    if (path.includes('/api/users') && method === 'GET') {
      return loadDemoUsers().map(u => { const { password, ...rest } = u; return rest; });
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
  }

  function updateProfileFields(user) {
    if (!user) return;
    if (profileNameInput) profileNameInput.value = user.name || user.username || '';
    if (profileEmailInput) profileEmailInput.value = user.email || '';
    const savedAvatar = localStorage.getItem('userAvatar');
    if (profileAvatar) profileAvatar.src = user.avatar || savedAvatar || profileAvatar.src;
  }

  // Login
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (loginError) loginError.classList.add('hidden');
    try {
      const res = await api('/api/users/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        showMainForUser(res.user);
      } else if (res && res.user) {
        showMainForUser(res.user);
      }
    } catch (err) {
      if (loginError) { loginError.textContent = err.message || 'Login failed'; loginError.classList.remove('hidden'); }
    }
  });

  // Signup
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('newPassword').value;
    try {
      await api('/api/users/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
      // redirect to login
      navigateTo('login.html');
    } catch (err) {
      alert(err.message || 'Signup failed');
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
        img.addEventListener('click', () => { profileAvatar.src = img.src; localStorage.setItem('userAvatar', img.src); avatarGalleryOverlay.classList.add('hidden'); });
        avatarGallery.appendChild(img);
      });
    } catch (err) {
      console.warn('Avatar gallery failed', err);
    }
  });
  closeAvatarGallery?.addEventListener('click', () => avatarGalleryOverlay?.classList.add('hidden'));
  uploadAvatarBtn?.addEventListener('click', () => avatarInput?.click());
  avatarInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return; const url = URL.createObjectURL(file); profileAvatar.src = url; localStorage.setItem('userAvatar', url);
  });

  // Initial UI state: show login, hide main content
  if (mainContent) mainContent.classList.add('hidden');
  if (loginSection) loginSection.classList.remove('hidden');
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
      memberListTable.innerHTML += `
        <tr class='border-b hover:bg-gray-50'>
          <td class='p-4 font-semibold text-gray-800'>${user.name || user.username}</td>
          <td class='p-4 text-gray-600'>${user.email}</td>
          <td class='p-4 text-gray-500'>${memberSince}</td>
        </tr>
      `;
    });
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
    // avatar: priority -> user.avatar, saved local avatar, default placeholder
    const savedAvatar = localStorage.getItem('userAvatar');
    profileAvatar.src = user.avatar || savedAvatar || profileAvatar.src;
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
        activeUser = res.user;
      } else {
        // legacy: entire user object returned
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
      updateProfileFields(activeUser);
      showAddBookForAdmin(); // <-- Call directly after login
      showPage('home');
    } catch (err) {
      loginError.classList.remove('hidden');
    }
  });

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: document.getElementById('newUsername').value.trim(),
      password: document.getElementById('newPassword').value.trim(),
      email: document.getElementById('email').value.trim(),
      name: document.getElementById('newUsername').value.trim(),
    };
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
      alert('Signup successful! You can login now');
      document.getElementById('newUsername').value = '';
      document.getElementById('email').value = '';
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
    mainContent.classList.add('hidden');
    loginSection.classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showAddBookForAdmin();
  });

  document.getElementById('showSignup')?.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    signupSection.classList.remove('hidden');
  });

  document.getElementById('showLogin')?.addEventListener('click', () => {
    signupSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
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
  avatarInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    profileAvatar.src = url;
    // Persist chosen avatar locally (for demo). In production, upload to backend.
    try { localStorage.setItem('profileAvatar', url); } catch (err) { /* ignore */ }
  });

  // Show avatar gallery modal and populate
  chooseFromGalleryBtn?.addEventListener('click', async () => {
    if (!avatarGallery) return;
    avatarGalleryOverlay?.classList.remove('hidden');
    // Fetch a static manifest of avatars. Use a manifest path that works when
    // running the page from the repo root (index.html) or from inside /pages/
    try {
      const manifestPath = window.location.pathname.includes('/pages/') ? './assets/avatars.json' : 'pages/assets/avatars.json';
      const res = await fetch(manifestPath, { cache: 'no-cache' });
      if (!res.ok) throw new Error('Failed to load avatars manifest');
      const list = await res.json();
      avatarGallery.innerHTML = '';
      // Determine base path for avatar images (same folder as manifest)
      const avatarBase = manifestPath.replace(/avatars\.json$/, '');
      list.forEach((file) => {
        const img = document.createElement('img');
        img.src = `${avatarBase}${file}`;
        img.alt = file;
        img.className = 'w-20 h-20 rounded-full cursor-pointer border-2 border-transparent hover:border-indigo-400 object-cover';
        img.addEventListener('click', () => {
          profileAvatar.src = img.src;
          try { localStorage.setItem('profileAvatar', img.src); } catch (err) { /* ignore */ }
          avatarGalleryOverlay?.classList.add('hidden');
        });
        avatarGallery.appendChild(img);
      });
    } catch (err) {
      console.warn('Avatar manifest fetch failed, falling back to bundled list:', err);
      // Fallback to the embedded list so the gallery still works when opened
      // via file:// or when the manifest cannot be fetched.
      const list = DEFAULT_AVATARS;
      avatarGallery.innerHTML = '';
      const avatarBase = window.location.pathname.includes('/pages/') ? './assets/' : 'pages/assets/';
      list.forEach((file) => {
        const img = document.createElement('img');
        img.src = `${avatarBase}${file}`;
        img.alt = file;
        img.className = 'w-20 h-20 rounded-full cursor-pointer border-2 border-transparent hover:border-indigo-400 object-cover';
        img.addEventListener('click', () => {
          profileAvatar.src = img.src;
          try { localStorage.setItem('profileAvatar', img.src); } catch (err) { /* ignore */ }
          avatarGalleryOverlay?.classList.add('hidden');
        });
        avatarGallery.appendChild(img);
      });
    }
  });

  closeAvatarGallery?.addEventListener('click', () => {
    avatarGalleryOverlay?.classList.add('hidden');
  });

  uploadAvatarBtn?.addEventListener('click', () => {
    // Reuse the file input for uploads
    avatarInput?.click();
  });

  // Load stored avatar on profile page load
  (function loadStoredAvatar() {
    try {
      const stored = localStorage.getItem('profileAvatar');
      if (stored && profileAvatar) profileAvatar.src = stored;
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