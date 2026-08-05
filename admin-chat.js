(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyC6OLHDgFQa_NzZ5hpLlBH9pCbreC7eKGc",
    authDomain: "cytype.firebaseapp.com",
    projectId: "cytype",
    storageBucket: "cytype.firebasestorage.app",
    messagingSenderId: "725617467999",
    appId: "1:725617467999:web:ffb349f9995a65591431ea"
  };
  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();
  var db = firebase.firestore();

  var ONLINE_WINDOW_MS = 60000;

  var loginSection = document.getElementById("admin-login");
  var loginForm = document.getElementById("admin-login-form");
  var loginError = document.getElementById("admin-login-error");
  var appSection = document.getElementById("admin-app");
  var threadListEl = document.getElementById("admin-thread-list");
  var browsingListEl = document.getElementById("admin-browsing-list");
  var browsingCountEl = document.getElementById("admin-browsing-count");
  var visitListEl = document.getElementById("admin-visit-list");
  var conversationEl = document.getElementById("admin-conversation");
  var signOutLink = document.getElementById("admin-signout");

  var threadsUnsub = null;
  var presenceUnsub = null;
  var visitsUnsub = null;
  var messagesUnsub = null;
  var activeThreadId = null;
  var browsingTick = null;

  var latestThreads = [];
  var latestPresence = [];

  auth.onAuthStateChanged(function (user) {
    if (user) {
      loginSection.hidden = true;
      appSection.hidden = false;
      signOutLink.hidden = false;
      listenThreads();
      listenPresence();
      listenVisits();
      browsingTick = setInterval(renderBrowsing, 15000);
    } else {
      loginSection.hidden = false;
      appSection.hidden = true;
      signOutLink.hidden = true;
      if (threadsUnsub) { threadsUnsub(); threadsUnsub = null; }
      if (presenceUnsub) { presenceUnsub(); presenceUnsub = null; }
      if (visitsUnsub) { visitsUnsub(); visitsUnsub = null; }
      if (messagesUnsub) { messagesUnsub(); messagesUnsub = null; }
      if (browsingTick) { clearInterval(browsingTick); browsingTick = null; }
    }
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var email = document.getElementById("admin-email").value.trim();
    var password = document.getElementById("admin-password").value;
    auth.signInWithEmailAndPassword(email, password).catch(function (err) {
      loginError.textContent = err.message;
      loginError.hidden = false;
    });
  });

  signOutLink.addEventListener("click", function (e) {
    e.preventDefault();
    auth.signOut();
  });

  function formatDateTime(date) {
    if (!date) return "";
    var pad = function (n) { return n < 10 ? "0" + n : n; };
    return (date.getMonth() + 1) + "/" + date.getDate() + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function visitorLabel(id, name) {
    return name ? escapeHtml(name) : "Visitor " + id.slice(0, 8);
  }

  function listenThreads() {
    threadsUnsub = db.collection("threads").orderBy("lastMessageAt", "desc")
      .onSnapshot(function (snapshot) {
        latestThreads = [];
        threadListEl.innerHTML = "";
        if (snapshot.empty) {
          var empty = document.createElement("p");
          empty.className = "admin-empty";
          empty.textContent = "No messages yet 暂无消息";
          threadListEl.appendChild(empty);
        }
        snapshot.forEach(function (doc) {
          var data = doc.data();
          latestThreads.push(doc.id);
          var item = document.createElement("button");
          item.type = "button";
          item.className = "admin-thread" + (doc.id === activeThreadId ? " admin-thread-active" : "") + (data.hasUnread ? " admin-thread-unread" : "");
          var time = data.lastMessageAt && data.lastMessageAt.toDate ? formatDateTime(data.lastMessageAt.toDate()) : "";
          item.innerHTML =
            '<span class="admin-thread-id">' + visitorLabel(doc.id, data.visitorName) + '</span>' +
            '<span class="admin-thread-preview">' + (data.lastMessageText ? escapeHtml(data.lastMessageText) : "") + '</span>' +
            '<span class="admin-thread-time">' + time + '</span>';
          item.addEventListener("click", function () { openThread(doc.id, data.visitorName); });
          threadListEl.appendChild(item);
        });
        renderBrowsing();
      }, function (err) {
        console.error("Threads listen error:", err);
      });
  }

  function listenPresence() {
    presenceUnsub = db.collection("presence")
      .onSnapshot(function (snapshot) {
        latestPresence = [];
        snapshot.forEach(function (doc) {
          latestPresence.push({ id: doc.id, data: doc.data() });
        });
        renderBrowsing();
      }, function (err) {
        console.error("Presence listen error:", err);
      });
  }

  function renderBrowsing() {
    var now = Date.now();
    var threadSet = {};
    latestThreads.forEach(function (id) { threadSet[id] = true; });

    var online = latestPresence.filter(function (p) {
      if (threadSet[p.id]) return false;
      var seen = p.data.lastSeenAt && p.data.lastSeenAt.toMillis ? p.data.lastSeenAt.toMillis() : 0;
      return now - seen < ONLINE_WINDOW_MS;
    });

    browsingCountEl.textContent = String(online.length);
    browsingListEl.innerHTML = "";

    if (!online.length) {
      var empty = document.createElement("p");
      empty.className = "admin-empty admin-empty-small";
      empty.textContent = "No one right now 暂无访客";
      browsingListEl.appendChild(empty);
      return;
    }

    online.forEach(function (p) {
      var row = document.createElement("div");
      row.className = "admin-browsing-row";
      row.innerHTML =
        '<span class="admin-browsing-dot"></span>' +
        '<span>' + visitorLabel(p.id, p.data.name) + '</span>';
      browsingListEl.appendChild(row);
    });
  }

  function listenVisits() {
    visitsUnsub = db.collection("visits").orderBy("createdAt", "desc").limit(200)
      .onSnapshot(function (snapshot) {
        visitListEl.innerHTML = "";
        if (snapshot.empty) {
          var empty = document.createElement("p");
          empty.className = "admin-empty";
          empty.textContent = "No visits yet 暂无访问记录";
          visitListEl.appendChild(empty);
          return;
        }
        snapshot.forEach(function (doc) {
          var data = doc.data();
          var time = data.createdAt && data.createdAt.toDate ? formatDateTime(data.createdAt.toDate()) : "";
          var row = document.createElement("div");
          row.className = "admin-visit-row";
          row.innerHTML =
            '<span class="admin-visit-name">' + visitorLabel(data.visitorId || doc.id, data.name) + '</span>' +
            '<span class="admin-visit-page">' + escapeHtml(data.page || "") + '</span>' +
            '<span class="admin-visit-time">' + time + '</span>';
          visitListEl.appendChild(row);
        });
      }, function (err) {
        console.error("Visits listen error:", err);
      });
  }

  function openThread(threadId, visitorName) {
    activeThreadId = threadId;
    Array.prototype.forEach.call(threadListEl.querySelectorAll(".admin-thread"), function (el) {
      el.classList.remove("admin-thread-active");
    });
    var clicked = Array.prototype.find
      ? Array.prototype.find.call(threadListEl.querySelectorAll(".admin-thread"), function (el) {
          return el.querySelector(".admin-thread-id").textContent === visitorLabel(threadId, visitorName);
        })
      : null;
    if (clicked) clicked.classList.add("admin-thread-active");

    db.collection("threads").doc(threadId).set({ hasUnread: false }, { merge: true });

    conversationEl.innerHTML =
      '<div class="admin-conversation-header">' + visitorLabel(threadId, visitorName) + '</div>' +
      '<div class="admin-conversation-messages" id="admin-conversation-messages"></div>' +
      '<form class="admin-reply-form" id="admin-reply-form">' +
        '<input type="text" id="admin-reply-input" autocomplete="off" placeholder="Reply…">' +
        '<button type="submit">Send</button>' +
      '</form>';

    var messagesEl = document.getElementById("admin-conversation-messages");
    var replyForm = document.getElementById("admin-reply-form");
    var replyInput = document.getElementById("admin-reply-input");

    if (messagesUnsub) messagesUnsub();
    messagesUnsub = db.collection("threads").doc(threadId).collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(function (snapshot) {
        messagesEl.innerHTML = "";
        snapshot.forEach(function (doc) {
          var msg = doc.data();
          var row = document.createElement("div");
          row.className = "admin-msg admin-msg-" + (msg.sender === "owner" ? "owner" : "visitor");
          var bubble = document.createElement("div");
          bubble.className = "admin-msg-bubble";
          bubble.textContent = msg.text;
          row.appendChild(bubble);
          messagesEl.appendChild(row);
        });
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });

    replyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = replyInput.value.trim();
      if (!text) return;
      replyInput.value = "";
      db.collection("threads").doc(threadId).collection("messages").add({
        sender: "owner",
        text: text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      db.collection("threads").doc(threadId).set({
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageText: text,
        hasUnread: false
      }, { merge: true });
    });
  }
})();
