from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import json
import subprocess
import tempfile
import os
import uuid
from datetime import datetime
import httpx
import openai
import anthropic

app = FastAPI(title="Visual AI Programmer Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:4200",
        "http://localhost:5173",
    ],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class NodeData(BaseModel):
    label: Optional[str] = None
    code: Optional[str] = None
    prompt: Optional[str] = None
    model: Optional[str] = None
    url: Optional[str] = None
    method: Optional[str] = None
    headers: Optional[str] = None
    body: Optional[str] = None


class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: NodeData


class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = None


class WorkflowRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


class ExecutionStep(BaseModel):
    node_id: str
    status: str  # "waiting", "running", "completed", "error"
    input_data: Optional[Any] = None
    output_data: Optional[Any] = None
    error: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ExecutionResponse(BaseModel):
    execution_id: str
    status: str
    steps: List[ExecutionStep]
    final_result: Optional[Any] = None


# In-memory storage for execution states (in production, use Redis or database)
execution_states: Dict[str, Dict[str, Any]] = {}


# Node execution functions
async def execute_input_node(node: Node, input_data: Any = None) -> Any:
    """Execute input node"""
    return node.data.label or "input_data"


async def execute_output_node(node: Node, input_data: Any) -> Any:
    """Execute output node"""
    print(f"Output: {input_data}")
    return input_data


async def execute_text_editor_node(node: Node, input_data: Any) -> str:
    """Execute text editor node"""
    return str(input_data)


async def execute_python_function_node(node: Node, input_data: Any) -> Any:
    """Execute Python function node"""
    try:
        # Create a safe execution environment
        code = node.data.code or "def process_data(input_data):\n    return input_data"

        # Create temporary file with the code
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(
                f"""
{code}

# Execute the function
result = process_data({repr(input_data)})
print("RESULT:", result)
"""
            )
            temp_file = f.name

        # Execute the code
        result = subprocess.run(
            ["python", temp_file], capture_output=True, text=True, timeout=30
        )

        # Clean up
        os.unlink(temp_file)

        if result.returncode != 0:
            raise Exception(f"Python execution error: {result.stderr}")

        # Extract result from stdout
        output_lines = result.stdout.strip().split("\n")
        for line in output_lines:
            if line.startswith("RESULT: "):
                return eval(line[8:])  # Remove "RESULT: " prefix

        return result.stdout.strip()

    except Exception as e:
        raise Exception(f"Python function execution failed: {str(e)}")


async def execute_llm_call_node(node: Node, input_data: Any) -> str:
    """Execute LLM call node"""
    try:
        model = node.data.model or "gpt-3.5-turbo"
        prompt = node.data.prompt or "Process the following data:"

        # Combine prompt with input data
        full_prompt = f"{prompt}\n\nData: {input_data}"

        # This is a placeholder - you'll need to configure your API keys
        if model.startswith("gpt"):
            # OpenAI API call
            # client = openai.OpenAI(api_key="your-api-key")
            # response = client.chat.completions.create(
            #     model=model,
            #     messages=[{"role": "user", "content": full_prompt}]
            # )
            # return response.choices[0].message.content
            return f"Mock OpenAI {model} response for: {input_data}"

        elif model.startswith("claude"):
            # Anthropic API call
            # client = anthropic.Anthropic(api_key="your-api-key")
            # response = client.messages.create(
            #     model=model,
            #     max_tokens=1000,
            #     messages=[{"role": "user", "content": full_prompt}]
            # )
            # return response.content[0].text
            return f"Mock Anthropic {model} response for: {input_data}"

        else:
            return f"Mock LLM response for: {input_data}"

    except Exception as e:
        raise Exception(f"LLM call failed: {str(e)}")


async def execute_curl_node(node: Node, input_data: Any) -> Dict[str, Any]:
    """Execute curl request node"""
    try:
        url = node.data.url or "https://api.example.com/endpoint"
        method = node.data.method or "GET"
        headers = json.loads(node.data.headers or "{}")
        body = node.data.body or None

        async with httpx.AsyncClient() as client:
            if method.upper() in ["POST", "PUT", "PATCH"]:
                response = await client.request(
                    method=method, url=url, headers=headers, json=body
                )
            else:
                response = await client.request(
                    method=method, url=url, headers=headers, params=body
                )

            return {
                "status_code": response.status_code,
                "data": (
                    response.json()
                    if response.headers.get("content-type", "").startswith(
                        "application/json"
                    )
                    else response.text
                ),
                "headers": dict(response.headers),
            }

    except Exception as e:
        raise Exception(f"HTTP request failed: {str(e)}")


