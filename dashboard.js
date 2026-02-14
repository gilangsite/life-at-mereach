/* ============================================
   MEREACH Dashboard — JavaScript
   Uses JSONP to bypass CORS for Google Apps Script
   ============================================ */

// ========== CONFIG ==========
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzun7ybIGPcN4sR71saLloMp9QwA22kGX1py-C4f5dUfTWGfBjPyqQ30lkDk8uhly7vaA/exec';
const REFRESH_INTERVAL = 30000; // 30 seconds

// ========== STATE ==========
const dashState = {
    partnerData: [],
    temanData: [],
    activeTab: 'partner',
    chart: null,
    chartDateFrom: null,
    chartDateTo: null,
    refreshTimer: null,
    searchQuery: ''
};

// ========== JSONP HELPER ==========
// Google Apps Script blocks fetch() due to CORS redirects.
// JSONP injects a <script> tag instead, which bypasses CORS entirely.
let jsonpCounter = 0;

function callScript(params) {
    return new Promise((resolve, reject) => {
        const callbackName = '__mereach_cb_' + (++jsonpCounter) + '_' + Date.now();

        // Build URL safely (handle existing ? in SCRIPT_URL)
        const query = Object.entries(params)
            .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
            .join('&');

        const separator = SCRIPT_URL.includes('?') ? '&' : '?';
        const url = SCRIPT_URL + separator + query + '&callback=' + callbackName;

        // Timeout after 20 seconds (GAS can be slow on cold starts)
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout: Server Google Apps Script tidak merespon dalam 20 detik. Coba refresh halaman.'));
        }, 20000);

        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
        }

        // Register callback
        window[callbackName] = function (data) {
            cleanup();
            resolve(data);
        };

        // Inject script tag
        const script = document.createElement('script');
        script.src = url;
        script.onerror = function () {
            cleanup();
            reject(new Error('Network error: Gagal menghubungi server. Pastikan URL Apps Script sudah benar dan dipublish sebagai Web App (Anyone).'));
        };
        document.head.appendChild(script);
    });
}

// ========== DOM REFERENCES ==========
const $ = id => document.getElementById(id);

const dom = {
    loginView: $('login-view'),
    dashboardView: $('dashboard-view'),
    loginForm: $('login-form'),
    loginEmail: $('login-email'),
    loginPassword: $('login-pass'),
    loginBtn: $('login-btn'),
    loginError: $('login-error'),
    topbarUser: $('topbar-user'),
    btnLogout: $('btn-logout'),

    totalPartner: $('total-partner'),
    totalTeman: $('total-teman'),
    totalPending: $('total-pending'),
    totalApproved: $('total-approved'),

    dateFrom: $('date-from'),
    dateTo: $('date-to'),
    btnFilterChart: $('btn-filter-chart'),
    btnResetChart: $('btn-reset-chart'),
    chartCanvas: $('registrant-chart'),

    tabPartner: $('tab-partner'),
    tabTeman: $('tab-teman'),
    tableHead: $('table-head'),
    tableBody: $('table-body'),
    tableEmpty: $('table-empty'),
    tableSearch: $('table-search'),
    tableCount: $('table-count'),
    tableUpdated: $('table-updated'),
    btnRefresh: $('btn-refresh'),

    toast: $('toast'),
    toastMessage: $('toast-message'),

    confirmOverlay: $('confirm-overlay'),
    confirmTitle: $('confirm-title'),
    confirmMessage: $('confirm-message'),
    confirmOk: $('confirm-ok'),
    confirmCancel: $('confirm-cancel')
};

// ========== AUTH MODULE ==========
function checkAuth() {
    const session = sessionStorage.getItem('mereach_team');
    if (session) {
        const user = JSON.parse(session);
        showDashboard(user.name);
        return true;
    }
    return false;
}

function showDashboard(name) {
    dom.loginView.style.display = 'none';
    dom.dashboardView.style.display = 'block';
    dom.topbarUser.textContent = name;
    loadAllData();
    startAutoRefresh();
}

function logout() {
    sessionStorage.removeItem('mereach_team');
    stopAutoRefresh();
    dom.dashboardView.style.display = 'none';
    dom.loginView.style.display = '';
    dom.loginError.textContent = '';
    dom.loginForm.reset();
}

