/* Study Tracker v2.1
 * Accurate timestamp-based timer + Pomodoro + analytics + heatmap + JSON backup + PWA.
 */
class StudyTracker {
    constructor() {
        this.defaultSettings = {
            theme: 'light',
            pomodoroWorkTime: 25,
            pomodoroBreakTime: 5,
            enableSoundEffects: true,
            subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature']
        };
        this.settings = { ...this.defaultSettings, subjects: [...this.defaultSettings.subjects] };
        this.sessions = [];
        this.goals = [];
        this.achievements = [];
        this.analyticsRange = 7;
        this.timerInterval = null;
        this.deferredInstallPrompt = null;
        this.currentSession = null;
        this.timer = this.createFreshTimer();
        this.motivationalMessages = [
            'Great job! Every focused minute counts. 🌟',
            'Keep going — consistency beats intensity. 💪',
            'Your future self will thank you for this session. ✨',
            'Amazing focus. Keep building the habit. 🎯',
            'One session at a time. You are making progress. 🚀'
        ];
        this.init();
    }

    createFreshTimer() {
        return {
            phase: 'work',
            isRunning: false,
            isPaused: false,
            isPomodoroMode: false,
            isPomodoroBreak: false,
            elapsedSeconds: 0,
            targetSeconds: 0,
            accumulatedSeconds: 0,
            startedAtMs: null,
            pausedAtMs: null,
            currentSubject: ''
        };
    }

    init() {
        this.loadData();
        this.setupDefaultAchievements();
        this.setupEventListeners();
        this.restoreTimerState();
        this.applyTheme();
        this.updateSubjectsList();
        this.updateGoalsList();
        this.updateAchievementsList();
        this.updateSettingsDisplay();
        this.updateAnalytics();
        this.updateDisplay();
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.updateOnlineStatus();
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
        window.addEventListener('beforeunload', () => this.persistTimerState());
    }

