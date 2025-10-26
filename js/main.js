// main.js

// Shared Navbar
function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  navbar.innerHTML = `
    <nav class="w-full bg-indigo-700 shadow-lg fixed top-0 left-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex-shrink-0">
            <a href="index.html" class="text-white font-extrabold text-2xl">Pustakalayah 📚</a>
          </div>

          <!-- Desktop Menu -->
          <div class="hidden md:flex space-x-6">
            <a href="index.html" class="text-white hover:text-indigo-300 font-semibold">Home</a>
            <a href="catalog.html" class="text-white hover:text-indigo-300 font-semibold">Catalog</a>
            <a href="dashboard.html" class="text-white hover:text-indigo-300 font-semibold">Dashboard</a>
            <a href="cart.html" class="text-white hover:text-indigo-300 font-semibold">Cart 🛒</a>
            <a href="borrowing.html" class="text-white hover:text-indigo-300 font-semibold">Borrowing</a>
            <a href="members.html" class="text-white hover:text-indigo-300 font-semibold">Members</a>
            <a href="profile.html" class="text-white hover:text-indigo-300 font-semibold">Profile 👤</a>
          </div>

          <!-- Mobile Hamburger -->
          <div class="md:hidden flex items-center">
            <button id="mobileMenuBtn" class="text-white focus:outline-none">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" 
                   viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div id="mobileMenu" class="hidden md:hidden bg-indigo-600">
        <a href="index.html" class="block px-4 py-2 text-white hover:bg-indigo-500">Home</a>
        <a href="catalog.html" class="block px-4 py-2 text-white hover:bg-indigo-500">Catalog</a>
        <a href="dashboard.html" class="block px-4 py-2 text-white hover:bg-indigo-500">Dashboard</a>
        <a href="cart.html" class="block px-4 py-2 text-white hover:bg-indigo-500">Cart 🛒</a>
        <a href="borrowing.html" class="block px-4 py-2 text-white hover:bg-indigo-500">Borrowing</a>
        <a href="members.html" class="block px-4 py-2 text-white hover:bg-indigo-500">Members</a>
        <a href="profile.html" class="block px-4 py-2 text-white hover:bg-indigo-500">Profile 👤</a>
      </div>
    </nav>
  `;

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

// Call it when page loads
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});


// Call it when page loads
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});


document.addEventListener("DOMContentLoaded", () => {

  // ====== Inject Navbar on main pages ======
  const navContainer = document.getElementById("navbar");
  if (navContainer) {
    navContainer.innerHTML = `
      <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="text-3xl text-indigo-600">📖</div>
            <span class="text-xl font-bold text-indigo-600">Pustakalayah LibraryHub</span>
          </div>
          <div class="space-x-4">
            <a href="home.html" class="text-gray-700 hover:text-indigo-600">Home</a>
            <a href="dashboard.html" class="text-gray-700 hover:text-indigo-600">Dashboard</a>
            <a href="catalog.html" class="text-gray-700 hover:text-indigo-600">Catalog</a>
            <a href="cart.html" class="text-gray-700 hover:text-indigo-600">Cart</a>
            <a href="borrowing.html" class="text-gray-700 hover:text-indigo-600">Borrowing</a>
            <a href="members.html" class="text-gray-700 hover:text-indigo-600">Members</a>
            <a href="profile.html" class="text-gray-700 hover:text-indigo-600">Profile</a>
            <button id="logoutBtn" class="bg-red-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-600">Logout</button>
          </div>
        </div>
      </nav>
    `;
  }

  // ====== Logout ======
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "index.html";
    });
  }

  // ====== LOGIN ======
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const users = JSON.parse(localStorage.getItem("users")) || [];

      const validUser = users.find(u => u.username === username && u.password === password);
      const errorText = document.getElementById("loginError");

      if (validUser) {
        localStorage.setItem("loggedInUser", JSON.stringify(validUser));
        window.location.href = "home.html";
      } else {
        errorText.classList.remove("hidden");
      }
    });
  }

  // ====== SIGNUP ======
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("newUsername").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("newPassword").value.trim();

      if (!username || !email || !password) return alert("Please fill all fields!");

      const users = JSON.parse(localStorage.getItem("users")) || [];
      if (users.some(u => u.username === username)) {
        alert("Username already exists!");
        return;
      }

      users.push({ username, email, password });
      localStorage.setItem("users", JSON.stringify(users));
      alert("Account created! You can now log in.");
      window.location.href = "index.html";
    });
  }
});


