# from flask_script import Manager
# from flask_migrate import Migrate, MigrateCommand
import click
from flask_migrate import Migrate
from flask.cli import FlaskGroup, run_command
from api import create_app, socketio
from api.models import db

# sets up the app
app = create_app()

# manager = Manager(app)

migrate = Migrate(app, db)
@app.shell_context_processor
def make_shell_context():
    return dict(app=app, db=db)

# adds the python manage.py db init, db migrate, db upgrade commands
# manager.add_command("db", MigrateCommand)


@click.group(cls=FlaskGroup, create_app=create_app)
def manager():
    """Management script"""

manager.add_command(run_command, "runserver")
manager.add_command(run_command, "runworker")
manager.add_command(run_command, "runprod")

@manager.command
def runserver():
    print('11111')
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)


@manager.command
def runprod():
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)


@manager.command
def runworker():
    socketio.run(app, debug=True)


if __name__ == "__main__":
    # manager.run()
    manager()
    
