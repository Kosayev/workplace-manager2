
// --- Supabase Client Initialization ---
const SUPABASE_URL = 'https://fpykdcvcswamsiawtibh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweWtkY3Zjc3dhbXNpYXd0aWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTQxNjUsImV4cCI6MjA2NzA5MDE2NX0.G8VYMDmNSdXeLoDU1PBihAq7ybWhGi_YhRWvjRgsb0U';

// Check if the placeholder values have been replaced
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  alert('SupabaseのURLとanon keyをapp.jsファイルに設定してください。');
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application Data and State
let appData = {
  departments: [],
  priorities: [],
  schedules: [],
  handovers: [],
  tasks: []
};

let currentCalendarDate = new Date();
let currentSection = 'dashboard';
let activeHandoverDept = 'general';

// --- Data Fetching Functions ---
async function fetchData() {
  try {
    const [departmentsRes, prioritiesRes, schedulesRes, handoversRes, tasksRes] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('priorities').select('*'),
      supabase.from('schedules').select('*'),
      supabase.from('handovers').select('*'),
      supabase.from('tasks').select('*')
    ]);

    if (departmentsRes.error) throw departmentsRes.error;
    if (prioritiesRes.error) throw prioritiesRes.error;
    if (schedulesRes.error) throw schedulesRes.error;
    if (handoversRes.error) throw handoversRes.error;
    if (tasksRes.error) throw tasksRes.error;

    appData.departments = departmentsRes.data;
    appData.priorities = prioritiesRes.data;
    appData.schedules = schedulesRes.data;
    appData.handovers = handoversRes.data;
    appData.tasks = tasksRes.data;
    
    // Set default active department if it exists
    if (appData.departments.length > 0) {
        activeHandoverDept = appData.departments[0].id;
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    alert('データの読み込みに失敗しました。');
  }
}


// Utility Functions
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5);
}

function formatDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getDepartmentName(id) {
  return appData.departments.find(d => d.id === id)?.name || id;
}

function getDepartmentColor(id) {
  return appData.departments.find(d => d.id === id)?.color || '#666';
}

function getPriorityName(id) {
  return appData.priorities.find(p => p.id === id)?.name || id;
}

function getPriorityColor(id) {
  return appData.priorities.find(p => p.id === id)?.color || '#666';
}

function getHandoverStatusName(status) {
  switch (status) {
    case 'pending': return '未対応';
    case 'in-progress': return '対応中';
    case 'completed': return '完了';
    default: return status;
  }
}

// Navigation Functions
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const body = document.body; // Get the body element

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Close sidebar on navigation link click for mobile
      if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-open');
      }
    });
  });

  sidebarToggle.addEventListener('click', () => {
    body.classList.toggle('sidebar-open'); // Toggle sidebar-open class on body
  });
}

function showSection(section) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(s => s.classList.remove('active'));
  
  const targetSection = document.getElementById(`${section}-section`);
  if (targetSection) {
    targetSection.classList.add('active');
    currentSection = section;
    
    switch(section) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'handovers':
        renderHandovers();
        break;
      case 'tasks':
        renderTasks();
        break;
      case 'calendar':
        renderCalendar();
        break;
    }
  }
}

// Dashboard Functions
function renderDashboard() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  document.getElementById('today-date').textContent = formatDate(todayStr);
  document.getElementById('tomorrow-date').textContent = formatDate(tomorrowStr);
  
  const searchInput = document.getElementById('dashboard-search');
  searchInput.addEventListener('input', renderDashboard);

  const searchTerm = searchInput.value.toLowerCase();

  renderScheduleList('today-schedule', todayStr, searchTerm);
  renderScheduleList('tomorrow-schedule', tomorrowStr, searchTerm);
}

function renderScheduleList(containerId, date, searchTerm = '') {
  const container = document.getElementById(containerId);
  let schedules = appData.schedules.filter(s => s.date === date);
  
  if (searchTerm) {
    schedules = schedules.filter(s => 
      s.title.toLowerCase().includes(searchTerm) ||
      s.description.toLowerCase().includes(searchTerm) ||
      getDepartmentName(s.department).toLowerCase().includes(searchTerm)
    );
  }
  
  if (schedules.length === 0) {
    container.innerHTML = '<div class="empty-state">スケジュールがありません</div>';
    return;
  }
  
  container.innerHTML = schedules.map(schedule => `
    <div class="schedule-item">
      <div class="schedule-time">${formatTime(schedule.time)}</div>
      <div class="schedule-details">
        <div class="schedule-title">${schedule.title}</div>
        <div class="schedule-description">${schedule.description}</div>
        <div class="schedule-department" style="background-color: ${getDepartmentColor(schedule.department)}">
          ${getDepartmentName(schedule.department)}
        </div>
      </div>
      <button class="delete-btn" data-id="${schedule.id}">×</button>
    </div>
  `).join('');

  container.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const scheduleId = e.target.dataset.id;
      if (confirm('このスケジュールを削除しますか？')) {
        deleteSchedule(scheduleId);
      }
    });
  });
}

