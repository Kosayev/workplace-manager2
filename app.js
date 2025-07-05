
// --- Supabase Client Initialization ---
const SUPABASE_URL = 'https://fpykdcvcswamsiawtibh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweWtkY3Zjc3dhbXNpYXd0aWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTQxNjUsImV4cCI6MjA2NzA5MDE2NX0.G8VYMDmNSdXeLoDU1PBihAq7ybWhGi_YhRWvjRgsb0U';

// Check if the placeholder values have been replaced
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  alert('SupabaseのURLとanon keyをapp.jsファイルに設定してください。');
}

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Error Tracking and Monitoring System
const ErrorTracker = {
  // Sentry初期化（本番環境でのみ有効化）
  init() {
    if (typeof Sentry !== 'undefined' && window.location.hostname !== 'localhost') {
      Sentry.init({
        dsn: 'https://your-sentry-dsn@sentry.io/your-project-id', // 実際のDSNに置き換え
        environment: 'production',
        integrations: [
          new Sentry.BrowserTracing(),
        ],
        tracesSampleRate: 0.1, // 10%のトランザクションをサンプリング
        beforeSend(event) {
          // 個人情報を含む可能性のあるデータを除外
          if (event.user) {
            delete event.user.email;
            delete event.user.ip_address;
          }
          return event;
        }
      });
      
      console.log('🔍 Sentryエラートラッキング初期化完了');
      return true;
    } else {
      console.log('⚠️ Sentryエラートラッキングは本番環境でのみ有効です');
      return false;
    }
  },

  // エラーを手動で報告
  captureError(error, context = {}) {
    console.error('エラーを検出:', error);
    
    try {
      if (typeof Sentry !== 'undefined' && Sentry.captureException) {
        Sentry.withScope((scope) => {
          scope.setTag('component', context.component || 'unknown');
          scope.setLevel('error');
          scope.setContext('errorContext', context);
          Sentry.captureException(error);
        });
      }
      
      // ローカルエラーログも保存
      this.logErrorLocally(error, context);
    } catch (sentryError) {
      console.warn('Sentryエラー送信に失敗:', sentryError);
    }
  },

  // 警告レベルのイベントを報告
  captureWarning(message, context = {}) {
    console.warn('警告:', message);
    
    try {
      if (typeof Sentry !== 'undefined' && Sentry.captureMessage) {
        Sentry.withScope((scope) => {
          scope.setTag('component', context.component || 'unknown');
          scope.setLevel('warning');
          scope.setContext('warningContext', context);
          Sentry.captureMessage(message);
        });
      }
    } catch (sentryError) {
      console.warn('Sentry警告送信に失敗:', sentryError);
    }
  },

  // ローカルエラーログ（Sentryが使えない場合のフォールバック）
  logErrorLocally(error, context) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message || error,
        stack: error.stack,
        context: context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(errorLog);
      
      // 最新50件のみ保持
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (storageError) {
      console.warn('ローカルエラーログ保存に失敗:', storageError);
    }
  },

  // ローカルエラーログを取得
  getLocalErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  },

  // ローカルエラーログをクリア
  clearLocalErrorLogs() {
    try {
      localStorage.removeItem('error_logs');
      console.log('ローカルエラーログをクリアしました');
    } catch (error) {
      console.warn('ローカルエラーログクリアに失敗:', error);
    }
  }
};

// Task Status Configuration
const TaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PENDING_APPROVAL: 'pending_approval',
  COMPLETED: 'completed',
  
  // ステータスラベル
  LABELS: {
    'not_started': '未着手',
    'in_progress': '着手中', 
    'pending_approval': '決裁中',
    'completed': '対応済'
  },
  
  // ステータスのCSS クラス
  CSS_CLASSES: {
    'not_started': 'status--not-started',
    'in_progress': 'status--in-progress',
    'pending_approval': 'status--pending-approval',
    'completed': 'status--completed'
  },
  
  // ステータスの順序（進行度順）
  ORDER: ['not_started', 'in_progress', 'pending_approval', 'completed'],
  
  // 次のステータスを取得
  getNextStatus(currentStatus) {
    const currentIndex = this.ORDER.indexOf(currentStatus);
    if (currentIndex < this.ORDER.length - 1) {
      return this.ORDER[currentIndex + 1];
    }
    return currentStatus;
  },
  
  // 前のステータスを取得
  getPreviousStatus(currentStatus) {
    const currentIndex = this.ORDER.indexOf(currentStatus);
    if (currentIndex > 0) {
      return this.ORDER[currentIndex - 1];
    }
    return currentStatus;
  }
};

// Handover Status Configuration
const HandoverStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  
  // ステータスラベル
  LABELS: {
    'pending': '未対応',
    'in_progress': '対応中',
    'completed': '対応済'
  },
  
  // ステータスのCSS クラス
  CSS_CLASSES: {
    'pending': 'status--pending',
    'in_progress': 'status--in-progress',
    'completed': 'status--completed'
  },
  
  // ステータスの順序（進行度順）
  ORDER: ['pending', 'in_progress', 'completed'],
  
  // 次のステータスを取得
  getNextStatus(currentStatus) {
    const currentIndex = this.ORDER.indexOf(currentStatus);
    if (currentIndex < this.ORDER.length - 1) {
      return this.ORDER[currentIndex + 1];
    }
    return currentStatus;
  },
  
  // 前のステータスを取得
  getPreviousStatus(currentStatus) {
    const currentIndex = this.ORDER.indexOf(currentStatus);
    if (currentIndex > 0) {
      return this.ORDER[currentIndex - 1];
    }
    return currentStatus;
  }
};

