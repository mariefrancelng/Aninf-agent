import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, getAuth, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-srbyp6lh0E8lBJUjUijGMu_BEzfsha8",
  authDomain: "aninf-agent-ia.firebaseapp.com",
  projectId: "aninf-agent-ia",
  storageBucket: "aninf-agent-ia.firebasestorage.app",
  messagingSenderId: "520092610268",
  appId: "1:520092610268:web:4efd443a01417f78c58e19",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Ouvre la popup Google, récupère le token Firebase,
 * l'envoie au backend qui crée le cookie de session.
 */
export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  const response = await fetch("/api/auth/firebase-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("Échec de la connexion au serveur");
  }
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}
