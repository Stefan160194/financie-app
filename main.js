import * as storage from './storage.js';
import * as ui from './ui.js';

// --- Global State ---
let currentDate = new Date(); // To track the currently viewed month
let currentBarChartView = 'both'; // 'both', 'expense', 'income' for the bar chart
let currentChartType = 'bar'; // 'bar', 'pie', or 'line'
let activeCategoryFilters = new Set();
let appData = {}; // Lokálna kópia všetkých dát

// --- DOM Elements ---
const authModal = document.getElementById('authModal');
const userIdInput = document.getElementById('userIdInput');
const loginBtn = document.getElementById('loginBtn');
const createNewUserBtn = document.getElementById('createNewUserBtn');
const userIdDisplayModal = document.getElementById('userIdDisplayModal');
const newUserIdEl = document.getElementById('newUserId');
const copyUserIdBtn = document.getElementById('copyUserIdBtn');
const closeUserIdModalBtn = document.getElementById('closeUserIdModalBtn');
const userIdDisplay = document.getElementById('userIdDisplay');
const logoutBtn = document.getElementById('logoutBtn');

const initialBalanceInput = document.getElementById('initialBalance');
const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const monthlyLimitInput = document.getElementById('monthlyLimit');
const dailyLimitInput = document.getElementById('dailyLimit');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const totalSpentEl = document.getElementById('totalSpent');
const monthlyIncomeEl = document.getElementById('monthlyIncome');
const monthlyBalanceEl = document.getElementById('monthlyBalance');
const avgDailyExpenseEl = document.getElementById('avgDailyExpense');
const progressBar = document.getElementById('progressBar');
const summaryMonthlyLimitEl = document.getElementById('summaryMonthlyLimit');
const dailyStatusEl = document.getElementById('dailyStatus');
const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const transactionDateInput = document.getElementById('transactionDate');
const categorySelect = document.getElementById('categorySelect');
const transactionTableBody = document.getElementById('transactionTableBody');
const noTransactionsMessage = document.getElementById('noTransactionsMessage');
const messageBox = document.getElementById('messageBox');
const confirmationModal = document.getElementById('confirmationModal');
const modalTitle = document.getElementById('modalTitle');
const cancelButton = document.getElementById('cancelButton');
const confirmButton = document.getElementById('confirmButton');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const currentMonthDisplay = document.getElementById('currentMonthDisplay');
const barChartCanvas = document.getElementById('expensesChart');
const pieChartCanvas = document.getElementById('categoryPieChart');
const lineChartCanvas = document.getElementById('trendsLineChart');
const chartFilterToggle = document.getElementById('chartFilterToggle');
const chartTypeToggle = document.getElementById('chartTypeToggle');
const barChartContainer = document.getElementById('barChartContainer');
const pieChartContainer = document.getElementById('pieChartContainer');
const lineChartContainer = document.getElementById('lineChartContainer');
const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryName');
const categoryIconInput = document.getElementById('categoryIcon');
const categoryList = document.getElementById('categoryList');
const categoryFilterList = document.getElementById('categoryFilterList');
const selectAllCategoriesBtn = document.getElementById('selectAllCategoriesBtn');
const deselectAllCategoriesBtn = document.getElementById('deselectAllCategoriesBtn');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editTransactionIdInput = document.getElementById('editTransactionId');
const editDescriptionInput = document.getElementById('editDescription');
const editDateInput = document.getElementById('editDate');
const editAmountInput = document.getElementById('editAmount');
const editCategorySelect = document.getElementById('editCategorySelect');
const cancelEditButton = document.getElementById('cancelEditButton');
const editCategoryModal = document.getElementById('editCategoryModal');
const editCategoryForm = document.getElementById('editCategoryForm');
const editCategoryIdInput = document.getElementById('editCategoryId');
const editCategoryNameInput = document.getElementById('editCategoryName');
const editCategoryIconInput = document.getElementById('editCategoryIcon');
const cancelEditCategoryButton = document.getElementById('cancelEditCategoryButton');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const importFileInput = document.getElementById('importFileInput');
const cardHeaders = document.querySelectorAll('.card-header');
const categorySummaryList = document.getElementById('categorySummaryList');
const merchantSummaryList = document.getElementById('merchantSummaryList');

