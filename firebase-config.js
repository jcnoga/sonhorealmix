// firebase-config.js — Sonho Real Mix
if (!firebase.apps.length) {
const firebaseConfig = {
  apiKey: "AIzaSyCk7j2q4ZSid99mTPp9yp12dKS2XM_gIVI",
  authDomain: "sonhorealmix.firebaseapp.com",
  projectId: "sonhorealmix",
  storageBucket: "sonhorealmix.firebasestorage.app",
  messagingSenderId: "133225034441",
  appId: "1:133225034441:web:4f87f4807837cccb6f5318",
  measurementId: "G-HL8K48JZBS"
};
}
var db      = firebase.firestore();
var auth    = firebase.auth();
var storage = firebase.storage();
var CONFIG_DOC   = db.collection("settings").doc("site");
var PRODUCTS_COL = db.collection("products");
