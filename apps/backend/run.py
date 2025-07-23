#!/usr/bin/env python3
"""
Simple script to run the FastAPI backend server with virtual environment support
"""

import os
import sys
import subprocess
import uvicorn


def check_venv():
    """Check if virtual environment is activated or available"""
    # Check if we're already in a virtual environment
    if hasattr(sys, "real_prefix") or (
        hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix
    ):
        return True

    # Check if venv directory exists
    venv_path = os.path.join(os.path.dirname(__file__), "venv")
    if not os.path.exists(venv_path):
        print("❌ Virtual environment not found!")
        print("Please run the setup script first:")
        print("  ./setup-venv.sh")
        return False

    return True


def activate_venv():
    """Activate virtual environment if not already active"""
    if check_venv():
        # If we're already in a venv, just return
        if hasattr(sys, "real_prefix") or (
            hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix
        ):
            return True

        # Try to activate the virtual environment
        venv_path = os.path.join(os.path.dirname(__file__), "venv")
        python_path = os.path.join(venv_path, "bin", "python")

        if os.path.exists(python_path):
            # Re-execute with the virtual environment's Python
            os.execv(python_path, [python_path] + sys.argv)
        else:
            print("❌ Virtual environment Python not found!")
            print("Please run the setup script first:")
            print("  ./setup-venv.sh")
            return False

    return False


if __name__ == "__main__":
    print("🐍 Starting Visual AI Programmer Backend...")

    # Check and activate virtual environment
    if not activate_venv():
        sys.exit(1)

    print("✅ Virtual environment activated!")
    print("Server will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")

    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,  # Auto-reload on code changes
            log_level="info",
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
