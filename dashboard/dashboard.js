document.addEventListener("DOMContentLoaded", () => {
  // ---- Auth keys ----
  const USERS_KEY = "mdd_users";
  const CURRENT_USER_KEY = "mdd_current_user";
  const THEME_KEY = "theme";

  const currentUser = localStorage.getItem(CURRENT_USER_KEY);
  if (!currentUser) {
    window.location.href = "../index.html";
    return;
  }

  const NOTES_KEY = `mdd_notes_${currentUser}`;
  const PIN_KEY = `mdd_archive_pin_${currentUser}`;

  // ---- UI elements ----
  const welcomeUser = document.getElementById("welcomeUser");

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

  const themeToggle = document.getElementById("themeToggle");
  const viewTitle = document.getElementById("viewTitle");
  const searchWrap = document.getElementById("searchWrap");
  const searchInput = document.getElementById("searchInput");

  const calendarWrap = document.getElementById("calendarWrap");
  const calGrid = document.getElementById("calGrid");
  const calTitle = document.getElementById("calTitle");
  const calPrev = document.getElementById("calPrev");
  const calNext = document.getElementById("calNext");
  const calList = document.getElementById("calList");

  // lock modal
  const lockModal = document.getElementById("lockModal");
  const lockTitle = document.getElementById("lockTitle");
  const lockSub = document.getElementById("lockSub");
  const pinInput = document.getElementById("pinInput");
  const pinConfirm = document.getElementById("pinConfirm");
  const pinActionBtn = document.getElementById("pinActionBtn");
  const pinCancelBtn = document.getElementById("pinCancelBtn");
  const lockHint = document.getElementById("lockHint");

  // settings modal
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const settingsCloseBtn = document.getElementById("settingsCloseBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const clearPass = document.getElementById("clearPass");
  const clearDataBtn = document.getElementById("clearDataBtn");
  const clearHint = document.getElementById("clearHint");

  // ---- State ----
  let notes = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  let currentView = "all";
  let currentIndex = null;
  let selectedCategory = "Work";
  let archiveUnlocked = false;
  let calDate = new Date();

  welcomeUser.textContent = `Logged in as ${currentUser}`;

  // ---- Theme ----
  function applyTheme() {
    const t = localStorage.getItem(THEME_KEY) || "light";
    document.body.classList.toggle("dark", t === "dark");
    themeToggle.textContent = (t === "dark") ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
  applyTheme();
  themeToggle.onclick = () => {
    const current = localStorage.getItem(THEME_KEY) || "light";
    localStorage.setItem(THEME_KEY, current === "dark" ? "light" : "dark");
    applyTheme();
  };

  // ---- Utils ----
  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function saveNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  // Ensure ids exist
  let changed = false;
  notes = notes.map(n => {
    if (!n.id) { changed = true; return { ...n, id: uid() }; }
    return n;
  });
  if (changed) saveNotes();

  function findIndexById(id) {
    return notes.findIndex(n => n.id === id);
  }

  // ---- Category selection ----
  categoryItems.forEach(cat => {
    cat.onclick = () => {
      categoryItems.forEach(c => c.classList.remove("active"));
      cat.classList.add("active");
      selectedCategory = cat.dataset.cat;
    };
  });

  // ---- Search ----
  function matchesSearch(note) {
    const q = (searchInput.value || "").trim().toLowerCase();
    if (!q) return true;
    return (note.title || "").toLowerCase().includes(q) || (note.text || "").toLowerCase().includes(q);
  }
  searchInput.addEventListener("input", () => {
    if (currentView !== "calendar") renderNotes();
  });

  // ---- Notes view render ----
  function renderNotes() {
    notesDiv.innerHTML = "";

    notes.forEach((note) => {
      if (!matchesSearch(note)) return;

      if (
        (currentView === "favorites" && !note.favorite) ||
        (currentView === "archive" && !note.archived) ||
        (currentView === "all" && note.archived)
      ) return;

      const card = document.createElement("div");
      card.className = "note-card";
      card.innerHTML = `
        <h4>${note.favorite ? "⭐ " : ""}${escapeHtml(note.title)}</h4>
        <small>${escapeHtml(note.date)}</small>
      `;
      card.onclick = () => openNoteWindow(note.id);
      notesDiv.appendChild(card);
    });
  }

  // ---- Open maximized note window ----
  function openMaxWindow() {
    return window.open("", "_blank", `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`);
  }

  function openNoteWindow(noteId) {
    const i = findIndexById(noteId);
    if (i === -1) return;
    const note = notes[i];

    const win = openMaxWindow();
    if (!win) return;

    const favText = note.favorite ? "Unfav" : "Fav";
    const archText = note.archived ? "Unarchive" : "Archive";

    win.document.write(`
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(note.title)}</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body{font-family:Poppins,Arial,sans-serif;padding:22px;background:#f3f7ff;}
          .bar{display:flex;gap:10px;margin-bottom:14px;}
          .btn{flex:1;padding:12px;border:none;border-radius:14px;cursor:pointer;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.12);background:#fff;}
          .btn.primary{background:linear-gradient(135deg,#2f80ed,#56ccf2);color:#fff;}
          .btn.danger{background:#ff4d4d;color:#fff;}
          .card{background:#fff;padding:24px;border-radius:18px;box-shadow:0 12px 30px rgba(0,0,0,0.14);}
          h1{margin:0 0 8px;font-size:26px;}
          .meta{color:#627d98;font-size:14px;margin-bottom:16px;}
          .content{white-space:pre-wrap;line-height:1.8;color:#102a43;}
        </style>
      </head>
      <body>
        <div class="bar">
          <button class="btn primary" id="editBtn">Edit</button>
          <button class="btn" id="favBtn">⭐ ${escapeHtml(favText)}</button>
          <button class="btn" id="archBtn">📦 ${escapeHtml(archText)}</button>
          <button class="btn danger" id="delBtn">🗑 Delete</button>
        </div>

        <div class="card">
          <h1>${escapeHtml(note.title)}</h1>
          <div class="meta">${escapeHtml(note.date)} • ${escapeHtml(note.category || "Work")}</div>
          <div class="content">${escapeHtml(note.text)}</div>
        </div>

        <script>
          const id = ${JSON.stringify(noteId)};
          document.getElementById("editBtn").onclick = () => {
            if (window.opener && window.opener.openEditModalById) {
              window.opener.openEditModalById(id);
              window.close();
            }
          };
          document.getElementById("favBtn").onclick = () => {
            if (window.opener && window.opener.toggleFavById) {
              window.opener.toggleFavById(id);
              location.reload();
            }
          };
          document.getElementById("archBtn").onclick = () => {
            if (window.opener && window.opener.toggleArchiveById) {
              window.opener.toggleArchiveById(id);
              location.reload();
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

  // Expose actions for popup window
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
    renderCalendar();
  };
  window.toggleArchiveById = (id) => {
    const i = findIndexById(id);
    if (i === -1) return;
    notes[i].archived = !notes[i].archived;
    saveNotes();
    renderNotes();
    renderCalendar();
  };
  window.deleteNoteById = (id) => {
    const i = findIndexById(id);
    if (i === -1) return;
    notes.splice(i, 1);
    saveNotes();
    renderNotes();
    renderCalendar();
  };

  // ---- Modal open ----
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
    renderCalendar();
  };

  favBtn.onclick = () => {
    if (currentIndex === null) return;
    notes[currentIndex].favorite = !notes[currentIndex].favorite;
    saveNotes();
    renderNotes();
    renderCalendar();
  };

  archiveBtn.onclick = () => {
    if (currentIndex === null) return;
    notes[currentIndex].archived = !notes[currentIndex].archived;
    saveNotes();
    modal.classList.add("hidden");
    renderNotes();
    renderCalendar();
  };

  deleteBtn.onclick = () => {
    if (currentIndex === null) return;
    notes.splice(currentIndex, 1);
    saveNotes();
    modal.classList.add("hidden");
    renderNotes();
    renderCalendar();
  };

  closeBtn.onclick = () => modal.classList.add("hidden");

  // ---- Archive Lock ----
  function showLock() {
    lockHint.textContent = "";
    pinInput.value = "";
    pinConfirm.value = "";

    const savedPin = localStorage.getItem(PIN_KEY);

    if (!savedPin) {
      lockTitle.textContent = "Set Archive PIN 🔒";
      lockSub.textContent = "Create a PIN to protect your archive.";
      pinConfirm.classList.remove("hidden");
      pinActionBtn.textContent = "Set PIN";
      pinActionBtn.onclick = () => {
        const p1 = pinInput.value.trim();
        const p2 = pinConfirm.value.trim();
        if (p1.length < 4) { lockHint.textContent = "PIN should be at least 4 digits."; return; }
        if (p1 !== p2) { lockHint.textContent = "PINs do not match."; return; }
        localStorage.setItem(PIN_KEY, p1);
        archiveUnlocked = true;
        lockModal.classList.add("hidden");
        switchView("archive", true);
      };
    } else {
      lockTitle.textContent = "Archive Locked 🔒";
      lockSub.textContent = "Enter your PIN to open archive.";
      pinConfirm.classList.add("hidden");
      pinActionBtn.textContent = "Unlock";
      pinActionBtn.onclick = () => {
        const p = pinInput.value.trim();
        if (p !== savedPin) { lockHint.textContent = "Wrong PIN."; return; }
        archiveUnlocked = true;
        lockModal.classList.add("hidden");
        switchView("archive", true);
      };
    }

    pinCancelBtn.onclick = () => {
      lockModal.classList.add("hidden");
      switchView("all", true);
    };

    lockModal.classList.remove("hidden");
  }

  // ---- Views ----
  function switchView(view, force=false) {
    currentView = view;
    navItems.forEach(n => n.classList.toggle("active", n.dataset.view === view));

    viewTitle.textContent =
      view === "all" ? "All Notes" :
      view === "favorites" ? "Favorites" :
      view === "archive" ? "Archive" :
      "Calendar";

    const isCalendar = (view === "calendar");
    calendarWrap.classList.toggle("hidden", !isCalendar);

    searchWrap.classList.toggle("hidden", isCalendar);
    notesDiv.classList.toggle("hidden", isCalendar);

    if (isCalendar) renderCalendar();
    else renderNotes();
  }

  navItems.forEach(item => {
    item.onclick = () => {
      const view = item.dataset.view;

      if (view === "archive" && !archiveUnlocked) {
        showLock();
        return;
      }
      switchView(view);
    };
  });

  // ---- Calendar ----
  function ymd(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function entriesByDate() {
    const map = new Map();
    for (const n of notes) {
      const key = n.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    }
    return map;
  }

  function renderCalendar() {
    calGrid.innerHTML = "";
    calList.innerHTML = "";

    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const monthName = first.toLocaleString(undefined, { month: "long" });
    calTitle.textContent = `${monthName} ${year}`;

    const startDay = first.getDay();
    const totalDays = last.getDate();

    const map = entriesByDate();

    for (let i=0; i<startDay; i++){
      const blank = document.createElement("div");
      blank.className = "cal-day";
      blank.style.visibility = "hidden";
      calGrid.appendChild(blank);
    }

    for (let day=1; day<=totalDays; day++){
      const d = new Date(year, month, day);
      const key = ymd(d);

      const cell = document.createElement("div");
      cell.className = "cal-day" + (map.has(key) ? " has" : "");
      cell.textContent = day;

      cell.onclick = () => {
        const items = map.get(key) || [];
        calList.innerHTML = `<h4>${key}</h4>`;
        if (!items.length) {
          calList.innerHTML += `<div style="color:var(--muted);padding:8px 2px;">No entry this day.</div>`;
          return;
        }
        items.forEach(n => {
          const el = document.createElement("div");
          el.className = "cal-item";
          el.innerHTML = `<strong>${escapeHtml(n.title)}</strong><br><small style="color:var(--muted)">${escapeHtml(n.category || "Work")}</small>`;
          el.onclick = () => openNoteWindow(n.id);
          calList.appendChild(el);
        });
      };

      calGrid.appendChild(cell);
    }
  }

  calPrev.onclick = () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth()-1, 1); renderCalendar(); };
  calNext.onclick = () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth()+1, 1); renderCalendar(); };

  // ---- Settings: logout + clear data ----
  settingsBtn.onclick = () => {
    clearHint.textContent = "";
    clearPass.value = "";
    settingsModal.classList.remove("hidden");
  };
  settingsCloseBtn.onclick = () => settingsModal.classList.add("hidden");

  logoutBtn.onclick = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem("currentUser");
    window.location.href = "../index.html";
  };

  function verifyPassword(pass) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const me = users.find(u => (u.username || "").toLowerCase() === currentUser.toLowerCase());
    return me && me.password === pass;
  }

  clearDataBtn.onclick = () => {
    clearHint.textContent = "";
    const pass = clearPass.value.trim();
    if (!pass) { clearHint.textContent = "Enter your login password."; return; }
    if (!verifyPassword(pass)) { clearHint.textContent = "Wrong password."; return; }

    // Clear EVERYTHING (as you asked)
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem("currentUser");

    // Remove all diary data keys safely
    // easiest: wipe localStorage completely but keep theme? you said clear everything incl pin and accounts, so yes wipe.
    localStorage.clear();

    window.location.href = "../index.html";
  };

  // ---- init ----
  switchView("all", true);
});