// Application Health Monitor
const HealthMonitor = {
  startTime: Date.now(),
  metrics: {
    pageLoads: 0,
    errors: 0,
    apiCalls: 0,
    apiErrors: 0,
    cacheHits: 0,
    cacheMisses: 0
  },

  // メトリクス初期化
  init() {
    this.startTime = Date.now();
    this.setupPerformanceMonitoring();
    this.setupNetworkMonitoring();
    console.log('📊 ヘルスモニター初期化完了');
  },

  // パフォーマンス監視
  setupPerformanceMonitoring() {
    // ページロード時間の監視
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          
          if (loadTime > 5000) { // 5秒以上
            ErrorTracker.captureWarning('ページロード時間が遅い', {
              component: 'performance',
              loadTime: loadTime,
              url: window.location.href
            });
          }
          
          console.log(`⏱️ ページロード時間: ${loadTime}ms`);
        }
      }, 100);
    });

    // メモリ使用量の監視（対応ブラウザのみ）
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (memoryUsage > 0.9) { // 90%以上
          ErrorTracker.captureWarning('メモリ使用量が高い', {
            component: 'performance',
            memoryUsage: `${(memoryUsage * 100).toFixed(1)}%`,
            usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024)
          });
        }
      }, 60000); // 1分ごと
    }
  },

  // ネットワーク監視
  setupNetworkMonitoring() {
    // オンライン/オフライン状態の監視
    window.addEventListener('online', () => {
      console.log('🌐 ネットワーク接続復帰');
      this.recordEvent('network_restored');
    });

    window.addEventListener('offline', () => {
      console.log('📡 ネットワーク接続断');
      ErrorTracker.captureWarning('ネットワーク接続が切断されました', {
        component: 'network'
      });
      this.recordEvent('network_lost');
    });
  },

  // メトリクスの記録
  recordEvent(eventType, details = {}) {
    switch(eventType) {
      case 'page_load':
        this.metrics.pageLoads++;
        break;
      case 'error':
        this.metrics.errors++;
        break;
      case 'api_call':
        this.metrics.apiCalls++;
        break;
      case 'api_error':
        this.metrics.apiErrors++;
        break;
      case 'cache_hit':
        this.metrics.cacheHits++;
        break;
      case 'cache_miss':
        this.metrics.cacheMisses++;
        break;
    }

    // メトリクスをローカルストレージに保存
    try {
      localStorage.setItem('health_metrics', JSON.stringify({
        ...this.metrics,
        lastUpdate: Date.now(),
        uptime: Date.now() - this.startTime
      }));
    } catch (error) {
      console.warn('メトリクス保存に失敗:', error);
    }
  },

  // ヘルスレポートの生成
  generateHealthReport() {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(1);
    
    return {
      uptime: {
        ms: uptime,
        hours: uptimeHours,
        formatted: this.formatUptime(uptime)
      },
      metrics: { ...this.metrics },
      errorRate: this.metrics.apiCalls > 0 ? 
        ((this.metrics.apiErrors / this.metrics.apiCalls) * 100).toFixed(1) : 0,
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0 ? 
        ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(1) : 0,
      status: this.getHealthStatus()
    };
  },

  // アップタイムをフォーマット
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日 ${hours % 24}時間`;
    if (hours > 0) return `${hours}時間 ${minutes % 60}分`;
    if (minutes > 0) return `${minutes}分 ${seconds % 60}秒`;
    return `${seconds}秒`;
  },

  // ヘルス状態の判定
  getHealthStatus() {
    const errorRate = this.metrics.apiCalls > 0 ? 
      (this.metrics.apiErrors / this.metrics.apiCalls) * 100 : 0;
    
    if (errorRate > 10) return 'critical';
    if (errorRate > 5) return 'warning';
    if (this.metrics.errors > 10) return 'warning';
    return 'healthy';
  }
};

// Cache Management System
const CacheManager = {
  // キャッシュの有効期限設定（分）
  CACHE_DURATION: {
    departments: 60,    // 1時間 - 変更頻度低
    priorities: 60,     // 1時間 - 変更頻度低
    schedules: 15,      // 15分 - 変更頻度中
    handovers: 10,      // 10分 - 変更頻度高
    tasks: 10           // 10分 - 変更頻度高
  },

  // データをキャッシュに保存
  set(key, data, customDuration = null) {
    try {
      const duration = customDuration || this.CACHE_DURATION[key] || 15;
      const expireTime = Date.now() + (duration * 60 * 1000);
      const cacheItem = {
        data: data,
        timestamp: Date.now(),
        expireTime: expireTime,
        version: '1.0'
      };
      localStorage.setItem(`workplace_cache_${key}`, JSON.stringify(cacheItem));
      console.log(`✅ キャッシュ保存: ${key} (${duration}分間有効)`);
    } catch (error) {
      console.warn('キャッシュ保存に失敗:', error);
    }
  },

  // キャッシュからデータを取得
  get(key) {
    try {
      const cached = localStorage.getItem(`workplace_cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // 有効期限チェック
      if (Date.now() > cacheItem.expireTime) {
        this.remove(key);
        console.log(`⏰ キャッシュ期限切れ: ${key}`);
        return null;
      }

      console.log(`🚀 キャッシュヒット: ${key}`);
      HealthMonitor.recordEvent('cache_hit');
      return cacheItem.data;
    } catch (error) {
      console.warn('キャッシュ取得に失敗:', error);
      this.remove(key);
      return null;
    }
  },

  // 特定のキャッシュを削除
  remove(key) {
    try {
      localStorage.removeItem(`workplace_cache_${key}`);
      console.log(`🗑️ キャッシュ削除: ${key}`);
    } catch (error) {
      console.warn('キャッシュ削除に失敗:', error);
    }
  },

  // 全キャッシュを削除
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('workplace_cache_'));
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 全キャッシュクリア: ${keys.length}個削除`);
    } catch (error) {
      console.warn('キャッシュクリアに失敗:', error);
    }
  },

  // キャッシュの情報を取得
  getInfo() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('workplace_cache_'));
      const info = keys.map(key => {
        try {
          const cacheItem = JSON.parse(localStorage.getItem(key));
          const keyName = key.replace('workplace_cache_', '');
          const remainingTime = Math.max(0, cacheItem.expireTime - Date.now());
          return {
            key: keyName,
            size: new Blob([localStorage.getItem(key)]).size,
            remainingMinutes: Math.floor(remainingTime / (60 * 1000)),
            isExpired: remainingTime <= 0
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      const totalSize = info.reduce((sum, item) => sum + item.size, 0);
      return { items: info, totalSize, count: info.length };
    } catch (error) {
      console.warn('キャッシュ情報取得に失敗:', error);
      return { items: [], totalSize: 0, count: 0 };
    }
  },

  // 期限切れキャッシュを削除
  cleanup() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('workplace_cache_'));
      let cleaned = 0;
      
      keys.forEach(key => {
        try {
          const cacheItem = JSON.parse(localStorage.getItem(key));
          if (Date.now() > cacheItem.expireTime) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch {
          localStorage.removeItem(key);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`🧼 期限切れキャッシュクリーンアップ: ${cleaned}個削除`);
      }
    } catch (error) {
      console.warn('キャッシュクリーンアップに失敗:', error);
    }
  }
};

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
async function fetchData(forceRefresh = false) {
  try {
    console.log(`📡 データ取得開始 ${forceRefresh ? '(強制更新)' : '(キャッシュ優先)'}`);
    
    // キャッシュクリーンアップを実行
    CacheManager.cleanup();
    
    const dataTypes = ['departments', 'priorities', 'schedules', 'handovers', 'tasks'];
    const promises = [];
    
    for (const type of dataTypes) {
      promises.push(fetchDataWithCache(type, forceRefresh));
    }
    
    const results = await Promise.all(promises);
    
    // 結果をappDataに設定
    dataTypes.forEach((type, index) => {
      appData[type] = results[index];
    });
    
    // Set default active department if it exists
    if (appData.departments.length > 0) {
        activeHandoverDept = appData.departments[0].id;
    }
    
    console.log('✅ 全データ取得完了');

  } catch (error) {
    console.error('Error fetching data:', error);
    
    // エラートラッキングに報告
    ErrorTracker.captureError(error, {
      component: 'fetchData',
      operation: 'data_fetch',
      forceRefresh: forceRefresh
    });
    
    HealthMonitor.recordEvent('error');
    
    // エラー時はキャッシュからフォールバック
    const fallbackSuccess = await loadFromCacheFallback();
    if (!fallbackSuccess) {
      alert('データの読み込みに失敗しました。');
    } else {
      console.log('⚠️ キャッシュからデータを復元しました');
      ErrorTracker.captureWarning('データ取得に失敗、キャッシュから復元', {
        component: 'fetchData',
        operation: 'fallback_success'
      });
    }
  }
}

// 個別のデータタイプをキャッシュ対応で取得
async function fetchDataWithCache(dataType, forceRefresh = false) {
  try {
    // キャッシュから取得を試行
    if (!forceRefresh) {
      const cachedData = CacheManager.get(dataType);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Supabaseから取得
    console.log(`🔄 Supabaseから取得: ${dataType}`);
    HealthMonitor.recordEvent('api_call');
    HealthMonitor.recordEvent('cache_miss');
    const { data, error } = await supabase.from(dataType).select('*');
    
    if (error) throw error;
    
    // キャッシュに保存
    CacheManager.set(dataType, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${dataType}:`, error);
    
    // API エラーを記録
    HealthMonitor.recordEvent('api_error');
    ErrorTracker.captureError(error, {
      component: 'fetchDataWithCache',
      dataType: dataType,
      operation: 'supabase_fetch'
    });
    
    // エラー時はキャッシュからフォールバック
    const cachedData = CacheManager.get(dataType);
    if (cachedData) {
      console.log(`⚠️ ${dataType}: Supabaseエラー、キャッシュから復元`);
      return cachedData;
    }
    
    throw error;
  }
}

