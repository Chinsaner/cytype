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
  var browsingListEl = document.getElementById("admin-browsing-list");
  var browsingCountEl = document.getElementById("admin-browsing-count");
  var visitListEl = document.getElementById("admin-visit-list");
  var signOutLink = document.getElementById("admin-signout");

  var presenceUnsub = null;
  var visitsUnsub = null;
  var browsingTick = null;
  var latestPresence = [];

  auth.onAuthStateChanged(function (user) {
    if (user) {
      loginSection.hidden = true;
      appSection.hidden = false;
      signOutLink.hidden = false;
      listenPresence();
      listenVisits();
      browsingTick = setInterval(renderBrowsing, 15000);
    } else {
      loginSection.hidden = false;
      appSection.hidden = true;
      signOutLink.hidden = true;
      if (presenceUnsub) { presenceUnsub(); presenceUnsub = null; }
      if (visitsUnsub) { visitsUnsub(); visitsUnsub = null; }
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
    return name ? escapeHtml(name) : "Visitor " + String(id).slice(0, 8);
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
    var online = latestPresence.filter(function (p) {
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
})();
