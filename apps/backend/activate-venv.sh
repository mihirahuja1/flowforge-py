#!/bin/bash

# Visual AI Programmer Backend - Virtual Environment Activation Script

echo "🐍 Activating Visual AI Programmer Backend Virtual Environment..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run the setup script first:"
    echo "  ./setup-venv.sh"
    exit 1
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

echo "✅ Virtual environment activated!"
echo "You can now run:"
echo "  python run.py"
echo ""
echo "To deactivate, run:"
echo "  deactivate"

# Start an interactive shell with the virtual environment
exec $SHELL 