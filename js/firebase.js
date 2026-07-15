// Import fungsi Firebase (Ini adalah standar terbaru)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Tempel konfigurasi dari Firebase Console Anda di sini
 const firebaseConfig = {
    apiKey: "AIzaSyDSvZ7i-GZQjNP9r02oOFn38Mr0sGTp46Q",
    authDomain: "uanguang-c7a10.firebaseapp.com",
    projectId: "uanguang-c7a10",
    storageBucket: "uanguang-c7a10.firebasestorage.app",
    messagingSenderId: "651490267003",
    appId: "1:651490267003:web:4e730fe905d3f3bdc7b7de"
  };


// Inisialisasi
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);