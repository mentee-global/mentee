# Getting Started on Backend

## Installing and Running
Make sure you have [Python3](https://realpython.com/installing-python/) and `pip3` installed.

Start your virtual environment:

```
$ pip3 install virtualenv
$ virtualenv venv
$ source venv/bin/activate
```
Now, install the python dependencies and run the server:
```
(venv) $ pip3 install -r requirements.txt
(venv) $ pip3 install -r requirements-dev.txt
(venv) $ make run_server
```

To exit the virtual environment:
```
(venv) $ deactivate
$
```

## Dependencies

Documentation for all the libraries we are using

- [Flask](https://flask.palletsprojects.com/en/1.1.x/)
- [Mongoengine](http://mongoengine.org/)
- [Twilio](twilio.com/docs/libraries/python)
- [SendGrid](https://sendgrid.com/docs/for-developers/) 
- [WTForms](https://wtforms.readthedocs.io/en/2.3.x/)
- [WTForms-JSON](https://wtforms-json.readthedocs.io/en/latest/)