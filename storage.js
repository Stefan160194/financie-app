// Importuj potrebné funkcie z Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Konfigurácia ---
// !!! DÔLEŽITÉ: Uisti sa, že tu máš vloženú správnu konfiguráciu z tvojho Firebase projektu
const firebaseConfig = {
  apiKey: "AIzaSyAVARl3DeLbIKC4VxLKMAims5RWYuf-hsw",
  authDomain: "financie-a372c.firebaseapp.com",
  projectId: "financie-a372c",
  storageBucket: "financie-a372c.firebasestorage.app",
  messagingSenderId: "408930768206",
  appId: "1:408930768206:web:3146be9da41c267efe3a1f"
};


// Inicializácia Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let dbUnsubscribe = null; // Funkcia na odhlásenie odberu zmien z databázy
let localDataCache = null; // Lokálna cache pre dáta

const USER_ID_KEY = 'financeApp.userId';

// Funkcie na prácu s User ID v localStorage
export function getUserId() { return localStorage.getItem(USER_ID_KEY); }
export function setUserId(id) { localStorage.setItem(USER_ID_KEY, id); }
export function clearUserId() { localStorage.removeItem(USER_ID_KEY); }

// Funkcia, ktorá nastaví "listener" na zmeny v databáze
export function listenForDataChanges(userId, onDataUpdate, onError) {
    if (!userId) {
        onError(new Error("User ID is not provided."));
        return;
    }

    const docRef = doc(db, "userData", userId);
    
    if (dbUnsubscribe) dbUnsubscribe(); 
    
    dbUnsubscribe = onSnapshot(docRef, (docSnap) => {
        let data;
        if (docSnap.exists()) {
            const remoteData = docSnap.data();
            // Konvertuj Firebase Timestamp na Date objekty
            const transactions = (remoteData.transactions || []).map(t => ({
                ...t,
                // Skontroluj, či createdAt existuje a je to Timestamp objekt
                createdAt: t.createdAt && t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
            }));
            data = { ...remoteData, transactions };
        } else {
            data = getDefaultData();
            // Ulož predvolené dáta, ak používateľ ešte žiadne nemá
            saveAllData(userId, data); 
        }
        localDataCache = data; // Ulož do lokálnej cache
        onDataUpdate(data); // Zavolaj funkciu z main.js na prekreslenie UI
    }, (error) => {
        console.error("Error listening to data changes:", error);
        onError(error);
    });
}


// Funkcia na uloženie všetkých dát naraz
function saveAllData(userId, data) {
     if (!userId) return Promise.reject("User not authenticated.");
     const docRef = doc(db, "userData", userId);
     
     // Konvertuj Date objekty na Firebase Timestamp pred uložením
     const dataToSave = {
         ...data,
         transactions: data.transactions.map(t => ({
             ...t,
             createdAt: Timestamp.fromDate(new Date(t.createdAt))
         }))
     };
     
     return setDoc(docRef, dataToSave);
}

// Optimalizované funkcie na ukladanie
function updateData(partialData) {
    const userId = getUserId();
    if (!userId || !localDataCache) {
        console.error("User ID or data cache is not initialized.");
        return Promise.reject("User ID or data cache is not initialized.");
    }
    const updatedData = { ...localDataCache, ...partialData };
    localDataCache = updatedData;
    return saveAllData(userId, updatedData);
}

export function saveTransactions(transactions) { return updateData({ transactions }); }
export function saveAllLimits(limits) { return updateData({ limits }); }
export function saveCategories(categories) { return updateData({ categories }); }
export function saveBalance(balance) { return updateData({ balance }); }
export function saveCardStates(cardStates) { return updateData({ cardStates }); }

function getDefaultData() {
    return {
        transactions: [],
        limits: {},
        balance: 0,
        categories: getDefaultCategories(),
        cardStates: {}
    };
}

function getDefaultCategories() {
    return [
        { id: 'cat-1', name: 'Potraviny', type: 'expense', icon: '🛒' },
        { id: 'cat-2', name: 'Doprava', type: 'expense', icon: '🚗' },
        { id: 'cat-3', name: 'Bývanie', type: 'expense', icon: '🏠' },
        { id: 'cat-4', name: 'Zábava', type: 'expense', icon: '🎉' },
        { id: 'cat-5', name: 'Oblečenie', type: 'expense', icon: '👕' },
        { id: 'cat-6', name: 'Reštaurácie', type: 'expense', icon: '🍔' },
        { id: 'cat-7', name: 'Zdravie', type: 'expense', icon: '💊' },
        { id: 'cat-8', name: 'Iné', type: 'expense', icon: '❓' },
        { id: 'cat-9', name: 'Výplata', type: 'income', icon: '💰' },
        { id: 'cat-10', name: 'Darček', type: 'income', icon: '🎁' },
        { id: 'cat-11', name: 'Iné', type: 'income', icon: '➕' },
    ];
}
