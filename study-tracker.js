// Study Tracker JavaScript - Fixed Analytics Charts
class StudyTracker {
    constructor() {
        this.timer = {
            isRunning: false,
            isPaused: false,
            isPomodoroMode: false,
            isPomodoroBreak: false,
            elapsedSeconds: 0,
            currentSubject: null,
            startTime: null
        };
        
        this.settings = {
            theme: 'light',
            pomodoroWorkTime: 25,
            pomodoroBreakTime: 5,
            enableSoundEffects: true,
            subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature']
        };
        
        this.sessions = [];
        this.goals = [];
        this.achievements = [];
        
        this.timerInterval = null;
        this.currentSession = null;
        
        this.motivationalMessages = [
            "Great job! You're making excellent progress! 🌟",
            "Keep going! Every minute counts towards your goals! 💪",
            "You're on fire! Your dedication is inspiring! 🔥",
            "Amazing focus! You're building great study habits! 🎯",
            "Fantastic work! Your future self will thank you! ✨",
            "You're crushing it! Stay consistent and reach new heights! 🚀",
            "Incredible dedication! You're becoming unstoppable! 💎",
            "Outstanding effort! Knowledge is power, keep building it! 📚"
        ];
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupDefaultAchievements();
        this.updateDisplay();
        this.updateSubjectsList();
        this.updateGoalsList();
        this.updateAchievementsList();
        this.updateAnalytics();
        this.applyTheme();
    }
    
