#!/usr/bin/env python3
"""
Diagnostic script to check Python environment and dependencies
"""
import sys
import os
import subprocess
import platform

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required")
        return False
    print("✅ Python version is compatible")
    return True

def check_virtual_env():
    """Check if we're in a virtual environment"""
    in_venv = hasattr(sys, 'real_prefix') or (
        hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
    )
    if in_venv:
        print(f"✅ Virtual environment is active: {sys.prefix}")
    else:
        print("❌ Virtual environment is NOT active")
        print(f"   Current Python path: {sys.executable}")
        print(f"   Expected venv path should contain 'venv' or 'env'")
    return in_venv

def check_pip():
    """Check if pip is available"""
    try:
        import pip
        print(f"✅ pip is available: {pip.__version__}")
        return True
    except ImportError:
        print("❌ pip is not available")
        return False

def check_requirements_file():
    """Check if requirements.txt exists"""
    if os.path.exists('requirements.txt'):
        print("✅ requirements.txt found")
        with open('requirements.txt', 'r') as f:
            packages = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        print(f"   Found {len(packages)} packages to install")
        return True
    else:
        print("❌ requirements.txt not found")
        return False

def check_installed_packages():
    """Check if required packages are installed"""
    required = ['fastapi', 'uvicorn', 'sqlalchemy', 'pymysql', 'requests']
    missing = []
    
    for package in required:
        try:
            __import__(package)
            print(f"✅ {package} is installed")
        except ImportError:
            print(f"❌ {package} is NOT installed")
            missing.append(package)
    
    return len(missing) == 0, missing

def get_python_executable():
    """Get the Python executable path"""
    return sys.executable

def main():
    print("=" * 60)
    print("Flight Booking Bot - Environment Diagnostic")
    print("=" * 60)
    print()
    
    print("1. Python Version:")
    python_ok = check_python_version()
    print()
    
    print("2. Virtual Environment:")
    venv_ok = check_virtual_env()
    print()
    
    print("3. pip:")
    pip_ok = check_pip()
    print()
    
    print("4. Requirements File:")
    req_ok = check_requirements_file()
    print()
    
    print("5. Installed Packages:")
    packages_ok, missing = check_installed_packages()
    print()
    
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Python executable: {sys.executable}")
    print(f"Python path: {sys.path[0]}")
    print()
    
    if not venv_ok:
        print("⚠️  ISSUE: Virtual environment is not active!")
        print()
        print("SOLUTION:")
        if platform.system() == "Windows":
            print("  1. Run: venv\\Scripts\\activate")
            print("  2. Then run: python check_setup.py")
        else:
            print("  1. Run: source venv/bin/activate")
            print("  2. Then run: python check_setup.py")
        print()
        return
    
    if not packages_ok:
        print("⚠️  ISSUE: Required packages are missing!")
        print(f"Missing packages: {', '.join(missing)}")
        print()
        print("SOLUTION:")
        print("  1. Make sure virtual environment is activated")
        print("  2. Run: pip install --upgrade pip")
        print("  3. Run: pip install -r requirements.txt")
        print()
        return
    
    if all([python_ok, venv_ok, pip_ok, req_ok, packages_ok]):
        print("✅ All checks passed! Environment is ready.")
        print()
        print("You can now run: python app.py")
    else:
        print("❌ Some checks failed. Please fix the issues above.")

if __name__ == "__main__":
    main()