const uiElementsForSummary = {
    monthlyIncomeEl, totalSpentEl, monthlyBalanceEl, summaryMonthlyLimitEl,
    progressBar, dailyStatusEl, currentBalanceDisplay, avgDailyExpenseEl
};

// --- Chart Rendering Logic ---
function updateCharts(transactionsForCurrentMonth, allTransactions, categories, balance) {
    if (currentChartType === 'bar') {
        ui.renderBarChart(barChartCanvas, currentDate, transactionsForCurrentMonth, allTransactions, balance, currentBarChartView);
    } else if (currentChartType === 'pie') {
        ui.renderPieChart(pieChartCanvas, transactionsForCurrentMonth, categories);
    } else if (currentChartType === 'line') {
        ui.renderLineChart(lineChartCanvas, allTransactions);
    }
}

// Hlavná funkcia na prekreslenie celého UI
function refreshDisplay() {
    if (!appData || !appData.transactions) return; 

    ui.updateMonthDisplay(currentMonthDisplay, currentDate);
    
    const { transactions: allTransactions, limits, balance, categories } = appData;
    
    initialBalanceInput.value = balance || '';
    
    const currentMonthKey = dayjs(currentDate).format('YYYY-MM');
    const limitsForCurrentMonth = limits[currentMonthKey] || { monthly: '', daily: '' };
    monthlyLimitInput.value = limitsForCurrentMonth.monthly;
    dailyLimitInput.value = limitsForCurrentMonth.daily;

    const startOfMonth = dayjs(currentDate).startOf('month');
    const endOfMonth = dayjs(currentDate).endOf('month');

    let transactionsForCurrentMonth = allTransactions.filter(t => {
        const tDate = dayjs(t.createdAt);
        return !tDate.isBefore(startOfMonth) && !tDate.isAfter(endOfMonth);
    });

    let filteredTransactionsForTable = [...transactionsForCurrentMonth];
    if (activeCategoryFilters.size > 0 && activeCategoryFilters.size < categories.length) {
        filteredTransactionsForTable = filteredTransactionsForTable.filter(t => activeCategoryFilters.has(t.categoryId) || !t.categoryId);
    }

    filteredTransactionsForTable.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    ui.renderTransactions(transactionTableBody, noTransactionsMessage, filteredTransactionsForTable, categories);
    ui.updateSummary(uiElementsForSummary, transactionsForCurrentMonth, allTransactions, balance, limitsForCurrentMonth.monthly || 0, limitsForCurrentMonth.daily || 0, currentDate);
    ui.renderCategorySummary(categorySummaryList, transactionsForCurrentMonth, categories);
    ui.renderMerchantSummary(merchantSummaryList, transactionsForCurrentMonth);
    updateCharts(transactionsForCurrentMonth, allTransactions, categories, balance);
    ui.renderCategories(categoryList, categories);
    ui.renderCategoryFilters(categoryFilterList, categories, activeCategoryFilters);
    const currentTransactionType = transactionForm.querySelector('input[name="transactionType"]:checked').value;
    ui.populateCategoryDropdowns(categories, currentTransactionType, categorySelect);
}

// Funkcia, ktorá sa zavolá vždy, keď prídu nové dáta z Firebase
function handleDataUpdate(data) {
    const isFirstLoad = !appData.transactions;
    appData = data;

    if (isFirstLoad) {
        const { cardStates, categories } = data;
        document.querySelectorAll('.card-wrapper').forEach(card => {
            const cardId = card.dataset.cardId;
            const savedState = cardStates[cardId];
            if (savedState === 'closed') {
                card.classList.remove('card-open');
            } else {
                card.classList.add('card-open');
            }
        });
        categories.forEach(cat => activeCategoryFilters.add(cat.id));
    }
    
    refreshDisplay();
}

// --- Modal Logic ---
let resolveConfirm;
const openConfirmationModal = (title) => {
    modalTitle.textContent = title;
    confirmationModal.classList.remove('hidden');
    return new Promise(resolve => {
        resolveConfirm = resolve;
    });
};

