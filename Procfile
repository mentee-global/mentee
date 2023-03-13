web: cd backend && gunicorn --workers 2 --worker-class eventlet manage:app
worker: cd backend && python manage.py runworker
clock: python emails.py
