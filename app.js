// ===== Data Storage Manager =====
// Centralized storage management for all app data
const StorageManager = {
    // Get all data for a specific date (YYYY-MM-DD format)
    getDateData(date) {
        const key = `schedule_${date}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : this.getDefaultDateData();
    },

    // Save data for a specific date
    saveDateData(date, data) {
        const key = `schedule_${date}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Get default empty data structure
    getDefaultDateData() {
        return {
            tasks: [],
            dsTopics: [],
            englishActivities: []
        };
    },

    // Clear all data (for testing purposes)
    clearAll() {
        localStorage.clear();
    }
};

// ===== Date Utility Functions =====
const DateUtil = {
    // Format date as YYYY-MM-DD
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Format date for display (e.g., "Monday, Dec 14, 2025")
    formatDateDisplay(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    // Get day name (e.g., "Mon", "Tue")
    getDayName(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    },

    // Get date string for display (e.g., "12/14")
    getDateString(date) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    },

    // Add days to a date
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    // Get start of week (Monday)
    getStartOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days, else go to Monday
        result.setDate(result.getDate() + diff);
        return result;
    }
};

// ===== Application State =====
const AppState = {
    currentDate: new Date(),
    currentData: null,
    editingTaskId: null,

    // Initialize state with today's data
    init() {
        this.currentData = StorageManager.getDateData(this.getCurrentDateString());
    },

    // Get current date as string
    getCurrentDateString() {
        return DateUtil.formatDate(this.currentDate);
    },

    // Change current date
    setDate(date) {
        this.currentDate = date;
        this.currentData = StorageManager.getDateData(this.getCurrentDateString());
    },

    // Save current data to storage
    save() {
        StorageManager.saveDateData(this.getCurrentDateString(), this.currentData);
    },

    // Navigate to previous day
    prevDay() {
        this.setDate(DateUtil.addDays(this.currentDate, -1));
    },

    // Navigate to next day
    nextDay() {
        this.setDate(DateUtil.addDays(this.currentDate, 1));
    }
};

// ===== Task Manager =====
const TaskManager = {
    // Generate unique ID for tasks
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Add new task
    addTask(taskData) {
        const task = {
            id: this.generateId(),
            startTime: taskData.startTime,
            endTime: taskData.endTime,
            name: taskData.name,
            category: taskData.category,
            completed: false
        };
        AppState.currentData.tasks.push(task);
        this.sortTasks();
        AppState.save();
        return task;
    },

    // Add recurring task to multiple dates
    addRecurringTask(taskData, numDays) {
        const currentDate = new Date(AppState.currentDate);
        
        for (let i = 0; i < numDays; i++) {
            const targetDate = DateUtil.addDays(currentDate, i);
            const dateString = DateUtil.formatDate(targetDate);
            const dateData = StorageManager.getDateData(dateString);
            
            const task = {
                id: this.generateId(),
                startTime: taskData.startTime,
                endTime: taskData.endTime,
                name: taskData.name,
                category: taskData.category,
                completed: false
            };
            
            dateData.tasks.push(task);
            dateData.tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
            StorageManager.saveDateData(dateString, dateData);
        }
        
        // Refresh current view
        AppState.currentData = StorageManager.getDateData(AppState.getCurrentDateString());
    },

    // Update existing task
    updateTask(id, taskData) {
        const task = AppState.currentData.tasks.find(t => t.id === id);
        if (task) {
            task.startTime = taskData.startTime;
            task.endTime = taskData.endTime;
            task.name = taskData.name;
            task.category = taskData.category;
            this.sortTasks();
            AppState.save();
        }
    },

    // Delete task
    deleteTask(id) {
        AppState.currentData.tasks = AppState.currentData.tasks.filter(t => t.id !== id);
        AppState.save();
    },

    // Toggle task completion
    toggleTask(id) {
        const task = AppState.currentData.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            AppState.save();
        }
    },

    // Sort tasks by start time
    sortTasks() {
        AppState.currentData.tasks.sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
    },

    // Get task by ID
    getTask(id) {
        return AppState.currentData.tasks.find(t => t.id === id);
    },

    // Get completion statistics
    getStats() {
        const total = AppState.currentData.tasks.length;
        const completed = AppState.currentData.tasks.filter(t => t.completed).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, rate };
    }
};

