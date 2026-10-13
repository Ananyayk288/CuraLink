"""
CURALINK — HTTP Server Entrypoint
Serves Doctor Portal UI and REST API with zero external runtime dependencies.
"""

import os
import json
import mimetypes
from urllib.parse import urlparse, parse_qs
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from src.db.database import init_db, DB_FILE
from src.usecases.doctor_usecases import DoctorUseCases
from src.api.router import ApiRouter

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")


class CuraLinkHandler(BaseHTTPRequestHandler):
    use_cases = DoctorUseCases(DB_FILE)
    router = ApiRouter(use_cases)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path.startswith("/api/v1/"):
            status_code, response_data = self.router.route_request("GET", path, query, None)
            self._send_json(status_code, response_data)
        else:
            self._serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        body = self._parse_json_body()

        if path.startswith("/api/v1/"):
            status_code, response_data = self.router.route_request("POST", path, query, body)
            self._send_json(status_code, response_data)
        else:
            self.send_error(404, "Not Found")

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path.startswith("/api/v1/"):
            status_code, response_data = self.router.route_request("DELETE", path, query, None)
            self._send_json(status_code, response_data)
        else:
            self.send_error(404, "Not Found")

    def _parse_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            raw_data = self.rfile.read(content_length)
            try:
                return json.loads(raw_data.decode("utf-8"))
            except Exception:
                return {}
        return {}

    def _send_json(self, status_code: int, data: dict):
        response_bytes = json.dumps(data, indent=2, default=str).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(response_bytes)

    def _serve_static(self, path: str):
        if path == "/" or path == "/doctor":
            path = "/index.html"

        safe_path = os.path.normpath(path.lstrip("/"))
        file_path = os.path.join(PUBLIC_DIR, safe_path)

        if not os.path.exists(file_path) or os.path.isdir(file_path):
            file_path = os.path.join(PUBLIC_DIR, "index.html")

        if os.path.exists(file_path):
            mime_type, _ = mimetypes.guess_type(file_path)
            mime_type = mime_type or "application/octet-stream"
            with open(file_path, "rb") as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(content)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_error(404, "Static file not found.")

    def log_message(self, format, *args):
        # Quiet logger for clean test output
        return


def run_server(port: int = 8080, db_path: str = DB_FILE):
    init_db(db_path)
    CuraLinkHandler.use_cases = DoctorUseCases(db_path)
    CuraLinkHandler.router = ApiRouter(CuraLinkHandler.use_cases)
    server_address = ("0.0.0.0", port)
    httpd = ThreadingHTTPServer(server_address, CuraLinkHandler)
    print(f"============================================================")
    print(f"  CURALINK Doctor Portal Server running at http://localhost:{port}")
    print(f"  Doctor Portal UI: http://localhost:{port}/doctor")
    print(f"  API Documentation: http://localhost:{port}/api/v1/doctor/stats")
    print(f"============================================================")
    return httpd


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    httpd = run_server(port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down CURALINK Doctor Portal Server.")
        httpd.server_close()
