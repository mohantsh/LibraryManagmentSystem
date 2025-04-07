
function borrowBook(index) {
  const books = JSON.parse(localStorage.getItem("books") || "[]");
  const borrowed = JSON.parse(localStorage.getItem("borrowedBooks") || "[]");
  borrowed.push(books[index]);
  localStorage.setItem("borrowedBooks", JSON.stringify(borrowed));
  alert("Book borrowed!");
}

function renderBorrowedBooks() {
  const container = document.getElementById("borrowed-container");
  const books = JSON.parse(localStorage.getItem("borrowedBooks") || "[]");
  if (!container) return;

  container.innerHTML = "";
  books.forEach(book => {
    const div = document.createElement("div");
    div.textContent = `${book.title} by ${book.author}`;
    container.appendChild(div);
  });
}
