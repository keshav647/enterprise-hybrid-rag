#!/usr/bin/env bash
# Synapse Enterprise RAG Launcher
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
export PYTHONPATH="$DIR:$PYTHONPATH"

echo "Starting Synapse Enterprise RAG Engine on http://127.0.0.1:8000..."
/Users/keshavbudhiraja/AI/project-1-pr-reviewer/.venv/bin/python3 -m uvicorn src.api.app:app --host 127.0.0.1 --port 8000 --reload
