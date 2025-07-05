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
- `tasks` - Task management (id, title, department, description, priority, due_date, assignedBy, completed, file_url)

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
3. **Tasks** (タスク管理): Grid-based task management with completion tracking
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

## Important Implementation Details

- All text is in Japanese - maintain this when making changes
- Status management uses specific values: 'pending', 'in-progress', 'completed'
- File uploads are handled asynchronously with proper error handling
- The application includes comprehensive error handling with Japanese error messages