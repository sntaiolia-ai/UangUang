// Baris ini menghubungkan file ini ke Firebase
import { db, auth } from './firebase.js';

// --- STATE APLIKASI ---
let state = {
    activeMenu: 'dashboard',
    wallets: [
        { id: 1, name: 'Kantong Utama', balance: 5420000, icon: 'fa-wallet', color: 'bg-slate-900 text-white' },
        { id: 2, name: 'Tabungan Nikah', balance: 25000000, icon: 'fa-heart', color: 'bg-brand-lime text-brand-textDark font-bold' },
        { id: 3, name: 'Dana Darurat', balance: 3750000, icon: 'fa-shield-halved', color: 'bg-slate-100 text-slate-800' }
    ],
    transactions: [
        { id: 1, type: 'expense', amount: 85000, category: 'Makanan', note: 'Makan siang bareng istri', date: 'Hari ini, 12:40', wallet: 'Kantong Utama' },
        { id: 2, type: 'income', amount: 15000000, category: 'Gaji', note: 'Transferan bulanan', date: 'Kemarin, 08:00', wallet: 'Kantong Utama' },
        { id: 3, type: 'expense', amount: 250000, category: 'Transport', note: 'Bensin & Tol', date: '24 Jul, 17:30', wallet: 'Dana Darurat' }
    ],
    activeModal: null,
    deleteTarget: null
};

// --- FUNGSI FORMAT RUPIAH ---
const formatRp = (val) => {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
};

// --- FUNGSI GLOBAL (Dihubungkan ke Window agar Tombol HTML Berfungsi) ---
window.switchMenu = function(menuId) {
    state.activeMenu = menuId;
    render();
};

window.openModal = function(modalId) {
    state.activeModal = modalId;
    render();
};

window.closeModal = function() {
    state.activeModal = null;
    render();
};

window.saveWallet = function(e) {
    e.preventDefault();
    const name = document.getElementById('walletName').value;
    const balance = Number(document.getElementById('walletBalance').value);
    const icon = document.getElementById('walletIcon').value;
    const styleOpt = document.getElementById('walletStyle').value;

    let color = 'bg-slate-100 text-slate-800';
    if (styleOpt === 'dark') color = 'bg-slate-900 text-white';
    if (styleOpt === 'lime') color = 'bg-brand-lime text-brand-textDark font-bold';

    state.wallets.push({
        id: Date.now(),
        name,
        balance,
        icon,
        color
    });

    window.closeModal();
};

window.saveTransaction = function(e) {
    e.preventDefault();
    const type = document.getElementById('txType').value;
    const amount = Number(document.getElementById('txAmount').value);
    const category = document.getElementById('txCategory').value;
    const wallet = document.getElementById('txWallet').value;
    const note = document.getElementById('txNote').value;

    // Update saldo dompet lokal
    const targetWallet = state.wallets.find(w => w.name === wallet);
    if (targetWallet) {
        if (type === 'income') targetWallet.balance += amount;
        else targetWallet.balance -= amount;
    }

    state.transactions.unshift({
        id: Date.now(),
        type,
        amount,
        category,
        note,
        date: 'Baru saja',
        wallet
    });

    window.closeModal();
};

window.confirmDelete = function(type, id) {
    state.deleteTarget = { type, id };
    render();
};

window.closeDeleteModal = function() {
    state.deleteTarget = null;
    render();
};

window.executeConfirm = function() {
    if (!state.deleteTarget) return;
    const { type, id } = state.deleteTarget;

    if (type === 'wallet') {
        state.wallets = state.wallets.filter(w => w.id !== id);
    } else if (type === 'transaction') {
        const tx = state.transactions.find(t => t.id === id);
        if (tx) {
            const wallet = state.wallets.find(w => w.name === tx.wallet);
            if (wallet) {
                if (tx.type === 'income') wallet.balance -= tx.amount;
                else wallet.balance += tx.amount;
            }
        }
        state.transactions = state.transactions.filter(t => t.id !== id);
    }

    state.deleteTarget = null;
    render();
};