// Handovers Functions
function renderHandovers() {
  renderHandoverTabs();
  const searchInput = document.getElementById('handover-search');
  searchInput.addEventListener('input', renderHandoverContent);
  renderHandoverContent();
}

function renderHandoverTabs() {
  const tabsContainer = document.getElementById('handover-tabs');
  tabsContainer.innerHTML = appData.departments.map(dept => `
    <button class="tab-button ${dept.id === activeHandoverDept ? 'active' : ''}" 
            data-department="${dept.id}">
      ${dept.name}
    </button>
  `).join('');
  
  tabsContainer.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      activeHandoverDept = button.dataset.department;
      renderHandoverContent(); // Only re-render content on tab change
    });
  });
}

function renderHandoverContent() {
  const contentContainer = document.getElementById('handover-content');
  let handovers = appData.handovers.filter(h => h.department === activeHandoverDept);
  
  const searchTerm = document.getElementById('handover-search').value.toLowerCase();
  if (searchTerm) {
    handovers = handovers.filter(h => 
      h.title.toLowerCase().includes(searchTerm) ||
      h.description.toLowerCase().includes(searchTerm) ||
      getPriorityName(h.priority).toLowerCase().includes(searchTerm)
    );
  }

  const statusFilter = document.getElementById('handover-status-filter').value;
  if (statusFilter) {
    handovers = handovers.filter(h => h.status === statusFilter);
  }

  if (handovers.length === 0) {
    contentContainer.innerHTML = '<div class="empty-state">申し送り事項がありません</div>';
    return;
  }
  
  contentContainer.innerHTML = handovers.map(handover => `
    <div class="handover-item">
      <div class="handover-priority priority-${handover.priority}">
        ${getPriorityName(handover.priority)}
      </div>
      <div class="handover-details">
        <div class="handover-title">${handover.title}</div>
        <div class="handover-description">${handover.description}</div>
        <div class="handover-timestamp">${formatDateTime(handover.timestamp)}</div>
      </div>
      <div class="handover-status status--${handover.status}">
        ${getHandoverStatusName(handover.status)}
      </div>
      <button class="delete-btn" data-id="${handover.id}">×</button>
    </div>
  `).join('');

  contentContainer.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const handoverId = e.target.dataset.id;
      if (confirm('この申し送り事項を削除しますか？')) {
        deleteHandover(handoverId);
      }
    });
  });
}

// Tasks Functions
function renderTasks() {
  renderTaskFilters();
  const searchInput = document.getElementById('task-search');
  searchInput.addEventListener('input', renderTasksGrid);
  renderTasksGrid();
}

function renderTaskFilters() {
  const deptFilter = document.getElementById('task-department-filter');
  const priorityFilter = document.getElementById('task-priority-filter');
  
  deptFilter.innerHTML = '<option value="">全部署</option>' + 
    appData.departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');
  
  priorityFilter.innerHTML = '<option value="">全優先度</option>' + 
    appData.priorities.map(priority => `<option value="${priority.id}">${priority.name}</option>`).join('');
  
  deptFilter.addEventListener('change', renderTasksGrid);
  priorityFilter.addEventListener('change', renderTasksGrid);
}