    // Data Management
    loadData() {
        const savedSessions = localStorage.getItem('study-sessions');
        if (savedSessions) this.sessions = JSON.parse(savedSessions);
        
        const savedGoals = localStorage.getItem('study-goals');
        if (savedGoals) this.goals = JSON.parse(savedGoals);
        
        const savedAchievements = localStorage.getItem('study-achievements');
        if (savedAchievements) this.achievements = JSON.parse(savedAchievements);
        
        const savedSettings = localStorage.getItem('study-settings');
        if (savedSettings) this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
    
    saveData() {
        localStorage.setItem('study-sessions', JSON.stringify(this.sessions));
        localStorage.setItem('study-goals', JSON.stringify(this.goals));
        localStorage.setItem('study-achievements', JSON.stringify(this.achievements));
        localStorage.setItem('study-settings', JSON.stringify(this.settings));
    }
    
    // Default Achievements
    setupDefaultAchievements() {
        if (this.achievements.length === 0) {
            this.achievements = [
                {
                    id: 'first-steps',
                    name: 'First Steps',
                    description: 'Complete your first study session',
                    type: 'milestone',
                    icon: '🎯',
                    progress: 0,
                    total: 1,
                    unlocked: false
                },
                {
                    id: 'time-keeper',
                    name: 'Time Keeper',
                    description: 'Study for 10 hours total',
                    type: 'milestone',
                    icon: '⏰',
                    progress: 0,
                    total: 10,
                    unlocked: false
                },
                {
                    id: 'study-marathon',
                    name: 'Study Marathon',
                    description: 'Study for 50 hours total',
                    type: 'milestone',
                    icon: '🏃',
                    progress: 0,
                    total: 50,
                    unlocked: false
                },
                {
                    id: 'century-club',
                    name: 'Century Club',
                    description: 'Reach 100 hours of study time',
                    type: 'milestone',
                    icon: '💯',
                    progress: 0,
                    total: 100,
                    unlocked: false
                },
                {
                    id: 'pomodoro-pro',
                    name: 'Pomodoro Pro',
                    description: 'Complete 25 Pomodoro sessions',
                    type: 'milestone',
                    icon: '🍅',
                    progress: 0,
                    total: 25,
                    unlocked: false
                },
                {
                    id: 'early-bird',
                    name: 'Early Bird',
                    description: 'Study 10 times between 5-9 AM',
                    type: 'milestone',
                    icon: '🐦',
                    progress: 0,
                    total: 10,
                    unlocked: false
                },
                {
                    id: 'streak-3',
                    name: '3-Day Streak',
                    description: 'Study for 3 consecutive days',
                    type: 'streak',
                    icon: '🔥',
                    progress: 0,
                    total: 3,
                    unlocked: false
                },
                {
                    id: 'streak-7',
                    name: 'Week Warrior',
                    description: 'Study for 7 consecutive days',
                    type: 'streak',
                    icon: '⚡',
                    progress: 0,
                    total: 7,
                    unlocked: false
                }
            ];
            this.saveData();
        }
    }
    
    // Event Listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Timer controls
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startTimer();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseTimer();
        });
        
        document.getElementById('stop-btn').addEventListener('click', () => {
            this.stopTimer();
        });
        
        // Subject selection
        document.getElementById('subject-select').addEventListener('change', (e) => {
            this.timer.currentSubject = e.target.value;
        });
        
        document.getElementById('add-subject-btn').addEventListener('click', () => {
            this.addSubject();
        });
        
        document.getElementById('new-subject').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSubject();
        });
        
        // Pomodoro mode
        document.getElementById('pomodoro-mode').addEventListener('change', (e) => {
            this.timer.isPomodoroMode = e.target.checked;
        });
        
        // Goals
        document.getElementById('add-goal-btn').addEventListener('click', () => {
            this.toggleGoalForm();
        });
        
        document.getElementById('save-goal-btn').addEventListener('click', () => {
            this.saveGoal();
        });
        
        document.getElementById('cancel-goal-btn').addEventListener('click', () => {
            this.toggleGoalForm();
        });
        
        // Achievements
        document.getElementById('add-achievement-btn').addEventListener('click', () => {
            this.toggleAchievementForm();
        });
        
        document.getElementById('save-achievement-btn').addEventListener('click', () => {
            this.saveCustomAchievement();
        });
        
        document.getElementById('cancel-achievement-btn').addEventListener('click', () => {
            this.toggleAchievementForm();
        });
        
        // Settings
        document.getElementById('work-time').addEventListener('change', (e) => {
            this.settings.pomodoroWorkTime = parseInt(e.target.value);
            this.saveData();
        });
        
        document.getElementById('break-time').addEventListener('change', (e) => {
            this.settings.pomodoroBreakTime = parseInt(e.target.value);
            this.saveData();
        });
        
        document.getElementById('sound-effects').addEventListener('change', (e) => {
            this.settings.enableSoundEffects = e.target.checked;
            this.saveData();
        });
        
        document.getElementById('test-sounds-btn').addEventListener('click', () => {
            this.testSounds();
        });
        
        document.getElementById('reset-data-btn').addEventListener('click', () => {
            this.resetAllData();
        });
    }
    
    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-section`).classList.add('active');
        
        // Update displays when switching tabs
        if (tabName === 'analytics') this.updateAnalytics();
        if (tabName === 'achievements') this.updateAchievementsList();
        if (tabName === 'settings') this.updateSettingsDisplay();
    }
    
    // Theme Management
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveData();
    }
    
    applyTheme() {
        if (this.settings.theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }
    
    // Timer Functions
    startTimer() {
        if (!this.timer.currentSubject) {
            this.showToast('Select a Subject', 'Please select a subject before starting the timer', 'error');
            return;
        }
        
        const now = new Date();
        
        // If we're in a break and user starts studying, end the break
        if (this.timer.isPomodoroBreak && this.timer.isRunning) {
            this.showToast('Break Ended Early!', 'Starting new work session. Great motivation!', 'success');
        }
        
        this.currentSession = {
            id: this.generateId(),
            subject: this.timer.currentSubject,
            startTime: now,
            endTime: null,
            duration: 0,
            isPomodoroSession: this.timer.isPomodoroMode
        };
        
        this.timer.isRunning = true;
        this.timer.isPaused = false;
        this.timer.isPomodoroBreak = false;
        this.timer.startTime = now;
        this.timer.elapsedSeconds = 0;
        
        this.startTimerInterval();
        this.playSound('start');
        this.updateTimerControls();
        
        this.showToast('Timer Started', `Studying ${this.timer.currentSubject}`, 'success');
    }
    
    pauseTimer() {
        this.timer.isPaused = true;
        this.timer.isRunning = false;
        this.clearTimerInterval();
        this.playSound('pause');
        this.updateTimerControls();
        
        this.showToast('Timer Paused', 'Take a quick break and resume when ready', 'success');
    }
    
    stopTimer() {
        if (this.currentSession && this.timer.elapsedSeconds > 0) {
            this.currentSession.endTime = new Date();
            this.currentSession.duration = this.timer.elapsedSeconds;
            
            this.sessions.push(this.currentSession);
            this.updateGoalProgress(this.currentSession);
            this.checkAchievements(this.currentSession);
            this.saveData();
        }
        
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        this.timer.isPomodoroBreak = false;
        this.timer.elapsedSeconds = 0;
        this.currentSession = null;
        
        this.clearTimerInterval();
        this.playSound('stop');
        this.updateDisplay();
        this.updateTimerControls();
        
        const message = this.motivationalMessages[Math.floor(Math.random() * this.motivationalMessages.length)];
        this.showToast('Session Complete', message, 'success');
    }
    
    resumeTimer() {
        if (this.timer.isPaused) {
            this.timer.isRunning = true;
            this.timer.isPaused = false;
            this.startTimerInterval();
            this.updateTimerControls();
            
            this.showToast('Timer Resumed', 'Back to studying!', 'success');
        }
    }
    
    startTimerInterval() {
        this.timerInterval = setInterval(() => {
            this.timer.elapsedSeconds++;
            this.updateDisplay();
            
            // Check for Pomodoro completion
            if (this.timer.isPomodoroMode && !this.timer.isPomodoroBreak) {
                const workMinutes = this.settings.pomodoroWorkTime * 60;
                if (this.timer.elapsedSeconds >= workMinutes) {
                    this.startPomodoroBreak();
                }
            } else if (this.timer.isPomodoroMode && this.timer.isPomodoroBreak) {
                const breakMinutes = this.settings.pomodoroBreakTime * 60;
                if (this.timer.elapsedSeconds >= breakMinutes) {
                    this.endPomodoroBreak();
                }
            }
        }, 1000);
    }
    
    clearTimerInterval() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    startPomodoroBreak() {
        // Save current work session
        if (this.currentSession) {
            this.currentSession.endTime = new Date();
            this.currentSession.duration = this.timer.elapsedSeconds;
            this.sessions.push(this.currentSession);
            this.updateGoalProgress(this.currentSession);
            this.checkAchievements(this.currentSession);
        }
        
        this.timer.isPomodoroBreak = true;
        this.timer.elapsedSeconds = 0;
        this.playSound('break');
        this.updateDisplay();
        
        this.showToast('Pomodoro Complete!', `Time for a ${this.settings.pomodoroBreakTime} minute break`, 'success');
    }
    
    endPomodoroBreak() {
        this.timer.isPomodoroBreak = false;
        this.timer.elapsedSeconds = 0;
        this.playSound('start');
        this.updateDisplay();
        
        // Start new work session
        this.currentSession = {
            id: this.generateId(),
            subject: this.timer.currentSubject,
            startTime: new Date(),
            endTime: null,
            duration: 0,
            isPomodoroSession: true
        };
        
        this.showToast('Break Complete!', 'Ready for another focused session', 'success');
    }
    
    updateDisplay() {
        const timeDisplay = document.getElementById('time-display');
        const timerStatus = document.getElementById('timer-status');
        const progressRing = document.querySelector('.progress-ring-progress');
        
        const formattedTime = this.formatTime(this.timer.elapsedSeconds);
        timeDisplay.textContent = formattedTime;
        
        // Update status
        if (this.timer.isPomodoroBreak) {
            timerStatus.textContent = `Break Time - ${this.formatTime(this.settings.pomodoroBreakTime * 60 - this.timer.elapsedSeconds)} remaining`;
        } else if (this.timer.isRunning) {
            timerStatus.textContent = `Studying ${this.timer.currentSubject}`;
        } else if (this.timer.isPaused) {
            timerStatus.textContent = 'Timer Paused';
        } else {
            timerStatus.textContent = 'Ready to start';
        }
        
        // Update progress ring
        if (this.timer.isPomodoroMode) {
            const totalTime = this.timer.isPomodoroBreak ? 
                this.settings.pomodoroBreakTime * 60 : 
                this.settings.pomodoroWorkTime * 60;
            const progress = this.timer.elapsedSeconds / totalTime;
            const circumference = 2 * Math.PI * 120;
            const strokeDashoffset = circumference - (progress * circumference);
            progressRing.style.strokeDashoffset = strokeDashoffset;
        } else {
            progressRing.style.strokeDashoffset = 754;
        }
    }
    
    updateTimerControls() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        
        if (this.timer.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            pauseBtn.textContent = '⏸️ Pause';
        } else if (this.timer.isPaused) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            pauseBtn.textContent = '▶️ Resume';
            pauseBtn.onclick = () => this.resumeTimer();
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.onclick = () => this.pauseTimer();
        }
    }
    
    // Subject Management
    addSubject() {
        const input = document.getElementById('new-subject');
        const subject = input.value.trim();
        
        if (subject && !this.settings.subjects.includes(subject)) {
            this.settings.subjects.push(subject);
            this.updateSubjectsList();
            this.saveData();
            input.value = '';
            this.showToast('Subject Added', `${subject} has been added to your subjects`, 'success');
        }
    }
    
    removeSubject(subject) {
        this.settings.subjects = this.settings.subjects.filter(s => s !== subject);
        this.updateSubjectsList();
        this.saveData();
        this.showToast('Subject Removed', `${subject} has been removed`, 'success');
    }
    
    updateSubjectsList() {
        const select = document.getElementById('subject-select');
        select.innerHTML = '<option value="">Choose a subject...</option>';
        
        this.settings.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });
        
        // Update settings display
        const subjectsList = document.getElementById('subjects-list');
        if (subjectsList) {
            subjectsList.innerHTML = '';
            this.settings.subjects.forEach(subject => {
                const tag = document.createElement('div');
                tag.className = 'subject-tag';
                tag.innerHTML = `
                    ${subject}
                    <button class="remove-subject" onclick="tracker.removeSubject('${subject}')">×</button>
                `;
                subjectsList.appendChild(tag);
            });
        }
    }
    
    // Goals Management
    toggleGoalForm() {
        const form = document.getElementById('add-goal-form');
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.clearGoalForm();
        }
    }
    
    clearGoalForm() {
        document.getElementById('goal-title').value = '';
        document.getElementById('goal-hours').value = '';
        document.getElementById('goal-timeframe').value = 'daily';
    }
    
    saveGoal() {
        const title = document.getElementById('goal-title').value.trim();
        const hours = parseFloat(document.getElementById('goal-hours').value);
        const timeframe = document.getElementById('goal-timeframe').value;
        
        if (!title || !hours || hours <= 0) {
            this.showToast('Invalid Input', 'Please fill in all fields with valid values', 'error');
            return;
        }
        
        const goal = {
            id: this.generateId(),
            title,
            targetHours: hours,
            timeframe,
            progress: 0,
            createdAt: new Date().toISOString()
        };
        
        this.goals.push(goal);
        this.updateGoalsList();
        this.toggleGoalForm();
        this.saveData();
        
        this.showToast('Goal Created', `${title} added to your goals`, 'success');
    }
    
    deleteGoal(goalId) {
        this.goals = this.goals.filter(goal => goal.id !== goalId);
        this.updateGoalsList();
        this.saveData();
        this.showToast('Goal Deleted', 'Goal has been removed', 'success');
    }
    
    updateGoalProgress(session) {
        const sessionHours = session.duration / 3600;
        
        this.goals.forEach(goal => {
            const now = new Date();
            let shouldUpdate = false;
            
            if (goal.timeframe === 'daily') {
                shouldUpdate = this.isSameDay(new Date(session.startTime), now);
            } else if (goal.timeframe === 'weekly') {
                shouldUpdate = this.isSameWeek(new Date(session.startTime), now);
            } else if (goal.timeframe === 'monthly') {
                shouldUpdate = this.isSameMonth(new Date(session.startTime), now);
            }
            
            if (shouldUpdate) {
                goal.progress += sessionHours;
            }
        });
    }
    
    updateGoalsList() {
        const goalsList = document.getElementById('goals-list');
        goalsList.innerHTML = '';
        
        this.goals.forEach(goal => {
            const progressPercent = Math.min((goal.progress / goal.targetHours) * 100, 100);
            const isComplete = goal.progress >= goal.targetHours;
            
            const goalCard = document.createElement('div');
            goalCard.className = `goal-card ${isComplete ? 'completed' : ''}`;
            goalCard.innerHTML = `
                <div class="goal-header">
                    <h3 class="goal-title">${goal.title}</h3>
                    <button class="delete-btn" onclick="tracker.deleteGoal('${goal.id}')">🗑️</button>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="goal-stats">
                    <span>${goal.progress.toFixed(1)}h / ${goal.targetHours}h</span>
                    <span>${goal.timeframe}</span>
                </div>
            `;
            goalsList.appendChild(goalCard);
        });
    }
    
    // Achievement Management
    toggleAchievementForm() {
        const form = document.getElementById('add-achievement-form');
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.clearAchievementForm();
        }
    }
    
    clearAchievementForm() {
        document.getElementById('achievement-name').value = '';
        document.getElementById('achievement-description').value = '';
        document.getElementById('achievement-icon').value = '';
        document.getElementById('achievement-target').value = '';
    }
    
    saveCustomAchievement() {
        const name = document.getElementById('achievement-name').value.trim();
        const description = document.getElementById('achievement-description').value.trim();
        const icon = document.getElementById('achievement-icon').value.trim();
        const target = parseInt(document.getElementById('achievement-target').value);
        
        if (!name || !description || !icon || !target || target <= 0) {
            this.showToast('Invalid Input', 'Please fill in all fields with valid values', 'error');
            return;
        }
        
        const achievement = {
            id: this.generateId(),
            name,
            description,
            icon,
            type: 'custom',
            progress: 0,
            total: target,
            unlocked: false
        };
        
        this.achievements.push(achievement);
        this.updateAchievementsList();
        this.toggleAchievementForm();
        this.saveData();
        
        this.showToast('Achievement Created', `${name} added to achievements`, 'success');
    }
    
    checkAchievements(session) {
        const sessionHours = session.duration / 3600;
        const totalHours = this.getTotalStudyHours();
        const totalSessions = this.sessions.length;
        const currentStreak = this.getCurrentStreak();
        const sessionHour = new Date(session.startTime).getHours();
        
        this.achievements.forEach(achievement => {
            if (achievement.unlocked) return;
            
            let newProgress = achievement.progress;
            
            switch (achievement.id) {
                case 'first-steps':
                    newProgress = totalSessions >= 1 ? 1 : 0;
                    break;
                case 'time-keeper':
                    newProgress = Math.min(totalHours, achievement.total);
                    break;
                case 'study-marathon':
                    newProgress = Math.min(totalHours, achievement.total);
                    break;
                case 'century-club':
                    newProgress = Math.min(totalHours, achievement.total);
                    break;
                case 'pomodoro-pro':
                    const pomodoroSessions = this.sessions.filter(s => s.isPomodoroSession).length;
                    newProgress = Math.min(pomodoroSessions, achievement.total);
                    break;
                case 'early-bird':
                    if (sessionHour >= 5 && sessionHour < 9) {
                        newProgress = Math.min(achievement.progress + 1, achievement.total);
                    }
                    break;
                case 'streak-3':
                case 'streak-7':
                    newProgress = Math.min(currentStreak, achievement.total);
                    break;
            }
            
            achievement.progress = newProgress;
            
            if (achievement.progress >= achievement.total && !achievement.unlocked) {
                achievement.unlocked = true;
                this.showToast('Achievement Unlocked!', `🏆 ${achievement.name}`, 'success');
            }
        });
        
        this.saveData();
    }
    
    updateAchievementsList() {
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            const progressPercent = (achievement.progress / achievement.total) * 100;
            
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : ''}`;
            achievementCard.innerHTML = `
                <div class="achievement-header">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <h3>${achievement.name}</h3>
                        <p class="achievement-description">${achievement.description}</p>
                    </div>
                </div>
                <div class="achievement-progress">
                    <div class="achievement-stats">
                        <span>${achievement.progress} / ${achievement.total}</span>
                        <span>${Math.round(progressPercent)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                ${achievement.unlocked ? '<div class="achievement-badge">Unlocked</div>' : ''}
            `;
            achievementsList.appendChild(achievementCard);
        });
    }
    
    // Analytics - FIXED CHARTS
    updateAnalytics() {
        this.updateStatCards();
        this.updateCharts();
    }
    
    updateStatCards() {
        const totalHours = this.getTotalStudyHours();
        const totalSessions = this.sessions.length;
        const currentStreak = this.getCurrentStreak();
        const avgSession = totalSessions > 0 ? (totalHours * 60) / totalSessions : 0;
        
        document.getElementById('total-hours').textContent = totalHours.toFixed(1);
        document.getElementById('total-sessions').textContent = totalSessions;
        document.getElementById('current-streak').textContent = currentStreak;
        document.getElementById('avg-session').textContent = `${Math.round(avgSession)}m`;
    }
    
    updateCharts() {
        this.updateDailyChart();
        this.updateSubjectChart();
    }
    
    // FIXED: Daily Chart with proper visualization
    updateDailyChart() {
        const dailyChart = document.getElementById('daily-chart');
        const last7Days = this.getLast7DaysData();
        
        // Clear and setup chart container
        dailyChart.innerHTML = '';
        dailyChart.style.display = 'flex';
        dailyChart.style.alignItems = 'flex-end';
        dailyChart.style.gap = '8px';
        dailyChart.style.height = '180px';
        dailyChart.style.padding = '10px 0';
        dailyChart.style.justifyContent = 'space-around';
        
        if (last7Days.every(day => day.hours === 0)) {
            dailyChart.innerHTML = '<div style="width: 100%; text-align: center; color: rgb(var(--muted-foreground)); padding: 50px 0; font-size: 0.9rem;">No study data yet - start your first session!</div>';
            return;
        }
        
        const maxHours = Math.max(...last7Days.map(d => d.hours), 1);
        
        last7Days.forEach(day => {
            const barContainer = document.createElement('div');
            barContainer.style.display = 'flex';
            barContainer.style.flexDirection = 'column';
            barContainer.style.alignItems = 'center';
            barContainer.style.flex = '1';
            barContainer.style.height = '100%';
            barContainer.style.justifyContent = 'flex-end';
            barContainer.style.maxWidth = '60px';
            
            const bar = document.createElement('div');
            bar.style.backgroundColor = 'rgb(var(--primary))';
            bar.style.width = '100%';
            bar.style.maxWidth = '30px';
            bar.style.borderRadius = '4px 4px 0 0';
            bar.style.transition = 'all 0.3s ease';
            bar.style.cursor = 'pointer';
            bar.style.minHeight = '4px';
            
            const height = day.hours > 0 ? Math.max((day.hours / maxHours) * 120, 4) : 4;
            bar.style.height = `${height}px`;
            
            const label = document.createElement('div');
            label.textContent = day.date;
            label.style.fontSize = '0.75rem';
            label.style.color = 'rgb(var(--muted-foreground))';
            label.style.marginTop = '8px';
            label.style.textAlign = 'center';
            label.style.fontWeight = '500';
            
            const value = document.createElement('div');
            value.textContent = `${day.hours.toFixed(1)}h`;
            value.style.fontSize = '0.7rem';
            value.style.color = 'rgb(var(--primary))';
            value.style.fontWeight = '600';
            value.style.marginTop = '4px';
            value.style.textAlign = 'center';
            
            bar.addEventListener('mouseenter', () => {
                bar.style.opacity = '0.8';
                bar.style.transform = 'translateY(-2px)';
                bar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });
            
            bar.addEventListener('mouseleave', () => {
                bar.style.opacity = '1';
                bar.style.transform = 'translateY(0)';
                bar.style.boxShadow = 'none';
            });
            
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(value);
            dailyChart.appendChild(barContainer);
        });
    }
    
    // FIXED: Subject Chart with proper horizontal bars
    updateSubjectChart() {
        const subjectChart = document.getElementById('subject-chart');
        const subjectData = this.getSubjectData();
        
        subjectChart.innerHTML = '';
        subjectChart.style.padding = '10px 0';
        
        if (subjectData.length === 0) {
            subjectChart.innerHTML = '<div style="width: 100%; text-align: center; color: rgb(var(--muted-foreground)); padding: 50px 0; font-size: 0.9rem;">No study sessions recorded yet</div>';
            return;
        }
        
        const maxHours = Math.max(...subjectData.map(s => s.hours), 1);
        
        subjectData.forEach((subject, index) => {
            const barContainer = document.createElement('div');
            barContainer.style.display = 'flex';
            barContainer.style.alignItems = 'center';
            barContainer.style.marginBottom = '12px';
            barContainer.style.gap = '12px';
            
            const label = document.createElement('div');
            label.textContent = subject.name;
            label.style.minWidth = '100px';
            label.style.fontSize = '0.85rem';
            label.style.color = 'rgb(var(--foreground))';
            label.style.fontWeight = '500';
            label.style.textAlign = 'left';
            
            const barTrack = document.createElement('div');
            barTrack.style.flex = '1';
            barTrack.style.height = '20px';
            barTrack.style.backgroundColor = 'rgb(var(--muted))';
            barTrack.style.borderRadius = '10px';
            barTrack.style.overflow = 'hidden';
            barTrack.style.position = 'relative';
            
            const barFill = document.createElement('div');
            const width = (subject.hours / maxHours) * 100;
            barFill.style.width = `${width}%`;
            barFill.style.height = '100%';
            
            // Different colors for each subject
            const colors = [
                'rgb(59, 130, 246)',   // Blue
                'rgb(16, 185, 129)',   // Green
                'rgb(245, 101, 101)',  // Red
                'rgb(251, 191, 36)',   // Yellow
                'rgb(139, 92, 246)',   // Purple
                'rgb(236, 72, 153)',   // Pink
                'rgb(6, 182, 212)',    // Cyan
                'rgb(34, 197, 94)'     // Emerald
            ];
            barFill.style.backgroundColor = colors[index % colors.length];
            barFill.style.borderRadius = '10px';
            barFill.style.transition = 'all 0.3s ease';
            
            const value = document.createElement('div');
            value.textContent = `${subject.hours.toFixed(1)}h`;
            value.style.minWidth = '45px';
            value.style.fontSize = '0.8rem';
            value.style.color = 'rgb(var(--primary))';
            value.style.fontWeight = '600';
            value.style.textAlign = 'right';
            
            barContainer.addEventListener('mouseenter', () => {
                barFill.style.opacity = '0.8';
                barFill.style.transform = 'scaleY(1.2)';
                barContainer.style.transform = 'translateX(4px)';
            });
            
            barContainer.addEventListener('mouseleave', () => {
                barFill.style.opacity = '1';
                barFill.style.transform = 'scaleY(1)';
                barContainer.style.transform = 'translateX(0)';
            });
            
            barTrack.appendChild(barFill);
            barContainer.appendChild(label);
            barContainer.appendChild(barTrack);
            barContainer.appendChild(value);
            subjectChart.appendChild(barContainer);
        });
    }
    
    // Settings
    updateSettingsDisplay() {
        document.getElementById('work-time').value = this.settings.pomodoroWorkTime;
        document.getElementById('break-time').value = this.settings.pomodoroBreakTime;
        document.getElementById('sound-effects').checked = this.settings.enableSoundEffects;
        this.updateSubjectsList();
    }
    
    testSounds() {
        this.playSound('start');
        setTimeout(() => this.playSound('stop'), 1000);
        this.showToast('Sound Test', 'Playing test sounds', 'success');
    }
    
    resetAllData() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            localStorage.clear();
            this.sessions = [];
            this.goals = [];
            this.achievements = [];
            this.settings = {
                theme: 'light',
                pomodoroWorkTime: 25,
                pomodoroBreakTime: 5,
                enableSoundEffects: true,
                subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature']
            };
            
            this.setupDefaultAchievements();
            this.updateDisplay();
            this.updateSubjectsList();
            this.updateGoalsList();
            this.updateAchievementsList();
            this.updateAnalytics();
            this.updateSettingsDisplay();
            this.updateTimerControls();
            this.applyTheme();
            
            this.showToast('Data Reset Complete', 'All your data has been reset to defaults', 'success');
        }
    }
    
    // Utility Functions
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getTotalStudyHours() {
        return this.sessions.reduce((total, session) => total + (session.duration / 3600), 0);
    }
    
    getCurrentStreak() {
        if (this.sessions.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
            const hasStudiedThisDay = this.sessions.some(session => 
                this.isSameDay(new Date(session.startTime), currentDate)
            );
            
            if (hasStudiedThisDay) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    getLast7DaysData() {
        const data = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dayHours = this.sessions
                .filter(session => this.isSameDay(new Date(session.startTime), date))
                .reduce((total, session) => total + (session.duration / 3600), 0);
            
            data.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                hours: dayHours
            });
        }
        
        return data;
    }
    
    getSubjectData() {
        const subjects = {};
        
        this.sessions.forEach(session => {
            if (!subjects[session.subject]) {
                subjects[session.subject] = 0;
            }
            subjects[session.subject] += session.duration / 3600;
        });
        
        return Object.entries(subjects)
            .map(([name, hours]) => ({ name, hours }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 8);
    }
    
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
    
    isSameWeek(date1, date2) {
        const week1 = this.getWeekNumber(date1);
        const week2 = this.getWeekNumber(date2);
        return week1 === week2 && date1.getFullYear() === date2.getFullYear();
    }
    
    isSameMonth(date1, date2) {
        return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
    }
    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    playSound(type) {
        if (!this.settings.enableSoundEffects) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'start':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                break;
            case 'pause':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                break;
            case 'stop':
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                break;
            case 'break':
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                break;
        }
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    showToast(title, description, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-description">${description}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new StudyTracker();
});