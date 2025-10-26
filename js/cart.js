// -------------------------------
// Cart & Borrowing Scripts
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const cartList = document.getElementById("cartList");
  const borrowedList = document.getElementById("borrowedList");
  const borrowBtn = document.getElementById("borrowBtn");

  // ----- Render Cart -----
  if (cartList) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      cartList.innerHTML = `<p class="text-center text-gray-600">Your cart is empty.</p>`;
    } else {
      cart.forEach(book => {
        const div = document.createElement("div");
        div.className = "p-4 border rounded-lg shadow flex justify-between items-center";
        div.innerHTML = `
          <div>
            <h3 class="font-semibold text-lg text-indigo-700">${book.title}</h3>
            <p class="text-gray-600">${book.author}</p>
          </div>
          <button data-id="${book.id}" class="removeBtn bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Remove</button>
        `;
        cartList.appendChild(div);
      });

      document.querySelectorAll(".removeBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = parseInt(e.target.dataset.id);
          removeFromCart(id);
        });
      });
    }
  }

  const removeFromCart = (id) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(b => b.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.reload();
  };

  // ----- Borrow Books -----
  if (borrowBtn) {
    borrowBtn.addEventListener("click", () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const borrowed = JSON.parse(localStorage.getItem("borrowedBooks")) || [];
      const allBorrowed = [...borrowed, ...cart];
      localStorage.setItem("borrowedBooks", JSON.stringify(allBorrowed));
      localStorage.removeItem("cart");
      alert("Books borrowed successfully!");
      window.location.href = "borrowing.html";
    });
  }

  // ----- Render Borrowed Books -----
  if (borrowedList) {
    const borrowed = JSON.parse(localStorage.getItem("borrowedBooks")) || [];
    if (borrowed.length === 0) {
      borrowedList.innerHTML = `<p class="text-center text-gray-600">No borrowed books.</p>`;
    } else {
      borrowed.forEach(book => {
        const div = document.createElement("div");
        div.className = "p-4 border rounded-lg shadow flex justify-between items-center";
        div.innerHTML = `
          <div>
            <h3 class="font-semibold text-lg text-indigo-700">${book.title}</h3>
            <p class="text-gray-600">${book.author}</p>
          </div>
          <button data-id="${book.id}" class="returnBtn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Return</button>
        `;
        borrowedList.appendChild(div);
      });

      document.querySelectorAll(".returnBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = parseInt(e.target.dataset.id);
          returnBook(id);
        });
      });
    }
  }

  const returnBook = (id) => {
    let borrowed = JSON.parse(localStorage.getItem("borrowedBooks")) || [];
    borrowed = borrowed.filter(b => b.id !== id);
    localStorage.setItem("borrowedBooks", JSON.stringify(borrowed));
    window.location.reload();
  };
});
function borrowBook(title) {
  const bookIndex = cart.findIndex(item => item.title === title);
  if(bookIndex === -1) return;

  let borrowed = JSON.parse(localStorage.getItem('borrowed') || '[]');
  borrowed.push(cart[bookIndex]);
  localStorage.setItem('borrowed', JSON.stringify(borrowed));

  // Remove from cart
  cart.splice(bookIndex, 1);
  localStorage.setItem('cart', JSON.stringify(cart));

  showNotification(`${title} borrowed successfully!`, 'success');
  renderCart();  // refresh the cart table
}

