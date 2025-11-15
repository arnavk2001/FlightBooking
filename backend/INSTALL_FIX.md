# Fixing "Preparing metadata (pyproject.toml)" Error

If you're getting an error about `pyproject.toml` when installing dependencies, this is usually due to:

1. **Missing build tools** (setuptools, wheel)
2. **Python 3.14 compatibility issues** with some packages
3. **Cryptography package** needing to compile from source

## Quick Fix

### Option 1: Use the Fix Script (Recommended)

```batch
cd backend
fix_install.bat
```

This will:
- Remove the old virtual environment
- Create a fresh one
- Upgrade build tools first
- Install all dependencies

### Option 2: Manual Fix

1. **Activate virtual environment:**
   ```batch
   cd backend
   venv\Scripts\activate
   ```

2. **Upgrade build tools:**
   ```batch
   python -m pip install --upgrade pip setuptools wheel
   ```

3. **Install dependencies:**
   ```batch
   python -m pip install -r requirements.txt
   ```

### Option 3: Install packages one by one

If the above doesn't work, try installing packages individually to identify the problematic one:

```batch
cd backend
venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel

REM Install packages one by one
python -m pip install fastapi
python -m pip install "uvicorn[standard]"
python -m pip install pydantic
python -m pip install python-multipart
python -m pip install python-dotenv
python -m pip install requests
python -m pip install sqlalchemy
python -m pip install pymysql
python -m pip install cryptography
python -m pip install email-validator
```

### Option 4: Use Pre-built Wheels Only

If `cryptography` is the issue, try installing it from pre-built wheels:

```batch
cd backend
venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install --only-binary :all: cryptography
python -m pip install -r requirements.txt
```

## Common Solutions

### If cryptography fails:

1. **Install Visual C++ Build Tools** (Windows):
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Install "Desktop development with C++" workload

2. **Or use pre-built wheels:**
   ```batch
   python -m pip install --only-binary :all: cryptography
   ```

### If other packages fail:

1. **Check Python version compatibility:**
   ```batch
   python --version
   ```
   Python 3.14 is very new - some packages might not have wheels yet.

2. **Try installing without strict version pins:**
   The requirements.txt has been updated to use `>=` instead of `==` to allow pip to find compatible versions.

3. **Use Python 3.11 or 3.12 instead:**
   If issues persist, consider using Python 3.11 or 3.12 which have better package compatibility.

## Verify Installation

After installation, verify everything works:

```batch
cd backend
venv\Scripts\activate
python -c "import fastapi; print('FastAPI OK')"
python -c "import uvicorn; print('Uvicorn OK')"
python -c "import sqlalchemy; print('SQLAlchemy OK')"
python -c "import cryptography; print('Cryptography OK')"
```

If all print "OK", you're ready to run:
```batch
python app.py
```

