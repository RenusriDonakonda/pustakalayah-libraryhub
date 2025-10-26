// -------------------------------
// Members List
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const memberList = document.getElementById("memberList");
  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.length === 0) {
    memberList.innerHTML = `<p class="text-center text-gray-600">No members registered yet.</p>`;
    return;
  }

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "flex items-center justify-between border p-4 rounded-lg shadow";
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <img src="https://cdn-icons-png.flaticon.com/512/847/847969.png" class="w-12 h-12 rounded-full">
        <div>
          <p class="font-semibold text-indigo-700">${user.username}</p>
          <p class="text-gray-600 text-sm">${user.email}</p>
        </div>
      </div>
      <span class="text-gray-400 text-sm">Member</span>
    `;
    memberList.appendChild(card);
  });
});

document.getElementById('addToCartBtn').addEventListener('click', () => {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if(cart.find(item => item.title === selectedBook.title)) {
    alert(`${selectedBook.title} is already in your cart!`);
    return;
  }
  cart.push({title: selectedBook.title, author: selectedBook.author});
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`${selectedBook.title} added to cart!`);
});
