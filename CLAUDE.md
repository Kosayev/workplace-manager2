# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese workplace management system (職場管理システム) built as a single-page application (SPA) for a fire station (東通消防署). The application manages schedules, handovers, tasks, and settings for different departments.

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Supabase (PostgreSQL database + Authentication + Storage)
- **Architecture**: Client-side SPA with direct database connections
- **Language**: Japanese (all UI text and comments)

## File Structure

```
workplace-manager-2/
├── app.js          # Main application logic and Supabase integration
├── index.html      # Single HTML file with all sections
├── style.css       # Complete styling with CSS custom properties
└── .gitignore      # Basic Git ignore file
```

## Database Schema

The application uses Supabase with the following tables:

- `departments` - Department management (id, name, color)
- `priorities` - Priority levels (id, name, color)  
- `schedules` - Daily scheduling (id, title, department, date, time, description, duration)
- `handovers` - Handover items (id, department, title, description, priority, timestamp, status, file_url)
- `tasks` - Task management (id, title, department, description, priority, due_date, assignedBy, completed, file_url, status, status_comment, assigned_to, last_updated)

## Application Architecture

### State Management
- Global `appData` object stores all application state
- No external state management library used
- Direct synchronization with Supabase on CRUD operations

### Navigation System
- Single-page application with section-based navigation
- Sections: dashboard, handovers, tasks, calendar, settings
- Mobile-responsive sidebar navigation

### Key Features

1. **Dashboard**: Today/tomorrow schedule overview with search
2. **Handovers** (申し送り事項): Department-based tabs with priority/status filtering
3. **Tasks** (タスク管理): Advanced task management with status tracking, progress comments, and assignee management
4. **Calendar**: Monthly calendar view with department-colored events
5. **Settings**: Dynamic department and priority management

### File Upload
- Uses Supabase Storage bucket `workplace-files`
- Supports file attachments for handovers and tasks
- Automatic file cleanup on item deletion

## Development Notes

### No Build System
- This is a static web application with no build process
- All code is directly executable in the browser
- Supabase client loaded via CDN

### Styling Architecture
- CSS custom properties for theming
- Automatic dark/light mode support
- Mobile-first responsive design
- Consistent spacing and color system

### Key Functions

#### Data Management
- `fetchData()` - Loads all data from Supabase on app initialization
- `add*()` functions - Create new records (schedules, handovers, tasks)
- `delete*()` functions - Remove records and associated files
- `edit*()` functions - Update existing records

#### UI Rendering
- `render*()` functions - Update UI sections based on current state
- `show*Modal()` functions - Display modals for adding/editing items
- `initializeApp()` - Main application initialization

### Mobile Responsiveness
- Collapsible sidebar navigation
- Responsive grid layouts
- Touch-friendly interface elements
- Optimized for smartphone display

## Common Development Tasks

Since this is a static application, development is straightforward:

1. **Testing**: Open `index.html` in a web browser
2. **Debugging**: Use browser developer tools
3. **Deployment**: Upload files to any static hosting service

## Database Configuration

The Supabase configuration is hardcoded in `app.js:3-4`. Update these values for different environments:

```javascript
const SUPABASE_URL = 'https://fpykdcvcswamsiawtibh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## Performance Optimization Features

### Local Storage Cache System
- **Cache Duration**: departments/priorities (60min), schedules (15min), handovers/tasks (10min)
- **Auto Cleanup**: Expired cache removal on app startup
- **Fallback Support**: Offline capability with cached data
- **Cache Management**: Settings panel with usage display and manual controls

### Image Optimization System
- **Format Support**: Automatic WebP/AVIF conversion with fallback to JPEG
- **Automatic Compression**: Client-side image optimization before upload (85% quality)
- **Lazy Loading**: Intersection Observer for images with blur-to-sharp transition
- **File Size Reduction**: 50-80% typical compression ratio
- **Optimization Testing**: Built-in test function in settings

### File Management
- **Auto Cleanup**: Files older than 1 month are automatically deleted
- **Storage Monitoring**: Real-time usage tracking with progress bars
- **Reference Cleanup**: Database cleanup of invalid file references
- **Manual Controls**: Force cleanup and storage verification

## Configuration Files

### Vercel Optimization (vercel.json)
- Image optimization with WebP/AVIF support
- CDN caching headers for static assets
- Supabase domain whitelist for image optimization

### Task Status Management (New Feature)
- **Four Status Types**: 未着手(not_started), 着手中(in_progress), 決裁中(pending_approval), 対応済(completed)
- **Progress Comments**:担当者が進捗コメントを追加可能 (例: "伺書起案中です")
- **Assignee Tracking**: 依頼者(assignedBy)と担当者(assigned_to)を分けて管理
- **Quick Actions**: ステータスの進行/後退をワンクリックで実行
- **Status Filtering**: ステータス別でのタスク絞り込み表示
- **Visual Indicators**: ステータス別の色分け表示とアイコン

### Error Tracking & Monitoring
- **Sentry Integration**: 本番環境でのエラー自動収集
- **Health Monitoring**: パフォーマンス・メモリ・ネットワーク監視
- **Local Fallback**: Sentryが利用できない場合のローカルログ保存
- **Monitoring Dashboard**: 設定画面での監視状況確認

## Important Implementation Details

- All text is in Japanese - maintain this when making changes
- Task status management uses specific values: 'not_started', 'in_progress', 'pending_approval', 'completed'
- Handover status uses: 'pending', 'in-progress', 'completed'
- File uploads include automatic image optimization before Supabase upload
- Cache keys use 'workplace_cache_' prefix for easy identification
- Image optimization gracefully degrades if optimization fails
- The application includes comprehensive error handling with Japanese error messages