function renderTasksGrid() {
  const container = document.getElementById('tasks-grid');
  const deptFilter = document.getElementById('task-department-filter').value;
  const priorityFilter = document.getElementById('task-priority-filter').value;
  
  let filteredTasks = appData.tasks;
  
  if (deptFilter) {
    filteredTasks = filteredTasks.filter(t => t.department === deptFilter);
  }
  
  if (priorityFilter) {
    filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
  }

  const searchTerm = document.getElementById('task-search').value.toLowerCase();
  if (searchTerm) {
    filteredTasks = filteredTasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm) ||
      t.description.toLowerCase().includes(searchTerm) ||
      getDepartmentName(t.department).toLowerCase().includes(searchTerm) ||
      getPriorityName(t.priority).toLowerCase().includes(searchTerm)
    );
  }
  
  if (filteredTasks.length === 0) {
    container.innerHTML = '<div class="empty-state">タスクがありません</div>';
    return;
  }
  
  container.innerHTML = filteredTasks.map(task => `
    <div class="task-card">
      <div class="task-header">
        <h4 class="task-title">${task.title}</h4>
        <span class="task-priority priority-${task.priority}">${getPriorityName(task.priority)}</span>
      </div>
      <div class="task-description">${task.description}</div>
      <div class="task-meta">
        <div>
          <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
          期限: ${formatDate(task.dueDate)}
        </div>
        <div style="color: ${getDepartmentColor(task.department)}">
          ${getDepartmentName(task.department)}
        </div>
      </div>
      <button class="delete-btn" data-id="${task.id}">×</button>
    </div>
  `).join('');

  // Add event listeners for checkboxes after rendering
  container.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => toggleTaskCompletion(e.target.dataset.taskId));
  });

  container.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const taskId = e.target.dataset.id;
      if (confirm('このタスクを削除しますか？')) {
        deleteTask(taskId);
      }
    });
  });
}

async function toggleTaskCompletion(taskId) {
  const taskIdNum = parseInt(taskId, 10);
  const task = appData.tasks.find(t => t.id === taskIdNum);
  if (task) {
    const newStatus = !task.completed;
    const { error } = await supabase
      .from('tasks')
      .update({ completed: newStatus })
      .eq('id', taskIdNum);

    if (error) {
      console.error('Error updating task:', error);
      alert('タスクの状態更新に失敗しました。');
    } else {
      task.completed = newStatus;
      renderTasksGrid();
    }
  }
}

// Calendar Functions
function renderCalendar() {
  renderCalendarHeader();
  renderCalendarGrid();
  renderCalendarLegend();
}

function renderCalendarHeader() {
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthElement = document.getElementById('current-month');
  monthElement.textContent = `${currentCalendarDate.getFullYear()}年${monthNames[currentCalendarDate.getMonth()]}`;
  
  document.getElementById('prev-month').onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  };
  
  document.getElementById('next-month').onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  };
}

function renderCalendarGrid() {
  const container = document.getElementById('calendar-grid');
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  let html = '';
  
  const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];
  dayHeaders.forEach(day => {
    html += `<div class="calendar-day" style="background-color: var(--color-secondary); font-weight: bold; min-height: 40px; align-items: center; justify-content: center;">${day}</div>`;
  });
  
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = dateStr === todayStr;
    const daySchedules = appData.schedules.filter(s => s.date === dateStr);
    
    let dayClass = 'calendar-day';
    if (!isCurrentMonth) dayClass += ' other-month';
    if (isToday) dayClass += ' today';
    
    html += `
      <div class="${dayClass}" data-date="${dateStr}">
        <div class="calendar-day-number">${currentDate.getDate()}</div>
        ${daySchedules.map(schedule => `
          <div class="calendar-event" style="background-color: ${getDepartmentColor(schedule.department)}">
            ${schedule.title}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  container.innerHTML = html;

  // Add event listeners for calendar days
  container.querySelectorAll('.calendar-day').forEach(dayElement => {
    dayElement.addEventListener('click', () => {
      const dateStr = dayElement.dataset.date;
      if (dateStr) {
        showDailyScheduleModal(dateStr);
      }
    });
  });
}

function renderCalendarLegend() {
  const container = document.getElementById('calendar-legend');
  container.innerHTML = appData.departments.map(dept => `
    <div class="legend-item">
      <div class="legend-color" style="background-color: ${dept.color}"></div>
      <span>${dept.name}</span>
    </div>
  `).join('');
}

// Daily Schedule Modal Function
function showDailyScheduleModal(dateStr) {
  const schedulesForDate = appData.schedules.filter(s => s.date === dateStr);
  let modalContent = '';

  if (schedulesForDate.length === 0) {
    modalContent = '<div class="empty-state">この日のスケジュールはありません</div>';
  } else {
    modalContent = schedulesForDate.map(schedule => `
      <div class="schedule-item">
        <div class="schedule-time">${formatTime(schedule.time)}</div>
        <div class="schedule-details">
          <div class="schedule-title">${schedule.title}</div>
          <div class="schedule-description">${schedule.description}</div>
          <div class="schedule-department" style="background-color: ${getDepartmentColor(schedule.department)}">
            ${getDepartmentName(schedule.department)}
          </div>
        </div>
        <button class="edit-btn" data-id="${schedule.id}">編集</button>
      </div>
    `).join('');
  }

  showModal(`${formatDate(dateStr)}のスケジュール`, modalContent);

  // Add event listeners for edit buttons in the daily schedule modal
  document.querySelectorAll('#modal-body .edit-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const scheduleId = e.target.dataset.id;
      showEditScheduleModal(scheduleId);
    });
  });
}

