@echo off
echo ================================================
echo  Global Seismic Monitoring System
echo ================================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create a .env file with your Hugging Face token.
    echo You can copy .env.example and edit it:
    echo.
    echo   copy .env.example .env
    echo   notepad .env
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo Starting services with Docker Compose...
echo.
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start services!
    pause
    exit /b 1
)

echo.
echo ================================================
echo  Services started successfully!
echo ================================================
echo.
echo  Backend API:  http://localhost:8000
echo  API Docs:     http://localhost:8000/docs
echo  Frontend:     http://localhost:3000
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Opening frontend in browser...
start http://localhost:3000

echo.
echo To view logs: docker-compose logs -f
echo To stop:      docker-compose down
echo.
pause