const closeConfirmationModal = () => confirmationModal.classList.add('hidden');

const openEditModal = (transaction) => {
    const { categories } = appData;
    editTransactionIdInput.value = transaction.id;
    editDescriptionInput.value = transaction.description;
    editAmountInput.value = transaction.amount;
    editDateInput.value = dayjs(transaction.createdAt).format('YYYY-MM-DD');
    editForm.querySelector(`input[name="editTransactionType"][value="${transaction.type}"]`).checked = true;
    ui.populateCategoryDropdowns(categories, transaction.type, editCategorySelect);
    editCategorySelect.value = transaction.categoryId || "";
    editModal.classList.remove('hidden');
};

const closeEditModal = () => editModal.classList.add('hidden');

const openEditCategoryModal = (category) => {
    editCategoryIdInput.value = category.id;
    editCategoryNameInput.value = category.name;
    editCategoryIconInput.value = category.icon;
    editCategoryForm.querySelector(`input[name="editCategoryType"][value="${category.type}"]`).checked = true;
    editCategoryModal.classList.remove('hidden');
};

const closeEditCategoryModal = () => editCategoryModal.classList.add('hidden');

// --- Event Handlers ---
confirmButton.addEventListener('click', () => {
    closeConfirmationModal();
    if (resolveConfirm) resolveConfirm(true);
});

cancelButton.addEventListener('click', () => {
    closeConfirmationModal();
    if (resolveConfirm) resolveConfirm(false);
});

cancelEditButton.addEventListener('click', closeEditModal);
cancelEditCategoryButton.addEventListener('click', closeEditCategoryModal);

prevMonthBtn.addEventListener('click', () => {
    currentDate = dayjs(currentDate).subtract(1, 'month').toDate();
    refreshDisplay();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate = dayjs(currentDate).add(1, 'month').toDate();
    refreshDisplay();
});

saveSettingsBtn.addEventListener('click', () => {
    const initialBalance = parseFloat(initialBalanceInput.value) || 0;
    storage.saveBalance(initialBalance);

    const { limits } = appData;
    const currentMonthKey = dayjs(currentDate).format('YYYY-MM');
    const monthly = parseFloat(monthlyLimitInput.value) || 0;
    const daily = parseFloat(dailyLimitInput.value) || 0;
    limits[currentMonthKey] = { monthly, daily };
    storage.saveAllLimits(limits);

    ui.showMessage(messageBox, 'Nastavenia úspešne uložené!');
});

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let description = descriptionInput.value.trim();
    if (!description) {
        description = `Záznam-${crypto.randomUUID().slice(0, 8)}`;
    }
    const amount = parseFloat(amountInput.value);
    const dateValue = transactionDateInput.value;
    const type = transactionForm.querySelector('input[name="transactionType"]:checked').value;
    const categoryId = categorySelect.value || null;

    if (amount > 0 && dateValue) {
        const createdAtDate = dayjs(dateValue).startOf('day').add(12, 'hour').toDate();
        const { transactions } = appData;
        
        const newTransaction = {
            id: Date.now().toString(),
            description,
            amount,
            createdAt: createdAtDate,
            type,
            categoryId
        };
        
        transactions.push(newTransaction);
        storage.saveTransactions(transactions);
        
        ui.showMessage(messageBox, 'Záznam pridaný!');
        
        currentDate = createdAtDate;

        descriptionInput.value = '';
        amountInput.value = '';
        transactionDateInput.value = dayjs().format('YYYY-MM-DD');
        descriptionInput.focus();
    }
});

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const transactionId = editTransactionIdInput.value;
    let newDescription = editDescriptionInput.value.trim();
     if (!newDescription) {
        newDescription = `Záznam-${crypto.randomUUID().slice(0, 8)}`;
    }
    const newAmount = parseFloat(editAmountInput.value);
    const newDateValue = editDateInput.value;
    const newType = editForm.querySelector('input[name="editTransactionType"]:checked').value;
    const newCategoryId = editCategorySelect.value || null;

    if (newAmount > 0 && newDateValue) {
        let { transactions } = appData;
        const transactionIndex = transactions.findIndex(t => t.id === transactionId);
        
        if (transactionIndex > -1) {
            transactions[transactionIndex] = { ...transactions[transactionIndex], description: newDescription, amount: newAmount, createdAt: dayjs(newDateValue).startOf('day').add(12, 'hour').toDate(), type: newType, categoryId: newCategoryId };
            storage.saveTransactions(transactions);
            ui.showMessage(messageBox, 'Záznam úspešne upravený!');
            closeEditModal();
            currentDate = transactions[transactionIndex].createdAt;
        }
    }
});

