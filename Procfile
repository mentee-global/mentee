# web: cd backend && gunicorn --workers 1 --worker-class eventlet manage:app
# web: cd backend && python manage.py runserver
worker: cd backend && python manage.py runworker
clock: python emails.py
