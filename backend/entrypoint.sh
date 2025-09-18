#!/bin/bash
set -e

echo "🔃 Running database migrations..."

# Wait for database to be ready
until python -c "
import asyncpg
import asyncio
import os

async def check_db():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/timetracker'))
        await conn.close()
        print('Database is ready!')
        return True
    except Exception as e:
        print(f'Database not ready: {e}')
        return False

if not asyncio.run(check_db()):
    exit(1)
"; do
  echo "⏳ Waiting for database..."
  sleep 2
done

# Run Alembic migrations
echo "🔧 Running Alembic migrations..."
alembic upgrade head

# Start the application
echo "🚀 Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000