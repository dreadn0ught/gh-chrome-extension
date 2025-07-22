// Detect environment
const isChromeExt = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;


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

const GITHUB_CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // TODO: Replace with your GitHub OAuth App Client ID
const GITHUB_OAUTH_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo%20read:user%20codespace&redirect_uri=https://<EXTENSION_ID>.chromiumapp.org/`;

function showLoginButton() {
    workflowStatus.innerHTML = '';
    const loginDiv = document.getElementById('login-button');
    loginDiv.className = 'flex justify-center my-4';
    loginDiv.innerHTML = `<button id="github-login" class="login-btn bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">Login with GitHub</button>`;
    document.getElementById('github-login').addEventListener('click', () => {
        if (isChromeExt) {
            chrome.identity.launchWebAuthFlow({
                url: GITHUB_OAUTH_URL,
                interactive: true
            }, function (redirectUrl) {
                if (redirectUrl) {
                    // Extract code from redirectUrl
                    const codeMatch = redirectUrl.match(/[?&]code=([^&]+)/);
                    if (codeMatch) {
                        const code = codeMatch[1];
                        codespacesTitle.innerHTML = `<div class="text-center text-sm text-gray-700">OAuth code received: <span class="font-mono bg-gray-100 px-2 py-1 rounded">${code}</span><br>Exchange this code for an access token on your backend.</div>`;
                    }
                }
            });
        } else {
            window.open(GITHUB_OAUTH_URL, '_blank');
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

function fetchAndRender() {
    getToken(ghToken => {
        if (!ghToken) {
            showLoginButton();
            return;
        }
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
            // For each repo, fetch up to 10 latest workflow runs
            const workflowPromises = repos.map(repo => {
                const owner = repo.owner.login;
                const name = repo.name;
                return fetch(`https://api.github.com/repos/${owner}/${name}/actions/runs?per_page=10`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.workflow_runs && data.workflow_runs.length > 0) {
                            return data.workflow_runs.map(run => ({
                                repo: name,
                                owner,
                                name: run.name || run.workflow_id,
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
                const runs = allRuns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
                if (runs.length === 0) {
                    workflowStatus.innerHTML = '<div class="text-center text-gray-500">No workflow runs found.</div>';
                    return;
                }
                workflowStatus.innerHTML = runs.map(run => `
                    <div class="workflow flex items-center justify-between py-2 border-b last:border-b-0">
                        <a href="#" data-url="${run.url}" class="workflow-link text-blue-600 hover:underline font-medium">${run.name} <span class="text-xs text-gray-500">(${run.repo})</span></a>
                        <span class="status px-2 py-1 rounded text-xs font-semibold ${run.status === 'success' ? 'bg-green-500 text-white' : run.status === 'failure' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-white'}">${run.status}</span>
                    </div>
                `).join('');
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

function startAutoRefresh(intervalMs = 10000) {
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
