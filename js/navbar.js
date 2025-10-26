document.addEventListener('DOMContentLoaded', () => {
  const navbarHTML = `
  <nav class="bg-white shadow-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="text-3xl text-indigo-600">📖</div>
        <span class="text-xl font-bold text-indigo-600">Pustakalayah LibraryHub</span>
      </div>
      <div class="space-x-4 flex items-center">
        <a href="index.html" class="text-gray-700 hover:text-indigo-600 font-medium">Home</a>
        <a href="dashboard.html" class="text-gray-700 hover:text-indigo-600 font-medium">Dashboard</a>
        <a href="catalog.html" class="text-gray-700 hover:text-indigo-600 font-medium">Catalog</a>
        <a href="cart.html" class="text-gray-700 hover:text-indigo-600 font-medium">Cart</a>
        <a href="borrowing.html" class="hover:text-indigo-300">Borrowing</a>

        <a href="members.html" class="text-gray-700 hover:text-indigo-600 font-medium">Members</a>
        <a href="profile.html" class="text-gray-700 hover:text-indigo-600 font-medium">Profile</a>
      </div>
    </div>
  </nav>
  `;

  const navbarContainer = document.getElementById('navbar');
  if (navbarContainer) navbarContainer.innerHTML = navbarHTML;
});
