# Flask Backend

This is based off of [Flask Boilerplate](https://github.com/tko22/flask-boilerplate), but repurposed for MongoDB using MongoEngine.

We use [black](https://github.com/ambv/black) for code formatting, and [mypy](http://mypy-lang.org/) for optional static typing.

![](../master/docs/flask.gif)

## Remote Database Setup
Create a `.env` file in this folder with the contents:
```
MONGO_USER=[DB username]
MONGO_PASSWORD=[DB password]
MONGO_DB=mentee
MONGO_HOST=[host uri]
```
Replace the `[xxx]` with your own credentials.

### Server Setup

Make sure you have [Python3](https://realpython.com/installing-python/) and [Poetry](https://python-poetry.org/) installed.

Install packages:

```
$ poetry install
```
To run the server:
```
$ poetry run start
```

### Verifying

Install [Postman](https://www.getpostman.com/downloads/) or your app of choice for testing API calls, or go onto "collections" on MongoDB Atlas.

Then, make Postman calls to verify that the server works:
<<<<<<< HEAD

`GET localhost:5000/api/mentors` should return a list of the test mentors we have in the DB.

=======

## Using Docker **NOT SUPPORTED**

>>>>>>> 7d1f975954ec0206455f04cc5effb8a660328e79
You can also view the contents of your database by connecting to it in Mongo Compass using the default settings!

## Repository Contents

- `api/views/` - Holds files that define your endpoints
- `api/models/` - Holds files that defines your database schema
- `api/__init__.py` - What is initially ran when you start your application
- `api/utils.py` - utility functions and classes - explained [here](https://github.com/tko22/flask-boilerplate/wiki/Conventions)
- `api/core.py` - includes core functionality including error handlers and logger
- `tests/` - Folder holding tests

#### Others

- `config.py` - Provides Configuration for the application. There are two configurations: one for development and one for production using Heroku.
- `manage.py` - Command line interface that allows you to perform common functions with a command
- `requirements.txt` - A list of python package dependencies the application requires
- `runtime.txt` & `Procfile` - configuration for Heroku
- `Dockerfile` - instructions for Docker to build the Flask app
- `docker-compose.yml` - config to setup this Flask app and a Database
- `migrations/` - Holds migration files – doesn't exist until you `python manage.py db init` if you decide to not use docker

### MISC

If you're annoyed by the **pycache** files

```
find . | grep -E "(__pycache__|\.pyc|\.pyo$)" | xargs rm -rf
```

### Additional Documentation

- [Flask](http://flask.pocoo.org/) - Flask Documentation
- [Flask Tutorial](http://flask.pocoo.org/docs/1.0/tutorial/) - great tutorial. Many patterns used here were pulled from there.
- [Flask SQLAlchemy](http://flask-sqlalchemy.pocoo.org/2.3/) - the ORM for the database
- [Heroku](https://devcenter.heroku.com/articles/getting-started-with-python#introduction) - Deployment using Heroku
- [Learn Python](https://www.learnpython.org/) - Learning Python3
- [Relational Databases](https://www.ntu.edu.sg/home/ehchua/programming/sql/Relational_Database_Design.html) - Designing a database schema
- [REST API](http://www.restapitutorial.com/lessons/restquicktips.html) - tips on making an API Restful
- [Docker Docs](https://docs.docker.com/get-started/) - Docker docs
- [SendGrid](https://sendgrid.com/docs/for-developers/) - Documentation For SendGrid
- [Twilio](twilio.com/docs/libraries/python) - Documentation for Twilio
