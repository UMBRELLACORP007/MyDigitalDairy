document.addEventListener("DOMContentLoaded", () => {
  const notesDiv = document.getElementById("notes");
  const modal = document.getElementById("noteModal");

  const titleInput = document.getElementById("noteTitle");
  const textInput = document.getElementById("noteText");
  const dateInput = document.getElementById("noteDate");
  const categorySelect = document.getElementById("noteCategory");

  const saveBtn = document.getElementById("saveBtn");
  const closeBtn = document.getElementById("closeBtn");
  const favBtn = document.getElementById("favBtn");
  const archiveBtn = document.getElementById("archiveBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  const newNoteBtn = document.getElementById("newNoteBtn");
  const navItems = document.querySelectorAll(".nav-item");
  const categoryItems = document.querySelectorAll("#categoryList li");

  let notes = JSON.parse(localStorage.getItem("notes")) || [];
  let currentView = "all";
  let currentIndex = null;
  let selectedCategory = "Work";

  // --- helpers ---
  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
  }

  // Ensure every note has a stable id (for popup actions)
  let changed = false;
  notes = notes.map(n => {
    if (!n.id) {
      changed = true;
      return { ...n, id: uid() };
    }
    return n;
  });
  if (changed) saveNotes();

  function findIndexById(id) {
    return notes.findIndex(n => n.id === id);
  }

  // --- category selection (sidebar) ---
  categoryItems.forEach(cat => {
    cat.onclick = () => {
      categoryItems.forEach(c => c.classList.remove("active"));
      cat.classList.add("active");
      selectedCategory = cat.dataset.cat;
    };
  });

  // --- render cards ---
  function renderNotes() {
    notesDiv.innerHTML = "";

    notes.forEach((note) => {
      if (
        (currentView === "favorites" && !note.favorite) ||
        (currentView === "archive" && !note.archived) ||
        (currentView === "all" && note.archived)
      ) return;

      const card = document.createElement("div");
      card.className = "note-card";
      card.innerHTML = `
        <h4>${note.title}</h4>
        <small>${note.date}</small>
      `;
      card.onclick = () => openNoteWindow(note.id);
      notesDiv.appendChild(card);
    });
  }

  // --- open read-only window with options ---
  function openNoteWindow(noteId) {
    const i = findIndexById(noteId);
    if (i === -1) return;

    const note = notes[i];

    const win = window.open(
  "",
  "_blank",
  `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`
);

    if (!win) return;

    const safe = (s) =>
      String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const favText = note.favorite ? "Unfav" : "Fav";
    const archText = note.archived ? "Unarchive" : "Archive";

    win.document.write(`
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${safe(note.title)}</title>
        <style>
          body{
            font-family: Poppins, Arial, sans-serif;
            padding: 22px;
            background:#f4f6fb;
          }
          .bar{
            display:flex;
            gap:10px;
            margin-bottom:14px;
          }
          .btn{
            flex:1;
            padding:10px 12px;
            border:none;
            border-radius:10px;
            cursor:pointer;
            background:#ffffff;
            box-shadow:0 6px 15px rgba(0,0,0,0.12);
            font-weight:600;
          }
          .btn.primary{ background:#667eea; color:white; }
          .btn.danger{ background:#ff4d4d; color:white; }
          .card{
            background:#fff;
            padding:22px;
            border-radius:14px;
            box-shadow:0 10px 25px rgba(0,0,0,0.15);
          }
          h1{ margin:0 0 6px; font-size:22px; }
          .meta{ color:#666; font-size:14px; margin-bottom:16px; }
          .content{ white-space:pre-wrap; line-height:1.7; }
        </style>
      </head>
      <body>
        <div class="bar">
          <button class="btn primary" id="editBtn">Edit</button>
          <button class="btn" id="favBtn">⭐ ${safe(favText)}</button>
          <button class="btn" id="archBtn">📦 ${safe(archText)}</button>
          <button class="btn danger" id="delBtn">🗑 Delete</button>
        </div>

        <div class="card">
          <h1>${safe(note.title)}</h1>
          <div class="meta">${safe(note.date)} • ${safe(note.category || "Work")}</div>
          <div class="content">${safe(note.text)}</div>
        </div>

        <script>
          const id = ${JSON.stringify(noteId)};

          function refresh() {
            // simple refresh after actions
            location.reload();
          }

          document.getElementById("editBtn").onclick = () => {
            if (window.opener && window.opener.openEditModalById) {
              window.opener.openEditModalById(id);
              window.close();
            }
          };

          document.getElementById("favBtn").onclick = () => {
            if (window.opener && window.opener.toggleFavById) {
              window.opener.toggleFavById(id);
              refresh();
            }
          };

          document.getElementById("archBtn").onclick = () => {
            if (window.opener && window.opener.toggleArchiveById) {
              window.opener.toggleArchiveById(id);
              refresh();
            }
          };

          document.getElementById("delBtn").onclick = () => {
            if (window.opener && window.opener.deleteNoteById) {
              window.opener.deleteNoteById(id);
              window.close();
            }
          };
        </script>
      </body>
      </html>
    `);

    win.document.close();
  }

  // --- modal open helpers for edit ---
  function openModalForNew() {
    currentIndex = null;
    titleInput.value = "";
    textInput.value = "";
    dateInput.value = new Date().toISOString().split("T")[0];
    categorySelect.value = selectedCategory;
    modal.classList.remove("hidden");
  }

  function openModalForEdit(index) {
    currentIndex = index;
    const note = notes[index];
    titleInput.value = note.title;
    textInput.value = note.text;
    dateInput.value = note.date;
    categorySelect.value = note.category || "Work";
    modal.classList.remove("hidden");
  }

  // --- expose popup actions ---
  window.openEditModalById = (id) => {
    const i = findIndexById(id);
    if (i === -1) return;
    openModalForEdit(i);
  };

  window.toggleFavById = (id) => {
    const i = findIndexById(id);
    if (i === -1) return;
    notes[i].favorite = !notes[i].favorite;
    saveNotes();
    renderNotes();
  };

  window.toggleArchiveById = (id) => {
    const i = findIndexById(id);
    if (i === -1) return;
    notes[i].archived = !notes[i].archived;
    saveNotes();
    renderNotes();
  };

  window.deleteNoteById = (id) => {
    const i = findIndexById(id);
    if (i === -1) return;
    notes.splice(i, 1);
    saveNotes();
    renderNotes();
  };

  // --- buttons in main modal (existing) ---
  newNoteBtn.onclick = openModalForNew;

  saveBtn.onclick = () => {
    if (!titleInput.value.trim()) return;

    if (currentIndex === null) {
      notes.unshift({
        id: uid(),
        title: titleInput.value.trim(),
        text: textInput.value,
        date: dateInput.value,
        category: categorySelect.value,
        favorite: false,
        archived: false
      });
    } else {
      Object.assign(notes[currentIndex], {
        title: titleInput.value.trim(),
        text: textInput.value,
        date: dateInput.value,
        category: categorySelect.value
      });
    }

    saveNotes();
    modal.classList.add("hidden");
    renderNotes();
  };

  favBtn.onclick = () => {
    if (currentIndex === null) return;
    notes[currentIndex].favorite = !notes[currentIndex].favorite;
    saveNotes();
    renderNotes();
  };

  archiveBtn.onclick = () => {
    if (currentIndex === null) return;
    notes[currentIndex].archived = !notes[currentIndex].archived;
    saveNotes();
    modal.classList.add("hidden");
    renderNotes();
  };

  deleteBtn.onclick = () => {
    if (currentIndex === null) return;
    notes.splice(currentIndex, 1);
    saveNotes();
    modal.classList.add("hidden");
    renderNotes();
  };

  closeBtn.onclick = () => modal.classList.add("hidden");

  // --- nav view switching ---
  navItems.forEach(item => {
    item.onclick = () => {
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      currentView = item.dataset.view;
      renderNotes();
    };
  });

  renderNotes();
});
