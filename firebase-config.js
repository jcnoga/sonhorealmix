// ============================================================
// firebase-config.js — Configuração Firebase
// Substitua os valores abaixo pelas suas credenciais Firebase
// ============================================================

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
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
