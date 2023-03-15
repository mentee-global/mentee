# from flask_script import Manager
# from flask_migrate import Migrate, MigrateCommand
import click
from api import create_app, socketio

# sets up the app
app = create_app()


@click.group()
def manager():
    """Management script"""
    
@manager.command()
def runserver():
    socketio.run(app, debug=True, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    manager()
    
