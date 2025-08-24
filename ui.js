let expensesChartInstance = null;

export function formatCurrency(value) {
    return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);
};

export function showMessage(messageBox, text, type = 'success') {
    messageBox.textContent = text;
    messageBox.className = `fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-lg transition-all duration-300 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} opacity-100 -translate-y-0`;
    setTimeout(() => {
        messageBox.className = messageBox.className.replace('opacity-100 -translate-y-0', 'opacity-0 translate-y-10');
    }, 3000);
};

export function updateMonthDisplay(currentMonthDisplay, currentDate) {
    currentMonthDisplay.textContent = dayjs(currentDate).format('MMMM YYYY');
};

export function renderChart(chartCanvas, currentDate, transactions, chartView = 'both') {
    const daysInMonth = dayjs(currentDate).daysInMonth();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const incomeData = Array(daysInMonth).fill(0);
    const expenseData = Array(daysInMonth).fill(0);

    transactions.forEach(transaction => {
        const dayOfMonth = dayjs(transaction.createdAt).date();
        if (transaction.type === 'income') {
            incomeData[dayOfMonth - 1] += transaction.amount;
        } else {
            expenseData[dayOfMonth - 1] += transaction.amount;
        }
    });

    if (expensesChartInstance) {
        expensesChartInstance.destroy();
    }

    const datasets = [];

    if (chartView === 'income' || chartView === 'both') {
        datasets.push({
            label: 'Príjmy (€)',
            data: incomeData,
            backgroundColor: 'rgba(74, 222, 128, 0.5)',
            borderColor: 'rgba(74, 222, 128, 1)',
            borderWidth: 1,
            borderRadius: 5
        });
    }

    if (chartView === 'expense' || chartView === 'both') {
        datasets.push({
            label: 'Výdavky (€)',
            data: expenseData,
            backgroundColor: 'rgba(248, 113, 113, 0.5)',
            borderColor: 'rgba(248, 113, 113, 1)',
            borderWidth: 1,
            borderRadius: 5
        });
    }


    expensesChartInstance = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#9ca3af'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        color: '#4b5563'
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

export function renderTransactions(transactionTableBody, noTransactionsMessage, filteredTransactions, categories) {
    transactionTableBody.innerHTML = '';
    noTransactionsMessage.classList.toggle('hidden', filteredTransactions.length > 0);
    
    let lastDate = null;
    let isAlternateDay = false;

    filteredTransactions.forEach(transaction => {
        const currentDate = dayjs(transaction.createdAt).format('YYYY-MM-DD');
        if (currentDate !== lastDate) {
            isAlternateDay = !isAlternateDay;
            lastDate = currentDate;
        }
        
        const rowBgClass = isAlternateDay ? 'bg-gray-800' : 'bg-gray-900/50';

        const isIncome = transaction.type === 'income';
        const amountClass = isIncome ? 'text-green-400' : 'text-red-400';
        const category = categories.find(c => c.id === transaction.categoryId) || { name: 'Nezaradené', icon: '❓' };

        const tr = document.createElement('tr');
        tr.className = `${rowBgClass} border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors`;
        tr.innerHTML = `
            <td class="p-4">${dayjs(transaction.createdAt).format('DD.MM.YYYY')}</td>
            <td class="p-4">${transaction.description}</td>
            <td class="p-4"><span class="flex items-center gap-2">${category.icon} <span>${category.name}</span></span></td>
            <td class="p-4 text-right font-mono font-semibold ${amountClass}">${isIncome ? '+' : ''}${formatCurrency(transaction.amount)}</td>
            <td class="p-4 text-center">
                <div class="flex justify-center items-center">
                    <button data-id="${transaction.id}" class="edit-btn text-blue-400 hover:text-blue-600 transition-colors p-1" title="Upraviť">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                    </button>
                    <button data-id="${transaction.id}" class="delete-btn text-red-400 hover:text-red-600 transition-colors p-1" title="Odstrániť">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </td>
        `;
        transactionTableBody.appendChild(tr);
    });
}

export function updateSummary(elements, filteredTransactions, allTransactions, balance, monthlyLimit, dailyLimit, currentDate) {
    const monthlyIncomes = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    elements.monthlyIncomeEl.textContent = formatCurrency(monthlyIncomes);
    elements.totalSpentEl.textContent = formatCurrency(monthlyExpenses);
    const balanceForMonth = monthlyIncomes - monthlyExpenses;
    elements.monthlyBalanceEl.textContent = formatCurrency(balanceForMonth);
    elements.monthlyBalanceEl.classList.toggle('text-red-400', balanceForMonth < 0);
    elements.monthlyBalanceEl.classList.toggle('text-green-400', balanceForMonth >= 0);

    const daysInMonth = dayjs(currentDate).daysInMonth();
    const avgDailyExpense = monthlyExpenses > 0 ? monthlyExpenses / daysInMonth : 0;
    elements.avgDailyExpenseEl.textContent = formatCurrency(avgDailyExpense);

    elements.summaryMonthlyLimitEl.textContent = formatCurrency(monthlyLimit);

    const progressPercentage = monthlyLimit > 0 ? (monthlyExpenses / monthlyLimit) * 100 : 0;
    elements.progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
    elements.progressBar.classList.toggle('bg-red-500', progressPercentage > 100);
    elements.progressBar.classList.toggle('from-blue-500', progressPercentage <= 100);
    elements.progressBar.classList.toggle('to-teal-400', progressPercentage <= 100);

    if(dailyLimit > 0) {
        const today = dayjs().startOf('day');
        const todayExpenses = allTransactions
            .filter(t => t.type === 'expense' && dayjs(t.createdAt).isSame(today, 'day'))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const dailyRemaining = dailyLimit - todayExpenses;
        if (dailyRemaining >= 0) {
            elements.dailyStatusEl.innerHTML = `Dnes ti zostáva <span class="font-bold text-green-400">${formatCurrency(dailyRemaining)}</span>.`;
        } else {
            elements.dailyStatusEl.innerHTML = `Dnes si prekročil limit o <span class="font-bold text-red-400">${formatCurrency(Math.abs(dailyRemaining))}</span>.`;
        }
    } else {
        elements.dailyStatusEl.textContent = 'Zadaj denný limit pre sledovanie.';
    }

    const totalIncomeOverall = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpensesOverall = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = balance + totalIncomeOverall - totalExpensesOverall;
    elements.currentBalanceDisplay.textContent = formatCurrency(currentBalance);
    elements.currentBalanceDisplay.classList.toggle('text-red-400', currentBalance < 0);
    elements.currentBalanceDisplay.classList.toggle('text-green-400', currentBalance >= 0);
}

export function renderCategories(categoryList, categories) {
    categoryList.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-700 p-2 rounded';
        li.innerHTML = `
            <span class="flex items-center gap-2">${cat.icon} <span class="text-sm">${cat.name}</span></span>
            <div class="flex items-center gap-2">
                <button data-id="${cat.id}" class="edit-category-btn text-blue-400 hover:text-blue-600 transition-colors" title="Upraviť kategóriu">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                </button>
                <button data-id="${cat.id}" class="delete-category-btn text-red-400 hover:text-red-600 transition-colors" title="Zmazať kategóriu">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                </button>
            </div>
        `;
        categoryList.appendChild(li);
    });
}

export function renderCategoryFilters(categoryFilterList, categories, activeFilters) {
    categoryFilterList.innerHTML = '';
    categories.forEach(cat => {
        const isChecked = activeFilters.has(cat.id);
        const label = document.createElement('label');
        label.className = 'flex items-center text-sm text-gray-300 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" data-id="${cat.id}" class="filter-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500" ${isChecked ? 'checked' : ''}>
            <span class="ml-2">${cat.icon} ${cat.name}</span>
        `;
        categoryFilterList.appendChild(label);
    });
}

export function populateCategoryDropdowns(categories, type = 'expense', selectElement) {
    const filteredCategories = categories.filter(c => c.type === type);
    selectElement.innerHTML = '<option value="">Bez kategórie</option>';
    filteredCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.icon} ${cat.name}`;
        selectElement.appendChild(option);
    });
}
