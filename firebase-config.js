// Firebase Configuration Module
// Simple hardcoded configuration - all complex setup moved to Firestore

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updatePassword,
    updateEmail
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    setDoc, 
    getDoc, 
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Firebase Configuration - Simple hardcoded values
// Everything else is managed through Firestore
const firebaseConfig = {
    apiKey: "AIzaSyAVF3fzkTQeMeChRhrDEj9qIbjgkB57piU",
    authDomain: "webhookrouter-81e63.firebaseapp.com",
    projectId: "webhookrouter-81e63",
    storageBucket: "webhookrouter-81e63.appspot.com",
    messagingSenderId: "189949744069",
    appId: "1:189949744069:web:c12661b9c7e878f0c7f1ac",
    measurementId: "G-NGC91FD733"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firebase functions
export {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    updateEmail,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    Timestamp
};

console.log('✅ Firebase initialized - all config from Firestore');