dom.loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = dom.loginEmail.value.trim().toLowerCase();
    const passwordInput = dom.loginPassword.value;

    dom.loginBtn.disabled = true;
    dom.loginBtn.querySelector('.login-btn-text').style.display = 'none';
    dom.loginBtn.querySelector('.login-btn-loading').style.display = '';
    dom.loginError.textContent = '';

    // Simulate network delay for UX
    setTimeout(() => {
        const user = TEAM_MEMBERS.find(m => m.email === emailInput && m.password === passwordInput);

        if (user) {
            sessionStorage.setItem('mereach_team', JSON.stringify({ name: user.name, email: user.email }));
            showDashboard(user.name);
        } else {
            dom.loginError.textContent = 'Email atau password salah.';
        }

        dom.loginBtn.disabled = false;
        dom.loginBtn.querySelector('.login-btn-text').style.display = '';
        dom.loginBtn.querySelector('.login-btn-loading').style.display = 'none';
    }, 800);
});

dom.btnLogout?.addEventListener('click', logout);

// ========== DATA MODULE ==========
async function fetchData(action) {
    const result = await callScript({ action });
    if (result.status === 'success') return result.data;
    throw new Error(result.message);
}

async function loadAllData() {
    try {
        dom.btnRefresh.classList.add('spinning');
        const [partner, teman] = await Promise.all([
            fetchData('getPartnerData'),
            fetchData('getTemanData')
        ]);
        dashState.partnerData = partner;
        dashState.temanData = teman;

        updateSummaryCards();
        renderChart();
        renderTable();
        updateTimestamp();
    } catch (err) {
        console.error('Data load error:', err);
        showToast('Gagal memuat data: ' + err.message, 'error');
    } finally {
        dom.btnRefresh.classList.remove('spinning');
    }
}

function startAutoRefresh() {
    stopAutoRefresh();
    dashState.refreshTimer = setInterval(loadAllData, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (dashState.refreshTimer) {
        clearInterval(dashState.refreshTimer);
        dashState.refreshTimer = null;
    }
}

dom.btnRefresh?.addEventListener('click', loadAllData);

// ========== SUMMARY CARDS ==========
function updateSummaryCards() {
    const allData = [...dashState.partnerData, ...dashState.temanData];
    dom.totalPartner.textContent = dashState.partnerData.length;
    dom.totalTeman.textContent = dashState.temanData.length;

    const pending = allData.filter(d => !d.Status || d.Status === 'Waiting Approval').length;
    const approved = allData.filter(d => d.Status === 'Approved' || d.Status === 'Partner Active').length;
    dom.totalPending.textContent = pending;
    dom.totalApproved.textContent = approved;
}

// ========== CHART MODULE ==========
function renderChart() {
    const allData = [...dashState.partnerData.map(d => ({ ...d, _type: 'Partner' })),
    ...dashState.temanData.map(d => ({ ...d, _type: 'Teman' }))];

    // Parse dates
    const parsed = allData.map(d => ({
        ...d,
        _date: d.Timestamp ? new Date(d.Timestamp) : null
    })).filter(d => d._date && !isNaN(d._date));

    // Apply date filter
    let filtered = parsed;
    if (dashState.chartDateFrom) {
        filtered = filtered.filter(d => d._date >= new Date(dashState.chartDateFrom));
    }
    if (dashState.chartDateTo) {
        const to = new Date(dashState.chartDateTo);
        to.setHours(23, 59, 59);
        filtered = filtered.filter(d => d._date <= to);
    }

    // Group by date
    const partnerByDate = {};
    const temanByDate = {};

    filtered.forEach(d => {
        const dateKey = d._date.toISOString().split('T')[0];
        if (d._type === 'Partner') {
            partnerByDate[dateKey] = (partnerByDate[dateKey] || 0) + 1;
        } else {
            temanByDate[dateKey] = (temanByDate[dateKey] || 0) + 1;
        }
    });

    // Get all unique dates and sort
    const allDates = [...new Set([...Object.keys(partnerByDate), ...Object.keys(temanByDate)])].sort();

    // Cumulative data
    let partnerCum = 0;
    let temanCum = 0;
    const partnerPoints = [];
    const temanPoints = [];

    allDates.forEach(date => {
        partnerCum += partnerByDate[date] || 0;
        temanCum += temanByDate[date] || 0;
        partnerPoints.push({ x: date, y: partnerCum });
        temanPoints.push({ x: date, y: temanCum });
    });

    // Destroy existing chart
    if (dashState.chart) {
        dashState.chart.destroy();
    }

    const ctx = dom.chartCanvas.getContext('2d');

    dashState.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Partner MEREACH',
                    data: partnerPoints,
                    borderColor: '#ff751f',
                    backgroundColor: 'rgba(255, 117, 31, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: allDates.length > 30 ? 0 : 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#ff751f',
                },
                {
                    label: 'Teman MEREACH',
                    data: temanPoints,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: allDates.length > 30 ? 0 : 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#3B82F6',
                }
            ]
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
                    position: 'top',
                    labels: {
                        color: '#94A3B8',
                        font: { family: "'Inter', sans-serif", size: 12 },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 35, 50, 0.95)',
                    titleColor: '#F8FAFC',
                    bodyColor: '#94A3B8',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: "'Inter', sans-serif", weight: '600' },
                    bodyFont: { family: "'Inter', sans-serif" },
                    callbacks: {
                        title: function (tooltipItems) {
                            const date = new Date(tooltipItems[0].parsed.x || tooltipItems[0].label);
                            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    ticks: {
                        color: '#64748B',
                        font: { family: "'Inter', sans-serif", size: 11 },
                        maxTicksLimit: 10,
                        callback: function (val, idx) {
                            const label = this.getLabelForValue(val);
                            const d = new Date(label);
                            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                        }
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748B',
                        font: { family: "'Inter', sans-serif", size: 11 },
                        stepSize: 1
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                }
            }
        }
    });
}

