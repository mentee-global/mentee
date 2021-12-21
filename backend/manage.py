from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from api import create_app, socketio
from api.models import db

# sets up the app
app = create_app()

manager = Manager(app)
migrate = Migrate(app, db)

# adds the python manage.py db init, db migrate, db upgrade commands
manager.add_command("db", MigrateCommand)


@manager.command
def runserver():
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)


@manager.command
def runprod():
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)


@manager.command
def runworker():
    socketio.run(app, debug=True)


if __name__ == "__main__":
    manager.run()
