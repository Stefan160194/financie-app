let barChartInstance = null;
let pieChartInstance = null;
let lineChartInstance = null;

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

export function renderBarChart(chartCanvas, currentDate, transactionsForCurrentMonth, allTransactions, initialBalance, chartView = 'both') {
    const daysInMonth = dayjs(currentDate).daysInMonth();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const incomeData = Array(daysInMonth).fill(0);
    const expenseData = Array(daysInMonth).fill(0);

    transactionsForCurrentMonth.forEach(transaction => {
        const dayOfMonth = dayjs(transaction.createdAt).date();
        if (transaction.type === 'income') {
            incomeData[dayOfMonth - 1] += transaction.amount;
        } else {
            expenseData[dayOfMonth - 1] += transaction.amount;
        }
    });

    // --- Balance Line Calculation ---
    const startOfMonth = dayjs(currentDate).startOf('month');
    
    // 1. Calculate balance at the beginning of the month
    const balanceBeforeMonth = allTransactions
        .filter(t => dayjs(t.createdAt).isBefore(startOfMonth))
        .reduce((balance, t) => {
            return t.type === 'income' ? balance + t.amount : balance - t.amount;
        }, initialBalance);

    // 2. Calculate daily balance changes for the current month
    const balanceData = [];
    let currentBalance = balanceBeforeMonth;

    for (let i = 0; i < daysInMonth; i++) {
        currentBalance += incomeData[i] - expenseData[i];
        balanceData.push(currentBalance);
    }
    
    if (barChartInstance) {
        barChartInstance.destroy();
    }

    const datasets = [];

    // Bar datasets
    if (chartView === 'income' || chartView === 'both') {
        datasets.push({
            type: 'bar',
            label: 'Príjmy',
            data: incomeData,
            backgroundColor: 'rgba(74, 222, 128, 0.5)',
            borderColor: 'rgba(74, 222, 128, 1)',
            yAxisID: 'y',
        });
    }

    if (chartView === 'expense' || chartView === 'both') {
        datasets.push({
            type: 'bar',
            label: 'Výdavky',
            data: expenseData,
            backgroundColor: 'rgba(248, 113, 113, 0.5)',
            borderColor: 'rgba(248, 113, 113, 1)',
            yAxisID: 'y',
        });
    }

    // Balance Line dataset
    if (chartView === 'both') {
        datasets.push({
            type: 'line',
            label: 'Zostatok',
            data: balanceData,
            borderColor: '#f59e0b', // amber-500
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'yBalance',
            tension: 0.4,
            fill: true,
            pointRadius: 2,
            pointHitRadius: 10
        });
    }


    barChartInstance = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
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
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#4b5563' }
                },
                yBalance: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: { color: '#f59e0b' },
                    grid: {
                        drawOnChartArea: false, 
                    },
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

export function renderPieChart(chartCanvas, transactions, categories) {
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    const PIE_CHART_COLORS = [
        '#4338ca', '#db2777', '#f59e0b', '#10b981', '#2563eb',
        '#9333ea', '#ec4899', '#facc15', '#22c55e', '#3b82f6',
        '#a855f7', '#f472b6', '#fbbf24', '#4ade80', '#60a5fa'
    ];

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
        const categoryId = transaction.categoryId || 'uncategorized';
        if (!acc[categoryId]) {
            acc[categoryId] = 0;
        }
        acc[categoryId] += transaction.amount;
        return acc;
    }, {});

    const categoryMap = categories.reduce((map, cat) => {
        map[cat.id] = cat;
        return map;
    }, {});

    const labels = [];
    const data = [];
    const backgroundColors = [];

    const sortedCategories = Object.keys(expensesByCategory).sort((a, b) => expensesByCategory[b] - expensesByCategory[a]);

    sortedCategories.forEach((categoryId, index) => {
        const category = categoryMap[categoryId];
        const label = category ? `${category.icon} ${category.name}` : '❓ Nezaradené';
        labels.push(label);
        data.push(expensesByCategory[categoryId]);
        backgroundColors.push(PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]);
    });
    
    const initialTotalExpenses = data.reduce((sum, value) => sum + value, 0);

    if (data.length === 0) {
        const ctx = chartCanvas.getContext('2d');
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText('V tomto mesiaci nie sú žiadne výdavky na zobrazenie.', chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }

    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: (chart) => {
            let visibleTotal = 0;
            const chartData = chart.data.datasets[0].data;

            for (let i = 0; i < chartData.length; i++) {
                if (chart.getDataVisibility(i)) {
                    visibleTotal += chartData[i];
                }
            }

            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            
            if (!meta.data.length) return;

            ctx.save();
            const centerX = meta.data[0].x;
            const centerY = meta.data[0].y;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = 'bold 2rem Inter, sans-serif';
            ctx.fillStyle = '#f9fafb';
            ctx.fillText(formatCurrency(visibleTotal), centerX, centerY - 15);

            ctx.font = '0.875rem Inter, sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText('Zobrazené výdavky', centerX, centerY + 15);
            ctx.restore();
        }
    };

    pieChartInstance = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Výdavky podľa kategórií',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#1f2937',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#d1d5db',
                        boxWidth: 20,
                        padding: 20,
                        font: {
                            size: 14
                        }
                    },
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.index;
                        const ci = legend.chart;
                        ci.toggleDataVisibility(index);
                        ci.update();
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.chart.getDatasetMeta(0).total;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: '#374151',
                    titleFont: { size: 16 },
                    bodyFont: { size: 14 },
                    padding: 10,
                    cornerRadius: 8
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}

