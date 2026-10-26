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

  // Which site these records came from. The chenyue site ships the same
  // tracker with this set to "chenyue", so one admin page can tell the two
  // apart even though their page paths are identical.
  var SITE = "cytype";

  var VISITOR_KEY = "cytypeChatThreadId";
  var NAME_KEY = "cytypeChatName";
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
  // Visitors who named themselves back when the chat widget existed keep that
  // name; there is no longer any way to set a new one.
  var visitorName = localStorage.getItem(NAME_KEY) || null;
  var presenceRef = db.collection("presence").doc(visitorId);

  // Presence heartbeat: powers the admin page's "currently browsing" list.
  function heartbeat() {
    presenceRef.set({
      name: visitorName,
      site: SITE,
      lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  heartbeat();
  setInterval(heartbeat, HEARTBEAT_MS);

  // Visit log: one persistent record per page load, so the owner has a
  // lasting trail of who came by even after they've left the site.
  db.collection("visits").add({
    visitorId: visitorId,
    name: visitorName,
    site: SITE,
    page: location.pathname.replace(/^\//, "") || "index.html",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
})();
