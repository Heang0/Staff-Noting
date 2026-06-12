import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAMstnwO6V6TDqncw6tIwqSS-Fp2y-UpUc",
  authDomain: "ysg-attendance.firebaseapp.com",
  projectId: "ysg-attendance",
  storageBucket: "ysg-attendance.firebasestorage.app",
  messagingSenderId: "863778818825",
  appId: "1:863778818825:web:4ec6e418543560c185a1d8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    await setDoc(doc(db, 'users', 'VwZEcR8xilhF2hWYZZCG6FgAYU73'), {
      username: 'admin',
      email: 'admin@staff.portal',
      role: 'admin',
      createdAt: new Date()
    });
    console.log("Admin created successfully in Firestore!");
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}
createAdmin();
