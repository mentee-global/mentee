
import click
from api import create_app, socketio
from flask import request
from api.utils.simple_secure_logging import secure_log_request


app = create_app()


@app.after_request
def secure_log_request_handler(response):
    secure_log_request(app.logger, response)
    return response


@click.group()
def manager():
    pass


@manager.command()
def runserver():
    socketio.run(app, debug=True, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    manager()
