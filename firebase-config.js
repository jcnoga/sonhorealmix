// ============================================================
// firebase-config.js — Configuração Firebase
// Substitua os valores abaixo pelas suas credenciais Firebase
// ============================================================

const firebaseConfig = {
const firebaseConfig = {
  apiKey: "AIzaSyCk7j2q4ZSid99mTPp9yp12dKS2XM_gIVI",
  authDomain: "sonhorealmix.firebaseapp.com",
  projectId: "sonhorealmix",
  storageBucket: "sonhorealmix.firebasestorage.app",
  messagingSenderId: "133225034441",
  appId: "1:133225034441:web:4f87f4807837cccb6f5318",
  measurementId: "G-HL8K48JZBS"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

const db       = firebase.firestore();
const auth     = firebase.auth();
const storage  = firebase.storage();

// Refs principais
const CONFIG_DOC   = db.collection("settings").doc("site");
const PRODUCTS_COL = db.collection("products");
const ADMIN_DOC    = db.collection("settings").doc("admin");
