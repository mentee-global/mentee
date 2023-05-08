# from flask_script import Manager
# from flask_migrate import Migrate, MigrateCommand
import click
from api import create_app, socketio
from flask import request


# sets up the app
app = create_app()

@app.after_request
def log_request(response):
    if (response.status_code >= 400):
        app.logger.debug('%s %s %s %s',request.method, request.path, response.status_code, response.get_data())
    else :
        app.logger.debug('%s %s %s',request.method, request.path, response.status)
    
    return response

@click.group()
def manager():
    """Management script"""


@manager.command()
def runserver():
    socketio.run(app, debug=True, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    manager()
