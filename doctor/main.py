"""
CURALINK — Doctor Portal Application Launcher
Initializes database, seeds demo data, and launches the HTTP Server.
"""

import sys
import os
from src.db.database import init_db, DB_FILE
from src.db.seed import seed_data
from src.server import run_server
from src.db.supabase_client import load_dotenv, is_supabase_configured, get_supabase_config


def main():
    load_dotenv()
    port = int(os.environ.get("PORT", 8080))
    print("==============================================================")
    print("  Initializing CURALINK Doctor Clinical Portal...")
    print("==============================================================")
    init_db(DB_FILE)
    seed_data(DB_FILE)

    if is_supabase_configured():
        _, _, project_id = get_supabase_config()
        print(f"  [Supabase] Live PostgreSQL Sync ACTIVE (Project: {project_id})")
    else:
        print("  [Supabase] Standby: Ready for SUPABASE_PROJECT_ID & SUPABASE_ANON_KEY")

    httpd = run_server(port, DB_FILE)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping CURALINK Doctor Portal.")
        httpd.server_close()


if __name__ == "__main__":
    main()