// ===== Data Science Topic Manager =====
const DSTopicManager = {
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Add new Data Science topic
    addTopic(topicData) {
        if (topicData.topic.trim()) {
            const topic = {
                id: this.generateId(),
                topic: topicData.topic.trim(),
                duration: topicData.duration || null,
                difficulty: topicData.difficulty || 'Intermediate',
                resource: topicData.resource || 'Other',
                notes: topicData.notes.trim() || null,
                date: AppState.getCurrentDateString()
            };
            AppState.currentData.dsTopics.push(topic);
            AppState.save();
        }
    },

    // Delete topic
    deleteTopic(id) {
        AppState.currentData.dsTopics = AppState.currentData.dsTopics.filter(t => t.id !== id);
        AppState.save();
    },

    // Get topics for current date
    getTopics() {
        return AppState.currentData.dsTopics || [];
    },

    // Get summary statistics
    getSummary() {
        const topics = this.getTopics();
        const totalSessions = topics.length;
        const totalMinutes = topics.reduce((sum, t) => sum + (parseInt(t.duration) || 0), 0);
        return { totalSessions, totalMinutes };
    }
};

// ===== English Activity Manager =====
const EnglishManager = {
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Add new English activity
    addActivity(activityData) {
        const activity = {
            id: this.generateId(),
            type: activityData.type,
            duration: activityData.duration || null,
            completed: activityData.completed === 'true',
            content: activityData.content.trim() || null,
            notes: activityData.notes.trim() || null,
            date: AppState.getCurrentDateString()
        };
        if (!AppState.currentData.englishActivities) {
            AppState.currentData.englishActivities = [];
        }
        AppState.currentData.englishActivities.push(activity);
        AppState.save();
    },

    // Delete activity
    deleteActivity(id) {
        if (!AppState.currentData.englishActivities) return;
        AppState.currentData.englishActivities = AppState.currentData.englishActivities.filter(a => a.id !== id);
        AppState.save();
    },

    // Get activities for current date
    getActivities() {
        return AppState.currentData.englishActivities || [];
    },

    // Get summary statistics
    getSummary() {
        const activities = this.getActivities();
        const totalActivities = activities.length;
        const completedActivities = activities.filter(a => a.completed).length;
        const totalMinutes = activities.reduce((sum, a) => sum + (parseInt(a.duration) || 0), 0);
        return { totalActivities, completedActivities, totalMinutes };
    }
};

