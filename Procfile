web: cd backend && FLASK_ENV=production FORCE_HTTPS=true gunicorn --workers 4 --threads 256 --worker-class eventlet --access-logfile - --error-logfile - --log-level info manage:app
worker: cd backend && python manage.py runworker
clock: python backend/scripts/emails.py
