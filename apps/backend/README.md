# Visual AI Programmer Backend

This is the Python FastAPI backend for the Visual AI Programmer application.

## Features

- **Workflow Execution**: Execute visual workflows by running nodes in dependency order
- **Real-time Status**: Track execution progress with detailed status for each node
- **Node Types Support**: 
  - Input/Output nodes
  - Text Editor nodes
  - Python Function nodes (with actual Python execution)
  - LLM Call nodes (OpenAI, Anthropic)
  - HTTP Request nodes (Curl-like functionality)
- **Error Handling**: Comprehensive error handling and reporting
- **API Documentation**: Auto-generated OpenAPI documentation

## Setup

### 1. Virtual Environment Setup (Recommended)

**Option A: Automated Setup**
```bash
# Run the setup script (creates venv and installs dependencies)
./setup-venv.sh
```

**Option B: Manual Setup**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Manual Activation (if using virtual environment)
```bash
# Activate the virtual environment
./activate-venv.sh

# Or manually activate
source venv/bin/activate
```

### 3. Run the Server
```bash
# Option 1: Using the run script (automatically uses venv)
python run.py

# Option 2: Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Access the API
- Server: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

## API Endpoints

### POST /api/execute-workflow
Execute a visual workflow and return real-time progress.

**Request Body**:
```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "input",
      "position": {"x": 100, "y": 100},
      "data": {"label": "Hello World"}
    }
  ],
  "edges": []
}
```

**Response**:
```json
{
  "execution_id": "uuid",
  "status": "completed",
  "steps": [
    {
      "node_id": "node_1",
      "status": "completed",
      "input_data": null,
      "output_data": "Hello World",
      "error": null,
      "start_time": "2024-01-01T00:00:00",
      "end_time": "2024-01-01T00:00:01"
    }
  ],
  "final_result": "Hello World"
}
```

### GET /api/execution-status/{execution_id}
Get the status of a workflow execution.

### GET /api/health
Health check endpoint.

## Node Execution

### Input Node
- **Purpose**: Provides input data to the workflow
- **Output**: The label text or default value

### Output Node
- **Purpose**: Displays final results
- **Input**: Data from connected nodes
- **Output**: Same as input (pass-through)

### Text Editor Node
- **Purpose**: Text processing and manipulation
- **Input**: Any data
- **Output**: String representation of input

### Python Function Node
- **Purpose**: Execute custom Python code
- **Input**: Data from connected nodes
- **Output**: Result of Python function execution
- **Security**: Runs in isolated environment with timeout

### LLM Call Node
- **Purpose**: Make calls to language models
- **Input**: Data to include in prompt
- **Output**: LLM response
- **Supported**: OpenAI GPT models, Anthropic Claude models

### Curl Node
- **Purpose**: Make HTTP requests
- **Input**: Data to include in request
- **Output**: HTTP response (status, headers, data)
- **Methods**: GET, POST, PUT, DELETE, PATCH

## Configuration

### API Keys
To use real LLM calls, configure your API keys:

```python
# In main.py, uncomment and configure:
# client = openai.OpenAI(api_key="your-openai-key")
# client = anthropic.Anthropic(api_key="your-anthropic-key")
```

### Security
- Python code execution is sandboxed with timeouts
- HTTP requests are limited to prevent abuse
- Consider adding authentication for production use

## Development

### Using Virtual Environment
- The `run.py` script automatically detects and uses the virtual environment
- Always activate the virtual environment before installing new packages
- To deactivate: `deactivate`

### Adding New Dependencies
```bash
# Activate virtual environment
source venv/bin/activate

# Install new package
pip install package_name

# Update requirements.txt
pip freeze > requirements.txt
```

### Testing
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=.
```

## Production Deployment

For production deployment:
1. Use a production ASGI server (Gunicorn + Uvicorn)
2. Add proper authentication and authorization
3. Use Redis or database for execution state storage
4. Configure proper logging and monitoring
5. Set up environment variables for API keys
6. Add rate limiting and request validation 