# For detailed usage instructions, see the [User Guide](./user-guide.md).

---
# TaskFlow - Real-time Collaborative Task Manager

![TaskFlow Banner](docs/screenshots/banner.png)

A modern, real-time collaborative task management application built with React, Node.js (TypeScript), and PostgreSQL.

---

# [Live Demo](https://taskflow-client-p251.onrender.com/login)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [AI Tools Usage](#ai-tools-usage)

## Overview

TaskFlow is a real-time collaborative task manager that enables teams to create, assign, and track tasks efficiently. It features Google OAuth authentication, real-time updates via WebSockets, and a premium, responsive UI.

### Key Highlights

- **Real-time collaboration**: Changes sync instantly across all connected clients.
- **Google OAuth**: Secure authentication with Google accounts
- **Task assignment by email**: Assign tasks to users even before they sign up
- **Premium UI**: Modern, responsive design with smooth animations
- **Type-safe**: Full TypeScript implementation on both frontend and backend

## Features

### Authentication
- Google OAuth 2.0 sign-in
- Email/password registration and login
- Secure JWT-based session management with HTTP-only cookies

### Task Management
- Create, edit, delete, and duplicate tasks
- Set priority levels (High, Medium, Normal, Low)
- Track task stages (To Do, In Progress, Completed)
- Add subtasks with completion tracking
- Set due dates
- Activity timeline for each task
- Soft delete with trash/restore functionality

### Collaboration
- Assign tasks to users by email address
- **Pending assignment**: Tasks assigned to non-registered emails are automatically linked when the user signs up
- Real-time notifications for task assignments and updates
- Activity comments on tasks

### Dashboard
- Task statistics overview
- Tasks grouped by priority (chart)
- Recent tasks list
- Quick navigation to task details

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Redux Toolkit + RTK Query | State management & API caching |
| React Router v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations |
| Headless UI | Accessible components |
| Socket.IO Client | Real-time communication |
| React Hook Form | Form handling |
| Recharts | Data visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| TypeScript | Type safety |
| Express.js | Web framework |
| Prisma | ORM for PostgreSQL |
| PostgreSQL | Relational database |
| Socket.IO | Real-time WebSocket server |
| JWT | Authentication tokens |
| Zod | Request validation |
| Google Auth Library | OAuth verification |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client (React)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Pages     │  │ Components  │  │ Redux Store │  │  Socket.IO      │ │
│  │ (Dashboard, │  │ (TaskModal, │  │ (Auth, API  │  │  Client         │ │
│  │  Tasks...)  │  │  Sidebar...)│  │   Slices)   │  │  (Real-time)    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                │                  │          │
└─────────┼────────────────┼────────────────┼──────────────────┼──────────┘
          │                │                │                  │
          ▼                ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Layer (REST + WebSocket)                   │
│                                                                         │
│  HTTP Requests ────────────────────────┐  ┌─────── WebSocket Events     │
│                                        │  │                             │
└────────────────────────────────────────┼──┼──────────────────────────────
                                         │  │
                                         ▼  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Server (Express + Socket.IO)                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Routes     │  │ Controllers  │  │  Middleware  │  │   Socket    │  │
│  │ (auth, task, │  │ (business    │  │ (auth, error,│  │   Handler   │  │
│  │   user)      │  │   logic)     │  │  validation) │  │             │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         │                 │                 │                 │         │
│         └─────────────────┼─────────────────┼─────────────────┘         │
│                           │                 │                           │
│                           ▼                 ▼                           │
│                    ┌──────────────────────────────┐                     │
│                    │         Prisma ORM           │                     │
│                    │    (Type-safe DB queries)    │                     │
│                    └──────────────┬───────────────┘                     │
│                                   │                                     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     PostgreSQL       │
                         │      Database        │
                         │                      │
                         │  ┌───────────────┐   │
                         │  │    users      │   │
                         │  │    tasks      │   │
                         │  │   subtasks    │   │
                         │  │  activities   │   │
                         │  │ notifications │   │
                         │  └───────────────┘   │
                         └──────────────────────┘
```

### Data Flow

1. **Authentication Flow**:
   - User signs in via Google OAuth or email/password
   - Server verifies credentials and issues JWT token
   - Token stored in HTTP-only cookie for security
   - Subsequent requests include cookie automatically

2. **Task Assignment Flow**:
   - User creates task with assignee email
   - If assignee exists: link task and send notification
   - If assignee doesn't exist: store email for later linking
   - When new user registers: automatically link pending tasks

3. **Real-time Update Flow**:
   - Client connects to Socket.IO server with JWT token
   - User joins their personal room (`user:{userId}`)
   - When viewing a task, joins task room (`task:{taskId}`)
   - Server emits events on task/notification changes
   - RTK Query cache invalidated on real-time events

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn
- Google Cloud Console project (for OAuth)

### 1. Clone the Repository

```bash
git clone https://github.com/maanvijangid/taskflow
cd taskflow
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE task_manager;
\q
```

### 3. Server Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values:
# DATABASE_URL="postgresql://username:password@localhost:5432/task_manager"
# JWT_SECRET="your-secure-secret-key"
# GOOGLE_CLIENT_ID="your-google-client-id"
# CLIENT_URL="http://localhost:5173"

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# (Optional) Seed demo data
npm run db:seed

# Start development server
npm run dev
```

### 4. Client Setup

```bash
cd client

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values:
# VITE_API_URL=http://localhost:8800
# VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Start development server
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8800/api

### Demo Credentials (after seeding)

| Email | Password |
|-------|----------|
| demo@example.com | password123 |
| john@example.com | password123 |
| jane@example.com | password123 |

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google-login` | Login with Google |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PUT | `/api/tasks/:id/stage` | Change task stage |
| POST | `/api/tasks/:id/duplicate` | Duplicate task |
| PUT | `/api/tasks/:id/trash` | Move to trash |
| PUT | `/api/tasks/:id/restore` | Restore from trash |
| DELETE | `/api/tasks/:id` | Permanently delete |
| GET | `/api/tasks/dashboard` | Dashboard stats |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/notifications` | Get notifications |
| PUT | `/api/users/notifications/:id/read` | Mark notification read |

## Testing

### Running Tests

```bash
cd server

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```


## Deployment

- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend**: Railway, Render, or Fly.io
- **Database**: Neon (serverless PostgreSQL) or Supabase

### Environment Variables

**Production Server (.env)**:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="production-secure-secret"
NODE_ENV="production"
GOOGLE_CLIENT_ID="..."
CLIENT_URL="https://your-frontend-domain.com"
PORT=8800
```

**Production Client (.env)**:
```env
VITE_API_URL="https://your-backend-domain.com"
VITE_GOOGLE_CLIENT_ID="..."
```



## AI Tools Usage

### What I Used AI For

1. **Boilerplate generation**: Initial project structure, Prisma schema setup, Redux store configuration
2. **Error handling patterns**: Implementing consistent error middleware