async function showEditScheduleModal(scheduleId) {
  const schedule = appData.schedules.find(s => s.id === parseInt(scheduleId));
  if (!schedule) return;

  const content = `
    <form class="modal-form" id="edit-schedule-form">
      <input type="hidden" name="id" value="${schedule.id}">
      <div class="form-group"><label class="form-label">タイトル</label><input type="text" class="form-control" name="title" value="${schedule.title}" required></div>
      <div class="form-group"><label class="form-label">部署</label><select class="form-control" name="department" required>${appData.departments.map(d => `<option value="${d.id}" ${schedule.department === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">日付</label><input type="date" class="form-control" name="date" value="${schedule.date}" required></div>
      <div class="form-group"><label class="form-label">時間</label><input type="time" class="form-control" name="time" value="${schedule.time}" required></div>
      <div class="form-group"><label class="form-label">説明</label><textarea class="form-control" name="description" rows="3">${schedule.description || ''}</textarea></div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="button" class="btn btn--danger" onclick="deleteSchedule(${schedule.id}); document.getElementById('modal').classList.remove('active');">削除</button>
        <button type="submit" class="btn btn--primary">保存</button>
      </div>
    </form>
  `;
  showModal('スケジュール編集', content);
  document.getElementById('edit-schedule-form').addEventListener('submit', editSchedule);
}

async function editSchedule(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const updatedSchedule = {
    id: parseInt(formData.get('id')),
    title: formData.get('title'),
    department: formData.get('department'),
    date: formData.get('date'),
    time: formData.get('time'),
    description: formData.get('description') || '',
  };

  const { data, error } = await supabase
    .from('schedules')
    .update(updatedSchedule)
    .eq('id', updatedSchedule.id)
    .select();

  if (error) {
    console.error('Error updating schedule:', error);
    alert('スケジュールの更新に失敗しました。');
  } else {
    // Update appData
    const index = appData.schedules.findIndex(s => s.id === updatedSchedule.id);
    if (index !== -1) {
      appData.schedules[index] = data[0];
    }
    document.getElementById('modal').classList.remove('active');
    if (currentSection === 'dashboard') renderDashboard();
    else if (currentSection === 'calendar') renderCalendar();
  }
}

// Modal Functions
function initializeModal() {
  const modal = document.getElementById('modal');
  const closeBtn = document.getElementById('modal-close');
  
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  document.getElementById('modal').classList.add('active');
}

function showScheduleModal() {
  const content = `
    <form class="modal-form" id="add-schedule-form">
      <div class="form-group"><label class="form-label">タイトル</label><input type="text" class="form-control" name="title" required></div>
      <div class="form-group"><label class="form-label">部署</label><select class="form-control" name="department" required>${appData.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">日付</label><input type="date" class="form-control" name="date" required></div>
      <div class="form-group"><label class="form-label">時間</label><input type="time" class="form-control" name="time" required></div>
      <div class="form-group"><label class="form-label">説明</label><textarea class="form-control" name="description" rows="3"></textarea></div>
      <div class="modal-buttons"><button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button><button type="submit" class="btn btn--primary">追加</button></div>
    </form>
  `;
  showModal('スケジュール追加', content);
  document.getElementById('add-schedule-form').addEventListener('submit', addSchedule);
}

function showHandoverModal() {
  const content = `
    <form class="modal-form" id="add-handover-form">
      <div class="form-group"><label class="form-label">タイトル</label><input type="text" class="form-control" name="title" required></div>
      <div class="form-group"><label class="form-label">部署</label><select class="form-control" name="department" required>${appData.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">優先度</label><select class="form-control" name="priority" required>${appData.priorities.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">ステータス</label><select class="form-control" name="status">
        <option value="pending" selected>未対応</option>
        <option value="in-progress">対応中</option>
        <option value="completed">完了</option>
      </select></div>
      <div class="form-group"><label class="form-label">内容</label><textarea class="form-control" name="description" rows="4" required></textarea></div>
      <div class="modal-buttons"><button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button><button type="submit" class="btn btn--primary">追加</button></div>
    </form>
  `;
  showModal('申し送り追加', content);
  document.getElementById('add-handover-form').addEventListener('submit', addHandover);
}

function showTaskModal() {
  const content = `
    <form class="modal-form" id="add-task-form">
      <div class="form-group"><label class="form-label">タイトル</label><input type="text" class="form-control" name="title" required></div>
      <div class="form-group"><label class="form-label">部署</label><select class="form-control" name="department" required>${appData.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">優先度</label><select class="form-control" name="priority" required>${appData.priorities.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">期限</label><input type="date" class="form-control" name="dueDate" required></div>
      <div class="form-group"><label class="form-label">内容</label><textarea class="form-control" name="description" rows="3" required></textarea></div>
      <div class="form-group"><label class="form-label">担当者</label><input type="text" class="form-control" name="assignedBy" required></div>
      <div class="modal-buttons"><button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button><button type="submit" class="btn btn--primary">追加</button></div>
    </form>
  `;
  showModal('タスク追加', content);
  document.getElementById('add-task-form').addEventListener('submit', addTask);
}

// --- Data Modification Functions ---
async function addSchedule(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const newSchedule = {
    title: formData.get('title'),
    department: formData.get('department'),
    date: formData.get('date'),
    time: formData.get('time'),
    description: formData.get('description') || '',
    duration: 60
  };
  
  const { data, error } = await supabase.from('schedules').insert([newSchedule]).select();
  
  if (error) {
    console.error('Error adding schedule:', error);
    alert('スケジュールの追加に失敗しました。');
  } else {
    appData.schedules.push(data[0]);
    document.getElementById('modal').classList.remove('active');
    if (currentSection === 'dashboard') renderDashboard();
    else if (currentSection === 'calendar') renderCalendar();
  }
}

async function deleteSchedule(scheduleId) {
  const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);

  if (error) {
    console.error('Error deleting schedule:', error);
    alert('スケジュールの削除に失敗しました。');
  } else {
    appData.schedules = appData.schedules.filter(s => s.id !== parseInt(scheduleId));
    if (currentSection === 'dashboard') renderDashboard();
    else if (currentSection === 'calendar') renderCalendar();
  }
}

async function addHandover(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const newHandover = {
    department: formData.get('department'),
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    timestamp: new Date().toISOString(),
    status: formData.get('status') || 'pending' // Add status, default to 'pending'
  };
  
  const { data, error } = await supabase.from('handovers').insert([newHandover]).select();

  if (error) {
    console.error('Error adding handover:', error);
    alert('申し送りの追加に失敗しました。');
  } else {
    appData.handovers.push(data[0]);
    document.getElementById('modal').classList.remove('active');
    if (currentSection === 'handovers') renderHandovers();
  }
}

async function deleteHandover(handoverId) {
  const { error } = await supabase.from('handovers').delete().eq('id', handoverId);

  if (error) {
    console.error('Error deleting handover:', error);
    alert('申し送り事項の削除に失敗しました。');
  } else {
    appData.handovers = appData.handovers.filter(h => h.id !== parseInt(handoverId));
    if (currentSection === 'handovers') renderHandovers();
  }
}

async function addTask(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const newTask = {
    title: formData.get('title'),
    department: formData.get('department'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate'),
    assignedBy: formData.get('assignedBy'),
    completed: false
  };
  
  const { data, error } = await supabase.from('tasks').insert([newTask]).select();

  if (error) {
    console.error('Error adding task:', error);
    alert('タスクの追加に失敗しました。');
  } else {
    appData.tasks.push(data[0]);
    document.getElementById('modal').classList.remove('active');
    if (currentSection === 'tasks') renderTasks();
  }
}

async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    alert('タスクの削除に失敗しました。');
  } else {
    appData.tasks = appData.tasks.filter(t => t.id !== parseInt(taskId));
    if (currentSection === 'tasks') renderTasks();
  }
}

// Initialize Application
async function initializeApp() {
  initializeNavigation();
  initializeModal();
  
  document.getElementById('add-schedule-btn').addEventListener('click', showScheduleModal);
  document.getElementById('add-handover-btn').addEventListener('click', showHandoverModal);
  document.getElementById('add-task-btn').addEventListener('click', showTaskModal);
  
  await fetchData();
  
  showSection('dashboard');
}

document.addEventListener('DOMContentLoaded', initializeApp);
