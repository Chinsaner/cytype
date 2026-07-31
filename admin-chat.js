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

  var loginSection = document.getElementById("admin-login");
  var loginForm = document.getElementById("admin-login-form");
  var loginError = document.getElementById("admin-login-error");
  var appSection = document.getElementById("admin-app");
  var threadsEl = document.getElementById("admin-threads");
  var conversationEl = document.getElementById("admin-conversation");
  var signOutLink = document.getElementById("admin-signout");

  var threadsUnsub = null;
  var messagesUnsub = null;
  var activeThreadId = null;

  auth.onAuthStateChanged(function (user) {
    if (user) {
      loginSection.hidden = true;
      appSection.hidden = false;
      signOutLink.hidden = false;
      listenThreads();
    } else {
      loginSection.hidden = false;
      appSection.hidden = true;
      signOutLink.hidden = true;
      if (threadsUnsub) { threadsUnsub(); threadsUnsub = null; }
      if (messagesUnsub) { messagesUnsub(); messagesUnsub = null; }
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

  function listenThreads() {
    threadsUnsub = db.collection("threads").orderBy("lastMessageAt", "desc")
      .onSnapshot(function (snapshot) {
        threadsEl.innerHTML = "";
        if (snapshot.empty) {
          var empty = document.createElement("p");
          empty.className = "admin-empty";
          empty.textContent = "No messages yet 暂无消息";
          threadsEl.appendChild(empty);
          return;
        }
        snapshot.forEach(function (doc) {
          var data = doc.data();
          var item = document.createElement("button");
          item.type = "button";
          item.className = "admin-thread" + (doc.id === activeThreadId ? " admin-thread-active" : "") + (data.hasUnread ? " admin-thread-unread" : "");
          var time = data.lastMessageAt && data.lastMessageAt.toDate ? formatDateTime(data.lastMessageAt.toDate()) : "";
          item.innerHTML =
            '<span class="admin-thread-id">Visitor ' + doc.id.slice(0, 8) + '</span>' +
            '<span class="admin-thread-preview">' + (data.lastMessageText ? escapeHtml(data.lastMessageText) : "") + '</span>' +
            '<span class="admin-thread-time">' + time + '</span>';
          item.addEventListener("click", function () { openThread(doc.id); });
          threadsEl.appendChild(item);
        });
      }, function (err) {
        console.error("Threads listen error:", err);
      });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function openThread(threadId) {
    activeThreadId = threadId;
    Array.prototype.forEach.call(threadsEl.querySelectorAll(".admin-thread"), function (el, i) {
      el.classList.toggle("admin-thread-active", el === document.activeElement);
    });

    db.collection("threads").doc(threadId).set({ hasUnread: false }, { merge: true });

    conversationEl.innerHTML =
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