// --- UTILITY RENDERING TAMBAHAN ---
function getActiveWalletCount() { return state.wallets.length; }
function getTotalBalance() { return state.wallets.reduce((acc, w) => acc + w.balance, 0); }
function getTotalIncome() { return state.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0); }
function getTotalExpense() { return state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0); }

// --- RENDER ENGINE UTAMA ---
function render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    let content = '';
    if (state.activeMenu === 'dashboard') content = renderDashboard();
    else if (state.activeMenu === 'wallets') content = renderWalletsMenu();
    else if (state.activeMenu === 'transactions') content = renderTransactionsMenu();
    else content = renderPlaceholderView();

    root.innerHTML = `
        <div class="min-h-screen bg-brand-bgLight flex flex-col font-sans text-brand-textDark antialiased select-none pb-24 md:pb-6">
            ${renderHeader()}
            <main class="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
                ${content}
            </main>
            ${renderBottomNav()}
            ${renderModals()}
            ${renderDeleteModalWrapper()}
        </div>
    `;
}

// Semuanya fungsi visual di bawah ini diambil penuh dari prototipe lama Anda:
function renderHeader() {
    return `
        <header class="bg-white border-b border-brand-border sticky top-0 z-40 blur-bg bg-white/90">
            <div class="max-w-5xl w-full mx-auto px-4 h-16 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 bg-brand-lime rounded-xl flex items-center justify-center text-brand-textDark font-heading font-black text-lg shadow-sm tracking-tighter">B</div>
                    <div>
                        <h1 class="font-heading font-bold text-sm tracking-tight text-slate-900 leading-none mb-0.5">Budggt</h1>
                        <p class="text-[10px] text-brand-textMuted font-medium tracking-wide">Keluarga Yulian</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="hidden md:flex flex-col text-right">
                        <span class="text-xs font-semibold text-slate-800">Yulian & Pasangan</span>
                        <span class="text-[10px] text-brand-textMuted">Premium Members</span>
                    </div>
                    <div class="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 font-bold text-xs shadow-inner">YP</div>
                </div>
            </div>
        </header>
    `;
}

function renderBottomNav() {
    const navItems = [
        { id: 'dashboard', label: 'Ringkasan', icon: 'fa-chart-pie' },
        { id: 'wallets', label: 'Dompet', icon: 'fa-wallet' },
        { id: 'transactions', label: 'Transaksi', icon: 'fa-arrow-left-right' },
        { id: 'budget', label: 'Budget', icon: 'fa-bullseye' },
        { id: 'goals', label: 'Goals', icon: 'fa-heart' },
        { id: 'debts', label: 'Utang', icon: 'fa-hand-holding-dollar' }
    ];

    return `
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border px-2 py-2.5 z-40 flex justify-around md:static md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:justify-start md:gap-2 hidden">
            ${navItems.map(item => {
                const isActive = state.activeMenu === item.id;
                return `
                    <button 
                        onclick="switchMenu('${item.id}')"
                        class="flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${isActive ? 'text-brand-textDark font-bold bg-brand-limeLight/60' : 'text-brand-textMuted hover:text-slate-800'}"
                    >
                        <i class="fa-solid ${item.icon} text-base mb-1"></i>
                        <span class="text-[9px] tracking-tight font-sans">${item.label}</span>
                    </button>
                `;
            }).join('')}
        </nav>
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border px-2 py-2 z-40 flex justify-around shadow-lg md:max-w-md md:mx-auto md:bottom-4 md:rounded-2xl md:border">
            ${navItems.map(item => {
                const isActive = state.activeMenu === item.id;
                return `
                    <button 
                        onclick="switchMenu('${item.id}')"
                        class="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all flex-1 ${isActive ? 'text-brand-textDark font-bold bg-brand-limeLight' : 'text-brand-textMuted hover:text-slate-800'}"
                    >
                        <i class="fa-solid ${item.icon} text-sm mb-1"></i>
                        <span class="text-[9px] font-sans tracking-tight">${item.label}</span>
                    </button>
                `;
            }).join('')}
        </nav>
    `;
}