// エラー時のキャッシュフォールバック
async function loadFromCacheFallback() {
  try {
    const dataTypes = ['departments', 'priorities', 'schedules', 'handovers', 'tasks'];
    let hasAnyData = false;
    
    dataTypes.forEach(type => {
      const cachedData = CacheManager.get(type);
      if (cachedData) {
        appData[type] = cachedData;
        hasAnyData = true;
      }
    });
    
    return hasAnyData;
  } catch (error) {
    console.error('キャッシュフォールバックに失敗:', error);
    return false;
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
  return HandoverStatus.LABELS[status] || status;
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
      case 'settings':
        renderSettings();
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

  const priorityFilter = document.getElementById('handover-priority-filter');
  priorityFilter.innerHTML = '<option value="">全優先度</option>' +
    appData.priorities.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  priorityFilter.addEventListener('change', renderHandoverContent);

  const statusFilter = document.getElementById('handover-status-filter');
  statusFilter.addEventListener('change', renderHandoverContent);

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
    button.addEventListener('click', (e) => {
      // Remove active class from all buttons
      tabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      // Add active class to the clicked button
      e.target.classList.add('active');

      activeHandoverDept = e.target.dataset.department;
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

  const priorityFilter = document.getElementById('handover-priority-filter').value;
  if (priorityFilter) {
    handovers = handovers.filter(h => h.priority === priorityFilter);
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
      <div class="handover-meta-group">
        <div class="handover-priority priority-${handover.priority}">
          ${getPriorityName(handover.priority)}
        </div>
        <div class="handover-status ${HandoverStatus.CSS_CLASSES[handover.status] || 'status--pending'}" 
             data-id="${handover.id}" data-status="${handover.status}">
          ${getHandoverStatusName(handover.status)}
        </div>
      </div>
      <div class="handover-details">
        <div class="handover-title">${handover.title}</div>
        <div class="handover-description">${handover.description}</div>
        ${handover.status_comment ? `<div class="handover-status-comment">💬 ${handover.status_comment}</div>` : ''}
        ${handover.assigned_to ? `<div class="handover-assigned-to">👤 担当者: ${handover.assigned_to}</div>` : ''}
        ${handover.file_url ? `<div class="handover-attachment"><a href="${handover.file_url}" target="_blank" rel="noopener noreferrer">📎 添付ファイルを見る</a></div>` : ''}
        <div class="handover-meta">
          <div class="handover-meta-item">
            <span class="handover-meta-label">登録日:</span>
            <span>${formatDateTime(handover.timestamp)}</span>
          </div>
          ${handover.last_updated ? `
            <div class="handover-meta-item">
              <span class="handover-meta-label">更新日:</span>
              <span>${formatDateTime(handover.last_updated)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="handover-actions">
        <button class="btn btn--sm btn--primary" onclick="showHandoverStatusModal(${handover.id})" title="ステータス変更">ステータス変更</button>
        <button class="btn btn--sm btn--outline edit-btn" data-id="${handover.id}" title="編集">編集</button>
      </div>
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

  contentContainer.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const handoverId = e.target.dataset.id;
      showEditHandoverModal(handoverId);
    });
  });

  contentContainer.querySelectorAll('.handover-status').forEach(statusElement => {
    statusElement.addEventListener('click', (e) => {
      const handoverId = e.target.dataset.id;
      const currentStatus = e.target.dataset.status;
      toggleHandoverStatus(handoverId, currentStatus);
    });
  });
}

async function toggleHandoverStatus(handoverId, currentStatus) {
  const nextStatusMap = {
    'pending': 'in-progress',
    'in-progress': 'completed',
    'completed': 'pending'
  };
  const newStatus = nextStatusMap[currentStatus];

  const { error } = await supabase
    .from('handovers')
    .update({ status: newStatus })
    .eq('id', handoverId);

  if (error) {
    console.error('Error updating handover status:', error);
    alert('申し送り事項のステータス更新に失敗しました。');
  } else {
    const handover = appData.handovers.find(h => h.id === parseInt(handoverId));
    if (handover) {
      handover.status = newStatus;
    }
    renderHandoverContent();
  }
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
  const statusFilter = document.getElementById('task-status-filter');
  
  deptFilter.innerHTML = '<option value="">全部署</option>' + 
    appData.departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');
  
  priorityFilter.innerHTML = '<option value="">全優先度</option>' + 
    appData.priorities.map(priority => `<option value="${priority.id}">${priority.name}</option>`).join('');
  
  deptFilter.addEventListener('change', renderTasksGrid);
  priorityFilter.addEventListener('change', renderTasksGrid);
  statusFilter.addEventListener('change', renderTasksGrid);
}

function renderTasksGrid() {
  const container = document.getElementById('tasks-grid');
  const deptFilter = document.getElementById('task-department-filter').value;
  const priorityFilter = document.getElementById('task-priority-filter').value;
  const statusFilter = document.getElementById('task-status-filter').value;
  
  let filteredTasks = appData.tasks;
  
  if (deptFilter) {
    filteredTasks = filteredTasks.filter(t => t.department === deptFilter);
  }
  
  if (priorityFilter) {
    filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
  }
  
  if (statusFilter) {
    filteredTasks = filteredTasks.filter(t => (t.status || 'not_started') === statusFilter);
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
    <div class="task-card" data-task-id="${task.id}">
      <div class="task-header">
        <h4 class="task-title">${task.title}</h4>
        <span class="task-priority priority-${task.priority}">${getPriorityName(task.priority)}</span>
      </div>
      <div class="task-description">${task.description}</div>
      
      <!-- ステータス表示 -->
      <div class="task-status-section">
        <div class="task-status-info">
          <span class="task-status-label">ステータス:</span>
          <span class="task-status-btn ${TaskStatus.CSS_CLASSES[task.status || 'not_started']}">
            ${TaskStatus.LABELS[task.status || 'not_started']}
          </span>
        </div>
        ${task.assigned_to ? `<div class="task-assigned-to">担当: ${task.assigned_to}</div>` : ''}
        ${task.status_comment ? `<div class="task-status-comment">💬 ${task.status_comment}</div>` : ''}
      </div>
      
      ${task.file_url ? `<div class="task-attachment"><a href="${task.file_url}" target="_blank" rel="noopener noreferrer">📎 添付ファイルを見る</a></div>` : ''}
      <div class="task-meta">
        <div class="task-meta-item">
          <span class="task-meta-label">期限:</span>
          <span class="task-due-date">${formatDate(task.due_date)}</span>
        </div>
        <div class="task-meta-item">
          <span class="task-meta-label">部署:</span>
          <span style="color: ${getDepartmentColor(task.department)}">
            ${getDepartmentName(task.department)}
          </span>
        </div>
        <div class="task-meta-item">
          <span class="task-meta-label">依頼者:</span>
          <span>${task.assignedBy || '未設定'}</span>
        </div>
      </div>
      
      <!-- タスクアクション -->
      <div class="task-actions">
        <button class="btn btn--primary btn--sm" onclick="showTaskStatusModal(${task.id})">ステータス変更</button>
        <button class="btn btn--outline btn--sm" onclick="editTask(${task.id})">編集</button>
        <button class="btn btn--danger btn--sm" onclick="deleteTask(${task.id})">削除</button>
      </div>
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
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: newStatus })
      .eq('id', taskIdNum)
      .select();

    if (error) {
      console.error('Error updating task:', error);
      alert('タスクの状態更新に失敗しました。');
    } else {
      const updatedTask = data[0];
      const index = appData.tasks.findIndex(t => t.id === updatedTask.id);
      if (index !== -1) {
        appData.tasks[index] = updatedTask;
      }
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
      <div class="form-group"><label class="form-label">添付ファイル</label><input type="file" class="form-control" name="file"></div>
      <div class="modal-buttons"><button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button><button type="submit" class="btn btn--primary">追加</button></div>
    </form>
  `;
  showModal('申し送り追加', content);
  document.getElementById('add-handover-form').addEventListener('submit', addHandover);
}

async function showEditHandoverModal(handoverId) {
  const handover = appData.handovers.find(h => h.id === parseInt(handoverId));
  if (!handover) return;

  const content = `
    <form class="modal-form" id="edit-handover-form">
      <input type="hidden" name="id" value="${handover.id}">
      <div class="form-group"><label class="form-label">タイトル</label><input type="text" class="form-control" name="title" value="${handover.title}" required></div>
      <div class="form-group"><label class="form-label">部署</label><select class="form-control" name="department" required>${appData.departments.map(d => `<option value="${d.id}" ${handover.department === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">優先度</label><select class="form-control" name="priority" required>${appData.priorities.map(p => `<option value="${p.id}" ${handover.priority === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">ステータス</label><select class="form-control" name="status">
        <option value="pending" ${handover.status === 'pending' ? 'selected' : ''}>未対応</option>
        <option value="in-progress" ${handover.status === 'in-progress' ? 'selected' : ''}>対応中</option>
        <option value="completed" ${handover.status === 'completed' ? 'selected' : ''}>完了</option>
      </select></div>
      <div class="form-group"><label class="form-label">内容</label><textarea class="form-control" name="description" rows="4" required>${handover.description}</textarea></div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="button" class="btn btn--danger" onclick="deleteHandover(${handover.id}); document.getElementById('modal').classList.remove('active');">削除</button>
        <button type="submit" class="btn btn--primary">保存</button>
      </div>
    </form>
  `;
  showModal('申し送り編集', content);
  document.getElementById('edit-handover-form').addEventListener('submit', editHandover);
}

async function editHandover(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const updatedHandover = {
    id: parseInt(formData.get('id')),
    title: formData.get('title'),
    department: formData.get('department'),
    priority: formData.get('priority'),
    status: formData.get('status'),
    description: formData.get('description'),
  };

  const { data, error } = await supabase
    .from('handovers')
    .update(updatedHandover)
    .eq('id', updatedHandover.id)
    .select();

  if (error) {
    console.error('Error updating handover:', error);
    alert('申し送りの更新に失敗しました。');
  } else {
    const index = appData.handovers.findIndex(h => h.id === updatedHandover.id);
    if (index !== -1) {
      appData.handovers[index] = data[0];
    }
    document.getElementById('modal').classList.remove('active');
    renderHandovers();
  }
}

function showTaskModal() {
  const content = `
    <form class="modal-form" id="add-task-form">
      <div class="form-group"><label class="form-label">タイトル</label><input type="text" class="form-control" name="title" required></div>
      <div class="form-group"><label class="form-label">部署</label><select class="form-control" name="department" required>${appData.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">優先度</label><select class="form-control" name="priority" required>${appData.priorities.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">期限</label><input type="date" class="form-control" name="dueDate" required></div>
      <div class="form-group"><label class="form-label">内容</label><textarea class="form-control" name="description" rows="3" required></textarea></div>
      <div class="form-group"><label class="form-label">依頼者</label><input type="text" class="form-control" name="assignedBy" required></div>
      <div class="form-group"><label class="form-label">担当者</label><input type="text" class="form-control" name="assignedTo" placeholder="タスクを実行する担当者"></div>
      <div class="form-group"><label class="form-label">添付ファイル</label><input type="file" class="form-control" name="file"></div>
      <div class="modal-buttons"><button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button><button type="submit" class="btn btn--primary">追加</button></div>
    </form>
  `;
  showModal('タスク追加', content);
  document.getElementById('add-task-form').addEventListener('submit', addTask);
}

// タスクステータス更新モーダル
function showTaskStatusModal(taskId) {
  const task = appData.tasks.find(t => t.id === parseInt(taskId));
  if (!task) return;

  const content = `
    <form class="modal-form" id="update-task-status-form">
      <input type="hidden" name="taskId" value="${task.id}">
      
      <div class="task-info-summary">
        <h4>${task.title}</h4>
        <p class="task-summary-meta">
          担当者: ${task.assigned_to || '未設定'} | 
          期限: ${formatDate(task.due_date)}
        </p>
      </div>
      
      <div class="form-group">
        <label class="form-label">ステータス</label>
        <select class="form-control" name="status" required>
          <option value="not_started" ${task.status === 'not_started' ? 'selected' : ''}>未着手</option>
          <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>着手中</option>
          <option value="pending_approval" ${task.status === 'pending_approval' ? 'selected' : ''}>決裁中</option>
          <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>対応済</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">進捗コメント</label>
        <textarea class="form-control" name="statusComment" rows="3" 
                  placeholder="例: 伺書起案中です、承認待ちです、完了しました 等">${task.status_comment || ''}</textarea>
        <small class="form-help">現在の状況や進捗状況を入力してください</small>
      </div>
      
      <div class="form-group">
        <label class="form-label">担当者変更</label>
        <input type="text" class="form-control" name="assignedTo" 
               value="${task.assigned_to || ''}" placeholder="担当者名">
      </div>
      
      <div class="task-status-actions">
        <button type="button" class="btn btn--outline" onclick="updateTaskStatusQuick(${task.id}, '${TaskStatus.getPreviousStatus(task.status || 'not_started')}')">
          ⬅️ ${TaskStatus.LABELS[TaskStatus.getPreviousStatus(task.status || 'not_started')]}
        </button>
        <button type="button" class="btn btn--primary" onclick="updateTaskStatusQuick(${task.id}, '${TaskStatus.getNextStatus(task.status || 'not_started')}')">
          ${TaskStatus.LABELS[TaskStatus.getNextStatus(task.status || 'not_started')]} ➡️
        </button>
      </div>
      
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  
  showModal('タスクステータス更新', content);
  document.getElementById('update-task-status-form').addEventListener('submit', updateTaskStatus);
}

// タスクステータス更新
async function updateTaskStatus(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const taskId = parseInt(formData.get('taskId'));
  const newStatus = formData.get('status');
  const statusComment = formData.get('statusComment');
  const assignedTo = formData.get('assignedTo');
  
  try {
    const updates = {
      status: newStatus,
      status_comment: statusComment,
      assigned_to: assignedTo,
      last_updated: new Date().toISOString()
    };
    
    // completedフィールドも更新
    if (newStatus === 'completed') {
      updates.completed = true;
    } else {
      updates.completed = false;
    }
    
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);
      
    if (error) {
      throw error;
    }
    
    // ローカルデータを更新
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
    }
    
    // キャッシュを更新
    CacheManager.set('tasks', appData.tasks);
    
    document.getElementById('modal').classList.remove('active');
    renderTasks();
    
    // HealthMonitor でイベントを記録
    HealthMonitor.recordEvent('task_status_updated');
    
  } catch (error) {
    console.error('Error updating task status:', error);
    ErrorTracker.captureError(error, {
      component: 'task-status-update',
      taskId: taskId
    });
    alert('タスクステータスの更新に失敗しました。');
  }
}

// タスクステータスクイック更新
async function updateTaskStatusQuick(taskId, newStatus) {
  const task = appData.tasks.find(t => t.id === parseInt(taskId));
  if (!task) return;
  
  try {
    const updates = {
      status: newStatus,
      last_updated: new Date().toISOString()
    };
    
    if (newStatus === 'completed') {
      updates.completed = true;
    } else {
      updates.completed = false;
    }
    
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);
      
    if (error) {
      throw error;
    }
    
    // ローカルデータを更新
    Object.assign(task, updates);
    
    // キャッシュを更新
    CacheManager.set('tasks', appData.tasks);
    
    document.getElementById('modal').classList.remove('active');
    renderTasks();
    
  } catch (error) {
    console.error('Error quick updating task status:', error);
    ErrorTracker.captureError(error, {
      component: 'task-status-quick-update',
      taskId: taskId
    });
    alert('タスクステータスの更新に失敗しました。');
  }
}

// === 申し送り事項ステータス管理機能 ===

// 申し送り事項ステータス更新モーダル表示
function showHandoverStatusModal(handoverId) {
  const handover = appData.handovers.find(h => h.id === parseInt(handoverId));
  if (!handover) return;

  const content = `
    <form class="modal-form" id="update-handover-status-form">
      <input type="hidden" name="handoverId" value="${handover.id}">
      
      <div class="task-info-summary">
        <h4>${handover.title}</h4>
        <p class="task-summary-meta">
          担当者: ${handover.assigned_to || '未設定'} | 
          部署: ${getDepartmentName(handover.department)} |
          登録日: ${formatDate(handover.timestamp)}
        </p>
      </div>
      
      <div class="form-group">
        <label class="form-label">ステータス</label>
        <select class="form-control" name="status" required>
          <option value="pending" ${handover.status === 'pending' ? 'selected' : ''}>未対応</option>
          <option value="in_progress" ${handover.status === 'in_progress' ? 'selected' : ''}>対応中</option>
          <option value="completed" ${handover.status === 'completed' ? 'selected' : ''}>対応済</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">進捗コメント</label>
        <textarea class="form-control" name="statusComment" rows="3" 
                  placeholder="例: 確認中です、対応を検討中です、完了しました 等">${handover.status_comment || ''}</textarea>
        <small class="form-help">現在の状況や進捗状況を入力してください</small>
      </div>
      
      <div class="form-group">
        <label class="form-label">担当者変更</label>
        <input type="text" class="form-control" name="assignedTo" 
               value="${handover.assigned_to || ''}" placeholder="担当者名">
      </div>
      
      <div class="task-status-actions">
        <button type="button" class="btn btn--outline" onclick="updateHandoverStatusQuick(${handover.id}, '${HandoverStatus.getPreviousStatus(handover.status || 'pending')}')">
          ⬅️ ${HandoverStatus.LABELS[HandoverStatus.getPreviousStatus(handover.status || 'pending')]}
        </button>
        <button type="button" class="btn btn--primary" onclick="updateHandoverStatusQuick(${handover.id}, '${HandoverStatus.getNextStatus(handover.status || 'pending')}')">
          ${HandoverStatus.LABELS[HandoverStatus.getNextStatus(handover.status || 'pending')]} ➡️
        </button>
      </div>
      
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">更新</button>
      </div>
    </form>
  `;
  
  showModal('申し送り事項ステータス更新', content);
  document.getElementById('update-handover-status-form').addEventListener('submit', updateHandoverStatus);
}

// 申し送り事項ステータス更新
async function updateHandoverStatus(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const handoverId = parseInt(formData.get('handoverId'));
  const newStatus = formData.get('status');
  const statusComment = formData.get('statusComment');
  const assignedTo = formData.get('assignedTo');
  
  try {
    const updates = {
      status: newStatus,
      status_comment: statusComment,
      assigned_to: assignedTo,
      last_updated: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('handovers')
      .update(updates)
      .eq('id', handoverId);
      
    if (error) {
      throw error;
    }
    
    // ローカルデータを更新
    const handover = appData.handovers.find(h => h.id === handoverId);
    if (handover) {
      Object.assign(handover, updates);
    }
    
    // キャッシュを更新
    CacheManager.set('handovers', appData.handovers);
    
    document.getElementById('modal').classList.remove('active');
    renderHandovers();
    
    // HealthMonitor でイベントを記録
    HealthMonitor.recordEvent('handover_status_updated');
    
  } catch (error) {
    console.error('Error updating handover status:', error);
    ErrorTracker.captureError(error, {
      component: 'handover-status-update',
      handoverId: handoverId
    });
    alert('申し送り事項ステータスの更新に失敗しました。');
  }
}

// 申し送り事項ステータスクイック更新
async function updateHandoverStatusQuick(handoverId, newStatus) {
  const handover = appData.handovers.find(h => h.id === parseInt(handoverId));
  if (!handover) return;
  
  try {
    const updates = {
      status: newStatus,
      last_updated: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('handovers')
      .update(updates)
      .eq('id', handoverId);
      
    if (error) {
      throw error;
    }
    
    // ローカルデータを更新
    Object.assign(handover, updates);
    
    // キャッシュを更新
    CacheManager.set('handovers', appData.handovers);
    
    document.getElementById('modal').classList.remove('active');
    renderHandovers();
    
  } catch (error) {
    console.error('Error quick updating handover status:', error);
    ErrorTracker.captureError(error, {
      component: 'handover-status-quick-update',
      handoverId: handoverId
    });
    alert('申し送り事項ステータスの更新に失敗しました。');
  }
}

// === タスク編集機能 ===

// タスク編集機能
function editTask(taskId) {
  const task = appData.tasks.find(t => t.id === parseInt(taskId));
  if (!task) return;

  const content = `
    <form class="modal-form" id="edit-task-form">
      <input type="hidden" name="taskId" value="${task.id}">
      <div class="form-group"><label class="form-label">タイトル</label><input type="text" class="form-control" name="title" value="${task.title}" required></div>
      <div class="form-group"><label class="form-label">部署</label><select class="form-control" name="department" required>${appData.departments.map(d => `<option value="${d.id}" ${task.department === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">優先度</label><select class="form-control" name="priority" required>${appData.priorities.map(p => `<option value="${p.id}" ${task.priority === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">期限</label><input type="date" class="form-control" name="dueDate" value="${task.due_date}" required></div>
      <div class="form-group"><label class="form-label">内容</label><textarea class="form-control" name="description" rows="3" required>${task.description}</textarea></div>
      <div class="form-group"><label class="form-label">依頼者</label><input type="text" class="form-control" name="assignedBy" value="${task.assignedBy || ''}" required></div>
      <div class="form-group"><label class="form-label">担当者</label><input type="text" class="form-control" name="assignedTo" value="${task.assigned_to || ''}" placeholder="タスクを実行する担当者"></div>
      <div class="modal-buttons">
        <button type="button" class="btn btn--outline" onclick="document.getElementById('modal').classList.remove('active')">キャンセル</button>
        <button type="submit" class="btn btn--primary">保存</button>
      </div>
    </form>
  `;
  
  showModal('タスク編集', content);
  document.getElementById('edit-task-form').addEventListener('submit', updateTask);
}

// タスク更新機能
async function updateTask(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const taskId = parseInt(formData.get('taskId'));
  
  try {
    const updates = {
      title: formData.get('title'),
      department: formData.get('department'),
      priority: formData.get('priority'),
      due_date: formData.get('dueDate'),
      description: formData.get('description'),
      assignedBy: formData.get('assignedBy'),
      assigned_to: formData.get('assignedTo'),
      last_updated: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);
      
    if (error) {
      throw error;
    }
    
    // ローカルデータを更新
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
    }
    
    // キャッシュを更新
    CacheManager.set('tasks', appData.tasks);
    
    document.getElementById('modal').classList.remove('active');
    renderTasks();
    
  } catch (error) {
    console.error('Error updating task:', error);
    ErrorTracker.captureError(error, {
      component: 'task-update',
      taskId: taskId
    });
    alert('タスクの更新に失敗しました。');
  }
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
    // キャッシュを更新
    CacheManager.set('schedules', appData.schedules);
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
    // キャッシュを更新
    CacheManager.set('schedules', appData.schedules);
    if (currentSection === 'dashboard') renderDashboard();
    else if (currentSection === 'calendar') renderCalendar();
  }
}

async function addHandover(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const file = formData.get('file');
  let fileUrl = null;

  if (file && file.size > 0) {
    try {
      // 画像ファイルの場合は最適化を実行
      let uploadFile = file;
      if (file.type.startsWith('image/')) {
        console.log('🖼️ 画像最適化を開始します...');
        const optimizationResult = await ImageOptimizer.optimizeImage(file);
        uploadFile = optimizationResult.optimizedFile;
        
        if (optimizationResult.compressionRatio > 0) {
          console.log(`✨ 画像最適化完了: ${optimizationResult.compressionRatio}% 削減`);
        }
      }

      const { data: fileData, error: fileError } = await supabase.storage
        .from('workplace-files')
        .upload(`${Date.now()}_${file.name}`, uploadFile);

      if (fileError) {
        console.error('Error uploading file:', fileError);
        alert('ファイルのアップロードに失敗しました。');
        return;
      }

      const { data: urlData } = supabase.storage.from('workplace-files').getPublicUrl(fileData.path);
      fileUrl = urlData.publicUrl;
    } catch (optimizationError) {
      console.warn('画像最適化に失敗、元ファイルをアップロード:', optimizationError);
      
      // 最適化に失敗した場合は元ファイルをアップロード
      const { data: fileData, error: fileError } = await supabase.storage
        .from('workplace-files')
        .upload(`${Date.now()}_${file.name}`, file);

      if (fileError) {
        console.error('Error uploading file:', fileError);
        alert('ファイルのアップロードに失敗しました。');
        return;
      }

      const { data: urlData } = supabase.storage.from('workplace-files').getPublicUrl(fileData.path);
      fileUrl = urlData.publicUrl;
    }
  }

  const newHandover = {
    department: formData.get('department'),
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    timestamp: new Date().toISOString(),
    status: formData.get('status') || 'pending',
    file_url: fileUrl,
    status_comment: null,
    assigned_to: null,
    last_updated: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('handovers').insert([newHandover]).select();

  if (error) {
    console.error('Error adding handover:', error);
    alert('申し送りの追加に失敗しました。');
  } else {
    appData.handovers.push(data[0]);
    // キャッシュを更新
    CacheManager.set('handovers', appData.handovers);
    document.getElementById('modal').classList.remove('active');
    if (currentSection === 'handovers') renderHandovers();
  }
}

async function deleteHandover(handoverId) {
  const handover = appData.handovers.find(h => h.id === parseInt(handoverId));
  if (handover && handover.file_url) {
    const fileName = handover.file_url.split('/').pop();
    await supabase.storage.from('workplace-files').remove([fileName]);
  }

  const { error } = await supabase.from('handovers').delete().eq('id', handoverId);

  if (error) {
    console.error('Error deleting handover:', error);
    alert('申し送り事項の削除に失敗しました。');
  } else {
    appData.handovers = appData.handovers.filter(h => h.id !== parseInt(handoverId));
    // キャッシュを更新
    CacheManager.set('handovers', appData.handovers);
    if (currentSection === 'handovers') renderHandovers();
  }
}

async function addTask(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const file = formData.get('file');
  let fileUrl = null;

  if (file && file.size > 0) {
    try {
      // 画像ファイルの場合は最適化を実行
      let uploadFile = file;
      if (file.type.startsWith('image/')) {
        console.log('🖼️ 画像最適化を開始します...');
        const optimizationResult = await ImageOptimizer.optimizeImage(file);
        uploadFile = optimizationResult.optimizedFile;
        
        if (optimizationResult.compressionRatio > 0) {
          console.log(`✨ 画像最適化完了: ${optimizationResult.compressionRatio}% 削減`);
        }
      }

      const { data: fileData, error: fileError } = await supabase.storage
        .from('workplace-files')
        .upload(`${Date.now()}_${file.name}`, uploadFile);

      if (fileError) {
        console.error('Error uploading file:', fileError);
        alert('ファイルのアップロードに失敗しました。');
        return;
      }

      const { data: urlData } = supabase.storage.from('workplace-files').getPublicUrl(fileData.path);
      fileUrl = urlData.publicUrl;
    } catch (optimizationError) {
      console.warn('画像最適化に失敗、元ファイルをアップロード:', optimizationError);
      
      // 最適化に失敗した場合は元ファイルをアップロード
      const { data: fileData, error: fileError } = await supabase.storage
        .from('workplace-files')
        .upload(`${Date.now()}_${file.name}`, file);

      if (fileError) {
        console.error('Error uploading file:', fileError);
        alert('ファイルのアップロードに失敗しました。');
        return;
      }

      const { data: urlData } = supabase.storage.from('workplace-files').getPublicUrl(fileData.path);
      fileUrl = urlData.publicUrl;
    }
  }

  const newTask = {
    title: formData.get('title'),
    department: formData.get('department'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    due_date: formData.get('dueDate'),
    assignedBy: formData.get('assignedBy'),
    completed: false,
    file_url: fileUrl,
    status: 'not_started', // 未着手
    status_comment: '', // ステータスコメント
    assigned_to: formData.get('assignedTo') || '', // 担当者
    last_updated: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('tasks').insert([newTask]).select();

  if (error) {
    console.error('Error adding task:', error);
    alert(`タスクの追加に失敗しました。\nエラー: ${error.message}`);
  } else {
    appData.tasks.push(data[0]);
    // キャッシュを更新
    CacheManager.set('tasks', appData.tasks);
    document.getElementById('modal').classList.remove('active');
    if (currentSection === 'tasks') renderTasks();
  }
}

async function deleteTask(taskId) {
  const task = appData.tasks.find(t => t.id === parseInt(taskId));
  if (task && task.file_url) {
    const fileName = task.file_url.split('/').pop();
    await supabase.storage.from('workplace-files').remove([fileName]);
  }

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    alert('タスクの削除に失敗しました。');
  } else {
    appData.tasks = appData.tasks.filter(t => t.id !== parseInt(taskId));
    // キャッシュを更新
    CacheManager.set('tasks', appData.tasks);
    if (currentSection === 'tasks') renderTasks();
  }
}

// Settings Functions
function renderSettings() {
    renderDepartmentSettings();
    renderPrioritySettings();
    renderFileManagement();
    renderCacheManagement();
    renderOptimizationManagement();

    // Add event listeners for forms after rendering
    document.getElementById('add-department-form').addEventListener('submit', (e) => addSetting(e, 'departments'));
    document.getElementById('add-priority-form').addEventListener('submit', (e) => addSetting(e, 'priorities'));
    
    // Add event listeners for file management
    document.getElementById('check-storage-btn').addEventListener('click', updateStorageDisplay);
    document.getElementById('cleanup-files-btn').addEventListener('click', manualFileCleanup);
    
    // Add event listeners for cache management
    document.getElementById('check-cache-btn').addEventListener('click', updateCacheDisplay);
    document.getElementById('refresh-cache-btn').addEventListener('click', refreshAllData);
    document.getElementById('clear-cache-btn').addEventListener('click', clearAllCache);
    
    // Add event listeners for optimization management
    document.getElementById('check-optimization-btn').addEventListener('click', updateOptimizationDisplay);
    document.getElementById('test-optimization-btn').addEventListener('click', testOptimization);
}

function renderDepartmentSettings() {
    const container = document.getElementById('department-settings-content');
    container.innerHTML = appData.departments.map(dept => `
        <div class="setting-item">
            <div class="flex items-center">
                <div class="setting-item-color-swatch" style="background-color: ${dept.color}"></div>
                <span>${dept.name}</span>
            </div>
            <button class="delete-btn" data-id="${dept.id}" data-type="department">×</button>
        </div>
    `).join('');

    container.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (confirm('この部署を削除しますか？関連するデータも全て削除されます。')) {
                deleteSetting(id, 'departments');
            }
        });
    });
}

function renderPrioritySettings() {
    const container = document.getElementById('priority-settings-content');
    container.innerHTML = appData.priorities.map(prio => `
        <div class="setting-item">
            <div class="flex items-center">
                <div class="setting-item-color-swatch" style="background-color: ${prio.color}"></div>
                <span>${prio.name}</span>
            </div>
            <button class="delete-btn" data-id="${prio.id}" data-type="priority">×</button>
        </div>
    `).join('');

    container.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (confirm('この優先度を削除しますか？関連するデータも全て削除されます。')) {
                deleteSetting(id, 'priorities');
            }
        });
    });
}

async function addSetting(event, type) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    const color = formData.get('color');

    const { data, error } = await supabase.from(type).insert([{ name, color }]).select();

    if (error) {
        console.error(`Error adding ${type}:`, error);
        alert(`${type}の追加に失敗しました。`);
    } else {
        appData[type].push(data[0]);
        form.reset();
        if (type === 'departments') renderDepartmentSettings();
        if (type === 'priorities') renderPrioritySettings();
    }
}

async function deleteSetting(id, type) {
    const { error } = await supabase.from(type).delete().eq('id', id);

    if (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`${type}の削除に失敗しました。`);
    } else {
        appData[type] = appData[type].filter(item => item.id !== parseInt(id));
        if (type === 'departments') renderDepartmentSettings();
        if (type === 'priorities') renderPrioritySettings();
    }
}

function renderFileManagement() {
    updateStorageDisplay();
}

async function updateStorageDisplay() {
    const usageContainer = document.getElementById('storage-usage');
    usageContainer.innerHTML = '<span>ストレージ使用量を確認中...</span>';
    
    const usage = await getStorageUsage();
    if (usage) {
        const usagePercent = ((usage.totalSize / (1024 * 1024 * 1024)) * 100).toFixed(1); // % of 1GB
        usageContainer.innerHTML = `
            <div class="storage-details">
                <div class="storage-stat">
                    <strong>使用量:</strong> ${usage.sizeMB}MB / 1024MB (${usagePercent}%)
                </div>
                <div class="storage-stat">
                    <strong>ファイル数:</strong> ${usage.fileCount}個
                </div>
                <div class="storage-progress">
                    <div class="progress-bar" style="width: ${Math.min(usagePercent, 100)}%"></div>
                </div>
            </div>
        `;
    } else {
        usageContainer.innerHTML = '<span class="error">使用量の取得に失敗しました</span>';
    }
}

async function manualFileCleanup() {
    const button = document.getElementById('cleanup-files-btn');
    button.disabled = true;
    button.textContent = '削除中...';
    
    try {
        await cleanupOldFiles();
        await updateStorageDisplay();
        alert('古いファイルの削除が完了しました');
    } catch (error) {
        console.error('手動ファイルクリーンアップエラー:', error);
        alert('ファイル削除中にエラーが発生しました');
    } finally {
        button.disabled = false;
        button.textContent = '古いファイル削除';
    }
}

function renderCacheManagement() {
    updateCacheDisplay();
}

async function updateCacheDisplay() {
    const usageContainer = document.getElementById('cache-usage');
    usageContainer.innerHTML = '<span>キャッシュ情報を確認中...</span>';
    
    try {
        const cacheInfo = CacheManager.getInfo();
        const totalSizeKB = (cacheInfo.totalSize / 1024).toFixed(2);
        
        usageContainer.innerHTML = `
            <div class="cache-details">
                <div class="cache-stat">
                    <strong>キャッシュサイズ:</strong> ${totalSizeKB}KB
                </div>
                <div class="cache-stat">
                    <strong>キャッシュ数:</strong> ${cacheInfo.count}個
                </div>
                <div class="cache-items">
                    ${cacheInfo.items.map(item => `
                        <div class="cache-item ${item.isExpired ? 'expired' : ''}">
                            <span class="cache-key">${item.key}</span>
                            <span class="cache-time">${item.isExpired ? '期限切れ' : `${item.remainingMinutes}分残り`}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('キャッシュ情報取得エラー:', error);
        usageContainer.innerHTML = '<span class="error">キャッシュ情報の取得に失敗しました</span>';
    }
}

async function refreshAllData() {
    const button = document.getElementById('refresh-cache-btn');
    button.disabled = true;
    button.textContent = '更新中...';
    
    try {
        await fetchData(true); // 強制更新
        await updateCacheDisplay();
        
        // 現在のセクションを再レンダリング
        showSection(currentSection);
        
        alert('データの更新が完了しました');
    } catch (error) {
        console.error('データ更新エラー:', error);
        alert('データ更新中にエラーが発生しました');
    } finally {
        button.disabled = false;
        button.textContent = 'データ更新';
    }
}

async function clearAllCache() {
    const button = document.getElementById('clear-cache-btn');
    
    if (!confirm('全てのキャッシュを削除しますか？\n次回アクセス時にデータを再取得します。')) {
        return;
    }
    
    button.disabled = true;
    button.textContent = '削除中...';
    
    try {
        CacheManager.clear();
        await updateCacheDisplay();
        alert('キャッシュをクリアしました');
    } catch (error) {
        console.error('キャッシュクリアエラー:', error);
        alert('キャッシュクリア中にエラーが発生しました');
    } finally {
        button.disabled = false;
        button.textContent = 'キャッシュクリア';
    }
}

function renderOptimizationManagement() {
    updateOptimizationDisplay();
}

function updateOptimizationDisplay() {
    const statusContainer = document.getElementById('optimization-status');
    
    try {
        const webpSupport = ImageOptimizer.supportsWebP;
        const avifSupport = ImageOptimizer.supportsAVIF;
        const lazyLoadSupport = !!LazyLoader.imageObserver;
        
        statusContainer.innerHTML = `
            <h4>ブラウザサポート状況</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${webpSupport ? '✅' : '❌'}</div>
                    <div class="stat-label">WebP</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${avifSupport ? '✅' : '❌'}</div>
                    <div class="stat-label">AVIF</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${lazyLoadSupport ? '✅' : '❌'}</div>
                    <div class="stat-label">遅延読み込み</div>
                </div>
            </div>
            <div style="margin-top: var(--space-12); font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                最適フォーマット: ${ImageOptimizer.getBestFormat().extension.toUpperCase()}
            </div>
        `;
    } catch (error) {
        console.error('最適化情報取得エラー:', error);
        statusContainer.innerHTML = '<span class="error">最適化情報の取得に失敗しました</span>';
    }
}

async function testOptimization() {
    const button = document.getElementById('test-optimization-btn');
    button.disabled = true;
    button.textContent = 'テスト中...';
    
    try {
        // テスト用の小さな画像データを作成
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // グラデーションを描画
        const gradient = ctx.createLinearGradient(0, 0, 100, 100);
        gradient.addColorStop(0, '#4A90E2');
        gradient.addColorStop(1, '#2E5B7A');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 100, 100);
        
        // Blobに変換
        const testBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });
        
        const testFile = new File([testBlob], 'test-image.png', { type: 'image/png' });
        
        console.log('🧪 画像最適化テスト開始...');
        const result = await ImageOptimizer.optimizeImage(testFile);
        
        alert(`テスト完了！
        
元ファイル: ${(result.originalSize / 1024).toFixed(1)}KB
最適化後: ${(result.optimizedSize / 1024).toFixed(1)}KB
圧縮率: ${result.compressionRatio}%
フォーマット: ${result.format}

詳細はコンソールをご確認ください。`);
        
    } catch (error) {
        console.error('最適化テストエラー:', error);
        alert('最適化テスト中にエラーが発生しました');
    } finally {
        button.disabled = false;
        button.textContent = 'テスト実行';
    }
}

// Image Optimization Functions
const ImageOptimizer = {
  // サポートされている画像フォーマットをチェック
  supportsWebP: (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })(),

  supportsAVIF: (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  })(),

  // 最適な出力フォーマットを選択
  getBestFormat() {
    if (this.supportsAVIF) return { format: 'image/avif', extension: 'avif' };
    if (this.supportsWebP) return { format: 'image/webp', extension: 'webp' };
    return { format: 'image/jpeg', extension: 'jpg' };
  },

  // 画像を最適化
  async optimizeImage(file, options = {}) {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.85,
      enableResize = true,
      enableFormatConversion = true
    } = options;

    return new Promise((resolve, reject) => {
      // 画像以外のファイルはそのまま返す
      if (!file.type.startsWith('image/')) {
        resolve({ 
          optimizedFile: file, 
          originalSize: file.size, 
          optimizedSize: file.size, 
          compressionRatio: 0,
          format: 'no-change'
        });
        return;
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          let { width, height } = img;
          const originalSize = file.size;

          // リサイズが有効で、画像が指定サイズより大きい場合
          if (enableResize && (width > maxWidth || height > maxHeight)) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
            console.log(`📐 画像リサイズ: ${img.width}x${img.height} → ${width}x${height}`);
          }

          canvas.width = width;
          canvas.height = height;

          // 画像を描画
          ctx.drawImage(img, 0, 0, width, height);

          // 出力フォーマットを決定
          let outputFormat = file.type;
          let formatInfo = 'original';

          if (enableFormatConversion) {
            const bestFormat = this.getBestFormat();
            outputFormat = bestFormat.format;
            formatInfo = bestFormat.extension;
          }

          // Blobとして出力
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('画像の最適化に失敗しました'));
              return;
            }

            const optimizedSize = blob.size;
            const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

            console.log(`🎨 画像最適化完了:
              📏 サイズ: ${(originalSize/1024).toFixed(1)}KB → ${(optimizedSize/1024).toFixed(1)}KB
              📉 圧縮率: ${compressionRatio}%
              🎭 フォーマット: ${formatInfo}`);

            resolve({
              optimizedFile: new File([blob], file.name, { type: outputFormat }),
              originalSize,
              optimizedSize,
              compressionRatio: parseFloat(compressionRatio),
              format: formatInfo
            });
          }, outputFormat, quality);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = URL.createObjectURL(file);
    });
  },

  // 複数画像の一括最適化
  async optimizeMultipleImages(files, options = {}) {
    const results = [];
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    for (const file of files) {
      try {
        const result = await this.optimizeImage(file, options);
        results.push(result);
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;
      } catch (error) {
        console.error(`画像最適化エラー (${file.name}):`, error);
        results.push({
          optimizedFile: file,
          originalSize: file.size,
          optimizedSize: file.size,
          compressionRatio: 0,
          format: 'error',
          error: error.message
        });
      }
    }

    const totalCompressionRatio = totalOriginalSize > 0 
      ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1)
      : 0;

    return {
      results,
      summary: {
        totalOriginalSize,
        totalOptimizedSize,
        totalCompressionRatio: parseFloat(totalCompressionRatio),
        processedCount: files.length
      }
    };
  }
};

// Lazy Loading Implementation
const LazyLoader = {
  // Intersection Observer のインスタンス
  imageObserver: null,

  // 初期化
  init() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.imageObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px' // 画面に入る50px前から読み込み開始
      });
    }
  },

  // 画像を遅延読み込み対象として設定
  observe(img) {
    if (this.imageObserver && img.dataset.src) {
      img.classList.add('lazy-loading');
      this.imageObserver.observe(img);
    } else {
      // Intersection Observer が使えない場合は即座に読み込み
      this.loadImage(img);
    }
  },

  // 画像を実際に読み込み
  loadImage(img) {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      img.onload = () => {
        console.log('🖼️ 遅延画像読み込み完了:', img.src);
      };
    }
  },

  // 全ての遅延読み込み画像を強制読み込み
  loadAll() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.loadImage(img);
      if (this.imageObserver) {
        this.imageObserver.unobserve(img);
      }
    });
  }
};

// File Management Functions
async function cleanupOldFiles() {
  try {
    console.log('古いファイルのクリーンアップを開始します...');
    
    // Get list of all files in storage
    const { data: files, error: listError } = await supabase.storage
      .from('workplace-files')
      .list();

    if (listError) {
      console.error('ファイル一覧の取得に失敗:', listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('削除対象のファイルはありません');
      return;
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Filter files older than 1 month
    const oldFiles = files.filter(file => {
      if (!file.created_at) return false;
      const fileDate = new Date(file.created_at);
      return fileDate < oneMonthAgo;
    });

    if (oldFiles.length === 0) {
      console.log('1ヶ月以上経過したファイルはありません');
      return;
    }

    console.log(`${oldFiles.length}個の古いファイルを削除します`);

    // Delete old files from storage
    const filesToDelete = oldFiles.map(file => file.name);
    const { error: deleteError } = await supabase.storage
      .from('workplace-files')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('ファイル削除に失敗:', deleteError);
    } else {
      console.log(`${oldFiles.length}個のファイルを正常に削除しました`);
      
      // Clean up file_url references in database
      await cleanupFileReferences();
    }
  } catch (error) {
    console.error('ファイルクリーンアップ中にエラーが発生:', error);
  }
}

async function cleanupFileReferences() {
  try {
    // Get all storage files to compare against database references
    const { data: files, error: listError } = await supabase.storage
      .from('workplace-files')
      .list();

    if (listError) return;

    const existingFiles = files?.map(file => file.name) || [];

    // Clean up handover file references
    const handovers = appData.handovers.filter(h => h.file_url);
    for (const handover of handovers) {
      const fileName = handover.file_url.split('/').pop();
      if (!existingFiles.includes(fileName)) {
        await supabase
          .from('handovers')
          .update({ file_url: null })
          .eq('id', handover.id);
      }
    }

    // Clean up task file references
    const tasks = appData.tasks.filter(t => t.file_url);
    for (const task of tasks) {
      const fileName = task.file_url.split('/').pop();
      if (!existingFiles.includes(fileName)) {
        await supabase
          .from('tasks')
          .update({ file_url: null })
          .eq('id', task.id);
      }
    }

    console.log('データベースの無効なファイル参照をクリーンアップしました');
  } catch (error) {
    console.error('ファイル参照のクリーンアップ中にエラーが発生:', error);
  }
}

async function getStorageUsage() {
  try {
    const { data: files, error } = await supabase.storage
      .from('workplace-files')
      .list();

    if (error) {
      console.error('ストレージ使用量の取得に失敗:', error);
      return null;
    }

    const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
    const fileSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    console.log(`現在のストレージ使用量: ${fileSizeMB}MB (${files?.length || 0}ファイル)`);
    return { totalSize, fileCount: files?.length || 0, sizeMB: fileSizeMB };
  } catch (error) {
    console.error('ストレージ使用量の計算中にエラーが発生:', error);
    return null;
  }
}

// Monitoring Management Functions
async function checkMonitoringStatus() {
  const sentryInitialized = ErrorTracker.init();
  const healthReport = HealthMonitor.generateHealthReport();
  
  // Update monitoring status display
  document.getElementById('sentry-status').textContent = sentryInitialized ? '動作中' : '無効';
  document.getElementById('sentry-status').className = sentryInitialized ? 'status-success' : 'status-warning';
  
  document.getElementById('uptime-status').textContent = healthReport.uptime.formatted;
  document.getElementById('uptime-status').className = 'status-info';
  
  document.getElementById('performance-status').textContent = 
    healthReport.status === 'healthy' ? '正常' : 
    healthReport.status === 'warning' ? '警告' : '異常';
  document.getElementById('performance-status').className = 
    healthReport.status === 'healthy' ? 'status-success' : 
    healthReport.status === 'warning' ? 'status-warning' : 'status-error';
  
  console.log('📊 監視状況:', {
    sentry: sentryInitialized,
    health: healthReport
  });
}

async function testErrorTracking() {
  try {
    // 意図的にエラーを発生させてテスト
    const testError = new Error('テスト用エラー - 無視してください');
    ErrorTracker.captureError(testError, {
      component: 'monitoring-test',
      testType: 'manual'
    });
    
    // 警告レベルのテスト
    ErrorTracker.captureWarning('テスト用警告 - 無視してください', {
      component: 'monitoring-test',
      testType: 'manual'
    });
    
    alert('エラートラッキングテストが完了しました。コンソールとSentryダッシュボードを確認してください。');
  } catch (error) {
    console.error('エラートラッキングテストに失敗:', error);
  }
}

async function viewLocalLogs() {
  try {
    const logs = ErrorTracker.getLocalErrorLogs();
    const healthMetrics = JSON.parse(localStorage.getItem('health_metrics') || '{}');
    
    const logWindow = window.open('', '_blank', 'width=800,height=600');
    logWindow.document.write(`
      <html>
        <head>
          <title>システムログ</title>
          <style>
            body { font-family: monospace; margin: 20px; }
            .log-entry { margin: 10px 0; padding: 10px; border-left: 3px solid #ccc; }
            .error { border-left-color: #f44336; }
            .warning { border-left-color: #ff9800; }
            .info { border-left-color: #2196f3; }
            .timestamp { color: #666; font-size: 0.9em; }
            .metrics { background: #f5f5f5; padding: 15px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>システムログ</h1>
          <div class="metrics">
            <h2>ヘルスメトリクス</h2>
            <pre>${JSON.stringify(healthMetrics, null, 2)}</pre>
          </div>
          <h2>エラーログ (最新${logs.length}件)</h2>
          ${logs.reverse().map(log => `
            <div class="log-entry error">
              <div class="timestamp">${new Date(log.timestamp).toLocaleString()}</div>
              <div><strong>${log.message}</strong></div>
              ${log.stack ? `<pre>${log.stack}</pre>` : ''}
              ${log.context ? `<div>Context: ${JSON.stringify(log.context)}</div>` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `);
    logWindow.document.close();
  } catch (error) {
    console.error('ログ表示に失敗:', error);
    alert('ログの表示に失敗しました。コンソールを確認してください。');
  }
}

// Initialize Application
async function initializeApp() {
  initializeNavigation();
  initializeModal();
  
  // Initialize monitoring systems
  ErrorTracker.init();
  HealthMonitor.init();
  
  // Initialize image optimization features
  LazyLoader.init();
  console.log(`🖼️ 画像最適化機能を初期化:
    - WebP サポート: ${ImageOptimizer.supportsWebP ? '✅' : '❌'}
    - AVIF サポート: ${ImageOptimizer.supportsAVIF ? '✅' : '❌'}
    - 遅延読み込み: ${LazyLoader.imageObserver ? '✅' : '❌'}`);
  
  document.getElementById('add-schedule-btn').addEventListener('click', showScheduleModal);
  document.getElementById('add-handover-btn').addEventListener('click', showHandoverModal);
  document.getElementById('add-task-btn').addEventListener('click', showTaskModal);
  
  // Add monitoring event listeners
  document.getElementById('check-monitoring-btn').addEventListener('click', checkMonitoringStatus);
  document.getElementById('test-error-btn').addEventListener('click', testErrorTracking);
  document.getElementById('view-logs-btn').addEventListener('click', viewLocalLogs);
  
  await fetchData();
  
  // Run file cleanup on app start
  await cleanupOldFiles();
  await getStorageUsage();
  
  // Initialize monitoring status
  await checkMonitoringStatus();
  
  showSection('dashboard');
}

document.addEventListener('DOMContentLoaded', initializeApp);
// Force redeploy #午後
