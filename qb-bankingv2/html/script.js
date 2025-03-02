const Config = {
    maxAccounts: 2
};

const bankingApp = Vue.createApp({
    data() {
        return {
            isBankOpen: false,
            isATM: false,
            playerData: {},
            accounts: [],
            statements: {},
            selectedAccount: null,
            pinNumbers: [],
            activeTab: 'accounts',
            
            depositAccount: null,
            depositAmount: 0,
            withdrawAccount: null,
            withdrawAmount: 0,
            
            internalFromAccount: null,
            internalToAccount: null,
            internalAmount: 0,
            externalFromAccount: null,
            externalToCitizenId: '',
            externalAmount: 0,
            
            cardAccount: null,
            cardPin: '',
            
            newAccountName: '',
            newAccountDeposit: 0,
            manageAccount: null,
            addUserCitizenId: '',
            
            atmPinInput: '',
            atmSelectedAccount: null,
            atmWithdrawAmount: 0,
            atmDepositAmount: 0,
            atmPinDisplay: '• • • •',
            
            notifications: [],
            
            setupPin: '',
            confirmPin: ''
        };
    },
    computed: {
        formattedAccounts() {
            return this.accounts.map(account => ({
                ...account,
                formattedBalance: this.formatMoney(account.account_balance)
            }));
        },
        accountStatements() {
            const selectedAccountName = this.selectedAccount ? this.selectedAccount.account_name : null;
            if (selectedAccountName && this.statements[selectedAccountName]) {
                return this.statements[selectedAccountName];
            }
            return [];
        }
    },
    methods: {
        switchTab(tabId) {
            this.activeTab = tabId;
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');

            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
        },
        
        openModal(modalId) {
            document.getElementById('modal-container').style.display = 'flex';
            document.getElementById(modalId).style.display = 'block';
        },
        
        closeModal() {
            document.getElementById('modal-container').style.display = 'none';
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        },
        
        closeApp() {
            fetch('https://qb-bankingv2/closeApp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            this.isBankOpen = false;
            this.isATM = false;
            document.getElementById('banking-container').style.display = 'none';
            document.getElementById('atm-container').style.display = 'none';
            document.getElementById('modal-container').style.display = 'none';
            
            this.playerData = {};
            document.getElementById('player-name').textContent = 'Unknown';
            document.getElementById('player-citizenid').textContent = 'Unknown';
            
            this.resetAllInputs();
        },
        
        resetAllInputs() {
            this.depositAmount = 0;
            this.withdrawAmount = 0;
            this.internalAmount = 0;
            this.externalAmount = 0;
            this.externalToCitizenId = '';
            this.cardPin = '';
            this.newAccountName = '';
            this.newAccountDeposit = 0;
            this.addUserCitizenId = '';
            this.atmPinInput = '';
            this.atmWithdrawAmount = 0;
            this.atmDepositAmount = 0;
            this.setupPin = '';
            this.confirmPin = '';
        },
        
        handleDeposit() {
            if (!this.depositAccount || this.depositAmount <= 0) {
                this.showNotification('Please enter a valid amount', 'error');
                return;
            }

            this.sendData('deposit', {
                accountName: this.depositAccount,
                amount: parseFloat(this.depositAmount),
                isATM: this.isATM
            });
            
            this.closeModal();
            this.depositAmount = 0;
        },
        
        handleWithdraw() {
            if (!this.withdrawAccount || this.withdrawAmount <= 0) {
                this.showNotification('Please enter a valid amount', 'error');
                return;
            }

            this.sendData('withdraw', {
                accountName: this.withdrawAccount,
                amount: parseFloat(this.withdrawAmount),
                isATM: this.isATM
            });
            
            this.closeModal();
            this.withdrawAmount = 0;
        },
        
        handleInternalTransfer() {
            if (!this.internalFromAccount || !this.internalToAccount || this.internalAmount <= 0) {
                this.showNotification('Please fill all fields with valid values', 'error');
                return;
            }

            if (this.internalFromAccount === this.internalToAccount) {
                this.showNotification('Cannot transfer to the same account', 'error');
                return;
            }

            this.sendData('internalTransfer', {
                fromAccountName: this.internalFromAccount,
                toAccountName: this.internalToAccount,
                amount: parseFloat(this.internalAmount)
            });
            
            this.internalAmount = 0;
        },
        
        handleExternalTransfer() {
            if (!this.externalFromAccount || !this.externalToCitizenId || this.externalAmount <= 0) {
                this.showNotification('Please fill all fields with valid values', 'error');
                return;
            }

            this.sendData('externalTransfer', {
                fromAccountName: this.externalFromAccount,
                targetCitizenId: this.externalToCitizenId,
                amount: parseFloat(this.externalAmount)
            });
            
            this.externalToCitizenId = '';
            this.externalAmount = 0;
        },
        
        handleOrderCard() {
            if (!this.cardAccount || !this.cardPin || this.cardPin.length !== 4 || isNaN(this.cardPin)) {
                this.showNotification('Please enter a valid 4-digit PIN', 'error');
                return;
            }

            if (!this.pinNumbers.includes(this.cardPin)) {
                this.showNotification('You must first set this PIN using the "Set or Update ATM PIN" section before ordering a card', 'error');
                return;
            }

            this.sendData('orderCard', {
                accountName: this.cardAccount,
                cardPin: this.cardPin
            });
            
            this.showNotification('Card ordered successfully. You can now use this PIN at ATMs.', 'success');
            this.cardPin = '';
        },
        
        handleSetupPin() {
            if (!this.setupPin || this.setupPin.length !== 4 || isNaN(this.setupPin)) {
                this.showNotification('Please enter a valid 4-digit PIN', 'error');
                return;
            }
            
            if (this.setupPin !== this.confirmPin) {
                this.showNotification('PINs do not match', 'error');
                return;
            }
            
            this.sendData('setATMPin', {
                pin: this.setupPin
            });
            
            if (!this.pinNumbers.includes(this.setupPin)) {
                this.pinNumbers.push(this.setupPin);
            }
            
            this.showNotification('PIN set successfully. You can now order a card with this PIN.', 'success');
            this.setupPin = '';
            this.confirmPin = '';
        },
        
        handleCreateAccount() {
            const createAccountBtn = document.getElementById('create-account-btn');
            if (createAccountBtn && createAccountBtn.disabled) {
                this.showNotification(`You have reached the maximum number of accounts (${Config.maxAccounts}). Please delete an account before creating a new one.`, 'error');
                return;
            }
            
            const accountName = document.getElementById('new-account-name').value;
            const depositAmount = parseFloat(document.getElementById('new-account-deposit').value) || 0;
            
            const playerCitizenId = this.playerData.citizenid;
            const playerSharedAccounts = this.accounts.filter(account => 
                account.account_type === 'shared' && 
                account.citizenid === playerCitizenId
            );
            
            if (playerSharedAccounts.length >= Config.maxAccounts) {
                this.showNotification(`You have reached the maximum number of accounts (${Config.maxAccounts}). Please delete an account before creating a new one.`, 'error');
                return;
            }
            
            if (!accountName || accountName.trim() === '') {
                this.showNotification('Please enter a valid account name', 'error');
                return;
            }
            
            const accountExists = this.accounts.some(account => account.account_name.toLowerCase() === accountName.toLowerCase());
            if (accountExists) {
                this.showNotification('An account with this name already exists', 'error');
                return;
            }

            if (isNaN(depositAmount) || depositAmount < 0) {
                this.showNotification('Please enter a valid initial deposit amount', 'error');
                return;
            }

            this.sendData('openAccount', {
                accountName: accountName,
                amount: depositAmount
            });
            
            document.getElementById('new-account-name').value = '';
            document.getElementById('new-account-deposit').value = '0';
            this.newAccountName = '';
            this.newAccountDeposit = 0;
        },
        
        handleAddUser() {
            if (!this.manageAccount || !this.addUserCitizenId) {
                this.showNotification('Please fill all fields', 'error');
                return;
            }

            this.sendData('addUser', {
                accountName: this.manageAccount,
                targetCitizenId: this.addUserCitizenId
            });
            
            this.addUserCitizenId = '';
        },
        
        handlePinKeyPress(key) {
            if (key === 'clear') {
                this.atmPinInput = '';
                this.updatePinDisplay();
            } else if (key === 'enter') {
                this.verifyPin(this.atmPinInput);
            } else {
                if (this.atmPinInput.length < 4) {
                    this.atmPinInput += key;
                    this.updatePinDisplay();
                }
            }
        },
        
        updatePinDisplay() {
            
            let display = '';
            for (let i = 0; i < 4; i++) {
                if (i < this.atmPinInput.length) {
                    display += '•';
                } else {
                    display += ' ';
                }
            }
            this.atmPinDisplay = display;
        },
        
        verifyPin(pin) {
            if (!pin || pin.length !== 4) {
                this.showNotification('Please enter a 4-digit PIN', 'error');
                this.atmPinInput = '';
                this.updatePinDisplay();
                return;
            }
            
            console.log('Verifying PIN:', pin);
            console.log('Available PINs:', this.pinNumbers);
            
            const pinExists = this.pinNumbers.some(savedPin => String(savedPin) === String(pin));
            
            if (pinExists) {
                this.showNotification('PIN accepted', 'success');
                
                setTimeout(() => {
                    document.getElementById('atm-pin-section').style.display = 'none';
                    document.getElementById('atm-main-section').style.display = 'block';
                    this.updateATMAccounts();
                }, 500);
            } else {
                this.showNotification('Invalid PIN', 'error');
                this.atmPinInput = '';
                this.updatePinDisplay();
            }
        },
        
        selectATMAccount(accountName) {
            this.atmSelectedAccount = accountName;
            document.querySelectorAll('.atm-account').forEach(acc => {
                acc.classList.remove('selected');
            });
            document.querySelector(`.atm-account[data-account="${accountName}"]`).classList.add('selected');
            
            const account = this.accounts.find(acc => acc.account_name === accountName);
            if (account) {
                document.getElementById('atm-account-name').textContent = account.account_name;
                document.getElementById('atm-account-balance').textContent = '$' + this.formatMoney(account.account_balance);
            }
        },
        
        updateATMAccounts() {
            const atmAccounts = document.getElementById('atm-accounts');
            atmAccounts.innerHTML = '';

            if (!this.accounts.length) {
                atmAccounts.innerHTML = '<p>No accounts available.</p>';
                document.getElementById('atm-account-name').textContent = 'None';
                document.getElementById('atm-account-balance').textContent = '$0.00';
                return;
            }

            this.accounts.forEach(account => {
                const accountItem = document.createElement('div');
                accountItem.className = 'atm-account';
                accountItem.setAttribute('data-account', account.account_name);
                accountItem.innerHTML = `
                    <div class="account-name">${account.account_name}</div>
                    <div class="account-balance">$${this.formatMoney(account.account_balance)}</div>
                `;
                
                accountItem.addEventListener('click', () => {
                    this.selectATMAccount(account.account_name);
                });
                
                atmAccounts.appendChild(accountItem);
            });

            if (this.accounts.length > 0) {
                const firstAccount = atmAccounts.querySelector('.atm-account');
                if (firstAccount) {
                    firstAccount.classList.add('selected');
                    this.atmSelectedAccount = this.accounts[0].account_name;
                    document.getElementById('atm-account-name').textContent = this.accounts[0].account_name;
                    document.getElementById('atm-account-balance').textContent = '$' + this.formatMoney(this.accounts[0].account_balance);
                }
            }
        },
        
        handleATMWithdraw() {
            if (!this.atmSelectedAccount) {
                this.showNotification('Please select an account', 'error');
                return;
            }

            const amount = parseFloat(this.atmWithdrawAmount);
            
            if (isNaN(amount) || amount <= 0) {
                this.showNotification('Please enter a valid amount', 'error');
                return;
            }

            const selectedAccount = this.accounts.find(acc => acc.account_name === this.atmSelectedAccount);
            if (!selectedAccount) {
                this.showNotification('Account not found', 'error');
                return;
            }

            if (amount > selectedAccount.account_balance) {
                this.showNotification('Insufficient funds', 'error');
                return;
            }

            this.sendData('withdraw', {
                accountName: this.atmSelectedAccount,
                amount: amount,
                isATM: true
            });
            
            this.atmWithdrawAmount = 0;
        },
        
        handleATMDeposit() {
            if (!this.atmSelectedAccount) {
                this.showNotification('Please select an account', 'error');
                return;
            }

            const amount = parseFloat(this.atmDepositAmount);
            
            if (isNaN(amount) || amount <= 0) {
                this.showNotification('Please enter a valid amount', 'error');
                return;
            }

            this.sendData('deposit', {
                accountName: this.atmSelectedAccount,
                amount: amount,
                isATM: true
            });
            
            this.atmDepositAmount = 0;
        },
        
        sendData(action, data) {
            fetch(`https://qb-bankingv2/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(response => {
                if (response && response.success) {
                    this.showNotification(response.message || 'Operation successful', 'success');

                    if (action === 'setATMPin' && data.pin) {

                        const pinAsString = String(data.pin);
                        if (!this.pinNumbers.includes(pinAsString)) {
                            this.pinNumbers.push(pinAsString);
                            console.log('PIN added to pinNumbers array after server response:', pinAsString);
                            console.log('Current PINs:', this.pinNumbers);
                        }
                    }

                    if (action === 'deposit' || action === 'withdraw' || action === 'internalTransfer' || 
                        action === 'externalTransfer' || action === 'openAccount') {
                        fetch('https://qb-bankingv2/refreshAccounts', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({})
                        })
                        .then(() => {
                            this.refreshStatements();
                        });
                    }
                } else if (response && response.message) {

                    let errorMessage = response.message;
                    
                    if (action === 'openAccount' && response.message === 'Max accounts created') {
                        errorMessage = `You have reached the maximum number of accounts (${Config.maxAccounts || 2}). Please delete an account before creating a new one.`;
                    }
                    
                    this.showNotification(errorMessage, 'error');
                }
            })
            .catch(error => {
                this.showNotification('Failed to communicate with the server', 'error');
                console.error('Error:', error);
            });
        },
        
        formatMoney(amount) {
            if (amount === null || amount === undefined || isNaN(amount)) {
                return '0.00';
            }
            return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        
        formatAccountType(type) {
            if (type === 'personal') return 'Personal Account';
            if (type === 'shared') return 'Shared Account';
            if (type === 'job') return 'Job Account';
            if (type === 'gang') return 'Gang Account';
            return type.charAt(0).toUpperCase() + type.slice(1);
        },
        
        formatDate(dateString) {
            if (!dateString) return 'Unknown date';
            
            try {
                let date;
                
                if (typeof dateString === 'number') {

                    date = new Date(dateString);
                } else if (typeof dateString === 'string') {
                    if (dateString.includes('T') || dateString.includes('-')) {

                        date = new Date(dateString);
                    } else if (!isNaN(dateString)) {
                    } else {
                        date = new Date(dateString);
                    }
                } else {

                    date = new Date(dateString);
                }

                if (isNaN(date.getTime())) {
                    console.log('Invalid date:', dateString);
                    return 'Unknown date';
                }
                
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            } catch (error) {
                console.error('Error formatting date:', error, dateString);
                return 'Unknown date';
            }
        },
        
        showNotification(message, type) {
            const notification = {
                id: Date.now(),
                message,
                type
            };
            
            this.notifications.push(notification);
            
            setTimeout(() => {
                this.notifications = this.notifications.filter(n => n.id !== notification.id);
            }, 3000);
        },

        updateUI() {
            this.updatePlayerInfo();

            this.updateAccountsList();

            this.updateStatementsList();

            this.updateDropdowns();
            
            const statementAccount = document.getElementById('statement-account');
            if (statementAccount) {
                statementAccount.addEventListener('change', () => {
                    this.updateStatementsList();
                });
            }

            const playerCitizenId = this.playerData.citizenid;
            const playerSharedAccounts = this.accounts.filter(account => 
                account.account_type === 'shared' && 
                account.citizenid === playerCitizenId
            );

            const createAccountBtn = document.getElementById('create-account-btn');
            if (createAccountBtn) {
                if (playerSharedAccounts.length >= Config.maxAccounts) {
                    createAccountBtn.disabled = true;
                    createAccountBtn.classList.add('disabled');
                    createAccountBtn.title = `Maximum number of accounts (${Config.maxAccounts}) reached`;
                } else {
                    createAccountBtn.disabled = false;
                    createAccountBtn.classList.remove('disabled');
                    createAccountBtn.title = '';
                }
            }
        },

        updatePlayerInfo() {

            let playerName = 'Unknown';
            if (this.playerData && this.playerData.charinfo) {
                playerName = `${this.playerData.charinfo.firstname} ${this.playerData.charinfo.lastname}`;
            } else if (this.playerData && this.playerData.name) {
                playerName = this.playerData.name;
            }
            
            let citizenId = 'Unknown';
            if (this.playerData && this.playerData.citizenid) {
                citizenId = this.playerData.citizenid;
            }

            document.getElementById('player-name').textContent = playerName;
            document.getElementById('player-citizenid').textContent = citizenId;
        },
        
        updateAccountsList() {
            const accountsList = document.getElementById('accounts-list');
            accountsList.innerHTML = '';

            if (!this.accounts.length) {
                accountsList.innerHTML = '<p>No accounts available.</p>';
                return;
            }

            this.accounts.forEach(account => {
                const accountCard = document.createElement('div');
                accountCard.className = 'account-card';

                const accountType = this.formatAccountType(account.account_type);
                
                const displayName = account.account_name.length > 15 
                    ? account.account_name.substring(0, 15) + '...' 
                    : account.account_name;
                
                accountCard.innerHTML = `
                    <div class="account-info">
                        <div class="account-type">${accountType}</div>
                        <div class="account-name">${displayName}</div>
                        <div class="account-balance">$${this.formatMoney(account.account_balance)}</div>
                        <div class="account-number">Account : ${account.account_name}</div>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn deposit-btn" data-account="${account.account_name}">
                            <i class="fas fa-arrow-down"></i> Deposit
                        </button>
                        <button class="action-btn withdraw-btn" data-account="${account.account_name}">
                            <i class="fas fa-arrow-up"></i> Withdraw
                        </button>
                    </div>
                `;
                accountsList.appendChild(accountCard);
                
                const depositBtn = accountCard.querySelector('.deposit-btn');
                const withdrawBtn = accountCard.querySelector('.withdraw-btn');
                
                depositBtn.addEventListener('click', () => {
                    this.depositAccount = account.account_name;
                    this.openModal('deposit-modal');
                });
                
                withdrawBtn.addEventListener('click', () => {
                    this.withdrawAccount = account.account_name;
                    this.openModal('withdraw-modal');
                });
            });

            const existingNewAccountBtns = document.querySelectorAll('.new-account-btn');
            existingNewAccountBtns.forEach(btn => btn.remove());

            const playerCitizenId = this.playerData.citizenid;
            const playerSharedAccounts = this.accounts.filter(account => 
                account.account_type === 'shared' && 
                account.citizenid === playerCitizenId
            );

            if (playerSharedAccounts.length < Config.maxAccounts) {
                const newAccountBtn = document.createElement('button');
                newAccountBtn.className = 'new-account-btn';
                newAccountBtn.innerHTML = '<i class="fas fa-plus"></i> New Account';
                newAccountBtn.addEventListener('click', () => this.switchTab('settings'));
                accountsList.parentNode.appendChild(newAccountBtn);
            } else {

                const newAccountBtn = document.createElement('button');
                newAccountBtn.className = 'new-account-btn disabled';
                newAccountBtn.innerHTML = '<i class="fas fa-plus"></i> New Account';
                newAccountBtn.title = `Maximum number of accounts (${Config.maxAccounts}) reached`;
                accountsList.parentNode.appendChild(newAccountBtn);
            }
        },
        
        updateStatementsList() {
            const statementsList = document.getElementById('statements-list');
            statementsList.innerHTML = '';

            console.log('Updating statements list, statements data:', this.statements);
            console.log('Selected account:', this.selectedAccount);

            if (!this.statements || Object.keys(this.statements).length === 0) {
                console.log('No statements available');
                statementsList.innerHTML = '<p>No statements available.</p>';
                return;
            }

            let statementsToShow = [];
            const selectedAccountName = this.selectedAccount ? this.selectedAccount.account_name : null;

            if (Array.isArray(this.statements)) {
                console.log('Statements is an array, using directly');
                statementsToShow = this.statements;
            } else if (selectedAccountName && this.statements[selectedAccountName] && this.statements[selectedAccountName].length > 0) {
                console.log(`Using statements for selected account: ${selectedAccountName}`);
                statementsToShow = this.statements[selectedAccountName];
            } else {

                for (const accountName in this.statements) {
                    if (this.statements[accountName] && this.statements[accountName].length > 0) {
                        console.log(`Using statements for first available account: ${accountName}`);
                        statementsToShow = this.statements[accountName];
                        break;
                    }
                }
            }

            console.log('Statements to show:', statementsToShow);

            if (statementsToShow.length === 0) {
                statementsList.innerHTML = '<p>No statements available for this account.</p>';
                return;
            }

            statementsToShow.sort((a, b) => {

                let dateA, dateB;
                
                try {
                    dateA = new Date(a.date);
                    dateB = new Date(b.date);

                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        return dateB - dateA;
                    }
                } catch (error) {
                    console.error('Error sorting dates:', error);
                }

                return 0;
            });

            statementsToShow.forEach(statement => {
                console.log('Processing statement:', statement);
                
                const statementItem = document.createElement('div');
                statementItem.className = 'statement-item';
                
                let type = 'Unknown';
                let amountClass = '';
                
                console.log('Statement type:', statement.type, 'Statement statement_type:', statement.statement_type);

                const statementType = statement.statement_type || statement.type;
                
                if (statementType === 'deposit') {
                    type = 'Deposit';
                    amountClass = 'deposit';
                } else if (statementType === 'withdraw') {
                    type = 'Withdrawal';
                    amountClass = 'withdraw';
                } else if (statementType === 'transfer') {
                    type = `Transfer to ${statement.receiver || 'Unknown'}`;
                    amountClass = 'transfer';
                }

                if (statement.reason) {
                    type += ` - ${statement.reason}`;
                }
                
                console.log('Formatted type:', type, 'Amount class:', amountClass);
                console.log('Date string:', statement.date, 'Formatted date:', this.formatDate(statement.date));
                
                statementItem.innerHTML = `
                    <div class="statement-info">
                        <div class="statement-type">${type}</div>
                        <div class="statement-date">${this.formatDate(statement.date)}</div>
                    </div>
                    <div class="statement-amount ${amountClass}">$${this.formatMoney(statement.amount)}</div>
                `;
                
                statementsList.appendChild(statementItem);
            });
        },
        
        updateDropdowns() {
            const accountSelects = [
                'internal-from-account',
                'internal-to-account',
                'external-from-account',
                'statement-account',
                'card-account',
                'manage-account'
            ];

            accountSelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (!select) return;
                
                select.innerHTML = '';

                this.accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.account_name;
                    option.textContent = `${account.account_name} - $${this.formatMoney(account.account_balance)}`;
                    select.appendChild(option);
                });

                if (selectId === 'statement-account' && select.options.length > 0) {
                    this.selectedAccount = this.accounts[0];
                }
            });

            const internalToAccount = document.getElementById('internal-to-account');
            if (internalToAccount && internalToAccount.options.length > 1) {
                internalToAccount.selectedIndex = 1;
            }
        },
        
        refreshStatements() {
            fetch('https://qb-bankingv2/getStatements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
        },
        
        setupInputEventListeners() {
            const inputMappings = {
                'new-account-name': 'newAccountName',
                'new-account-deposit': 'newAccountDeposit',
                'card-pin': 'cardPin',
                'card-account': 'cardAccount',
                'setup-pin': 'setupPin',
                'confirm-pin': 'confirmPin',
            };
            
            Object.entries(inputMappings).forEach(([inputId, vueProperty]) => {
                const inputElement = document.getElementById(inputId);
                if (inputElement) {
                    inputElement.addEventListener('input', (event) => {
                        this[vueProperty] = event.target.value;
                        console.log(`Updated ${vueProperty} to:`, this[vueProperty]);
                    });
                }
            });
        }
    },
    mounted() {
        window.addEventListener('message', (event) => {
            const data = event.data;

            if (data.action === 'openBank') {
                this.isATM = false;
                this.accounts = data.accounts || [];
                this.statements = data.statements || {};
                this.playerData = data.playerData || {};
                this.pinNumbers = data.pinNumbers || [];

                this.updatePlayerInfo();
                
                console.log('Received statements:', this.statements);
                document.getElementById('banking-container').style.display = 'flex';
                document.getElementById('atm-container').style.display = 'none';
                this.updateUI();
                this.isBankOpen = true;

                this.setupInputEventListeners();
            } else if (data.action === 'openATM') {
                this.isATM = true;
                this.accounts = data.accounts || [];
                this.playerData = data.playerData || {};
                this.pinNumbers = data.pinNumbers || [];

                console.log('Received PIN numbers:', this.pinNumbers);

                this.updatePlayerInfo();
                
                document.getElementById('banking-container').style.display = 'none';
                document.getElementById('atm-container').style.display = 'flex';
                document.getElementById('atm-pin-section').style.display = 'flex';
                document.getElementById('atm-main-section').style.display = 'none';
                this.atmPinInput = '';
            } else if (data.action === 'closeApp') {

                document.getElementById('banking-container').style.display = 'none';
                document.getElementById('atm-container').style.display = 'none';
                document.getElementById('modal-container').style.display = 'none';
                this.isBankOpen = false;
                this.isATM = false;
                
                this.playerData = {};
                document.getElementById('player-name').textContent = 'Unknown';
                document.getElementById('player-citizenid').textContent = 'Unknown';

                this.resetAllInputs();
            } else if (data.action === 'refreshAccounts') {
                this.accounts = data.accounts || [];
                this.updateAccountsList();
                this.updateDropdowns();
                if (this.isATM) {
                    this.updateATMAccounts();
                }
            } else if (data.action === 'refreshStatements') {
                this.statements = data.statements || {};
                this.updateStatementsList();
            } else if (data.action === 'refreshPlayerData') {

                this.playerData = data.playerData || {};
                this.updatePlayerInfo();
            } else if (data.action === 'getStatements') {

                this.statements = data.statements || {};
                this.updateStatementsList();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeApp();
            }
        });

        document.addEventListener('DOMContentLoaded', () => {

            document.getElementById('banking-container').style.display = 'none';
            document.getElementById('atm-container').style.display = 'none';

            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const tabId = item.getAttribute('data-tab');
                    this.switchTab(tabId);
                });
            });

            document.getElementById('close-app').addEventListener('click', () => this.closeApp());
            document.getElementById('close-atm').addEventListener('click', () => this.closeApp());

            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => this.closeModal());
            });

            document.getElementById('internal-transfer-btn').addEventListener('click', () => this.handleInternalTransfer());
            document.getElementById('external-transfer-btn').addEventListener('click', () => this.handleExternalTransfer());

            document.getElementById('order-card-btn').addEventListener('click', () => {
                const cardPin = document.getElementById('card-pin').value;
                const cardAccount = document.getElementById('card-account').value;
                
                if (!cardAccount || !cardPin || cardPin.length !== 4 || isNaN(cardPin)) {
                    this.showNotification('Please enter a valid 4-digit PIN', 'error');
                    return;
                }

                console.log('Checking PIN:', cardPin);
                console.log('Available PINs:', this.pinNumbers);

                const pinExists = this.pinNumbers.some(pin => String(pin) === String(cardPin));
                
                if (!pinExists) {
                    this.showNotification('You must first set this PIN using the "Set or Update ATM PIN" section before ordering a card', 'error');
                    return;
                }
                
                this.sendData('orderCard', {
                    accountName: cardAccount,
                    cardPin: cardPin
                });
                
                this.showNotification('Card ordered successfully. You can now use this PIN at ATMs.', 'success');
                document.getElementById('card-pin').value = '';
            });

            document.getElementById('setup-pin-btn').addEventListener('click', () => {
                const setupPin = document.getElementById('setup-pin').value;
                const confirmPin = document.getElementById('confirm-pin').value;
                
                if (!setupPin || setupPin.length !== 4 || isNaN(setupPin)) {
                    this.showNotification('Please enter a valid 4-digit PIN', 'error');
                    return;
                }
                
                if (setupPin !== confirmPin) {
                    this.showNotification('PINs do not match', 'error');
                    return;
                }

                this.sendData('setATMPin', {
                    pin: setupPin
                });

                const pinAsString = String(setupPin);
                if (!this.pinNumbers.includes(pinAsString)) {
                    this.pinNumbers.push(pinAsString);
                    console.log('PIN added to pinNumbers array:', pinAsString);
                    console.log('Current PINs:', this.pinNumbers);
                }
                
                this.showNotification('PIN set successfully. You can now order a card with this PIN.', 'success');
                document.getElementById('setup-pin').value = '';
                document.getElementById('confirm-pin').value = '';
            });
            
            document.getElementById('create-account-btn').addEventListener('click', () => this.handleCreateAccount());
            document.getElementById('add-user-btn').addEventListener('click', () => this.handleAddUser());

            document.querySelectorAll('.pin-key').forEach(key => {
                key.addEventListener('click', () => this.handlePinKeyPress(key.getAttribute('data-key')));
            });

            document.getElementById('atm-withdraw-btn').addEventListener('click', () => this.handleATMWithdraw());
            document.getElementById('atm-deposit-btn').addEventListener('click', () => this.handleATMDeposit());
        });
    }
}).mount('#app'); 