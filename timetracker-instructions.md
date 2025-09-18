# Claude Code Project Instructions - TimeTracker App

## Projektübersicht
Erstelle eine vollständige Zeiterfassungs-App mit FastAPI Backend und React PWA Frontend.

## Technologie Stack
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + JWT Auth
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + PWA
- **Database**: PostgreSQL
- **Deployment**: Docker + docker-compose für lokale Entwicklung

## Projektstruktur
```
timetracker/
├── backend/                # FastAPI Backend
├── frontend/              # React PWA Frontend
├── docker-compose.yml     # Development Setup
├── README.md
└── .env.example
```

## Backend Anforderungen (FastAPI)

### Core Features
1. **Authentication System**
   - User Registration/Login mit Email & Passwort
   - JWT Token basierte Authentifizierung
   - Password Hashing mit bcrypt
   - Protected Routes mit Dependencies

2. **Database Models**
   - **User**: id, email, hashed_password, full_name, created_at, is_active
   - **Project**: id, name, description, color, user_id, created_at, is_active
   - **TimeEntry**: id, start_time, end_time, description, project_id, user_id, created_at

3. **API Endpoints**
   ```
   POST /api/v1/auth/register
   POST /api/v1/auth/login
   GET  /api/v1/auth/me
   
   GET    /api/v1/projects
   POST   /api/v1/projects
   PUT    /api/v1/projects/{id}
   DELETE /api/v1/projects/{id}
   
   GET    /api/v1/time-entries
   POST   /api/v1/time-entries
   PUT    /api/v1/time-entries/{id}
   DELETE /api/v1/time-entries/{id}
   GET    /api/v1/time-entries/active (laufende Zeiterfassung)
   POST   /api/v1/time-entries/{id}/stop
   ```

4. **Backend Setup Requirements**
   - SQLAlchemy ORM mit async support
   - Alembic für Database Migrations
   - Pydantic Schemas für Request/Response Validation
   - CORS Middleware für Frontend Zugriff
   - Environment Configuration mit pydantic Settings
   - Dependency Injection für Database und Auth

### Backend Dateistruktur
```
backend/
├── app/
│   ├── main.py             # FastAPI App
│   ├── core/
│   │   ├── config.py       # Settings
│   │   ├── security.py     # JWT & Password Hashing
│   │   └── database.py     # DB Connection
│   ├── models/             # SQLAlchemy Models
│   ├── schemas/            # Pydantic Schemas
│   ├── api/v1/             # API Routes
│   └── services/           # Business Logic
├── requirements.txt
├── Dockerfile
└── alembic/               # Migrations
```

## Frontend Anforderungen (React PWA)

### Core Features
1. **Authentication**
   - Login/Register Forms
   - Token-basierte Auth mit localStorage
   - Protected Routes
   - Auto-logout bei expired Token

2. **Zeit-Tracking Interface**
   - Start/Stop/Pause Timer
   - Projekt-Auswahl für Zeiterfassung
   - Aktuelle laufende Zeit anzeigen
   - Liste aller Zeiteinträge mit Bearbeitung

3. **Project Management**
   - Projekte erstellen/bearbeiten/löschen
   - Farbkodierung für Projekte
   - Projektstatistiken

4. **PWA Features**
   - Service Worker für Offline-Funktionalität
   - App Manifest für Installation
   - Responsive Design (Mobile-First)
   - Offline-Datenspeicherung mit IndexedDB
   - Background Sync für Offline-Änderungen

5. **UI/UX Features**
   - Dashboard mit Übersicht
   - Timer-Interface mit großen Start/Stop Buttons
   - Dunkler Modus Support
   - Toast Notifications
   - Loading States

### Frontend Dateistruktur
```
frontend/
├── public/
│   ├── manifest.json      # PWA Manifest
│   └── icons/             # PWA Icons
├── src/
│   ├── components/        # React Components
│   ├── pages/             # Page Components
│   ├── hooks/             # Custom Hooks
│   ├── services/          # API & Offline Services
│   ├── store/             # State Management (Zustand)
│   ├── utils/             # Helper Functions
│   └── types/             # TypeScript Types
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Entwicklungsreihenfolge

### Phase 1: Backend Setup
1. FastAPI Projekt mit SQLAlchemy setup
2. User Model und Authentication
3. Database Migrations mit Alembic
4. Basic CRUD für Users

### Phase 2: Core Backend APIs
1. Project Model und CRUD APIs
2. TimeEntry Model und CRUD APIs
3. JWT Authentication für alle Routes
4. API Documentation (automatisch durch FastAPI)

### Phase 3: Frontend Setup
1. React + Vite + TypeScript Setup
2. Tailwind CSS Integration
3. Basic Routing mit React Router
4. Auth Context und Login/Register

### Phase 4: Frontend Features
1. Timer Interface mit Start/Stop
2. Project Management Interface
3. Time Entry List und Bearbeitung
4. Dashboard mit Statistiken

### Phase 5: PWA Features
1. Service Worker Setup
2. Offline Storage mit IndexedDB
3. Background Sync
4. App Manifest und Installation

### Phase 6: Polish & Deployment
1. Error Handling und Validation
2. Loading States und UX Improvements
3. Docker Setup für Production
4. Environment Configuration

## Besondere Anforderungen

### Timer Logic
- Nur eine aktive Zeiterfassung pro User
- Start ohne End-Zeit erstellt "running" TimeEntry
- Stop fügt End-Zeit hinzu
- Frontend zeigt laufende Zeit in Echtzeit

### Offline Support
- Zeiterfassung muss offline funktionieren
- Sync bei Internetverbindung
- Konfliktbehandlung bei gleichzeitigen Änderungen

### Security
- Alle API Routes (außer Auth) erfordern gültigen JWT
- CORS richtig konfiguriert
- Input Validation mit Pydantic
- SQL Injection Schutz durch SQLAlchemy

## Dependencies

### Backend (requirements.txt)
```
fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
python-multipart
pydantic-settings
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react",
    "react-dom",
    "react-router-dom",
    "@types/react",
    "@types/react-dom",
    "zustand",
    "date-fns",
    "lucide-react"
  },
  "devDependencies": {
    "vite",
    "typescript",
    "@vitejs/plugin-react",
    "tailwindcss",
    "autoprefixer",
    "postcss"
  }
}
```

## Docker Setup
Erstelle docker-compose.yml für lokale Entwicklung mit:
- PostgreSQL Database
- Backend Service (FastAPI)
- Frontend Service (Vite Dev Server)
- Volume Mapping für Live-Reload

## Wichtige Hinweise
- Verwende TypeScript für typsichere Entwicklung
- Implementiere proper Error Handling
- Nutze FastAPI's automatische API Documentation
- PWA muss auch offline funktionieren
- Mobile-First Responsive Design
- Umfangreiche Kommentare für wichtige Business Logic