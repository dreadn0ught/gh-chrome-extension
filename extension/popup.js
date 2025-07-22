// Detect environment
const isChromeExt = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;

// Number of workflow runs to show
const MAX_WORKFLOW_RUNS = 5;

// DOM elements (move to top so always defined)
const codespacesTitle = document.getElementById('codespaces-title');
const codespacesList = document.getElementById('codespaces-list');
const workflowStatus = document.getElementById('workflow-status');

// Storage abstraction
function setToken(token, cb) {
    if (isChromeExt) {
        chrome.storage.sync.set({ ghToken: token }, cb);
    } else {
        localStorage.setItem('ghToken', token);
        if (cb) cb();
    }
}

function removeToken(cb) {
    if (isChromeExt) {
        chrome.storage.sync.remove('ghToken', cb);
    } else {
        localStorage.removeItem('ghToken');
        if (cb) cb();
    }
}

function showTokenInput() {
    document.getElementById('login-button').style.display = '';
    document.getElementById('main-content').style.display = 'none';
    workflowStatus.innerHTML = '';
    codespacesList.innerHTML = '';
    codespacesTitle.innerHTML = '';
    const loginDiv = document.getElementById('login-button');
    loginDiv.className = 'flex flex-col items-center my-4';
    loginDiv.innerHTML = `
        <input id="pat-input" type="password" placeholder="Enter GitHub PAT" class="border rounded px-3 py-2 mb-2 w-full max-w-xs" />
        <button id="pat-save" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow w-full max-w-xs mb-2">Save Token</button>
        <div class="text-xs text-gray-500 mt-2 text-center w-full max-w-xs">Your token is stored locally and never shared.</div>
    `;
    document.getElementById('pat-save').addEventListener('click', () => {
        const token = document.getElementById('pat-input').value.trim();
        if (token) {
            setToken(token, fetchAndRender);
        }
    });
}

function getToken(cb) {
    if (isChromeExt) {
        chrome.storage.sync.get('ghToken', ({ ghToken }) => cb(ghToken));
    } else {
        cb(localStorage.getItem('ghToken'));
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            removeToken(() => {
                fetchAndRender();
            });
        });
    }
}

function fetchAndRender() {
    getToken(ghToken => {
        if (!ghToken) {
            showTokenInput();
            return;
        }
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('main-content').style.display = '';
        setupLogoutButton();
        fetchCodespaces(ghToken);
        fetchLatestWorkflows(ghToken);
    });
}

function fetchLatestWorkflows(token) {
    // Get all user repos (up to 100)
    fetch('https://api.github.com/user/repos?per_page=100', {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(repos => {
            if (!Array.isArray(repos) || repos.length === 0) {
                workflowStatus.innerHTML = '<div>No repositories found.</div>';
                return;
            }
            // For each repo, fetch up to 5 latest workflow runs
            const workflowPromises = repos.map(repo => {
                const owner = repo.owner.login;
                const name = repo.name;
                return fetch(`https://api.github.com/repos/${owner}/${name}/actions/runs?per_page=${MAX_WORKFLOW_RUNS}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.workflow_runs && data.workflow_runs.length > 0) {
                            return data.workflow_runs.map(run => ({
                                repo: name,
                                owner,
                                name: run.name || run.workflow_id,
                                workflow_name: run.workflow_name || run.name || '',
                                commit_message: run.head_commit && run.head_commit.message ? run.head_commit.message : '',
                                status: run.conclusion || run.status,
                                url: run.html_url,
                                created_at: run.created_at
                            }));
                        }
                        return [];
                    })
                    .catch(() => []);
            });

            Promise.all(workflowPromises).then(results => {
                const allRuns = results.flat();
                const runs = allRuns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, MAX_WORKFLOW_RUNS);
                if (runs.length === 0) {
                    workflowStatus.innerHTML = '<div class="text-center text-gray-500">No workflow runs found.</div>';
                    return;
                }
                workflowStatus.innerHTML = runs.map(run => {
                    const startedAgo = timeAgo(run.created_at);
                    let statusHtml;
                    if (run.status === 'in_progress') {
                        statusHtml = `<span class="status px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 bg-yellow-400 text-white">
            <svg class="animate-spin h-4 w-4 mr-1 inline-block" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            In Progress
        </span>`;
                    } else {
                        statusHtml = `<span class="status px-2 py-1 rounded text-xs font-semibold ${run.status === 'success' ? 'bg-green-500 text-white' : run.status === 'failure' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-white'}">${run.status}</span>`;
                    }
                    return `
    <div class="workflow flex flex-col py-2 border-b last:border-b-0">
        <div class="flex items-center justify-between">
            <a href="#" data-url="${run.url}" class="workflow-link text-blue-600 hover:underline font-medium">${run.name} <span class="text-xs text-gray-500">(${run.repo})</span></a>
            ${statusHtml}
        </div>
        <div class="text-xs text-gray-600 mt-1">Started: <span class="font-mono">${startedAgo}</span></div>
        <div class="text-xs text-gray-600 mt-1">Commit: <span class="font-mono">${run.commit_message || 'N/A'}</span></div>
    </div>
    `;
                }).join('');
                // Utility: time ago formatting
                function timeAgo(dateString) {
                    const now = new Date();
                    const then = new Date(dateString);
                    const seconds = Math.floor((now - then) / 1000);
                    if (seconds < 60) return `${seconds}s ago`;
                    const minutes = Math.floor(seconds / 60);
                    if (minutes < 60) return `${minutes}m ago`;
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) return `${hours}h ago`;
                    const days = Math.floor(hours / 24);
                    return `${days}d ago`;
                }
                document.querySelectorAll('.workflow-link').forEach(link => {
                    link.addEventListener('click', e => {
                        e.preventDefault();
                        openTab(link.dataset.url);
                    });
                });
            });
        })
        .catch(() => {
            workflowStatus.innerHTML = '<div>Error fetching repositories.</div>';
        });
}

function fetchCodespaces(token) {
    fetch('https://api.github.com/user/codespaces', {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            if (!data.codespaces || !Array.isArray(data.codespaces)) {
                codespacesList.innerHTML = '<div>No Codespaces found.</div>';
                return;
            }
            codespacesList.innerHTML = data.codespaces.map(cs => `
        <div class="codespace flex items-center justify-between py-2 border-b last:border-b-0">
          <a href="#" data-url="${cs.web_url}" class="codespace-link text-blue-600 hover:underline font-medium">${cs.name}</a>
          <span class="status px-2 py-1 rounded text-xs font-semibold ${cs.state === 'Available' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">${cs.state}</span>
        </div>
      `).join('');
            document.querySelectorAll('.codespace-link').forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    openTab(link.dataset.url);
                });
            });
        })
        .catch(() => {
            codespacesList.innerHTML = '<div>Error fetching Codespaces.</div>';
        });
}

function startAutoRefresh(intervalMs = 3000) {
    // Refresh every intervalMs milliseconds
    setInterval(fetchAndRender, intervalMs);
}

// Tab opening abstraction
function openTab(url) {
    if (isChromeExt) {
        chrome.runtime.sendMessage({ type: 'openTab', url });
    } else {
        window.open(url, '_blank');
    }
}

// Initial load
fetchAndRender();
startAutoRefresh();
