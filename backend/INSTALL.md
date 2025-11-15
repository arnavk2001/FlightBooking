# Backend Installation Guide

## Quick Start

### Windows
```bash
cd backend
setup.bat
```

### Mac/Linux
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

## Manual Installation

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

### Step 3: Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

**You should see `(venv)` in your terminal prompt when activated.**

### Step 4: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Verify Installation
```bash
python -c "import fastapi; print('FastAPI installed successfully')"
```

### Step 6: Run the Application
```bash
python app.py
```

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'fastapi'"

**Solution:**
1. Make sure virtual environment is activated (you should see `(venv)` in terminal)
2. Check you're in the `backend` directory
3. Install dependencies: `pip install -r requirements.txt`

### Error: "python: command not found"

**Solution:**
- Windows: Use `python` or `py`
- Mac/Linux: Use `python3`
- Install Python 3.8 or higher from [python.org](https://www.python.org/)

### Error: "pip: command not found"

**Solution:**
```bash
# Windows
python -m ensurepip --upgrade

# Mac/Linux
python3 -m ensurepip --upgrade
```

### Virtual Environment Not Activating

**Windows:**
```bash
# If Scripts\activate doesn't work, try:
venv\Scripts\activate.bat
```

**Mac/Linux:**
```bash
# Make sure you're using bash or zsh
source venv/bin/activate
```

### Permission Errors (Mac/Linux)

**Solution:**
```bash
chmod +x setup.sh
sudo pip install -r requirements.txt
```

### Check Python Version

**Required:** Python 3.8 or higher

```bash
python --version
# OR
python3 --version
```

### Verify Installation

```bash
# Activate virtual environment first
python -c "import fastapi, uvicorn, sqlalchemy, pymysql; print('All dependencies installed!')"
```

## Dependencies

The following packages are installed:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `python-dotenv` - Environment variables
- `requests` - HTTP client
- `pydantic` - Data validation
- `sqlalchemy` - Database ORM
- `pymysql` - MySQL driver
- `cryptography` - Encryption support
- `email-validator` - Email validation

## Running the Server

Once installed, run:
```bash
python app.py
```

The server will start on `http://localhost:8000`

You can also use uvicorn directly:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

