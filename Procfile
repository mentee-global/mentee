web: cd backend && gunicorn --workers 1 --worker-class eventlet manage:app
worker: cd backend && python manage.py runworker
clock: python emails.py