// ===== UI Manager =====
const UI = {
    // Initialize UI
    init() {
        this.updateDateDisplay();
        this.renderTimetable();
        this.renderProgress();
        this.renderDSTopics();
        this.renderEnglishActivities();
        this.renderWeeklyOverview();
    },

    // Update date display in header
    updateDateDisplay() {
        const dateElement = document.getElementById('currentDate');
        dateElement.textContent = DateUtil.formatDateDisplay(AppState.currentDate);
    },

    // Render timetable list
    renderTimetable() {
        const container = document.getElementById('timetableList');
        const tasks = AppState.currentData.tasks;

        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks scheduled for today.<br>Click "+ Add Task" to get started.</div>';
            return;
        }

        container.innerHTML = tasks.map(task => {
            const categoryClass = task.category.toLowerCase().replace(/\s+/g, '-');
            return `
                <div class="timetable-item ${task.completed ? 'completed' : ''}">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        data-task-id="${task.id}"
                        ${task.completed ? 'checked' : ''}
                    >
                    <div class="task-info">
                        <div class="task-time">${task.startTime} - ${task.endTime}</div>
                        <div class="task-name">${task.name}</div>
                        <span class="task-category ${categoryClass}">${task.category}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-icon edit" data-task-id="${task.id}">✏️</button>
                        <button class="btn-icon delete" data-task-id="${task.id}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for checkboxes
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.dataset.taskId;
                TaskManager.toggleTask(taskId);
                this.renderTimetable();
                this.renderProgress();
                this.renderWeeklyOverview();
            });
        });

        // Add event listeners for edit buttons
        container.querySelectorAll('.edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskId;
                this.openEditTaskModal(taskId);
            });
        });

        // Add event listeners for delete buttons
        container.querySelectorAll('.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.dataset.taskId;
                if (confirm('Delete this task?')) {
                    TaskManager.deleteTask(taskId);
                    this.renderTimetable();
                    this.renderProgress();
                    this.renderWeeklyOverview();
                }
            });
        });
    },

    // Render progress summary
    renderProgress() {
        const stats = TaskManager.getStats();
        document.getElementById('completedTasks').textContent = stats.completed;
        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('completionRate').textContent = `${stats.rate}%`;
    },

    // Render Data Science topics
    renderDSTopics() {
        const container = document.getElementById('dsTopicList');
        const topics = DSTopicManager.getTopics();

        if (topics.length === 0) {
            container.innerHTML = '';
        } else {
            container.innerHTML = topics.map(topic => {
                const durationText = topic.duration ? `⏱️ ${topic.duration} min` : '';
                const notesHtml = topic.notes ? `<div class="item-notes">💡 ${topic.notes}</div>` : '';
                
                return `
                    <div class="topic-item">
                        <div class="item-header">
                            <div class="item-title">${topic.topic}</div>
                            <div class="item-actions">
                                <button class="btn-delete" data-topic-id="${topic.id}">🗑️</button>
                            </div>
                        </div>
                        <div class="item-meta">
                            ${durationText ? `<span class="meta-badge">${durationText}</span>` : ''}
                            <span class="meta-badge">📊 ${topic.difficulty}</span>
                            <span class="meta-badge">${topic.resource}</span>
                        </div>
                        ${notesHtml}
                    </div>
                `;
            }).join('');

            // Add event listeners for delete buttons
            container.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', (e) => {
                    const topicId = e.target.dataset.topicId;
                    if (confirm('Delete this study session?')) {
                        DSTopicManager.deleteTopic(topicId);
                        this.renderDSTopics();
                    }
                });
            });
        }

        this.renderDSSummary();
    },

    // Render Data Science summary
    renderDSSummary() {
        const container = document.getElementById('dsSummary');
        const summary = DSTopicManager.getSummary();
        
        if (summary.totalSessions === 0) {
            container.innerHTML = '';
            return;
        }

        const hours = Math.floor(summary.totalMinutes / 60);
        const minutes = summary.totalMinutes % 60;
        const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        container.innerHTML = `
            <h4>📈 Today's Data Science Summary</h4>
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="summary-stat-value">${summary.totalSessions}</div>
                    <div class="summary-stat-label">Sessions</div>
                </div>
                <div class="summary-stat">
                    <div class="summary-stat-value">${timeText}</div>
                    <div class="summary-stat-label">Study Time</div>
                </div>
            </div>
        `;
    },

    // Render English activities
    renderEnglishActivities() {
        const container = document.getElementById('englishList');
        const activities = EnglishManager.getActivities();

        if (activities.length === 0) {
            container.innerHTML = '';
        } else {
            container.innerHTML = activities.map(activity => {
                const statusClass = activity.completed ? 'completed' : 'planned';
                const statusIcon = activity.completed ? '✅' : '⏳';
                const durationText = activity.duration ? `⏱️ ${activity.duration} min` : '';
                const contentHtml = activity.content ? `<div class="item-notes">📝 ${activity.content}</div>` : '';
                const notesHtml = activity.notes ? `<div class="item-notes">💭 ${activity.notes}</div>` : '';
                
                return `
                    <div class="activity-item ${statusClass}">
                        <div class="item-header">
                            <div class="item-title">${statusIcon} ${activity.type}</div>
                            <div class="item-actions">
                                <button class="btn-delete" data-activity-id="${activity.id}">🗑️</button>
                            </div>
                        </div>
                        <div class="item-meta">
                            ${durationText ? `<span class="meta-badge">${durationText}</span>` : ''}
                            <span class="meta-badge">${activity.completed ? 'Completed' : 'Planned'}</span>
                        </div>
                        ${contentHtml}
                        ${notesHtml}
                    </div>
                `;
            }).join('');

            // Add event listeners for delete buttons
            container.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', (e) => {
                    const activityId = e.target.dataset.activityId;
                    if (confirm('Delete this activity?')) {
                        EnglishManager.deleteActivity(activityId);
                        this.renderEnglishActivities();
                    }
                });
            });
        }

        this.renderEnglishSummary();
    },

    // Render English summary
    renderEnglishSummary() {
        const container = document.getElementById('englishSummary');
        const summary = EnglishManager.getSummary();
        
        if (summary.totalActivities === 0) {
            container.innerHTML = '';
            return;
        }

        const hours = Math.floor(summary.totalMinutes / 60);
        const minutes = summary.totalMinutes % 60;
        const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        container.innerHTML = `
            <h4>📈 Today's English Summary</h4>
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="summary-stat-value">${summary.completedActivities}/${summary.totalActivities}</div>
                    <div class="summary-stat-label">Completed</div>
                </div>
                <div class="summary-stat">
                    <div class="summary-stat-value">${timeText}</div>
                    <div class="summary-stat-label">Practice Time</div>
                </div>
            </div>
        `;
    },

    // Render weekly overview
    renderWeeklyOverview() {
        const container = document.getElementById('weeklyStats');
        const startOfWeek = DateUtil.getStartOfWeek(AppState.currentDate);
        
        let html = '';
        for (let i = 0; i < 7; i++) {
            const date = DateUtil.addDays(startOfWeek, i);
            const dateString = DateUtil.formatDate(date);
            const data = StorageManager.getDateData(dateString);
            
            const total = data.tasks.length;
            const completed = data.tasks.filter(t => t.completed).length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            html += `
                <div class="day-card">
                    <div class="day-name">${DateUtil.getDayName(date)}</div>
                    <div class="day-date">${DateUtil.getDateString(date)}</div>
                    <div class="day-completion">${rate}%</div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    },

    // Open modal for adding new task
    openAddTaskModal() {
        AppState.editingTaskId = null;
        document.getElementById('modalTitle').textContent = 'Add Task';
        document.getElementById('taskForm').reset();
        document.getElementById('taskRecurring').checked = false;
        document.getElementById('recurringOptions').style.display = 'none';
        document.getElementById('recurringGroup').style.display = 'block';
        document.getElementById('taskModal').classList.add('active');
    },

    // Open modal for editing existing task
    openEditTaskModal(taskId) {
        AppState.editingTaskId = taskId;
        const task = TaskManager.getTask(taskId);
        
        if (task) {
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTime').value = task.startTime;
            document.getElementById('recurringGroup').style.display = 'none';
            document.getElementById('taskEndTime').value = task.endTime;
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskModal').classList.add('active');
        }
    },

    // Close task modal
    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskForm').reset();
        AppState.editingTaskId = null;
    },

    // Refresh entire UI
    refresh() {
        this.updateDateDisplay();
        this.renderTimetable();
        this.renderProgress();
        this.renderDSTopics();
        this.renderEnglishActivities();
        this.renderWeeklyOverview();
    }
};