transactionTableBody.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    const editBtn = e.target.closest('.edit-btn');

    if (editBtn) {
        const docId = editBtn.dataset.id;
        const { transactions } = appData;
        const transactionToEdit = transactions.find(t => t.id === docId);
        if (transactionToEdit) {
            openEditModal(transactionToEdit);
        }
    }
    
    if (deleteBtn) {
        const docId = deleteBtn.dataset.id;
        const confirmed = await openConfirmationModal('Naozaj chcete odstrániť tento záznam?');
        if (confirmed) {
            let { transactions } = appData;
            transactions = transactions.filter(t => t.id !== docId);
            storage.saveTransactions(transactions);
            ui.showMessage(messageBox, 'Záznam odstránený.');
        }
    }
});

exportDataBtn.addEventListener('click', () => {
    const data = appData;
    const dataString = JSON.stringify(data, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `financne-data-${dayjs().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ui.showMessage(messageBox, 'Dáta úspešne exportované!');
});

importDataBtn.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.transactions && importedData.limits && importedData.hasOwnProperty('balance') && importedData.categories) {
                const confirmed = await openConfirmationModal('Naozaj chcete prepísať všetky existujúce dáta?');
                if (confirmed) {
                    storage.saveTransactions(importedData.transactions);
                    storage.saveAllLimits(importedData.limits);
                    storage.saveBalance(importedData.balance);
                    storage.saveCategories(importedData.categories);
                    ui.showMessage(messageBox, 'Dáta úspešne importované!');
                    currentDate = new Date();
                }
            } else {
                throw new Error('Neplatný formát súboru.');
            }
        } catch (error) {
            console.error("Error importing data:", error);
            ui.showMessage(messageBox, `Chyba pri importe: ${error.message}`, 'error');
        } finally {
            importFileInput.value = '';
        }
    };
    reader.readAsText(file);
});

categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = categoryNameInput.value.trim();
    const icon = categoryIconInput.value.trim() || '💼';
    const type = categoryForm.querySelector('input[name="categoryType"]:checked').value;
    if (name) {
        const { categories } = appData;
        const newCategory = { id: `cat-${Date.now()}`, name, type, icon };
        categories.push(newCategory);
        storage.saveCategories(categories);
        ui.showMessage(messageBox, 'Kategória pridaná!');
        categoryNameInput.value = '';
        categoryIconInput.value = '';
    }
});

editCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editCategoryIdInput.value;
    const name = editCategoryNameInput.value.trim();
    const icon = editCategoryIconInput.value.trim() || '�';
    const type = editCategoryForm.querySelector('input[name="editCategoryType"]:checked').value;

    if (name) {
        let { categories } = appData;
        const catIndex = categories.findIndex(c => c.id === id);
        if (catIndex > -1) {
            categories[catIndex] = { id, name, icon, type };
            storage.saveCategories(categories);
            ui.showMessage(messageBox, 'Kategória upravená!');
            closeEditCategoryModal();
        }
    }
});

categoryList.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-category-btn');
    const deleteBtn = e.target.closest('.delete-category-btn');
    const { categories } = appData;

    if (editBtn) {
        const id = editBtn.dataset.id;
        const categoryToEdit = categories.find(c => c.id === id);
        if (categoryToEdit) {
            openEditCategoryModal(categoryToEdit);
        }
    }

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const confirmed = await openConfirmationModal('Naozaj chcete zmazať túto kategóriu?');
        if (confirmed) {
            const updatedCategories = categories.filter(c => c.id !== id);
            storage.saveCategories(updatedCategories);
            ui.showMessage(messageBox, 'Kategória zmazaná.');
        }
    }
});

transactionForm.querySelectorAll('input[name="transactionType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const { categories } = appData;
        ui.populateCategoryDropdowns(categories, e.target.value, categorySelect);
    });
});

editForm.querySelectorAll('input[name="editTransactionType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const { categories } = appData;
        ui.populateCategoryDropdowns(categories, e.target.value, editCategorySelect);
    });
});

cardHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const card = header.closest('.card-wrapper');
        card.classList.toggle('card-open');
        
        const { cardStates } = appData;
        const cardId = card.dataset.cardId;
        const newState = card.classList.contains('card-open') ? 'open' : 'closed';
        cardStates[cardId] = newState;
        storage.saveCardStates(cardStates);
    });
});

chartFilterToggle.addEventListener('click', (e) => {
    if (e.target.matches('.chart-filter-btn')) {
        currentBarChartView = e.target.dataset.view;
        chartFilterToggle.querySelectorAll('.chart-filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        refreshDisplay();
    }
});

chartTypeToggle.addEventListener('click', (e) => {
    if (e.target.matches('.chart-type-btn')) {
        currentChartType = e.target.dataset.chart;
        
        chartTypeToggle.querySelectorAll('.chart-type-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        barChartContainer.classList.toggle('hidden', currentChartType !== 'bar');
        pieChartContainer.classList.toggle('hidden', currentChartType !== 'pie');
        lineChartContainer.classList.toggle('hidden', currentChartType !== 'line');
        
        refreshDisplay();
    }
});

categoryFilterList.addEventListener('change', (e) => {
    if (e.target.matches('.filter-checkbox')) {
        const categoryId = e.target.dataset.id;
        if (e.target.checked) {
            activeCategoryFilters.add(categoryId);
        } else {
            activeCategoryFilters.delete(categoryId);
        }
        refreshDisplay();
    }
});

selectAllCategoriesBtn.addEventListener('click', () => {
    const { categories } = appData;
    categories.forEach(cat => activeCategoryFilters.add(cat.id));
    refreshDisplay();
});

deselectAllCategoriesBtn.addEventListener('click', () => {
    activeCategoryFilters.clear();
    refreshDisplay();
});

// --- Authentication Handlers ---
loginBtn.addEventListener('click', () => {
    const userId = userIdInput.value.trim();
    if (userId) {
        initializeApp(userId);
    } else {
        ui.showMessage(messageBox, "Prosím, zadajte platné ID.", "error");
    }
});

createNewUserBtn.addEventListener('click', () => {
    const newId = crypto.randomUUID();
    newUserIdEl.textContent = newId;
    userIdDisplayModal.classList.remove('hidden');
});

closeUserIdModalBtn.addEventListener('click', () => {
    const newId = newUserIdEl.textContent;
    userIdDisplayModal.classList.add('hidden');
    initializeApp(newId);
});

copyUserIdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(newUserIdEl.textContent);
    ui.showMessage(messageBox, "ID skopírované do schránky!");
});

logoutBtn.addEventListener('click', () => {
    storage.clearUserId();
    location.reload();
});

userIdDisplay.addEventListener('click', () => {
    const userId = storage.getUserId();
    if (userId) {
        newUserIdEl.textContent = userId;
        userIdDisplayModal.classList.remove('hidden');
    }
});

// --- Initialization ---
function initializeApp(userId) {
    storage.setUserId(userId);
    authModal.classList.add('hidden');
    userIdDisplay.textContent = `ID: ${userId.slice(0, 8)}...`;

    storage.listenForDataChanges(
        userId,
        (data) => handleDataUpdate(data),
        (error) => ui.showMessage(messageBox, "Nepodarilo sa načítať dáta.", "error")
    );
}

function init() {
    const userId = storage.getUserId();
    if (userId) {
        initializeApp(userId);
    } else {
        authModal.classList.remove('hidden');
    }
    transactionDateInput.value = dayjs().format('YYYY-MM-DD');
}

init();