function renderDashboard() {
    return `
        <section class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-fade-in">
            <div class="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between col-span-2 md:col-span-1 min-h-[110px]">
                <span class="text-[11px] font-semibold text-brand-textMuted tracking-tight font-sans">Total Saldo Gabungan</span>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight mt-2 font-heading font-sans">${formatRp(getTotalBalance())}</h3>
                <span class="text-[9px] text-emerald-600 font-medium mt-2 flex items-center gap-1 font-sans">
                    <i class="fa-solid fa-circle-check"></i> Terorganisir di ${getActiveWalletCount()} Dompet
                </span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between min-h-[110px]">
                <span class="text-[11px] font-semibold text-brand-textMuted tracking-tight font-sans">Pemasukan Bulan Ini</span>
                <h3 class="text-xl font-bold text-emerald-600 tracking-tight mt-2 font-sans">${formatRp(getTotalIncome())}</h3>
                <span class="text-[9px] text-brand-textMuted mt-2 font-sans">Dari semua sumber</span>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between min-h-[110px]">
                <span class="text-[11px] font-semibold text-brand-textMuted tracking-tight font-sans">Pengeluaran Bulan Ini</span>
                <h3 class="text-xl font-bold text-rose-600 tracking-tight mt-2 font-sans">${formatRp(getTotalExpense())}</h3>
                <span class="text-[9px] text-brand-textMuted mt-2 font-sans">Alokasi tercatat</span>
            </div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
            <div class="md:col-span-1 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h2 class="font-heading font-extrabold text-sm tracking-tight text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-wallet text-brand-textMuted text-xs"></i> Struktur Dompet
                    </h2>
                    <button onclick="openModal('addWallet')" class="text-[11px] font-bold text-slate-900 hover:text-slate-700 bg-brand-limeLight px-2.5 py-1 rounded-lg transition-all font-sans">
                        + Dompet
                    </button>
                </div>
                <div class="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                    ${state.wallets.map(w => `
                        <div class="p-3.5 rounded-xl border border-brand-border shadow-sm flex items-center justify-between bg-white transition-all hover:border-slate-300">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-sm ${w.color}">
                                    <i class="fa-solid ${w.icon}"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-xs text-slate-900 leading-snug font-sans">${w.name}</h4>
                                    <p class="text-[11px] font-extrabold text-slate-800 mt-0.5 font-sans">${formatRp(w.balance)}</p>
                                </div>
                            </div>
                            <button onclick="confirmDelete('wallet', ${w.id})" class="text-slate-300 hover:text-rose-600 p-1.5 transition-all">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="md:col-span-2 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h2 class="font-heading font-extrabold text-sm tracking-tight text-slate-900 flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-brand-textMuted text-xs"></i> Arus Kas Terbaru
                    </h2>
                    <button onclick="openModal('addTransaction')" class="text-[11px] font-bold text-white hover:bg-slate-800 bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm transition-all font-sans">
                        + Catat Transaksi
                    </button>
                </div>
                <div class="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
                    <div class="divide-y divide-brand-border max-h-[400px] overflow-y-auto">
                        ${state.transactions.length === 0 ? `
                            <div class="p-8 text-center text-brand-textMuted text-xs font-sans">Belum ada mutasi keuangan masuk.</div>
                        ` : state.transactions.map(t => `
                            <div class="p-3.5 flex items-center justify-between transition-all hover:bg-slate-50/50">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                                        <i class="fa-solid ${t.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-1.5">
                                            <h4 class="font-bold text-xs text-slate-900 font-sans">${t.category}</h4>
                                            <span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium font-sans">${t.wallet}</span>
                                        </div>
                                        <p class="text-[10px] text-brand-textMuted mt-0.5 font-sans">${t.note || '-'}</p>
                                    </div>
                                </div>
                                <div class="text-right flex items-center gap-3">
                                    <div>
                                        <h4 class="font-bold text-xs font-sans ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}">
                                            ${t.type === 'income' ? '+' : '-'}${formatRp(t.amount)}
                                        </h4>
                                        <p class="text-[9px] text-brand-textMuted mt-0.5 font-sans">${t.date}</p>
                                    </div>
                                    <button onclick="confirmDelete('transaction', ${t.id})" class="text-slate-300 hover:text-rose-600 p-1.5 transition-all">
                                        <i class="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderWalletsMenu() {
    return `
        <div class="flex flex-col gap-4 animate-fade-in">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-heading font-extrabold text-base text-slate-900 font-sans">Manajemen Dompet</h2>
                    <p class="text-xs text-brand-textMuted font-sans">Kelola alokasi dana dan pisahkan berdasarkan kebutuhan.</p>
                </div>
                <button onclick="openModal('addWallet')" class="text-xs font-bold text-slate-900 bg-brand-lime px-3 py-2 rounded-xl shadow-sm hover:bg-brand-limeDark transition-all font-sans">
                    + Dompet Baru
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                ${state.wallets.map(w => `
                    <div class="bg-white p-5 rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between min-h-[140px] relative group hover:border-slate-300 transition-all">
                        <div class="flex items-start justify-between">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base shadow-sm ${w.color}">
                                <i class="fa-solid ${w.icon}"></i>
                            </div>
                            <button onclick="confirmDelete('wallet', ${w.id})" class="text-slate-300 hover:text-rose-600 p-1.5 transition-all">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                        <div class="mt-4">
                            <h4 class="font-bold text-sm text-slate-900 font-sans">${w.name}</h4>
                            <p class="text-lg font-black text-slate-900 tracking-tight mt-1 font-sans">${formatRp(w.balance)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderTransactionsMenu() {
    return `
        <div class="flex flex-col gap-4 animate-fade-in">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-heading font-extrabold text-base text-slate-900 font-sans">Riwayat Transaksi</h2>
                    <p class="text-xs text-brand-textMuted font-sans">Arus keluar masuk keuangan secara keseluruhan.</p>
                </div>
                <button onclick="openModal('addTransaction')" class="text-xs font-bold text-white bg-slate-900 px-3 py-2 rounded-xl shadow-sm hover:bg-slate-800 transition-all font-sans">
                    + Catat Transaksi
                </button>
            </div>
            <div class="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden mt-2">
                <div class="divide-y divide-brand-border">
                    ${state.transactions.length === 0 ? `
                        <div class="p-12 text-center text-brand-textMuted text-xs font-sans">Belum ada rekam transaksi terdaftar.</div>
                    ` : state.transactions.map(t => `
                        <div class="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                            <div class="flex items-center gap-4">
                                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                                    <i class="fa-solid ${t.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h4 class="font-bold text-xs text-slate-900 font-sans">${t.category}</h4>
                                        <span class="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium font-sans">${t.wallet}</span>
                                    </div>
                                    <p class="text-xs text-brand-textMuted mt-0.5 font-sans">${t.note || 'Tanpa catatan'}</p>
                                </div>
                            </div>
                            <div class="text-right flex items-center gap-4">
                                <div>
                                    <h4 class="font-bold text-xs font-sans ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}">
                                        ${t.type === 'income' ? '+' : '-'}${formatRp(t.amount)}
                                    </h4>
                                    <p class="text-[10px] text-brand-textMuted mt-0.5 font-sans">${t.date}</p>
                                </div>
                                <button onclick="confirmDelete('transaction', ${t.id})" class="text-slate-300 hover:text-rose-600 p-2 transition-all">
                                    <i class="fa-solid fa-trash-can text-xs"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderPlaceholderView() {
    return `
        <div class="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div class="w-16 h-16 bg-brand-limeLight rounded-full flex items-center justify-center text-2xl mb-4 text-brand-textDark shadow-sm">
                <i class="fa-solid fa-hourglass-half animate-pulse"></i>
            </div>
            <h2 class="font-heading font-bold text-xl mb-1 text-slate-900">Modul Sedang Dikembangkan</h2>
            <p class="text-brand-textMuted text-xs max-w-sm font-sans">
                Modul untuk menu <span class="font-bold text-brand-textDark capitalize font-sans">"${state.activeMenu}"</span> sedang dipersiapkan. Gunakan menu navigasi utama untuk mengelola aliran finansial Anda.
            </p>
        </div>
    `;
}

function renderModals() {
    if (!state.activeModal) return '';

    if (state.activeModal === 'addWallet') {
        return `
            <div class="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 blur-bg transition-all animate-fade-in">
                <div class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-brand-border animate-scale-in flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-heading font-extrabold text-sm text-slate-900">Buat Dompet Alokasi</h3>
                        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-sm p-1">✕</button>
                    </div>
                    <form onsubmit="saveWallet(event)" class="flex flex-col gap-3.5">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Nama Kantong Dompet</label>
                            <input id="walletName" type="text" required placeholder="Contoh: Belanja Bulanan" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Saldo Awal</label>
                            <input id="walletBalance" type="number" required placeholder="Rp 0" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Simbol Icon</label>
                                <select id="walletIcon" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans bg-white">
                                    <option value="fa-wallet">Dompet (Standard)</option>
                                    <option value="fa-heart">Kebutuhan Istri</option>
                                    <option value="fa-basket-shopping">Belanja Kebun</option>
                                    <option value="fa-car">Kendaraan</option>
                                    <option value="fa-shield-halved">Proteksi / Darurat</option>
                                </select>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Tema Visual</label>
                                <select id="walletStyle" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans bg-white">
                                    <option value="light">Minimalis Terang</option>
                                    <option value="dark">Elegan Gelap</option>
                                    <option value="lime">Aksen Lime Signature</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 font-bold py-2.5 text-xs text-white rounded-xl shadow-sm transition-all mt-2 font-sans">
                            Simpan Struktur Dompet
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    if (state.activeModal === 'addTransaction') {
        return `
            <div class="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 blur-bg transition-all animate-fade-in">
                <div class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-brand-border flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-heading font-extrabold text-sm text-slate-900">Catat Mutasi Keuangan</h3>
                        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-sm p-1">✕</button>
                    </div>
                    <form onsubmit="saveTransaction(event)" class="flex flex-col gap-3.5">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Jenis Aliran Dana</label>
                            <select id="txType" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans bg-white">
                                <option value="expense">Pengeluaran (Uang Keluar)</option>
                                <option value="income">Pemasukan (Uang Masuk)</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Jumlah Uang</label>
                                <input id="txAmount" type="number" required placeholder="Rp 0" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Kategori</label>
                                <select id="txCategory" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans bg-white">
                                    <option value="Makanan">Makanan & Minuman</option>
                                    <option value="Gaji">Pendapatan / Gaji</option>
                                    <option value="Belanja">Belanja / Kebutuhan</option>
                                    <option value="Transport">Transportasi & Tol</option>
                                    <option value="Hiburan">Hiburan & Santai</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Gunakan Sumber Dompet</label>
                            <select id="txWallet" class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans bg-white">
                                ${state.wallets.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-bold text-brand-textMuted uppercase font-sans">Catatan Singkat</label>
                            <input id="txNote" type="text" placeholder="Keterangan tambahan..." class="border border-brand-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans" />
                        </div>
                        <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 font-bold py-2.5 text-xs text-white rounded-xl shadow-sm transition-all mt-2 font-sans">
                            Rekam Mutasi Sekarang
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    return '';
}

function renderDeleteModalWrapper() {
    if (!state.deleteTarget) return '';

    return `
        <div class="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 blur-bg transition-all animate-fade-in">
            <div class="bg-white rounded-2xl max-w-xs w-full p-5 shadow-xl border border-brand-border text-center flex flex-col items-center gap-3">
                <div class="w-11 h-11 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-sm mb-1 shadow-inner">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                    <h3 class="font-heading font-extrabold text-sm text-slate-900">Hapus Data Ini?</h3>
                    <p class="text-[11px] text-brand-textMuted mt-1 font-sans">Tindakan ini permanen. Saldo terkait mungkin tidak dapat dikembalikan secara otomatis.</p>
                </div>
                <div class="flex gap-2 w-full mt-2">
                    <button 
                        onclick="closeDeleteModal()"
                        class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all focus:outline-none font-sans"
                    >
                        Batal
                    </button>
                    <button 
                        onclick="executeConfirm()"
                        class="flex-1 bg-red-600 hover:bg-red-700 font-bold py-2.5 rounded-xl text-xs text-white shadow-sm transition-all focus:outline-none font-sans"
                    >
                        Hapus Permanen
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Menjalankan render awal saat aplikasi dibuka
render();