// Chart filter events
dom.btnFilterChart?.addEventListener('click', () => {
    dashState.chartDateFrom = dom.dateFrom.value || null;
    dashState.chartDateTo = dom.dateTo.value || null;
    renderChart();
});

dom.btnResetChart?.addEventListener('click', () => {
    dashState.chartDateFrom = null;
    dashState.chartDateTo = null;
    dom.dateFrom.value = '';
    dom.dateTo.value = '';
    renderChart();
});

// ========== TABLE MODULE ==========
function renderTable() {
    const isPartner = dashState.activeTab === 'partner';
    const rawData = isPartner ? dashState.partnerData : dashState.temanData;

    // Search filter
    let data = rawData;
    if (dashState.searchQuery) {
        const q = dashState.searchQuery.toLowerCase();
        data = data.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(q)
            )
        );
    }

    // Sort by timestamp descending (newest first)
    data = [...data].sort((a, b) => {
        const da = new Date(a.Timestamp || 0);
        const db = new Date(b.Timestamp || 0);
        return db - da;
    });

    // Define visible columns
    const columns = isPartner
        ? ['Timestamp', 'Nama Lengkap', 'Email', 'WhatsApp', 'Usia', 'Domisili', 'Pekerjaan', 'Sumber Info', 'Status']
        : ['Timestamp', 'Nama Lengkap', 'Email', 'WhatsApp', 'Status'];

    // Render header
    dom.tableHead.innerHTML = `<tr>
        ${columns.map(col => `<th>${col}</th>`).join('')}
        <th>Aksi</th>
    </tr>`;

    // Render body
    if (data.length === 0) {
        dom.tableBody.innerHTML = '';
        dom.tableEmpty.style.display = '';
    } else {
        dom.tableEmpty.style.display = 'none';
        dom.tableBody.innerHTML = data.map(row => {
            const status = row.Status || 'Waiting Approval';
            const namaCol = isPartner ? (row['Nama Panggilan'] || row['Nama Lengkap']) : row['Nama Lengkap'];
            const email = row.Email || '';
            const whatsapp = row.WhatsApp || '';

            return `<tr>
                ${columns.map(col => {
                if (col === 'Timestamp') {
                    const d = new Date(row[col]);
                    return `<td>${isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>`;
                }
                if (col === 'Nama Lengkap') {
                    return `<td class="name-cell">${escapeHtml(row[col] || '-')}</td>`;
                }
                if (col === 'Email') {
                    return `<td class="email-cell">${escapeHtml(row[col] || '-')}</td>`;
                }
                if (col === 'Status') {
                    return `<td>
                            <select class="status-select" data-email="${escapeAttr(email)}" data-type="${dashState.activeTab}" onchange="handleStatusChange(this)">
                                <option value="Waiting Approval" ${status === 'Waiting Approval' ? 'selected' : ''}>Waiting</option>
                                <option value="Approved" ${status === 'Approved' ? 'selected' : ''}>Approved</option>
                                <option value="Partner Active" ${status === 'Partner Active' ? 'selected' : ''}>Active</option>
                                <option value="Suspended" ${status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                            </select>
                        </td>`;
                }
                return `<td>${escapeHtml(String(row[col] || '-'))}</td>`;
            }).join('')}
                <td>
                    <div class="action-buttons">
                        ${status !== 'Approved' && status !== 'Partner Active' ? `
                        <button class="action-btn btn-accept" onclick="handleAccept('${escapeAttr(email)}', '${escapeAttr(namaCol)}', '${dashState.activeTab}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Accept
                        </button>` : ''}
                        ${whatsapp ? `
                        <button class="action-btn btn-chat" onclick="handleChat('${escapeAttr(whatsapp)}', '${escapeAttr(namaCol)}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            Chat
                        </button>` : ''}
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    dom.tableCount.textContent = `${data.length} pendaftar`;
}

function getStatusClass(status) {
    switch (status) {
        case 'Waiting Approval': return 'status-waiting';
        case 'Approved': return 'status-approved';
        case 'Partner Active': return 'status-active';
        case 'Suspended': return 'status-suspended';
        default: return 'status-waiting';
    }
}

// Tab switching
dom.tabPartner?.addEventListener('click', () => switchTab('partner'));
dom.tabTeman?.addEventListener('click', () => switchTab('teman'));

function switchTab(tab) {
    dashState.activeTab = tab;
    dom.tabPartner.classList.toggle('active', tab === 'partner');
    dom.tabTeman.classList.toggle('active', tab === 'teman');
    renderTable();
}

// Search
dom.tableSearch?.addEventListener('input', (e) => {
    dashState.searchQuery = e.target.value;
    renderTable();
});

// ========== ACTION HANDLERS ==========

// Accept button — sends acceptance email via JSONP
function handleAccept(email, nama, type) {
    showConfirm(
        'Terima Pendaftar?',
        `Kirim email penerimaan ke <strong>${escapeHtml(nama)}</strong> (${escapeHtml(email)}) sebagai ${type === 'partner' ? 'Partner MEREACH' : 'Teman MEREACH'}?`,
        async () => {
            try {
                showToast('Mengirim email penerimaan...', 'info');
                const result = await callScript({
                    action: 'sendAcceptanceEmail',
                    sheetType: type,
                    email: email,
                    nama: nama
                });
                if (result.status === 'success') {
                    showToast(`Email berhasil dikirim ke ${nama}! Status diupdate.`, 'success');
                    await loadAllData();
                } else {
                    showToast('Gagal: ' + result.message, 'error');
                }
            } catch (err) {
                showToast('Koneksi gagal.', 'error');
                console.error(err);
            }
        }
    );
}

// Chat button — opens WhatsApp
function handleChat(whatsapp, nama) {
    // Normalize phone number
    let phone = whatsapp.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    if (!phone.startsWith('62')) phone = '62' + phone;

    const message = encodeURIComponent(`Halo ${nama}, saya dari Tim MEREACH. `);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

// Status change — via JSONP
async function handleStatusChange(selectEl) {
    const email = selectEl.dataset.email;
    const type = selectEl.dataset.type;
    const newStatus = selectEl.value;

    try {
        showToast('Mengupdate status...', 'info');
        const result = await callScript({
            action: 'updateStatus',
            sheetType: type,
            email: email,
            newStatus: newStatus
        });
        if (result.status === 'success') {
            showToast(`Status berhasil diupdate ke: ${newStatus}`, 'success');
            // Update local state
            const dataset = type === 'partner' ? dashState.partnerData : dashState.temanData;
            const item = dataset.find(d => String(d.Email).toLowerCase() === email.toLowerCase());
            if (item) item.Status = newStatus;
            updateSummaryCards();
        } else {
            showToast('Gagal: ' + result.message, 'error');
            await loadAllData(); // Refresh to restore correct state
        }
    } catch (err) {
        showToast('Koneksi gagal.', 'error');
        console.error(err);
    }
}

// ========== TOAST ==========
let toastTimeout = null;
function showToast(message, type = 'info') {
    dom.toastMessage.textContent = message;
    dom.toast.className = `toast ${type} show`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        dom.toast.classList.remove('show');
    }, 4000);
}

// ========== CONFIRM DIALOG ==========
let confirmCallback = null;

function showConfirm(title, message, onOk) {
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.innerHTML = message;
    dom.confirmOverlay.style.display = '';
    confirmCallback = onOk;
}

dom.confirmOk?.addEventListener('click', () => {
    dom.confirmOverlay.style.display = 'none';
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
});

dom.confirmCancel?.addEventListener('click', () => {
    dom.confirmOverlay.style.display = 'none';
    confirmCallback = null;
});

// ========== UTILITY ==========
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function updateTimestamp() {
    const now = new Date();
    dom.tableUpdated.textContent = `Terakhir diupdate: ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
