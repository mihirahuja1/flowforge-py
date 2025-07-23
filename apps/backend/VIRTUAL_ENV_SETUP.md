# Virtual Environment Setup Guide

This guide explains how to use the virtual environment for the Visual AI Programmer backend.

## Quick Start

### 1. Automated Setup (Recommended)
```bash
cd apps/backend
./setup-venv.sh
```

This script will:
- Create a Python virtual environment (`venv/`)
- Install all required dependencies from `requirements.txt`
- Set up the environment for development

### 2. Run the Backend
```bash
# Option A: Using the run script (automatically uses venv)
python run.py

# Option B: Manual activation
source venv/bin/activate
python run.py
```

## Manual Setup

### Create Virtual Environment
```bash
cd apps/backend
python3 -m venv venv
```

### Activate Virtual Environment
```bash
# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Deactivate Virtual Environment
```bash
deactivate
```

## Development Workflow

### Starting Development
1. **Activate the virtual environment**:
   ```bash
   cd apps/backend
   source venv/bin/activate
   ```

2. **Run the backend**:
   ```bash
   python run.py
   ```

3. **Access the API**:
   - Server: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health

### Adding New Dependencies
```bash
# Activate virtual environment
source venv/bin/activate

# Install new package
pip install package_name

# Update requirements.txt
pip freeze > requirements.txt
```

### Using the Startup Script
The main startup script (`start-dev.sh`) automatically:
- Checks if virtual environment exists
- Sets up virtual environment if needed
- Starts backend with virtual environment
- Starts frontend

```bash
# From project root
./start-dev.sh
```

## Virtual Environment Features

### Automatic Detection
The `run.py` script automatically:
- Detects if virtual environment exists
- Activates virtual environment if available
- Provides helpful error messages if setup is needed

### Isolation
- All Python packages are installed in the virtual environment
- No conflicts with system Python packages
- Clean, reproducible development environment

### File Structure
```
apps/backend/
├── venv/                    # Virtual environment (created by setup)
├── setup-venv.sh           # Setup script
├── activate-venv.sh        # Manual activation script
├── run.py                  # Backend runner (auto-detects venv)
├── requirements.txt        # Python dependencies
├── main.py                 # FastAPI application
└── .gitignore             # Excludes venv/ from git
```

## Troubleshooting

### Virtual Environment Not Found
If you see "Virtual environment not found!":
```bash
cd apps/backend
./setup-venv.sh
```

### Permission Issues
If you get permission errors:
```bash
chmod +x setup-venv.sh
chmod +x activate-venv.sh
```

### Port Already in Use
If port 8000 is already in use:
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
python run.py --port 8001
```

### Dependencies Issues
If you have dependency conflicts:
```bash
# Remove and recreate virtual environment
rm -rf venv
./setup-venv.sh
```

## Best Practices

1. **Always use the virtual environment** for development
2. **Never commit the `venv/` directory** to git (it's in `.gitignore`)
3. **Update `requirements.txt`** when adding new dependencies
4. **Use the setup scripts** for consistent environment setup
5. **Activate virtual environment** before running any Python commands

## Integration with Frontend

The backend is configured to work with the React frontend:
- CORS is configured for frontend URLs (localhost:3000, 5173)
- API endpoints are designed for frontend consumption
- Real-time execution status is available for frontend polling

## Production Deployment

For production deployment:
1. Use the same virtual environment setup
2. Install production dependencies
3. Use a production WSGI server (Gunicorn, uvicorn)
4. Configure environment variables
5. Set up proper CORS origins

```bash
# Production example
source venv/bin/activate
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
``` 