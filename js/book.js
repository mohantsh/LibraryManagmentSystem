
function loadBooks() {
  return JSON.parse(localStorage.getItem("books") || "[]");
}

function saveBooks(books) {
  localStorage.setItem("books", JSON.stringify(books));
}

function renderBooks() {
  const books = loadBooks();
  const container = document.getElementById("book-container");
  if (!container) return;

  container.innerHTML = "";
  books.forEach((book, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${book.title}</strong> by ${book.author} - ${book.genre}
      <button onclick="editBook(${index})">Edit</button>
      <button onclick="deleteBook(${index})">Delete</button>
      <button onclick="borrowBook(${index})">Borrow</button>
    `;
    container.appendChild(div);
  });
}

function addBookFormHandler() {
  document.querySelector("form")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const title = this.querySelector("input[placeholder='Book Title']").value;
    const author = this.querySelector("input[placeholder='Author']").value;
    const genre = this.querySelector("input[placeholder='Genre']").value;
    const description = this.querySelector("textarea").value;

    let books = loadBooks();
    books.push({ title, author, genre, description });
    saveBooks(books);
    alert("Book added!");
    window.location.href = "book-list.html";
  });
}


function deleteBook(index) {
  const books = loadBooks();
  if (confirm("Are you sure?")) {
    books.splice(index, 1);
    saveBooks(books);
    renderBooks();
  }
  
}
function editBook(index) {
  localStorage.setItem("editBookIndex", index);
  window.location.href = "edit-book.html";
}

function loadEditForm() {
  const index = localStorage.getItem("editBookIndex");
  if (index === null) return;

  const books = loadBooks();
  const book = books[index];

  document.getElementById("title").value = book.title;
  document.getElementById("author").value = book.author;
  document.getElementById("genre").value = book.genre;
  document.getElementById("description").value = book.description;

  document.getElementById("edit-form").addEventListener("submit", function(e) {
    e.preventDefault();
    book.title = document.getElementById("title").value;
    book.author = document.getElementById("author").value;
    book.genre = document.getElementById("genre").value;
    book.description = document.getElementById("description").value;

    books[index] = book;
    saveBooks(books);
    alert("Book updated successfully!");
    window.location.href = "book-list.html";
  });
}

