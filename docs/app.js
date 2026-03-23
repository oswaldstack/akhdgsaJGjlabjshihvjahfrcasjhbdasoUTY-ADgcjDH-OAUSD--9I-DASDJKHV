// Admin Dashboard App Logic

let currentPage = 'dashboard';
let charts = {};

// Initialize app - called by config.js after loading credentials
function initializeApp() {
    setupNavigation();
    setupModals();
    setupAIQuizGeneration();
    loadDashboard();
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            switchPage(page);
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
}

function switchPage(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        quizzes: 'Manage Quizzes',
        users: 'Users',
        challenges: 'Challenges',
        prizes: 'Prizes',
        analytics: 'Analytics'
    };
    document.getElementById('pageTitle').textContent = titles[page];

    currentPage = page;

    // Load page data
    loadPageData(page);
}

async function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'quizzes':
            await loadQuizzes();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'challenges':
            await loadChallenges();
            break;
        case 'prizes':
            await loadPrizes();
            break;
        case 'analytics':
            await loadAnalytics();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        // Load stats
        const { data: users } = await supabase.from('users').select('id');
        const { data: quizzes } = await supabase.from('daily_quizzes').select('id');
        const { data: attempts } = await supabase.from('user_quiz_attempts').select('id');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: activeUsers } = await supabase
            .from('user_quiz_attempts')
            .select('user_id')
            .gte('completed_at', sevenDaysAgo.toISOString());

        document.getElementById('totalUsers').textContent = users?.length || 0;
        document.getElementById('totalQuizzes').textContent = quizzes?.length || 0;
        document.getElementById('totalAttempts').textContent = attempts?.length || 0;
        document.getElementById('activeUsers').textContent = new Set(activeUsers?.map(a => a.user_id)).size || 0;

        // Load charts
        await loadCharts();

        // Load recent attempts
        await loadRecentAttempts();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadCharts() {
    // Completion trend chart
    const ctx1 = document.getElementById('completionChart');
    if (charts.completion) charts.completion.destroy();

    const { data: attempts } = await supabase
        .from('user_quiz_attempts')
        .select('completed_at')
        .order('completed_at', { ascending: true })
        .limit(30);

    const dates = {};
    attempts?.forEach(a => {
        const date = new Date(a.completed_at).toLocaleDateString();
        dates[date] = (dates[date] || 0) + 1;
    });

    charts.completion = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: Object.keys(dates),
            datasets: [{
                label: 'Quiz Completions',
                data: Object.values(dates),
                borderColor: 'rgb(159, 0, 110)',
                backgroundColor: 'rgba(159, 0, 110, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Top users chart
    const ctx2 = document.getElementById('topUsersChart');
    if (charts.topUsers) charts.topUsers.destroy();

    const { data: topUsers } = await supabase
        .from('users')
        .select('display_name, total_points')
        .order('total_points', { ascending: false })
        .limit(10);

    charts.topUsers = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: topUsers?.map(u => u.display_name) || [],
            datasets: [{
                label: 'Points',
                data: topUsers?.map(u => u.total_points) || [],
                backgroundColor: 'rgb(240, 225, 0)',
                borderColor: 'rgb(159, 0, 110)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

async function loadRecentAttempts() {
    const { data: attempts } = await supabase
        .from('user_quiz_attempts')
        .select('*, users(display_name), daily_quizzes(quiz_date)')
        .order('completed_at', { ascending: false })
        .limit(10);

    const container = document.getElementById('recentAttempts');
    container.innerHTML = attempts?.map(a => `
        <div class="activity-item">
            <div>
                <strong>${a.users.display_name}</strong> completed quiz
                <span style="color: #666;">${new Date(a.daily_quizzes.quiz_date).toLocaleDateString()}</span>
            </div>
            <div>
                <span style="color: rgb(159, 0, 110); font-weight: bold;">${a.score}/${a.total_questions}</span>
                (${a.percentage.toFixed(0)}%)
            </div>
        </div>
    `).join('') || '<p>No recent attempts</p>';
}

// Quizzes Management
async function loadQuizzes() {
    const { data: quizzes } = await supabase
        .from('daily_quizzes')
        .select('*')
        .order('quiz_date', { ascending: false });

    const container = document.getElementById('quizzesList');
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Difficulty</th>
                    <th>Questions</th>
                    <th>Attempts</th>
                    <th>Avg Score</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${quizzes?.map(q => `
                    <tr>
                        <td>${new Date(q.quiz_date).toLocaleDateString()}</td>
                        <td><span class="badge">${q.difficulty}</span></td>
                        <td>${q.total_questions}</td>
                        <td>${q.total_attempts}</td>
                        <td>${q.average_score?.toFixed(1) || 0}%</td>
                        <td>
                            <button onclick="deleteQuiz('${q.id}')" class="btn-danger">Delete</button>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="6">No quizzes found</td></tr>'}
            </tbody>
        </table>
    `;
}

async function deleteQuiz(id) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
        await supabase.from('daily_quizzes').delete().eq('id', id);
        await loadQuizzes();
        alert('Quiz deleted successfully');
    } catch (error) {
        alert('Error deleting quiz: ' + error.message);
    }
}

// Users Management
async function loadUsers() {
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('total_points', { ascending: false });

    const container = document.getElementById('usersList');
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Points</th>
                    <th>Streak</th>
                    <th>Quizzes</th>
                    <th>Avg Score</th>
                    <th>Rank</th>
                </tr>
            </thead>
            <tbody>
                ${users?.map(u => `
                    <tr>
                        <td>${u.display_name}</td>
                        <td>${u.email}</td>
                        <td>${u.total_points}</td>
                        <td>🔥 ${u.current_streak}</td>
                        <td>${u.total_quizzes_completed}</td>
                        <td>${u.average_score?.toFixed(1) || 0}%</td>
                        <td>#${u.rank || '--'}</td>
                    </tr>
                `).join('') || '<tr><td colspan="7">No users found</td></tr>'}
            </tbody>
        </table>
    `;
}

// Challenges Management
async function loadChallenges() {
    const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

    const container = document.getElementById('challengesList');
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Target</th>
                    <th>Reward</th>
                    <th>Period</th>
                    <th>Active</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${challenges?.map(c => `
                    <tr>
                        <td>${c.title}</td>
                        <td>${c.challenge_type}</td>
                        <td>${c.target_value}</td>
                        <td>${c.reward_points} points</td>
                        <td>${new Date(c.start_date).toLocaleDateString()} - ${new Date(c.end_date).toLocaleDateString()}</td>
                        <td>${c.is_active ? '✅' : '❌'}</td>
                        <td>
                            <button onclick="toggleChallenge('${c.id}', ${!c.is_active})" class="btn-primary">
                                ${c.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="7">No challenges found</td></tr>'}
            </tbody>
        </table>
    `;
}

async function toggleChallenge(id, active) {
    try {
        await supabase.from('challenges').update({ is_active: active }).eq('id', id);
        await loadChallenges();
    } catch (error) {
        alert('Error updating challenge: ' + error.message);
    }
}

// Prizes Management
async function loadPrizes() {
    const { data: prizes } = await supabase
        .from('prizes')
        .select('*, users(display_name)')
        .order('created_at', { ascending: false });

    const container = document.getElementById('prizesList');
    container.innerHTML = prizes?.map(p => `
        <div class="prize-card">
            <h4>${p.title}</h4>
            <p>${p.description}</p>
            <p><strong>Type:</strong> ${p.prize_type}</p>
            <p><strong>Period:</strong> ${new Date(p.period_start).toLocaleDateString()} - ${new Date(p.period_end).toLocaleDateString()}</p>
            ${p.winner_user_id ? `<p><strong>Winner:</strong> ${p.users?.display_name}</p>` : '<p><em>No winner yet</em></p>'}
        </div>
    `).join('') || '<p>No prizes found</p>';
}

// Analytics
async function loadAnalytics() {
    // First completions
    const { data: firstCompletions } = await supabase
        .from('user_quiz_attempts')
        .select('*, users(display_name), daily_quizzes(quiz_date)')
        .eq('is_first_completion', true)
        .order('completed_at', { ascending: false })
        .limit(10);

    document.getElementById('firstCompletionsList').innerHTML = firstCompletions?.map(a => `
        <div class="analytics-item">
            <strong>${a.users.display_name}</strong> - ${new Date(a.daily_quizzes.quiz_date).toLocaleDateString()}
            <span>🏆 First!</span>
        </div>
    `).join('') || '<p>No data</p>';

    // Fastest completions
    const { data: fastest } = await supabase
        .from('user_quiz_attempts')
        .select('*, users(display_name)')
        .order('time_taken_seconds', { ascending: true })
        .limit(10);

    document.getElementById('fastestCompletionsList').innerHTML = fastest?.map(a => `
        <div class="analytics-item">
            <strong>${a.users.display_name}</strong>
            <span>⚡ ${Math.floor(a.time_taken_seconds / 60)}m ${a.time_taken_seconds % 60}s</span>
        </div>
    `).join('') || '<p>No data</p>';

    // Consistency leaders
    const { data: consistent } = await supabase
        .from('users')
        .select('display_name, current_streak, longest_streak')
        .order('longest_streak', { ascending: false })
        .limit(10);

    document.getElementById('consistencyList').innerHTML = consistent?.map(u => `
        <div class="analytics-item">
            <strong>${u.display_name}</strong>
            <span>🔥 ${u.longest_streak} days (Current: ${u.current_streak})</span>
        </div>
    `).join('') || '<p>No data</p>';
}

// Modals
function setupModals() {
    // Quiz modal
    const quizModal = document.getElementById('quizModal');
    document.getElementById('addQuizBtn').addEventListener('click', () => {
        quizModal.classList.add('active');
    });

    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    document.getElementById('quizForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createQuiz();
    });

    // Challenge modal
    const challengeModal = document.getElementById('challengeModal');
    document.getElementById('addChallengeBtn').addEventListener('click', () => {
        challengeModal.classList.add('active');
    });

    document.getElementById('challengeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createChallenge();
    });
}

async function createQuiz() {
    try {
        const questions = JSON.parse(document.getElementById('quizQuestions').value);

        const quizData = {
            quiz_date: document.getElementById('quizDate').value,
            difficulty: document.getElementById('quizDifficulty').value,
            questions: questions,
            total_questions: questions.length,
            points_per_question: 10
        };

        await supabase.from('daily_quizzes').insert(quizData);

        document.getElementById('quizModal').classList.remove('active');
        document.getElementById('quizForm').reset();
        await loadQuizzes();
        alert('Quiz created successfully!');
    } catch (error) {
        alert('Error creating quiz: ' + error.message);
    }
}

async function createChallenge() {
    try {
        const challengeData = {
            title: document.getElementById('challengeTitle').value,
            description: document.getElementById('challengeDescription').value,
            challenge_type: document.getElementById('challengeType').value,
            target_value: parseInt(document.getElementById('challengeTarget').value),
            reward_points: parseInt(document.getElementById('challengeReward').value),
            start_date: document.getElementById('challengeStart').value,
            end_date: document.getElementById('challengeEnd').value,
            is_active: true
        };

        await supabase.from('challenges').insert(challengeData);

        document.getElementById('challengeModal').classList.remove('active');
        document.getElementById('challengeForm').reset();
        await loadChallenges();
        alert('Challenge created successfully!');
    } catch (error) {
        alert('Error creating challenge: ' + error.message);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.reload();
    }
}