// ===== Event Handlers =====
const EventHandlers = {
    init() {
        // Date navigation
        document.getElementById('prevDay').addEventListener('click', () => {
            AppState.prevDay();
            UI.refresh();
        });

        document.getElementById('nextDay').addEventListener('click', () => {
            AppState.nextDay();
            UI.refresh();
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            UI.openAddTaskModal();
        });

        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const taskData = {
                startTime: document.getElementById('taskTime').value,
                endTime: document.getElementById('taskEndTime').value,
                name: document.getElementById('taskName').value,
                category: document.getElementById('taskCategory').value
            };
const isRecurring = document.getElementById('taskRecurring').checked;
                if (isRecurring) {
                    const numDays = parseInt(document.getElementById('recurringDays').value) || 30;
                    TaskManager.addRecurringTask(taskData, numDays);
                } else {
                    TaskManager.addTask(taskData);
                }
            if (AppState.editingTaskId) {
                TaskManager.updateTask(AppState.editingTaskId, taskData);
            } else {
                TaskManager.addTask(taskData);
            }

            UI.closeTaskModal();
            UI.renderTimetable();
            UI.renderProgress();
            UI.renderWeeklyOverview();
        });

        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => {
            UI.closeTaskModal();
        });


        // Toggle recurring options
        document.getElementById('taskRecurring').addEventListener('change', (e) => {
            const options = document.getElementById('recurringOptions');
            options.style.display = e.target.checked ? 'block' : 'none';
        });
        document.getElementById('cancelModal').addEventListener('click', () => {
            UI.closeTaskModal();
        });

        // Close modal on outside click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                UI.closeTaskModal();
            }
        });

        // Toggle Data Science form
        document.getElementById('toggleDSForm').addEventListener('click', () => {
            const form = document.getElementById('dsForm');
            const button = document.getElementById('toggleDSForm');
            if (form.style.display === 'none') {
                form.style.display = 'block';
                button.textContent = '- Close Form';
                button.classList.add('active');
            } else {
                form.style.display = 'none';
                button.textContent = '+ Add Study Session';
                button.classList.remove('active');
            }
        });

        // Data Science topic save
        document.getElementById('saveDSTopic').addEventListener('click', () => {
            const topic = document.getElementById('dsTopicInput').value;
            const duration = document.getElementById('dsDuration').value;
            const difficulty = document.getElementById('dsDifficulty').value;
            const resource = document.getElementById('dsResource').value;
            const notes = document.getElementById('dsNotes').value;
            
            if (topic.trim()) {
                DSTopicManager.addTopic({
                    topic,
                    duration,
                    difficulty,
                    resource,
                    notes
                });
                
                // Clear form
                document.getElementById('dsTopicInput').value = '';
                document.getElementById('dsDuration').value = '';
                document.getElementById('dsDifficulty').value = 'Intermediate';
                document.getElementById('dsResource').value = 'Video';
                document.getElementById('dsNotes').value = '';
                
                UI.renderDSTopics();
            }
        });

        // Allow Enter key in DS topic input
        document.getElementById('dsTopicInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                document.getElementById('saveDSTopic').click();
            }
        });

        // Toggle English form
        document.getElementById('toggleEnglishForm').addEventListener('click', () => {
            const form = document.getElementById('englishForm');
            const button = document.getElementById('toggleEnglishForm');
            if (form.style.display === 'none') {
                form.style.display = 'block';
                button.textContent = '- Close Form';
                button.classList.add('active');
            } else {
                form.style.display = 'none';
                button.textContent = '+ Add Activity';
                button.classList.remove('active');
            }
        });

        // English activity save
        document.getElementById('saveEnglish').addEventListener('click', () => {
            const type = document.getElementById('englishActivity').value;
            const duration = document.getElementById('englishDuration').value;
            const completed = document.getElementById('englishCompleted').value;
            const content = document.getElementById('englishContent').value;
            const notes = document.getElementById('englishNotes').value;
            
            EnglishManager.addActivity({
                type,
                duration,
                completed,
                content,
                notes
            });
            
            // Clear form
            document.getElementById('englishActivity').value = 'Podcast';
            document.getElementById('englishDuration').value = '';
            document.getElementById('englishCompleted').value = 'true';
            document.getElementById('englishContent').value = '';
            document.getElementById('englishNotes').value = '';
            
            UI.renderEnglishActivities();
        });
    }
};

// ===== Application Initialization =====
// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Initialize application state
    AppState.init();
    
    // Initialize UI
    UI.init();
    
    // Setup event handlers
    EventHandlers.init();
    
    console.log('Student Productivity System initialized successfully');
});