# Node execution mapping
NODE_EXECUTORS = {
    "input": execute_input_node,
    "output": execute_output_node,
    "textEditor": execute_text_editor_node,
    "pythonFunction": execute_python_function_node,
    "llmCall": execute_llm_call_node,
    "curl": execute_curl_node,
}


def build_execution_order(nodes: List[Node], edges: List[Edge]) -> List[Node]:
    """Build execution order based on dependencies"""
    order = []
    visited = set()

    # Find nodes without incoming edges (start nodes)
    start_nodes = [
        node for node in nodes if not any(edge.target == node.id for edge in edges)
    ]

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        node = next((n for n in nodes if n.id == node_id), None)
        if node:
            order.append(node)

            # Visit all nodes that this node connects to
            for edge in edges:
                if edge.source == node_id:
                    visit(edge.target)

    for node in start_nodes:
        visit(node.id)

    # Add any remaining nodes
    for node in nodes:
        if node.id not in visited:
            order.append(node)

    return order


@app.post("/api/execute-workflow", response_model=ExecutionResponse)
async def execute_workflow(request: WorkflowRequest):
    """Execute a workflow and return real-time progress"""
    execution_id = str(uuid.uuid4())

    # Initialize execution state
    execution_states[execution_id] = {
        "status": "running",
        "steps": [],
        "results": {},
        "final_result": None,
    }

    try:
        # Build execution order
        execution_order = build_execution_order(request.nodes, request.edges)

        # Initialize steps
        for node in request.nodes:
            step = ExecutionStep(
                node_id=node.id, status="waiting", start_time=None, end_time=None
            )
            execution_states[execution_id]["steps"].append(step)

        # Execute nodes in order
        for node in execution_order:
            # Find the step for this node
            step = next(
                s
                for s in execution_states[execution_id]["steps"]
                if s.node_id == node.id
            )

            # Update step status to running
            step.status = "running"
            step.start_time = datetime.now()

            try:
                # Get input data (from previous node or None for start nodes)
                incoming_edges = [e for e in request.edges if e.target == node.id]
                input_data = None
                if incoming_edges:
                    source_node_id = incoming_edges[0].source
                    input_data = execution_states[execution_id]["results"].get(
                        source_node_id
                    )

                step.input_data = input_data

                # Execute the node
                executor = NODE_EXECUTORS.get(node.type)
                if executor:
                    output_data = await executor(node, input_data)
                else:
                    output_data = input_data  # Pass through for unknown node types

                # Store result
                execution_states[execution_id]["results"][node.id] = output_data
                step.output_data = output_data
                step.status = "completed"

            except Exception as e:
                step.status = "error"
                step.error = str(e)
                execution_states[execution_id]["status"] = "error"
                break

            finally:
                step.end_time = datetime.now()

        # Set final result
        if execution_states[execution_id]["status"] != "error":
            execution_states[execution_id]["status"] = "completed"
            # Get result from last node or output nodes
            output_nodes = [n for n in request.nodes if n.type == "output"]
            if output_nodes:
                execution_states[execution_id]["final_result"] = execution_states[
                    execution_id
                ]["results"].get(output_nodes[0].id)
            else:
                # Use result from last executed node
                last_node = execution_order[-1] if execution_order else None
                if last_node:
                    execution_states[execution_id]["final_result"] = execution_states[
                        execution_id
                    ]["results"].get(last_node.id)

    except Exception as e:
        execution_states[execution_id]["status"] = "error"
        execution_states[execution_id]["final_result"] = {"error": str(e)}

    return ExecutionResponse(
        execution_id=execution_id,
        status=execution_states[execution_id]["status"],
        steps=execution_states[execution_id]["steps"],
        final_result=execution_states[execution_id]["final_result"],
    )


@app.get("/api/execution-status/{execution_id}", response_model=ExecutionResponse)
async def get_execution_status(execution_id: str):
    """Get the status of a workflow execution"""
    if execution_id not in execution_states:
        raise HTTPException(status_code=404, detail="Execution not found")

    state = execution_states[execution_id]
    return ExecutionResponse(
        execution_id=execution_id,
        status=state["status"],
        steps=state["steps"],
        final_result=state["final_result"],
    )


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
