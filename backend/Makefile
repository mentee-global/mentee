
mac_setup:
	./mac_setup

setup:
	uv venv
	uv pip install -r requirements.txt -r requirements-dev.txt

run_server:
	.venv/bin/python manage.py runserver

heroku_setup:
	python manage.py recreate_db
	
format:
	( \
		. .venv/bin/activate; \
		black api/; \
		black tests/; \
		black manage.py; \
	)
