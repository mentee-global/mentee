web: cd backend && gunicorn --workers 1 --threads 256 --worker-class gevent manage:app
worker: cd backend && python manage.py runworker
clock: python backend/scripts/emails.py
