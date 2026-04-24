@echo off
echo ========================================
echo Government Fraud Detection System
echo Production Startup
echo ========================================

REM Check if virtual environment exists
if not exist "venv" (
    echo Error: Virtual environment not found
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found
    echo Please create .env file with your configuration
    pause
    exit /b 1
)

REM Start the application in production mode
echo Starting application in production mode...
echo.
echo Web Interface: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Monitoring: http://localhost:9090 (Prometheus)
echo.
echo Press Ctrl+C to stop the application
echo ========================================

python start.py --production

pause
