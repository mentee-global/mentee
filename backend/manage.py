# from flask_script import Manager
# from flask_migrate import Migrate, MigrateCommand
import click
import time
from api import create_app, socketio
from flask import request

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
    socketio.run(app, debug=True, host="0.0.0.0", port=8000)


@manager.command()
@click.option("--poll-interval", default=2.0, type=float)
@click.option("--once", is_flag=True)
def runworker(poll_interval, once):
    from api.utils.event_notifications import process_next_event_notification
    from api.utils.event_review_notifications import (
        process_next_event_review_notification,
    )

    while True:
        processed = process_next_event_review_notification()
        if not processed:
            processed = process_next_event_notification()
        if once:
            return
        if not processed:
            time.sleep(poll_interval)


if __name__ == "__main__":
    manager()
