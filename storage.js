const STORAGE_KEYS = {
    TRANSACTIONS: 'financeApp.transactions',
    LIMITS: 'financeApp.limits',
    BALANCE: 'financeApp.balance',
    CATEGORIES: 'financeApp.categories',
    CARD_STATES: 'financeApp.cardStates'
};

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

export function loadAllData() {
    try {
        const transactionsString = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]';
        const transactions = JSON.parse(transactionsString).map(tr => ({
            ...tr,
            createdAt: new Date(tr.createdAt)
        }));

        const limitsString = localStorage.getItem(STORAGE_KEYS.LIMITS) || '{}';
        const limits = JSON.parse(limitsString);

        const balanceString = localStorage.getItem(STORAGE_KEYS.BALANCE) || '0';
        const balance = parseFloat(balanceString);

        const categoriesString = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        let categories;
        if (categoriesString) {
            categories = JSON.parse(categoriesString);
        } else {
            categories = getDefaultCategories();
            saveCategories(categories);
        }

        const cardStatesString = localStorage.getItem(STORAGE_KEYS.CARD_STATES) || '{}';
        const cardStates = JSON.parse(cardStatesString);

        return { transactions, limits, balance, categories, cardStates };
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
        return { transactions: [], limits: {}, balance: 0, categories: getDefaultCategories(), cardStates: {} };
    }
}

export function saveTransactions(transactions) {
    try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
        console.error("Error saving transactions to localStorage:", error);
    }
}

export function saveAllLimits(limits) {
    try {
        localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(limits));
    } catch (error) {
        console.error("Error saving limits to localStorage:", error);
    }
}

export function saveCategories(categories) {
    try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
        console.error("Error saving categories to localStorage:", error);
    }
}

export function saveBalance(balance) {
    try {
        localStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
    } catch (error) {
        console.error("Error saving balance to localStorage:", error);
    }
}

export function saveCardStates(states) {
    try {
        localStorage.setItem(STORAGE_KEYS.CARD_STATES, JSON.stringify(states));
    } catch (error) {
        console.error("Error saving card states to localStorage:", error);
    }
}
