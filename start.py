#!/usr/bin/env python3
"""
Startup script for Government Fraud Detection System
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✓ Python version: {sys.version}")

def check_virtual_environment():
    """Check if running in virtual environment"""
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("Warning: Not running in a virtual environment")
        print("It's recommended to use a virtual environment")
        return False
    print("✓ Running in virtual environment")
    return True

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)

def setup_environment():
    """Set up environment variables"""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        print("Creating .env file from template...")
        import shutil
        shutil.copy(env_example, env_file)
        print("✓ .env file created")
        print("Please edit .env file with your configuration before starting the application")
    elif env_file.exists():
        print("✓ .env file exists")
    else:
        print("Warning: No .env file found")

def check_database():
    """Check database connectivity"""
    try:
        from app import engine
        engine.execute("SELECT 1")
        print("✓ Database connection successful")
    except Exception as e:
        print(f"Database connection error: {e}")
        print("The application will create the database on first run")

def start_application(mode="development"):
    """Start the application"""
    if mode == "development":
        print("Starting application in development mode...")
        try:
            import uvicorn
            uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
        except KeyboardInterrupt:
            print("\nApplication stopped by user")
        except ImportError:
            print("Error: uvicorn not installed. Please run: pip install uvicorn")
            sys.exit(1)
    elif mode == "production":
        print("Starting application in production mode...")
        try:
            subprocess.check_call([
                "gunicorn", "app:app",
                "--workers", "4",
                "--worker-class", "uvicorn.workers.UvicornWorker",
                "--bind", "0.0.0.0:8000",
                "--timeout", "120",
                "--keepalive", "5"
            ])
        except subprocess.CalledProcessError as e:
            print(f"Error starting production server: {e}")
            sys.exit(1)
        except FileNotFoundError:
            print("Error: gunicorn not installed. Please run: pip install gunicorn")
            sys.exit(1)

def main():
    """Main startup function"""
    print("=" * 60)
    print("Government Fraud Detection System - Startup")
    print("=" * 60)
    
    # Check system requirements
    check_python_version()
    check_virtual_environment()
    
    # Setup environment
    setup_environment()
    
    # Install dependencies
    if "--skip-install" not in sys.argv:
        install_dependencies()
    
    # Check database
    if "--skip-db-check" not in sys.argv:
        check_database()
    
    # Determine run mode
    mode = "development"
    if "--production" in sys.argv:
        mode = "production"
    
    print(f"\nStarting in {mode} mode...")
    print("Web Interface: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("\nPress Ctrl+C to stop the application")
    print("=" * 60)
    
    # Start application
    start_application(mode)

if __name__ == "__main__":
    main()
