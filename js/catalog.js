// -------------------------------
// Catalog Page Script
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const catalogContainer = document.getElementById("bookCatalog");
  const categoryButtons = document.getElementById("categoryButtons");

  // Sample books — you can load these from a JSON API later
  const books = [
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Classic" },
    { id: 2, title: "1984", author: "George Orwell", category: "Dystopian" },
    { id: 3, title: "To Kill a Mockingbird", author: "Harper Lee", category: "Classic" },
    { id: 4, title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy" },
    { id: 5, title: "The Alchemist", author: "Paulo Coelho", category: "Philosophy" },
    { id: 6, title: "The Silent Patient", author: "Alex Michaelides", category: "Thriller" },
  ];

  localStorage.setItem("books", JSON.stringify(books));

  // Extract categories
  const categories = ["All", ...new Set(books.map(b => b.category))];

  // Render category filter buttons
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "category-btn px-4 py-2 rounded-lg border text-indigo-600 font-semibold";
    if (cat === "All") btn.classList.add("active");
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCatalog(cat);
    });
    categoryButtons.appendChild(btn);
  });

  // Render book catalog
  const renderCatalog = (filter) => {
    catalogContainer.innerHTML = "";
    const filtered = filter === "All" ? books : books.filter(b => b.category === filter);
    filtered.forEach(book => {
      const card = document.createElement("div");
      card.className = "bg-white p-6 rounded-lg shadow hover:shadow-xl transition";
      card.innerHTML = `
        <h3 class="text-xl font-bold mb-2 text-indigo-700">${book.title}</h3>
        <p class="text-gray-600 mb-3">by ${book.author}</p>
        <p class="text-sm text-gray-500 mb-4">Category: ${book.category}</p>
        <button class="addCartBtn bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" data-id="${book.id}">
          Add to Cart
        </button>
      `;
      catalogContainer.appendChild(card);
    });

    document.querySelectorAll(".addCartBtn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        addToCart(id);
      });
    });
  };

  const addToCart = (id) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = books.find(b => b.id === id);
    if (!cart.some(b => b.id === id)) {
      cart.push(item);
      localStorage.setItem("cart", JSON.stringify(cart));
      alert(`${item.title} added to cart!`);
    } else {
      alert("Book already in cart!");
    }
  };

  renderCatalog("All");
});

// js/catalog.js

// Book data
const books = [
  { title: "The Lost City", author: "Sarah Mitchell", category: "fiction", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600" },
  { title: "Midnight Chase", author: "James Anderson", category: "action", image: "https://images.unsplash.com/photo-1589998059171-988d887df646?fit=crop&w=400&h=600" },
  { title: "Love in Paris", author: "Emily Roberts", category: "romance", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?fit=crop&w=400&h=600" },
  { title: "Superhero Chronicles", author: "Mike Turner", category: "comic", image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?fit=crop&w=400&h=600" },
  { title: "The Silent Witness", author: "Patricia Blake", category: "mystery", image: "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?fit=crop&w=400&h=600" }
];

// Function to render books
const catalogContainer = document.getElementById('catalogContainer');

if (catalogContainer) {
  catalogContainer.innerHTML = books.map(book => `
    <div class="bg-white rounded-xl shadow-lg p-4 flex flex-col justify-between hover:shadow-2xl transition">
      <img src="${book.image}" alt="${book.title}" class="rounded-lg h-64 w-full object-cover mb-4">
      <h3 class="text-xl font-bold text-gray-800">${book.title}</h3>
      <p class="text-indigo-600 font-semibold mb-4">${book.author}</p>
      <button 
        class="view-details-btn bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        data-title="${book.title}">
        View Details
      </button>
    </div>
  `).join('');
}

// Handle “View Details” button clicks
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('view-details-btn')) {
    const title = e.target.getAttribute('data-title');
    localStorage.setItem('selectedBook', title);
    window.location.href = 'bookdetails.html';
  }
});