export function renderLineChart(chartCanvas, allTransactions) {
    if (lineChartInstance) {
        lineChartInstance.destroy();
    }

    const labels = [];
    const data = [];
    const today = dayjs();

    for (let i = 5; i >= 0; i--) {
        const month = today.subtract(i, 'month');
        labels.push(month.format('MMM YYYY'));

        const startOfMonth = month.startOf('month');
        const endOfMonth = month.endOf('month');

        const monthlyExpenses = allTransactions
            .filter(t => {
                const transactionDate = dayjs(t.createdAt);
                return t.type === 'expense' && 
                       !transactionDate.isBefore(startOfMonth) && 
                       !transactionDate.isAfter(endOfMonth);
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        data.push(monthlyExpenses);
    }

    const ctx = chartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.5)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    lineChartInstance = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mesačné výdavky (€)',
                data: data,
                borderColor: '#6366f1', // indigo-500
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#4f46e5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Výdavky: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#4b5563' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
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
        tr.className = `${rowBgClass} border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors text-sm`;
        tr.innerHTML = `
            <td class="py-3 px-4 whitespace-nowrap">${dayjs(transaction.createdAt).format('DD.MM.YYYY')}</td>
            <td class="py-3 px-4 max-w-[150px] md:max-w-xs truncate" title="${transaction.description}">${transaction.description}</td>
            <td class="py-3 px-4 whitespace-nowrap"><span class="flex items-center gap-2">${category.icon} <span>${category.name}</span></span></td>
            <td class="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap ${amountClass}">${isIncome ? '+' : ''}${formatCurrency(transaction.amount)}</td>
            <td class="py-3 px-4 text-center">
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

export function renderCategorySummary(summaryListElement, transactions, categories) {
    summaryListElement.innerHTML = ''; // Clear previous content

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (totalExpenses === 0) {
        summaryListElement.innerHTML = '<p class="text-center text-gray-500 py-4">Žiadne výdavky v tomto mesiaci.</p>';
        return;
    }

    const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
        const categoryId = transaction.categoryId || 'uncategorized';
        if (!acc[categoryId]) {
            acc[categoryId] = 0;
        }
        acc[categoryId] += transaction.amount;
        return acc;
    }, {});

    const categoryMap = categories.reduce((map, cat) => {
        map[cat.id] = cat;
        return map;
    }, {});
    
    // Create an array of category summaries to sort them
    const categorySummaries = Object.keys(expensesByCategory).map(categoryId => {
        const amount = expensesByCategory[categoryId];
        const category = categoryMap[categoryId] || { name: 'Nezaradené', icon: '❓' };
        const percentage = (amount / totalExpenses) * 100;
        return { category, amount, percentage };
    });

    // Sort by amount descending
    categorySummaries.sort((a, b) => b.amount - a.amount);

    // Generate and append HTML for each category
    categorySummaries.forEach(({ category, amount, percentage }) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="flex justify-between items-center mb-1 text-sm">
                <span class="flex items-center gap-2">${category.icon} ${category.name}</span>
                <div class="text-right">
                    <span class="font-semibold block">${formatCurrency(amount)}</span>
                    <span class="text-xs text-gray-400">${percentage.toFixed(1)}%</span>
                </div>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2.5">
                <div class="bg-pink-600 h-2.5 rounded-full" style="width: ${percentage.toFixed(2)}%"></div>
            </div>
        `;
        summaryListElement.appendChild(div);
    });
}

export function renderMerchantSummary(summaryListElement, transactions) {
    summaryListElement.innerHTML = ''; // Clear previous content

    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (totalExpenses === 0) {
        summaryListElement.innerHTML = '<p class="text-center text-gray-500 py-4">Žiadne výdavky v tomto mesiaci.</p>';
        return;
    }

    const expensesByDescription = expenseTransactions.reduce((acc, transaction) => {
        const description = transaction.description.trim().toLowerCase();
        if (!description) return acc; // Skip empty descriptions
        if (!acc[description]) {
            acc[description] = 0;
        }
        acc[description] += transaction.amount;
        return acc;
    }, {});
    
    // Create an array of merchant summaries to sort them
    const merchantSummaries = Object.keys(expensesByDescription).map(description => {
        const amount = expensesByDescription[description];
        const percentage = (amount / totalExpenses) * 100;
        // Capitalize first letter for display
        const displayName = description.charAt(0).toUpperCase() + description.slice(1);
        return { displayName, amount, percentage };
    });

    // Sort by amount descending
    merchantSummaries.sort((a, b) => b.amount - a.amount);

    // Generate and append HTML for each merchant
    merchantSummaries.forEach(({ displayName, amount, percentage }) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="flex justify-between items-center mb-1 text-sm">
                <span class="flex items-center gap-2 truncate" title="${displayName}">${displayName}</span>
                <div class="text-right flex-shrink-0">
                    <span class="font-semibold block">${formatCurrency(amount)}</span>
                    <span class="text-xs text-gray-400">${percentage.toFixed(1)}%</span>
                </div>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2.5">
                <div class="bg-teal-500 h-2.5 rounded-full" style="width: ${percentage.toFixed(2)}%"></div>
            </div>
        `;
        summaryListElement.appendChild(div);
    });
}
