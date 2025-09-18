# TimeTracker

A full-stack time tracking application built with FastAPI and React. Track your time across projects with a modern Progressive Web App (PWA) interface.

## Features

### Backend (FastAPI)
- 🔐 **JWT Authentication** - Secure user registration and login
- 📊 **RESTful API** - Complete CRUD operations for users, projects, and time entries
- 🗄️ **PostgreSQL Database** - Robust data storage with SQLAlchemy ORM
- 🔄 **Database Migrations** - Alembic for schema management
- 📚 **Auto-generated Documentation** - Interactive API docs with Swagger/OpenAPI
- ⚡ **Async Support** - High-performance async database operations

### Frontend (React PWA)
- ⏱️ **Real-time Timer** - Start/stop time tracking with live duration updates
- 📱 **Progressive Web App** - Installable, works offline
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and dark mode support
- 🔒 **Protected Routes** - Secure navigation with authentication
- 📊 **Dashboard** - Overview of daily/weekly time tracking statistics
- 🏷️ **Project Management** - Create and organize projects with color coding
- 📝 **Time Entry Management** - Edit, delete, and organize time entries
- 🌐 **Offline Support** - Works without internet connection (PWA features)

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for Python
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Advanced open source database
- **Alembic** - Database migration tool
- **Pydantic** - Data validation using Python type annotations
- **JWT** - JSON Web Token for authentication
- **bcrypt** - Password hashing

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Declarative routing
- **Zustand** - Simple state management
- **Axios** - HTTP client
- **date-fns** - Modern date utility library
- **Lucide React** - Beautiful icons

### DevOps
- **Docker** - Containerization
- **docker-compose** - Multi-container Docker applications

## Project Structure

```
timetracker/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── core/           # Core functionality (config, security, database)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── api/v1/         # API routes
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React PWA Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Development environment
├── .env.example           # Environment variables template
└── README.md
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timetracker
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up database**
   ```bash
   # Make sure PostgreSQL is running
   alembic upgrade head
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

## API Documentation

The API is automatically documented using FastAPI's built-in OpenAPI support. When the backend is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

#### Projects
- `GET /api/v1/projects` - Get all projects
- `POST /api/v1/projects` - Create project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

#### Time Entries
- `GET /api/v1/time-entries` - Get all time entries
- `POST /api/v1/time-entries` - Start new time entry
- `GET /api/v1/time-entries/active` - Get active time entry
- `POST /api/v1/time-entries/{id}/stop` - Stop time entry
- `PUT /api/v1/time-entries/{id}` - Update time entry
- `DELETE /api/v1/time-entries/{id}` - Delete time entry

## Usage

### Creating Your First Project

1. Register an account or login
2. Navigate to the "Projects" page
3. Click "New Project"
4. Fill in project details and choose a color
5. Save the project

### Tracking Time

1. Go to the Dashboard
2. Select a project from the dropdown
3. Optionally add a description
4. Click "Start Timer"
5. The timer will run and show live updates
6. Click "Stop Timer" when finished

### Managing Time Entries

1. Navigate to "Time Entries"
2. View all your recorded time
3. Edit entries by clicking the edit icon
4. Delete unwanted entries
5. Stop running timers directly from the list

## Database Schema

### Users
- `id`: Primary key
- `email`: Unique email address
- `hashed_password`: Bcrypt hashed password
- `full_name`: Optional full name
- `is_active`: Account status
- `created_at`: Account creation timestamp

### Projects
- `id`: Primary key
- `name`: Project name
- `description`: Optional description
- `color`: Hex color code for UI
- `user_id`: Foreign key to users
- `is_active`: Project status
- `created_at`: Creation timestamp

### Time Entries
- `id`: Primary key
- `start_time`: When tracking started
- `end_time`: When tracking stopped (null for running entries)
- `description`: Optional description
- `project_id`: Foreign key to projects
- `user_id`: Foreign key to users
- `created_at`: Creation timestamp

## Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication
- **CORS Configuration**: Properly configured for frontend access
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection
- **Protected Routes**: All API endpoints require authentication

## PWA Features

- **Offline Support**: Service worker caches essential assets
- **Installable**: Can be installed as a native app
- **Responsive**: Works on desktop, tablet, and mobile
- **Network First**: API calls with fallback to cache
- **App Manifest**: Proper PWA configuration

## Development

### Database Migrations

Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

### Building for Production

Backend:
```bash
docker build -t timetracker-backend ./backend
```

Frontend:
```bash
cd frontend
npm run build
docker build -t timetracker-frontend .
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/timetracker
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any problems or have questions, please open an issue on GitHub.