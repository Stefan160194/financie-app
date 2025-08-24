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
const auth = getAuth(app);

let userId = null;
let dbUnsubscribe = null; // Funkcia na odhlásenie odberu zmien z databázy
let localDataCache = null; // Lokálna cache pre dáta

// Funkcia na prihlásenie anonymného používateľa
function authenticateUser() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                resolve(userId);
            } else {
                signInAnonymously(auth).catch(reject);
            }
        });
    });
}

// Nová funkcia, ktorá nastaví "listener" na zmeny v databáze
export function listenForDataChanges(onDataUpdate, onError) {
    authenticateUser()
        .then(uid => {
            const docRef = doc(db, "userData", uid);
            if (dbUnsubscribe) dbUnsubscribe();
            
            dbUnsubscribe = onSnapshot(docRef, (docSnap) => {
                let data;
                if (docSnap.exists()) {
                    const remoteData = docSnap.data();
                    const transactions = (remoteData.transactions || []).map(t => ({
                        ...t,
                        createdAt: t.createdAt.toDate() // Konvertuj Firebase Timestamp na Date
                    }));
                    data = { ...remoteData, transactions };
                } else {
                    data = getDefaultData();
                    // Ulož predvolené dáta, ak používateľ ešte žiadne nemá
                    saveAllData(data); 
                }
                localDataCache = data; // Ulož do lokálnej cache
                onDataUpdate(data); // Zavolaj funkciu z main.js na prekreslenie UI
            }, (error) => {
                console.error("Error listening to data changes:", error);
                onError(error);
            });
        })
        .catch(authError => {
            console.error("Authentication failed:", authError);
            onError(authError);
        });
}


// Funkcia na uloženie všetkých dát naraz
function saveAllData(data) {
     if (!userId) return Promise.reject("User not authenticated.");
     const docRef = doc(db, "userData", userId);
     
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
    if (!localDataCache) {
        console.error("Data cache is not initialized.");
        return Promise.reject("Data cache is not initialized.");
    }
    const updatedData = { ...localDataCache, ...partialData };
    localDataCache = updatedData;
    return saveAllData(updatedData);
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