    /* ---------- Data ---------- */
    safeParse(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn(`Could not read ${key}`, error);
            return fallback;
        }
    }

    loadData() {
        const oldSessions = this.safeParse('study-sessions', []);
        const oldGoals = this.safeParse('study-goals', []);
        const oldAchievements = this.safeParse('study-achievements', []);
        const savedSettings = this.safeParse('study-settings', {});

        this.sessions = Array.isArray(oldSessions) ? oldSessions.map(this.normalizeSession.bind(this)).filter(Boolean) : [];
        this.goals = Array.isArray(oldGoals) ? oldGoals.filter(Boolean) : [];
        this.achievements = Array.isArray(oldAchievements) ? oldAchievements.filter(Boolean) : [];
        this.settings = {
            ...this.defaultSettings,
            ...(savedSettings && typeof savedSettings === 'object' ? savedSettings : {}),
            subjects: Array.from(new Set([
                ...this.defaultSettings.subjects,
                ...((savedSettings && Array.isArray(savedSettings.subjects)) ? savedSettings.subjects : [])
            ].map(value => String(value).trim()).filter(Boolean)))
        };
    }

    normalizeSession(session) {
        if (!session || typeof session !== 'object') return null;
        const duration = Number(session.duration);
        const startTime = new Date(session.startTime);
        if (!Number.isFinite(duration) || duration <= 0 || Number.isNaN(startTime.getTime())) return null;
        return {
            id: session.id || this.generateId(),
            subject: String(session.subject || 'Uncategorized'),
            startTime: startTime.toISOString(),
            endTime: session.endTime ? new Date(session.endTime).toISOString() : new Date(startTime.getTime() + duration * 1000).toISOString(),
            duration: Math.floor(duration),
            isPomodoroSession: Boolean(session.isPomodoroSession),
            pomodoroCompleted: Boolean(session.pomodoroCompleted)
        };
    }

    saveData() {
        try {
            localStorage.setItem('study-sessions', JSON.stringify(this.sessions));
            localStorage.setItem('study-goals', JSON.stringify(this.goals));
            localStorage.setItem('study-achievements', JSON.stringify(this.achievements));
            localStorage.setItem('study-settings', JSON.stringify(this.settings));
        } catch (error) {
            this.showToast('Storage error', 'Your browser could not save the latest data.', 'error');
        }
    }

    persistTimerState() {
        try {
            const state = {
                timer: this.timer,
                currentSession: this.currentSession
            };
            localStorage.setItem('study-timer-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Could not save timer state', error);
        }
    }

    restoreTimerState() {
        const saved = this.safeParse('study-timer-state', null);
        if (!saved || !saved.timer) return;
        const timer = saved.timer;
        const validPhase = timer.phase === 'work' || timer.phase === 'break';
        if (!validPhase) return;

        this.timer = { ...this.createFreshTimer(), ...timer };
        this.currentSession = saved.currentSession || null;
        if (!this.timer.isPomodoroMode) this.timer.isPomodoroBreak = false;
        if (this.timer.currentSession && !this.currentSession) this.currentSession = this.timer.currentSession;

        this.updateDisplay();
        if (this.timer.isRunning) {
            this.startTimerInterval();
            this.showToast('Timer restored', this.timer.phase === 'break' ? 'Your Pomodoro break is continuing.' : 'Your study timer is continuing.', 'success');
        }
    }

    resetStorageOnly() {
        ['study-sessions', 'study-goals', 'study-achievements', 'study-settings', 'study-timer-state'].forEach(key => localStorage.removeItem(key));
    }

    setupDefaultAchievements() {
        if (this.achievements.length > 0) return;
        this.achievements = [
            { id: 'first-steps', name: 'First Steps', description: 'Complete your first study session', type: 'milestone', icon: '🎯', progress: 0, total: 1, unlocked: false },
            { id: 'time-keeper', name: 'Time Keeper', description: 'Study for 10 hours total', type: 'milestone', icon: '⏰', progress: 0, total: 10, unlocked: false },
            { id: 'study-marathon', name: 'Study Marathon', description: 'Study for 50 hours total', type: 'milestone', icon: '🏃', progress: 0, total: 50, unlocked: false },
            { id: 'century-club', name: 'Century Club', description: 'Reach 100 hours of study time', type: 'milestone', icon: '💯', progress: 0, total: 100, unlocked: false },
            { id: 'pomodoro-pro', name: 'Pomodoro Pro', description: 'Complete 25 Pomodoro sessions', type: 'milestone', icon: '🍅', progress: 0, total: 25, unlocked: false },
            { id: 'early-bird', name: 'Early Bird', description: 'Complete 10 sessions between 5–9 AM', type: 'milestone', icon: '🐦', progress: 0, total: 10, unlocked: false },
            { id: 'streak-3', name: '3-Day Streak', description: 'Study for 3 consecutive days', type: 'streak', icon: '🔥', progress: 0, total: 3, unlocked: false },
            { id: 'streak-7', name: 'Week Warrior', description: 'Study for 7 consecutive days', type: 'streak', icon: '⚡', progress: 0, total: 7, unlocked: false }
        ];
        this.saveData();
    }

    /* ---------- Events ---------- */
    setupEventListeners() {
        document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', () => this.switchTab(button.dataset.tab)));
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        document.getElementById('start-btn').addEventListener('click', () => this.handleStartButton());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('stop-btn').addEventListener('click', () => this.stopTimer());
        document.getElementById('subject-select').addEventListener('change', e => {
            this.timer.currentSubject = e.target.value;
            this.persistTimerState();
        });
        document.getElementById('add-subject-btn').addEventListener('click', () => this.addSubject());
        document.getElementById('new-subject').addEventListener('keydown', e => { if (e.key === 'Enter') this.addSubject(); });
        document.getElementById('pomodoro-mode').addEventListener('change', e => this.setPomodoroMode(e.target.checked));

        document.getElementById('add-goal-btn').addEventListener('click', () => this.toggleForm('add-goal-form'));
        document.getElementById('save-goal-btn').addEventListener('click', () => this.saveGoal());
        document.getElementById('cancel-goal-btn').addEventListener('click', () => this.toggleForm('add-goal-form', false));

        document.getElementById('add-achievement-btn').addEventListener('click', () => this.toggleForm('add-achievement-form'));
        document.getElementById('save-achievement-btn').addEventListener('click', () => this.saveCustomAchievement());
        document.getElementById('cancel-achievement-btn').addEventListener('click', () => this.toggleForm('add-achievement-form', false));

        document.querySelectorAll('.range-btn').forEach(button => button.addEventListener('click', () => {
            this.analyticsRange = button.dataset.range === 'all' ? 'all' : Number(button.dataset.range);
            document.querySelectorAll('.range-btn').forEach(btn => btn.classList.toggle('active', btn === button));
            this.updateAnalytics();
        }));

        document.getElementById('work-time').addEventListener('change', e => this.updatePomodoroSetting('pomodoroWorkTime', e.target.value, 1, 180));
        document.getElementById('break-time').addEventListener('change', e => this.updatePomodoroSetting('pomodoroBreakTime', e.target.value, 1, 60));
        document.getElementById('sound-effects').addEventListener('change', e => { this.settings.enableSoundEffects = e.target.checked; this.saveData(); });
        document.getElementById('test-sounds-btn').addEventListener('click', () => this.testSounds());
        document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-data-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
        document.getElementById('import-file-input').addEventListener('change', e => this.importData(e.target.files[0]));
        document.getElementById('reset-data-btn').addEventListener('click', () => this.resetAllData());
        document.getElementById('install-app-btn').addEventListener('click', () => this.installApp());
        document.getElementById('settings-install-btn').addEventListener('click', () => this.installApp());
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        document.querySelectorAll('.tab-content').forEach(section => section.classList.toggle('active', section.id === `${tabName}-section`));
        if (tabName === 'analytics') this.updateAnalytics();
        if (tabName === 'goals') this.updateGoalsList();
        if (tabName === 'achievements') this.updateAchievementsList();
        if (tabName === 'settings') this.updateSettingsDisplay();
    }

    toggleForm(id, force) {
        const form = document.getElementById(id);
        if (typeof force === 'boolean') form.hidden = !force;
        else form.hidden = !form.hidden;
    }

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveData();
    }

    applyTheme() {
        document.body.classList.toggle('dark', this.settings.theme === 'dark');
        document.getElementById('theme-toggle').textContent = this.settings.theme === 'dark' ? '☀️' : '🌙';
    }

    /* ---------- Accurate timer ---------- */
    handleStartButton() {
        if (this.timer.isPaused) {
            this.resumeTimer();
            return;
        }
        if (this.timer.phase === 'break') {
            this.resumeTimer();
            return;
        }
        this.startTimer();
    }

    startTimer() {
        if (this.timer.isRunning) return;
        if (!this.timer.currentSubject) {
            this.showToast('Choose a subject', 'Select a subject before starting a study session.', 'error');
            return;
        }
        const now = Date.now();
        const isPomodoro = this.timer.isPomodoroMode;
        this.timer.phase = 'work';
        this.timer.isPomodoroBreak = false;
        this.timer.isRunning = true;
        this.timer.isPaused = false;
        this.timer.startedAtMs = now;
        this.timer.pausedAtMs = null;
        this.timer.accumulatedSeconds = 0;
        this.timer.elapsedSeconds = 0;
        this.timer.targetSeconds = isPomodoro ? this.settings.pomodoroWorkTime * 60 : 0;
        this.currentSession = {
            id: this.generateId(),
            subject: this.timer.currentSubject,
            startTime: new Date(now).toISOString(),
            endTime: null,
            duration: 0,
            isPomodoroSession: isPomodoro,
            pomodoroCompleted: false
        };
        this.startTimerInterval();
        this.playSound('start');
        this.updateDisplay();
        this.persistTimerState();
        this.showToast(isPomodoro ? 'Pomodoro started' : 'Timer started', `Studying ${this.timer.currentSubject}.`, 'success');
    }

    pauseTimer() {
        if (!this.timer.isRunning) return;
        this.timer.accumulatedSeconds = this.getCurrentElapsedSeconds();
        this.timer.elapsedSeconds = this.timer.accumulatedSeconds;
        this.timer.isRunning = false;
        this.timer.isPaused = true;
        this.timer.startedAtMs = null;
        this.timer.pausedAtMs = Date.now();
        this.clearTimerInterval();
        this.playSound('pause');
        this.updateDisplay();
        this.persistTimerState();
        this.showToast('Timer paused', 'Resume whenever you are ready.', 'success');
    }

    resumeTimer() {
        if (this.timer.isRunning) return;
        const now = Date.now();
        this.timer.isRunning = true;
        this.timer.isPaused = false;
        this.timer.startedAtMs = now;
        this.timer.pausedAtMs = null;
        this.startTimerInterval();
        this.playSound('start');
        this.updateDisplay();
        this.persistTimerState();
        this.showToast(this.timer.phase === 'break' ? 'Break resumed' : 'Timer resumed', 'Your timer is running again.', 'success');
    }

    stopTimer() {
        if (!this.timer.isRunning && !this.timer.isPaused) return;
        const elapsed = this.getCurrentElapsedSeconds();
        const wasBreak = this.timer.phase === 'break';
        if (!wasBreak && this.currentSession && elapsed > 0) {
            this.completeCurrentSession(Math.min(elapsed, this.currentSession.isPomodoroSession && this.timer.targetSeconds ? this.timer.targetSeconds : elapsed), false);
            this.showToast('Session saved', this.motivationalMessages[Math.floor(Math.random() * this.motivationalMessages.length)], 'success');
        } else if (wasBreak) {
            this.showToast('Break ended', 'Ready for another focus session.', 'success');
        }
        this.resetTimer();
        this.playSound('stop');
    }

    getCurrentElapsedSeconds() {
        const accumulated = Number(this.timer.accumulatedSeconds) || 0;
        if (!this.timer.isRunning || !this.timer.startedAtMs) return Math.max(0, Math.floor(accumulated));
        return Math.max(0, accumulated + Math.floor((Date.now() - this.timer.startedAtMs) / 1000));
    }

    startTimerInterval() {
        this.clearTimerInterval();
        this.timerInterval = setInterval(() => this.tickTimer(), 250);
        this.tickTimer();
    }

    clearTimerInterval() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    tickTimer() {
        const elapsed = this.getCurrentElapsedSeconds();
        this.timer.elapsedSeconds = elapsed;
        if (this.timer.isPomodoroMode && this.timer.phase === 'work' && this.timer.targetSeconds > 0 && elapsed >= this.timer.targetSeconds) {
            this.timer.elapsedSeconds = this.timer.targetSeconds;
            this.completeCurrentSession(this.timer.targetSeconds, true);
            this.startPomodoroBreak();
            return;
        }
        if (this.timer.isPomodoroMode && this.timer.phase === 'break' && this.timer.targetSeconds > 0 && elapsed >= this.timer.targetSeconds) {
            this.finishPomodoroBreak();
            return;
        }
        this.updateDisplay();
    }

    completeCurrentSession(durationSeconds, pomodoroCompleted) {
        if (!this.currentSession || durationSeconds <= 0) return;
        const end = new Date();
        const session = { ...this.currentSession, endTime: end.toISOString(), duration: Math.floor(durationSeconds), pomodoroCompleted: Boolean(pomodoroCompleted) };
        this.sessions.push(session);
        this.updateGoalProgress(session);
        this.checkAchievements(session);
        this.saveData();
        this.currentSession = null;
        this.timer.accumulatedSeconds = 0;
        this.timer.elapsedSeconds = 0;
    }

    startPomodoroBreak() {
        this.clearTimerInterval();
        this.currentSession = null;
        this.timer.phase = 'break';
        this.timer.isPomodoroBreak = true;
        this.timer.isRunning = true;
        this.timer.isPaused = false;
        this.timer.startedAtMs = Date.now();
        this.timer.pausedAtMs = null;
        this.timer.accumulatedSeconds = 0;
        this.timer.elapsedSeconds = 0;
        this.timer.targetSeconds = this.settings.pomodoroBreakTime * 60;
        this.startTimerInterval();
        this.playSound('break');
        this.updateDisplay();
        this.persistTimerState();
        this.showToast('Focus complete! 🍅', `${this.settings.pomodoroBreakTime}-minute break started.`, 'success');
    }

    finishPomodoroBreak() {
        this.clearTimerInterval();
        this.timer = {
            ...this.createFreshTimer(),
            isPomodoroMode: true,
            currentSubject: this.timer.currentSubject
        };
        this.playSound('break');
        this.updateDisplay();
        this.persistTimerState();
        this.showToast('Break finished', 'Ready for your next focus session.', 'success');
    }

    resetTimer() {
        const subject = this.timer.currentSubject;
        const pomodoro = this.timer.isPomodoroMode;
        this.clearTimerInterval();
        this.currentSession = null;
        this.timer = { ...this.createFreshTimer(), currentSubject: subject, isPomodoroMode: pomodoro };
        this.persistTimerState();
        this.updateDisplay();
    }

    setPomodoroMode(enabled) {
        if (this.timer.isRunning || this.timer.isPaused) {
            document.getElementById('pomodoro-mode').checked = this.timer.isPomodoroMode;
            this.showToast('Finish this timer first', 'Pomodoro mode cannot be changed during an active timer.', 'error');
            return;
        }
        this.timer.isPomodoroMode = enabled;
        this.timer.targetSeconds = enabled ? this.settings.pomodoroWorkTime * 60 : 0;
        this.updateDisplay();
        this.persistTimerState();
    }

    updateDisplay() {
        const elapsed = this.getCurrentElapsedSeconds();
        this.timer.elapsedSeconds = elapsed;
        const phase = this.timer.phase;
        const displaySeconds = phase === 'break' ? Math.max((this.timer.targetSeconds || 0) - elapsed, 0) : elapsed;
        document.getElementById('time-display').textContent = this.formatTime(displaySeconds);

        const phaseLabel = document.getElementById('timer-phase');
        const heading = document.getElementById('timer-heading');
        const status = document.getElementById('timer-status');
        const badge = document.getElementById('timer-badge');
        const pomodoroToggle = document.getElementById('pomodoro-mode');
        const summary = document.getElementById('pomodoro-summary');
        const progress = document.getElementById('progress-ring-progress');
        const circumference = 2 * Math.PI * 120;
        const progressRatio = this.timer.targetSeconds > 0 ? Math.min(elapsed / this.timer.targetSeconds, 1) : Math.min(elapsed / 3600, 1);
        progress.style.strokeDasharray = `${circumference}`;
        progress.style.strokeDashoffset = `${circumference * (1 - progressRatio)}`;

        pomodoroToggle.checked = this.timer.isPomodoroMode;
        summary.textContent = `${this.settings.pomodoroWorkTime} min focus · ${this.settings.pomodoroBreakTime} min break`;
        badge.textContent = this.timer.isPomodoroMode ? (phase === 'break' ? 'Pomodoro · Break' : 'Pomodoro · Focus') : 'Normal timer';
        phaseLabel.textContent = phase === 'break' ? 'BREAK' : 'FOCUS';

        if (this.timer.isRunning) {
            heading.textContent = phase === 'break' ? 'Take a breather.' : `Studying ${this.timer.currentSubject}`;
            status.textContent = phase === 'break' ? 'Break is running — you can end it early.' : (this.timer.isPomodoroMode ? 'Stay focused until the timer completes.' : 'Timer is running.');
        } else if (this.timer.isPaused) {
            heading.textContent = 'Paused';
            status.textContent = phase === 'break' ? 'Your break is paused.' : 'Your study session is paused.';
        } else if (phase === 'break') {
            heading.textContent = 'Break complete';
            status.textContent = 'Ready for another focus session.';
        } else {
            heading.textContent = 'Ready to study?';
            status.textContent = this.timer.currentSubject ? `Selected: ${this.timer.currentSubject}` : 'Choose a subject and start when you\'re ready.';
        }

        this.updateTimerControls();
        this.updateTimerMeta();
    }

    updateTimerControls() {
        const active = this.timer.isRunning || this.timer.isPaused;
        const start = document.getElementById('start-btn');
        const pause = document.getElementById('pause-btn');
        const stop = document.getElementById('stop-btn');
        const disabledDuringTimer = active;
        start.disabled = this.timer.isRunning;
        start.textContent = this.timer.isPaused ? '▶ Resume' : (this.timer.phase === 'break' ? '▶ Resume break' : '▶ Start');
        pause.disabled = !this.timer.isRunning;
        pause.textContent = this.timer.phase === 'break' ? '⏸ Pause break' : '⏸ Pause';
        stop.disabled = !active;
        document.getElementById('subject-select').disabled = disabledDuringTimer;
        document.getElementById('new-subject').disabled = disabledDuringTimer;
        document.getElementById('add-subject-btn').disabled = disabledDuringTimer;
        document.getElementById('pomodoro-mode').disabled = disabledDuringTimer;
    }

    updateTimerMeta() {
        const todaySessions = this.getSessionsOnDate(new Date());
        const todaySeconds = todaySessions.reduce((sum, session) => sum + session.duration, 0);
        document.getElementById('today-study-time').textContent = this.formatCompactDuration(todaySeconds);
        document.getElementById('today-sessions').textContent = todaySessions.length;
        const streak = this.getCurrentStreak();
        document.getElementById('timer-streak').textContent = `${streak} ${streak === 1 ? 'day' : 'days'}`;
        this.updateQuickStats();
    }

    /* ---------- Subjects ---------- */
    addSubject() {
        const input = document.getElementById('new-subject');
        const subject = input.value.trim();
        if (!subject) return;
        if (this.settings.subjects.some(item => item.toLowerCase() === subject.toLowerCase())) {
            this.showToast('Already exists', 'That subject is already in your list.', 'error');
            return;
        }
        this.settings.subjects.push(subject);
        input.value = '';
        this.saveData();
        this.updateSubjectsList();
        document.getElementById('subject-select').value = subject;
        this.timer.currentSubject = subject;
        this.persistTimerState();
        this.showToast('Subject added', `${subject} is ready to use.`, 'success');
    }

    removeSubject(subject) {
        if (this.settings.subjects.length <= 1) {
            this.showToast('Keep one subject', 'At least one subject is required.', 'error');
            return;
        }
        if (this.timer.currentSubject === subject && (this.timer.isRunning || this.timer.isPaused)) {
            this.showToast('Subject in use', 'Stop the active timer before removing its subject.', 'error');
            return;
        }
        this.settings.subjects = this.settings.subjects.filter(item => item !== subject);
        if (this.timer.currentSubject === subject) this.timer.currentSubject = '';
        this.saveData();
        this.updateSubjectsList();
        this.updateDisplay();
    }

    updateSubjectsList() {
        const select = document.getElementById('subject-select');
        const current = this.timer.currentSubject;
        select.innerHTML = '<option value="">Choose a subject...</option>' + this.settings.subjects.map(subject => `<option value="${this.escapeHtml(subject)}">${this.escapeHtml(subject)}</option>`).join('');
        if (this.settings.subjects.includes(current)) select.value = current;

        const list = document.getElementById('subjects-list');
        list.innerHTML = '';
        this.settings.subjects.forEach(subject => {
            const chip = document.createElement('div');
            chip.className = 'subject-chip';
            chip.innerHTML = `<span>${this.escapeHtml(subject)}</span><button type="button" aria-label="Remove ${this.escapeHtml(subject)}">×</button>`;
            chip.querySelector('button').addEventListener('click', () => this.removeSubject(subject));
            list.appendChild(chip);
        });
    }

    /* ---------- Goals ---------- */
    saveGoal() {
        const title = document.getElementById('goal-title').value.trim();
        const targetHours = Number(document.getElementById('goal-hours').value);
        const timeframe = document.getElementById('goal-timeframe').value;
        if (!title || !Number.isFinite(targetHours) || targetHours <= 0) {
            this.showToast('Invalid goal', 'Enter a title and a target greater than 0.', 'error');
            return;
        }
        this.goals.push({ id: this.generateId(), title, targetHours, timeframe, createdAt: new Date().toISOString() });
        document.getElementById('goal-title').value = '';
        document.getElementById('goal-hours').value = '';
        this.toggleForm('add-goal-form', false);
        this.saveData();
        this.updateGoalsList();
        this.updateQuickStats();
        this.showToast('Goal created', `${title} has been added.`, 'success');
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(goal => goal.id !== goalId);
        this.saveData();
        this.updateGoalsList();
        this.updateQuickStats();
    }

    updateGoalProgress(session) {
        // Goal progress is calculated live from the current period, so nothing needs to be stored here.
        void session;
    }

    getGoalProgress(goal) {
        const sessions = this.sessions.filter(session => {
            const date = new Date(session.startTime);
            const now = new Date();
            if (goal.timeframe === 'daily') return this.isSameDay(date, now);
            if (goal.timeframe === 'weekly') return this.isSameWeek(date, now);
            return this.isSameMonth(date, now);
        });
        return sessions.reduce((sum, session) => sum + session.duration, 0) / 3600;
    }

    updateGoalsList() {
        const container = document.getElementById('goals-list');
        if (!this.goals.length) {
            container.innerHTML = '<div class="empty-state">🎯 No goals yet.<br>Set a study target and let your progress build.</div>';
            return;
        }
        container.innerHTML = '';
        this.goals.forEach(goal => {
            const progress = this.getGoalProgress(goal);
            const percent = Math.min(100, (progress / goal.targetHours) * 100);
            const card = document.createElement('div');
            card.className = 'goal-card';
            card.innerHTML = `<div class="goal-head"><div><div class="goal-title">${this.escapeHtml(goal.title)}</div><div class="goal-meta">${this.capitalize(goal.timeframe)} · ${goal.targetHours.toFixed(1)}h target</div></div><button class="goal-delete" type="button">Delete</button></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div><div class="goal-stats"><span>${progress.toFixed(1)}h completed</span><span>${Math.round(percent)}%</span></div>`;
            card.querySelector('.goal-delete').addEventListener('click', () => this.deleteGoal(goal.id));
            container.appendChild(card);
        });
    }

    updateQuickStats() {
        const daily = this.goals.find(goal => goal.timeframe === 'daily');
        const weekly = this.goals.find(goal => goal.timeframe === 'weekly');
        const formatGoal = goal => goal ? `${this.getGoalProgress(goal).toFixed(1)} / ${goal.targetHours.toFixed(1)}h` : 'No goal yet';
        document.getElementById('today-goal-summary').textContent = formatGoal(daily);
        document.getElementById('weekly-goal-summary').textContent = formatGoal(weekly);
        const subjectData = this.getSubjectData(this.sessions);
        document.getElementById('top-subject-summary').textContent = subjectData[0] ? `${subjectData[0].name} · ${subjectData[0].hours.toFixed(1)}h` : '—';
        const best = this.getBestDay(this.sessions);
        document.getElementById('best-day-summary').textContent = best ? `${best.label} · ${this.formatCompactDuration(best.seconds)}` : '—';
    }

    /* ---------- Achievements ---------- */
    saveCustomAchievement() {
        const name = document.getElementById('achievement-name').value.trim();
        const description = document.getElementById('achievement-description').value.trim();
        const icon = document.getElementById('achievement-icon').value.trim() || '🏆';
        const target = Number(document.getElementById('achievement-target').value);
        if (!name || !description || !Number.isFinite(target) || target <= 0) {
            this.showToast('Invalid achievement', 'Fill in all fields with a valid target.', 'error');
            return;
        }
        this.achievements.push({ id: this.generateId(), name, description, icon, type: 'custom', progress: 0, total: target, unlocked: false });
        ['achievement-name', 'achievement-description', 'achievement-icon', 'achievement-target'].forEach(id => { document.getElementById(id).value = ''; });
        this.toggleForm('add-achievement-form', false);
        this.saveData();
        this.updateAchievementsList();
        this.showToast('Achievement created', `${name} has been added.`, 'success');
    }

    checkAchievements(session) {
        const totalHours = this.getTotalStudyHours();
        const totalSessions = this.sessions.length;
        const currentStreak = this.getCurrentStreak();
        const completedPomodoros = this.sessions.filter(item => item.isPomodoroSession && item.pomodoroCompleted).length;
        const earlyBirdCount = this.sessions.filter(item => { const hour = new Date(item.startTime).getHours(); return hour >= 5 && hour < 9; }).length;
        this.achievements.forEach(achievement => {
            if (achievement.unlocked) return;
            switch (achievement.id) {
                case 'first-steps': achievement.progress = Math.min(totalSessions, 1); break;
                case 'time-keeper': achievement.progress = Math.min(totalHours, achievement.total); break;
                case 'study-marathon': achievement.progress = Math.min(totalHours, achievement.total); break;
                case 'century-club': achievement.progress = Math.min(totalHours, achievement.total); break;
                case 'pomodoro-pro': achievement.progress = Math.min(completedPomodoros, achievement.total); break;
                case 'early-bird': achievement.progress = Math.min(earlyBirdCount, achievement.total); break;
                case 'streak-3':
                case 'streak-7': achievement.progress = Math.min(currentStreak, achievement.total); break;
                default: break;
            }
            if (achievement.progress >= achievement.total) {
                achievement.unlocked = true;
                this.showToast('Achievement unlocked! 🏆', achievement.name, 'success');
            }
        });
        this.saveData();
        if (session) void session;
    }

    updateAchievementsList() {
        const container = document.getElementById('achievements-list');
        container.innerHTML = '';
        if (!this.achievements.length) {
            container.innerHTML = '<div class="empty-state">No achievements yet.</div>';
            return;
        }
        this.achievements.forEach(achievement => {
            const total = Math.max(1, Number(achievement.total) || 1);
            const progress = Math.min(total, Math.max(0, Number(achievement.progress) || 0));
            const percent = Math.round((progress / total) * 100);
            const card = document.createElement('div');
            card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : ''}`;
            card.innerHTML = `<div class="achievement-header"><div class="achievement-icon">${this.escapeHtml(achievement.icon || '🏆')}</div><div class="achievement-info"><h3>${this.escapeHtml(achievement.name)}</h3><p class="achievement-description">${this.escapeHtml(achievement.description)}</p></div></div><div class="achievement-stats"><span>${this.formatAchievementValue(achievement.progress)} / ${this.formatAchievementValue(total)}</span><span>${percent}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>${achievement.unlocked ? '<div class="achievement-badge">Unlocked</div>' : ''}`;
            container.appendChild(card);
        });
    }

    formatAchievementValue(value) {
        return Number.isInteger(Number(value)) ? Number(value).toString() : Number(value).toFixed(1);
    }

    /* ---------- Analytics ---------- */
    updateAnalytics() {
        const sessions = this.getRangeSessions(this.analyticsRange);
        this.updateStatCards(sessions);
        this.updateDailyChart(sessions);
        this.updateSubjectChart(sessions);
        this.updateWeekdayChart(sessions);
        this.updateHeatmap();
        this.updateQuickStats();
    }

    getRangeSessions(range) {
        if (range === 'all') return [...this.sessions];
        const days = Number(range);
        const cutoff = new Date();
        cutoff.setHours(0, 0, 0, 0);
        cutoff.setDate(cutoff.getDate() - (days - 1));
        return this.sessions.filter(session => new Date(session.startTime) >= cutoff);
    }

    updateStatCards(sessions) {
        const seconds = sessions.reduce((sum, session) => sum + session.duration, 0);
        const days = new Set(sessions.map(session => this.formatDateKey(new Date(session.startTime)))).size;
        const avg = sessions.length ? Math.round(seconds / sessions.length) : 0;
        const best = this.getBestDay(sessions);
        document.getElementById('total-hours').textContent = `${(seconds / 3600).toFixed(1)}h`;
        document.getElementById('total-sessions').textContent = sessions.length;
        document.getElementById('current-streak').textContent = this.getCurrentStreak();
        document.getElementById('avg-session').textContent = this.formatCompactDuration(avg);
        document.getElementById('best-day-hours').textContent = best ? this.formatCompactDuration(best.seconds) : '0m';
        document.getElementById('days-studied').textContent = days;
    }

    updateDailyChart(sessions) {
        const chart = document.getElementById('daily-chart');
        const data = this.getChartBuckets(sessions, this.analyticsRange);
        document.getElementById('daily-chart-caption').textContent = this.analyticsRange === 'all' ? 'Monthly history' : `Last ${this.analyticsRange} days`;
        chart.innerHTML = '';
        if (!data.length || data.every(item => item.seconds === 0)) {
            chart.innerHTML = '<div class="empty-state">📈 No study data for this range yet.</div>';
            return;
        }
        const max = Math.max(...data.map(item => item.seconds), 1);
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-chart';
        data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'bar-item';
            row.title = `${item.fullLabel}: ${this.formatCompactDuration(item.seconds)}`;
            const value = document.createElement('div'); value.className = 'bar-value'; value.textContent = this.formatCompactDuration(item.seconds);
            const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = `${Math.max(3, (item.seconds / max) * 150)}px`;
            const label = document.createElement('div'); label.className = 'bar-label'; label.textContent = item.label;
            row.append(value, bar, label); wrapper.appendChild(row);
        });
        chart.appendChild(wrapper);
    }

    getChartBuckets(sessions, range) {
        if (range === 'all') {
            if (!sessions.length) return [];
            const earliest = new Date(sessions.reduce((min, session) => Math.min(min, new Date(session.startTime).getTime()), Date.now()));
            const start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
            const end = new Date();
            end.setDate(1); end.setHours(0, 0, 0, 0);
            const buckets = [];
            const cursor = new Date(start);
            while (cursor <= end) {
                const y = cursor.getFullYear(), m = cursor.getMonth();
                const total = sessions.filter(s => { const d = new Date(s.startTime); return d.getFullYear() === y && d.getMonth() === m; }).reduce((sum, s) => sum + s.duration, 0);
                buckets.push({ label: cursor.toLocaleDateString(undefined, { month: 'short' }), fullLabel: cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), seconds: total });
                cursor.setMonth(cursor.getMonth() + 1);
            }
            return buckets;
        }
        const days = Number(range);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const buckets = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today); date.setDate(today.getDate() - i);
            const total = sessions.filter(session => this.isSameDay(new Date(session.startTime), date)).reduce((sum, session) => sum + session.duration, 0);
            buckets.push({ label: days <= 14 ? date.toLocaleDateString(undefined, { weekday: 'short' }) : date.toLocaleDateString(undefined, { day: 'numeric' }), fullLabel: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), seconds: total });
        }
        return buckets;
    }

    updateSubjectChart(sessions) {
        const chart = document.getElementById('subject-chart');
        const data = this.getSubjectData(sessions);
        chart.innerHTML = '';
        if (!data.length) { chart.innerHTML = '<div class="empty-state">📚 No subject data yet.</div>'; return; }
        const max = Math.max(...data.map(item => item.hours), 1);
        data.slice(0, 8).forEach(item => {
            const row = document.createElement('div'); row.className = 'subject-row'; row.title = `${item.name}: ${item.hours.toFixed(1)} hours`;
            row.innerHTML = `<div class="subject-name">${this.escapeHtml(item.name)}</div><div class="subject-track"><div class="subject-fill" style="width:${(item.hours / max) * 100}%"></div></div><div class="subject-value">${item.hours.toFixed(1)}h</div>`;
            chart.appendChild(row);
        });
    }

    updateWeekdayChart(sessions) {
        const chart = document.getElementById('weekday-chart');
        chart.innerHTML = '';
        const totals = Array.from({ length: 7 }, (_, day) => ({ day, seconds: 0 }));
        sessions.forEach(session => totals[new Date(session.startTime).getDay()].seconds += session.duration);
        const max = Math.max(...totals.map(item => item.seconds), 1);
        totals.forEach(item => {
            const name = new Date(2024, 0, 7 + item.day).toLocaleDateString(undefined, { weekday: 'short' });
            const row = document.createElement('div'); row.className = 'weekday-row';
            row.innerHTML = `<span class="weekday-label">${name}</span><div class="subject-track"><div class="subject-fill" style="width:${(item.seconds / max) * 100}%"></div></div><span class="weekday-value">${this.formatCompactDuration(item.seconds)}</span>`;
            chart.appendChild(row);
        });
    }

    updateHeatmap() {
        const heatmap = document.getElementById('heatmap');
        heatmap.innerHTML = '';
        const totals = new Map();
        this.sessions.forEach(session => {
            const key = this.formatDateKey(new Date(session.startTime));
            totals.set(key, (totals.get(key) || 0) + session.duration);
        });
        const values = [...totals.values()];
        const max = Math.max(...values, 1);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const start = new Date(today); start.setDate(today.getDate() - today.getDay() - (52 * 7));
        for (let index = 0; index < 53 * 7; index++) {
            const date = new Date(start); date.setDate(start.getDate() + index);
            const key = this.formatDateKey(date);
            const seconds = totals.get(key) || 0;
            const cell = document.createElement('button');
            cell.type = 'button'; cell.className = `heatmap-cell ${this.getHeatLevel(seconds, max)}`;
            cell.dataset.date = key;
            cell.title = `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${this.formatCompactDuration(seconds)}`;
            cell.setAttribute('aria-label', cell.title);
            cell.addEventListener('click', () => this.showHeatmapDetail(key, cell));
            heatmap.appendChild(cell);
        }
    }

    getHeatLevel(seconds, max) {
        if (!seconds) return 'level-0';
        const ratio = seconds / max;
        if (ratio <= .25) return 'level-1';
        if (ratio <= .5) return 'level-2';
        if (ratio <= .75) return 'level-3';
        return 'level-4';
    }

    showHeatmapDetail(key, element) {
        document.querySelectorAll('.heatmap-cell.selected').forEach(cell => cell.classList.remove('selected'));
        element.classList.add('selected');
        const sessions = this.sessions.filter(session => this.formatDateKey(new Date(session.startTime)) === key);
        const date = new Date(`${key}T12:00:00`);
        if (!sessions.length) {
            document.getElementById('heatmap-detail').textContent = `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · No study sessions.`;
            return;
        }
        const subjectText = this.getSubjectData(sessions).map(item => `${item.name} ${item.hours.toFixed(1)}h`).join(' · ');
        document.getElementById('heatmap-detail').textContent = `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · ${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${this.formatCompactDuration(sessions.reduce((sum, item) => sum + item.duration, 0))} · ${subjectText}`;
    }

    getSubjectData(sessions = this.sessions) {
        const subjects = {};
        sessions.forEach(session => { subjects[session.subject] = (subjects[session.subject] || 0) + session.duration / 3600; });
        return Object.entries(subjects).map(([name, hours]) => ({ name, hours })).sort((a, b) => b.hours - a.hours);
    }

    getBestDay(sessions) {
        const byDay = new Map();
        sessions.forEach(session => {
            const date = new Date(session.startTime);
            const key = this.formatDateKey(date);
            byDay.set(key, (byDay.get(key) || 0) + session.duration);
        });
        let best = null;
        byDay.forEach((seconds, key) => { if (!best || seconds > best.seconds) best = { key, seconds, label: new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }; });
        return best;
    }

    /* ---------- Settings / export / import / PWA ---------- */
    updatePomodoroSetting(key, value, min, max) {
        const number = Math.min(max, Math.max(min, Number(value) || min));
        this.settings[key] = number;
        this.saveData();
        if (!this.timer.isRunning && !this.timer.isPaused && this.timer.isPomodoroMode) this.timer.targetSeconds = this.settings.pomodoroWorkTime * 60;
        this.updateDisplay();
    }

    updateSettingsDisplay() {
        document.getElementById('work-time').value = this.settings.pomodoroWorkTime;
        document.getElementById('break-time').value = this.settings.pomodoroBreakTime;
        document.getElementById('sound-effects').checked = this.settings.enableSoundEffects;
        document.getElementById('settings-install-btn').disabled = !this.deferredInstallPrompt && !this.isStandalone();
        this.updateSubjectsList();
        this.updateDisplay();
    }

    exportData() {
        const payload = {
            app: 'Study Tracker',
            schemaVersion: 2,
            exportedAt: new Date().toISOString(),
            sessions: this.sessions,
            goals: this.goals,
            achievements: this.achievements,
            settings: this.settings
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `study-tracker-backup-${this.formatDateKey(new Date())}.json`;
        document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
        this.showToast('Backup exported', 'Your Study Tracker data is ready to save.', 'success');
    }

    async importData(file) {
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sessions) || !Array.isArray(parsed.goals) || !Array.isArray(parsed.achievements)) throw new Error('Invalid Study Tracker backup');
            const sessions = parsed.sessions.map(this.normalizeSession.bind(this)).filter(Boolean);
            if (!confirm(`Import ${sessions.length} sessions and replace your current Study Tracker data?`)) return;
            this.sessions = sessions;
            this.goals = Array.isArray(parsed.goals) ? parsed.goals : [];
            this.achievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
            const importedSettings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {};
            this.settings = { ...this.defaultSettings, ...importedSettings, subjects: Array.from(new Set((Array.isArray(importedSettings.subjects) ? importedSettings.subjects : this.defaultSettings.subjects).map(String).filter(Boolean))) };
            this.resetTimer();
            this.saveData();
            this.updateSettingsDisplay(); this.updateGoalsList(); this.updateAchievementsList(); this.updateAnalytics(); this.updateDisplay(); this.applyTheme();
            this.showToast('Import complete', 'Your backup has been restored.', 'success');
        } catch (error) {
            this.showToast('Import failed', error.message || 'That file is not a valid Study Tracker backup.', 'error');
        } finally {
            document.getElementById('import-file-input').value = '';
        }
    }

    resetAllData() {
        if (!confirm('Reset every Study Tracker session, goal, achievement, subject, and setting?')) return;
        this.clearTimerInterval(); this.resetStorageOnly();
        this.settings = { ...this.defaultSettings, subjects: [...this.defaultSettings.subjects] };
        this.sessions = []; this.goals = []; this.achievements = []; this.currentSession = null; this.timer = this.createFreshTimer();
        this.setupDefaultAchievements(); this.saveData();
        this.updateSettingsDisplay(); this.updateGoalsList(); this.updateAchievementsList(); this.updateAnalytics(); this.updateDisplay(); this.applyTheme();
        this.showToast('Data reset', 'Study Tracker is back to a clean state.', 'success');
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', event => {
            event.preventDefault();
            this.deferredInstallPrompt = event;
            document.getElementById('install-app-btn').classList.remove('hidden');
            this.updateSettingsDisplay();
        });
        window.addEventListener('appinstalled', () => {
            this.deferredInstallPrompt = null;
            document.getElementById('install-app-btn').classList.add('hidden');
            this.updateSettingsDisplay();
            this.showToast('App installed', 'Study Tracker is now installed on your device.', 'success');
        });
        if (this.isStandalone()) document.getElementById('install-app-btn').classList.add('hidden');
    }

    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    async installApp() {
        if (this.isStandalone()) { this.showToast('Already installed', 'Study Tracker is running as an installed app.', 'success'); return; }
        if (!this.deferredInstallPrompt) {
            this.showToast('Install not available yet', 'Open this app from a supported browser over HTTPS (such as GitHub Pages) and try again.', 'error');
            return;
        }
        this.deferredInstallPrompt.prompt();
        const choice = await this.deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') this.showToast('Installing…', 'Study Tracker will be added to your apps.', 'success');
        this.deferredInstallPrompt = null;
        document.getElementById('install-app-btn').classList.add('hidden');
        this.updateSettingsDisplay();
    }

    registerServiceWorker() {
        if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
        navigator.serviceWorker.register('./service-worker.js').then(() => this.updateOnlineStatus()).catch(error => console.warn('Service worker registration failed', error));
    }

    updateOnlineStatus() {
        const status = document.getElementById('offline-status');
        if (!navigator.onLine) { status.textContent = '● Offline'; status.style.color = 'rgb(var(--accent))'; }
        else { status.textContent = '● Online'; status.style.color = 'rgb(var(--muted-foreground))'; }
    }

    testSounds() {
        this.playSound('start');
        setTimeout(() => this.playSound('break'), 350);
        setTimeout(() => this.playSound('stop'), 700);
        this.showToast('Sound test', 'Three short tones are playing.', 'success');
    }

    /* ---------- Utilities ---------- */
    getTotalStudyHours() { return this.sessions.reduce((total, session) => total + session.duration / 3600, 0); }

    getCurrentStreak() {
        if (!this.sessions.length) return 0;
        const studied = new Set(this.sessions.map(session => this.formatDateKey(new Date(session.startTime))));
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (!studied.has(this.formatDateKey(today))) return 0;
        let streak = 0;
        const cursor = new Date(today);
        while (studied.has(this.formatDateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
        return streak;
    }

    getSessionsOnDate(date) { return this.sessions.filter(session => this.isSameDay(new Date(session.startTime), date)); }
    isSameDay(a, b) { return a.toDateString() === b.toDateString(); }

    isSameWeek(date, now) {
        const startA = this.startOfWeek(date).getTime();
        const startB = this.startOfWeek(now).getTime();
        return startA === startB;
    }

    isSameMonth(date, now) { return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); }

    startOfWeek(date) {
        const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - result.getDay()); return result;
    }

    formatDateKey(date) {
        const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    formatTime(totalSeconds) {
        const seconds = Math.max(0, Math.floor(totalSeconds));
        const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    formatCompactDuration(seconds) {
        const totalMinutes = Math.round(Math.max(0, seconds) / 60);
        if (totalMinutes < 60) return `${totalMinutes}m`;
        const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60;
        return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    capitalize(value) { return String(value).charAt(0).toUpperCase() + String(value).slice(1); }
    generateId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }

    escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }

    playSound(type) {
        if (!this.settings.enableSoundEffects) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const context = new AudioContext();
            const oscillator = context.createOscillator(); const gain = context.createGain();
            oscillator.connect(gain); gain.connect(context.destination);
            const frequencies = { start: 780, pause: 400, stop: 560, break: 980 };
            oscillator.frequency.value = frequencies[type] || 620;
            gain.gain.setValueAtTime(.08, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(.01, context.currentTime + .25);
            oscillator.start(); oscillator.stop(context.currentTime + .25);
            oscillator.addEventListener('ended', () => context.close());
        } catch (error) { console.debug('Sound unavailable', error); }
    }

    showToast(title, description, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div'); toast.className = `toast toast-${type}`;
        toast.innerHTML = `<div class="toast-title">${this.escapeHtml(title)}</div><div class="toast-description">${this.escapeHtml(description)}</div>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.tracker = new StudyTracker(); });
