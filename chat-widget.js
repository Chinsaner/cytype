(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyC6OLHDgFQa_NzZ5hpLlBH9pCbreC7eKGc",
    authDomain: "cytype.firebaseapp.com",
    projectId: "cytype",
    storageBucket: "cytype.firebasestorage.app",
    messagingSenderId: "725617467999",
    appId: "1:725617467999:web:ffb349f9995a65591431ea"
  };

  if (!window.firebase || !window.firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  var db = firebase.firestore();

  var VISITOR_KEY = "cytypeChatThreadId";
  var NAME_KEY = "cytypeChatName";
  var SEEN_KEY = "cytypeChatLastSeenOwnerAt";
  var HEARTBEAT_MS = 25000;

  function getVisitorId() {
    var id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  var visitorId = getVisitorId();
  var threadRef = db.collection("threads").doc(visitorId);
  var messagesRef = threadRef.collection("messages");
  var presenceRef = db.collection("presence").doc(visitorId);
  var threadExists = false;
  var unsubscribe = null;

  // Presence heartbeat: lets the admin see "currently browsing" visitors,
  // independent of whether they ever open or use the chat panel.
  function heartbeat() {
    presenceRef.set({
      name: localStorage.getItem(NAME_KEY) || null,
      lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  heartbeat();
  setInterval(heartbeat, HEARTBEAT_MS);

  var isZh = document.documentElement.classList.contains("lang-zh");

  var root = document.createElement("div");
  root.className = "cy-chat";
  root.innerHTML =
    '<button type="button" class="cy-chat-bubble" aria-label="Open chat">' +
      '<span class="cy-chat-bubble-icon">' +
        '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' +
      '</span>' +
      '<span class="cy-chat-bubble-dot" hidden></span>' +
    '</button>' +
    '<div class="cy-chat-panel" hidden>' +
      '<div class="cy-chat-header">' +
        '<span><span class="i18n-en">Message CY Type</span><span class="i18n-zh">给虫鱼爬字留言</span></span>' +
        '<button type="button" class="cy-chat-close" aria-label="Close chat">&times;</button>' +
      '</div>' +
      '<div class="cy-chat-namegate">' +
        '<p>' + (isZh ? "开始之前，留下你的称呼：" : "Before we start, what should we call you?") + '</p>' +
        '<form class="cy-chat-namegate-form">' +
          '<input type="text" class="cy-chat-namegate-input" maxlength="60" placeholder="' + (isZh ? "你的名字" : "Your name") + '" required>' +
          '<button type="submit">' + (isZh ? "开始对话" : "Start chat") + '</button>' +
        '</form>' +
      '</div>' +
      '<div class="cy-chat-messages" hidden></div>' +
      '<form class="cy-chat-form" hidden>' +
        '<input type="text" class="cy-chat-input" autocomplete="off" maxlength="2000">' +
        '<button type="submit" class="cy-chat-send" aria-label="Send">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
        '</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var input = root.querySelector(".cy-chat-input");
  input.placeholder = isZh ? "输入消息……" : "Type a message…";

  var bubble = root.querySelector(".cy-chat-bubble");
  var bubbleDot = root.querySelector(".cy-chat-bubble-dot");
  var panel = root.querySelector(".cy-chat-panel");
  var closeBtn = root.querySelector(".cy-chat-close");
  var nameGate = root.querySelector(".cy-chat-namegate");
  var nameGateForm = root.querySelector(".cy-chat-namegate-form");
  var nameGateInput = root.querySelector(".cy-chat-namegate-input");
  var messagesEl = root.querySelector(".cy-chat-messages");
  var form = root.querySelector(".cy-chat-form");

  function formatTime(date) {
    if (!date) return "";
    var h = date.getHours();
    var m = date.getMinutes();
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  }

  function render(snapshot) {
    var wasNearBottom = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 24;
    messagesEl.innerHTML = "";
    var latestOwnerAt = null;

    if (snapshot.empty) {
      var empty = document.createElement("p");
      empty.className = "cy-chat-empty";
      empty.textContent = isZh
        ? "留下你的消息，我们会尽快回复。"
        : "Leave a message and we'll get back to you soon.";
      messagesEl.appendChild(empty);
    }

    snapshot.forEach(function (doc) {
      var msg = doc.data();
      var row = document.createElement("div");
      row.className = "cy-chat-row cy-chat-row-" + (msg.sender === "owner" ? "owner" : "visitor");
      var bubbleEl = document.createElement("div");
      bubbleEl.className = "cy-chat-bubble-msg";
      bubbleEl.textContent = msg.text;
      row.appendChild(bubbleEl);
      if (msg.createdAt && msg.createdAt.toDate) {
        var timeEl = document.createElement("time");
        timeEl.className = "cy-chat-time";
        timeEl.textContent = formatTime(msg.createdAt.toDate());
        row.appendChild(timeEl);
        if (msg.sender === "owner") latestOwnerAt = msg.createdAt.toMillis();
      }
      messagesEl.appendChild(row);
    });

    if (wasNearBottom || snapshot.docChanges().length) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    if (latestOwnerAt) {
      var seen = Number(localStorage.getItem(SEEN_KEY) || 0);
      if (latestOwnerAt > seen && panel.hidden) {
        bubbleDot.hidden = false;
      }
      if (!panel.hidden) {
        localStorage.setItem(SEEN_KEY, String(latestOwnerAt));
        bubbleDot.hidden = true;
      }
    }
  }

  function listen() {
    if (unsubscribe) return;
    unsubscribe = messagesRef.orderBy("createdAt", "asc").onSnapshot(render, function (err) {
      console.error("Chat listen error:", err);
    });
  }

  function showChatUI() {
    nameGate.hidden = true;
    messagesEl.hidden = false;
    form.hidden = false;
    listen();
    input.focus();
  }

  function openPanel() {
    panel.hidden = false;
    bubble.classList.add("cy-chat-bubble-active");
    var seen = Number(localStorage.getItem(SEEN_KEY) || 0);
    localStorage.setItem(SEEN_KEY, String(Date.now()));
    bubbleDot.hidden = true;

    if (localStorage.getItem(NAME_KEY)) {
      showChatUI();
    } else {
      nameGateInput.focus();
    }
  }

  function closePanel() {
    panel.hidden = true;
    bubble.classList.remove("cy-chat-bubble-active");
  }

  bubble.addEventListener("click", function () {
    if (panel.hidden) openPanel();
    else closePanel();
  });
  closeBtn.addEventListener("click", closePanel);

  nameGateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = nameGateInput.value.trim();
    if (!name) return;
    localStorage.setItem(NAME_KEY, name);
    presenceRef.set({ name: name }, { merge: true });
    showChatUI();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    var name = localStorage.getItem(NAME_KEY) || null;

    var send = function () {
      messagesRef.add({
        sender: "visitor",
        text: text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      threadRef.set({
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageText: text,
        visitorName: name,
        hasUnread: true
      }, { merge: true });
    };

    if (!threadExists) {
      threadExists = true;
      threadRef.set({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessageText: text,
        visitorName: name,
        hasUnread: true
      }, { merge: true }).then(send);
    } else {
      send();
    }
  });

  // If this visitor already has a thread with history, start listening right away
  // so the unread dot can light up even before they open the panel.
  threadRef.get().then(function (doc) {
    if (doc.exists) {
      threadExists = true;
      if (localStorage.getItem(NAME_KEY)) listen();
    }
  });
})();
