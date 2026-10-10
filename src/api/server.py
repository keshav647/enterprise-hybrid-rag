"""Server entrypoint with dual-port listening (8000 default, 8080 fallback)."""

import socket
import uvicorn
from src.config import settings


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def run_server():
    target_port = settings.port
    if is_port_in_use(target_port):
        print(f"⚠️ Port {target_port} is already in use. Switching to fallback port {settings.fallback_port}...")
        target_port = settings.fallback_port

    print(f"🚀 Starting {settings.app_name} on http://{settings.host}:{target_port}")
    print(f"📚 Swagger UI docs available at http://{settings.host}:{target_port}/docs")

    uvicorn.run(
        "src.api.app:app",
        host=settings.host,
        port=target_port,
        reload=settings.debug,
    )


if __name__ == "__main__":
    run_server()
