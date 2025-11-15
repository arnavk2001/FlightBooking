# Troubleshooting Installation Issues

## Problem: ModuleNotFoundError: No module named 'fastapi'

This means the packages aren't installed in the Python environment you're using.

## Step-by-Step Fix

### Step 1: Run Diagnostic Script

First, let's see what's wrong:

```bash
cd backend
python check_setup.py
```

This will tell you:
- If Python version is correct
- If virtual environment is active
- If packages are installed
- What's missing

### Step 2: Force Reinstall (Recommended)

**Windows:**
```bash
cd backend
fix_install.bat
```

**Mac/Linux:**
```bash
cd backend
chmod +x fix_install.sh
./fix_install.sh
```

This will:
1. Remove the old virtual environment
2. Create a fresh one
3. Install all dependencies
4. Verify installation

### Step 3: Manual Fix (If scripts don't work)

#### On Windows:

1. **Open Command Prompt in the `backend` folder**

2. **Remove old venv:**
   ```cmd
   rmdir /s /q venv
   ```

3. **Create new venv:**
   ```cmd
   python -m venv venv
   ```

4. **Activate venv:**
   ```cmd
   venv\Scripts\activate.bat
   ```
   You should see `(venv)` in your prompt

5. **Verify Python path:**
   ```cmd
   python -c "import sys; print(sys.executable)"
   ```
   Should show something like: `C:\...\backend\venv\Scripts\python.exe`

6. **Install packages:**
   ```cmd
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```

7. **Verify installation:**
   ```cmd
   python -c "import fastapi; print('Success!')"
   ```

#### On Mac/Linux:

1. **Open Terminal in the `backend` folder**

2. **Remove old venv:**
   ```bash
   rm -rf venv
   ```

3. **Create new venv:**
   ```bash
   python3 -m venv venv
   ```

4. **Activate venv:**
   ```bash
   source venv/bin/activate
   ```
   You should see `(venv)` in your prompt

5. **Verify Python path:**
   ```bash
   python -c "import sys; print(sys.executable)"
   ```
   Should show something like: `/path/to/backend/venv/bin/python`

6. **Install packages:**
   ```bash
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```

7. **Verify installation:**
   ```bash
   python -c "import fastapi; print('Success!')"
   ```

## Common Issues

### Issue 1: "python: command not found"

**Windows:**
- Use `py` instead of `python`
- Or add Python to PATH

**Mac/Linux:**
- Use `python3` instead of `python`
- Install Python if missing

### Issue 2: Virtual environment not activating

**Windows:**
```cmd
# Try these in order:
venv\Scripts\activate.bat
venv\Scripts\activate
call venv\Scripts\activate.bat
```

**Mac/Linux:**
```bash
# Make sure you're using bash or zsh
source venv/bin/activate
```

### Issue 3: Still getting ModuleNotFoundError after activation

1. **Verify you're using venv Python:**
   ```bash
   which python  # Should point to venv/bin/python
   # OR
   where python  # Windows - should point to venv\Scripts\python.exe
   ```

2. **If it's not pointing to venv, deactivate and reactivate:**
   ```bash
   deactivate
   source venv/bin/activate  # Mac/Linux
   # OR
   venv\Scripts\activate.bat  # Windows
   ```

3. **Try installing with explicit Python:**
   ```bash
   python -m pip install -r requirements.txt
   ```

### Issue 4: Permission errors

**Mac/Linux:**
```bash
# Don't use sudo with venv
# If you get permission errors, check ownership:
ls -la venv/

# Fix ownership if needed:
chown -R $USER:$USER venv/
```

### Issue 5: pip is not found

```bash
# Install pip
python -m ensurepip --upgrade

# OR download get-pip.py and run:
python get-pip.py
```

### Issue 6: Installation fails with errors

1. **Check internet connection**
2. **Try upgrading pip first:**
   ```bash
   python -m pip install --upgrade pip setuptools wheel
   ```
3. **Install packages one by one to see which fails:**
   ```bash
   pip install fastapi
   pip install uvicorn
   pip install sqlalchemy
   # etc.
   ```

## Verification Checklist

After installation, verify:

- [ ] Virtual environment is activated (see `(venv)` in prompt)
- [ ] `python --version` shows Python 3.8+
- [ ] `python -c "import fastapi"` works without errors
- [ ] `python -c "import sys; print(sys.executable)"` points to venv
- [ ] `python check_setup.py` shows all green checks

## Still Not Working?

1. **Check Python installation:**
   ```bash
   python --version
   # Should be 3.8 or higher
   ```

2. **Check if you have multiple Python installations:**
   ```bash
   which python python3
   # OR
   where python
   ```

3. **Try using python3 explicitly:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   python3 -m pip install -r requirements.txt
   ```

4. **Check requirements.txt exists:**
   ```bash
   ls -la requirements.txt
   cat requirements.txt
   ```

5. **Run the diagnostic script:**
   ```bash
   python check_setup.py
   ```

## Getting Help

If nothing works, share the output of:
```bash
python check_setup.py
```

This will help identify the exact issue.

