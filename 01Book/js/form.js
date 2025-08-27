//전역변수
const API_BASE_URL = "http://localhost:8080";
var editingBookId = null;

//DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector(".cancel-btn");
const formErrorSpan = document.getElementById("formError");

//Document Load 이벤트
document.addEventListener("DOMContentLoaded", function () {
    loadBooks();
});

//Form Submit 이벤트
bookForm.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("Form 제출됨...");

    const bookFormData = new FormData(bookForm);
    const bookData = {
        title: bookFormData.get("title").trim(),
        author: bookFormData.get("author").trim(),
        isbn: bookFormData.get("isbn").trim(),
        price: bookFormData.get("price").trim(),
        publishDate: bookFormData.get("publishDate") || null
    };

    if (!validateBook(bookData)) {
        return;
    }

    if (editingBookId) {
        updateBook(editingBookId, bookData);
    } else {
        createBook(bookData);
    }
});

//입력 데이터 유효성 검사
function validateBook(book) {
    if (!book.title) {
        alert("제목을 입력해주세요.");
        return false;
    }
    if (!book.author) {
        alert("저자를 입력해주세요.");
        return false;
    }
    if (!book.isbn) {
        alert("ISBN을 입력해주세요.");
        return false;
    }
    const isbnPattern = /^\d{10}(\d{3})?$/; // ISBN 10자리 or 13자리
    if (!isbnPattern.test(book.isbn)) {
        alert("ISBN은 10자리 또는 13자리 숫자여야 합니다.");
        return false;
    }
    if (book.price && isNaN(book.price)) {
        alert("가격은 숫자만 입력 가능합니다.");
        return false;
    }
    return true;
}

//도서 등록
function createBook(bookData) {
    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "도서 등록 실패");
            }
            return response.json();
        })
        .then(() => {
            showSuccess("도서 등록 완료!");
            resetForm();
            loadBooks();
        })
        .catch((error) => {
            showError(error.message);
        });
}

//도서 수정 전에 데이터 채우기
function editBook(bookId) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then((response) => response.json())
        .then((book) => {
            bookForm.title.value = book.title;
            bookForm.author.value = book.author;
            bookForm.isbn.value = book.isbn;
            bookForm.price.value = book.price;
            bookForm.publishDate.value = book.publishDate || "";

            editingBookId = bookId;
            submitButton.textContent = "도서 수정";
            cancelButton.style.display = "inline-block";
        })
        .catch((error) => {
            showError(error.message);
        });
}

//도서 수정 요청
function updateBook(bookId, bookData) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "도서 수정 실패");
            }
            return response.json();
        })
        .then(() => {
            alert("도서 수정 완료!");
            resetForm();
            loadBooks();
        })
        .catch((error) => {
            showError(error.message);
        });
}

//도서 삭제
function deleteBook(bookId, title) {
    if (!confirm(`'${title}' 도서를 삭제하시겠습니까?`)) {
        return;
    }
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: "DELETE"
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("삭제 실패");
            }
            showSuccess("도서 삭제 완료!");
            loadBooks();
        })
        .catch((error) => {
            showError(error.message);
        });
}

//도서 목록 로드
function loadBooks() {
    console.log("도서 목록 로드 중...");
    fetch(`${API_BASE_URL}/api/books`)
        .then((response) => response.json())
        .then((books) => renderBookTable(books))
        .catch((error) => {
            showError("도서 목록 불러오기 실패: " + error.message);
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color:#dc3545;">
                        오류: 데이터를 불러올 수 없습니다.
                    </td>
                </tr>
            `;
        });
}

//도서 목록 테이블 렌더링
function renderBookTable(books) {
    bookTableBody.innerHTML = "";
    books.forEach((book) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.price ?? "-"}</td>
            <td>${book.publishDate ?? "-"}</td>
            <td>
                <button onclick="editBook(${book.id})">수정</button>
                <button onclick="deleteBook(${book.id}, '${book.title}')">삭제</button>
            </td>
        `;
        bookTableBody.appendChild(row);
    });
}

//입력필드 초기화
function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = "도서 등록";
    cancelButton.style.display = "none";
    clearMessages();
}

//성공 메시지
function showSuccess(message) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = "block";
    formErrorSpan.style.color = "#28a745";
}
//에러 메시지
function showError(message) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = "block";
    formErrorSpan.style.color = "#dc3545";
}
//메시지 초기화
function clearMessages() {
    formErrorSpan.style.display = "none";
}
