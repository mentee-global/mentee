# from flask_script import Manager
# from flask_migrate import Migrate, MigrateCommand
import click
import os
from api import create_app, socketio
from flask import request
from gevent import monkey

monkey.patch_all(ssl=False)

import sys, faulthandler

faulthandler.enable()
sys.setrecursionlimit(2000)

# sets up the app
app = create_app()


@app.after_request
def log_request(response):
    if response.status_code >= 400:
        app.logger.debug(
            "%s %s %s %s",
            request.method,
            request.path,
            response.status_code,
            response.get_data(),
        )
    else:
        app.logger.debug("%s %s %s", request.method, request.path, response.status)

    return response


@click.group()
def manager():
    """Management script"""


@manager.command()
def runserver():
    """Run the development server with security considerations"""
    # Determine if we're in production
    flask_env = os.environ.get("FLASK_ENV", "development")
    is_production = flask_env == "production"

    # Security settings based on environment
    debug_mode = not is_production
    host = (
        "0.0.0.0" if is_production else "127.0.0.1"
    )  # Only bind to all interfaces in production
    port = int(os.environ.get("PORT", 8000))

    if debug_mode:
        print(f"🔧 Running in DEVELOPMENT mode on {host}:{port}")
        print("⚠️  Debug mode is ENABLED - do not use in production!")
    else:
        print(f"🚀 Running in PRODUCTION mode on {host}:{port}")
        print("🔒 Debug mode is DISABLED")

    socketio.run(app, debug=debug_mode, host=host, port=port)


@manager.command()
def runprod():
    """Run the server in production mode (deprecated - use gunicorn instead)"""
    print("⚠️  Warning: runprod is deprecated. Use gunicorn for production:")
    print("   gunicorn --workers 4 --threads 256 --worker-class eventlet manage:app")

    # Force production settings
    os.environ["FLASK_ENV"] = "production"
    socketio.run(
        app, debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 8000))
    )


if __name__ == "__main__":
    manager()
