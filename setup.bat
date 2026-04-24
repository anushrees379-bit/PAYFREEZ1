@echo off
cls
echo ================================================================================
echo                Government Fraud Detection System - Setup
echo ================================================================================
echo.

REM Check if Python is installed
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python 3.8 or higher from https://python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

python --version
echo [OK] Python is installed
echo.

REM Create virtual environment
echo [2/6] Creating virtual environment...
if exist "venv" (
    echo [INFO] Virtual environment already exists
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
)
echo.

REM Activate virtual environment
echo [3/6] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated
echo.

REM Upgrade pip
echo [4/6] Upgrading pip...
python -m pip install --upgrade pip
echo [OK] Pip upgraded
echo.

REM Install dependencies
echo [5/6] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Setup environment file
echo [6/6] Setting up environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] .env file created from template
        echo [INFO] Please edit .env file to configure your settings
    ) else (
        echo [WARNING] .env.example file not found
    )
) else (
    echo [INFO] .env file already exists
)
echo.

echo ================================================================================
echo                              Setup Complete!
echo ================================================================================
echo.
echo The Government Fraud Detection System has been set up successfully.
echo.
echo To start the application:
echo   1. Run: start.bat (for development mode)
echo   2. Run: start-production.bat (for production mode)
echo   3. Run: docker-compose up (for Docker deployment)
echo.
echo Web Interface: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.
echo For more information, see README.md
echo.
pause
