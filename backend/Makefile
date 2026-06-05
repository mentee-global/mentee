
mac_setup:
	./mac_setup

setup:
	uv sync

run_server:
	uv run python manage.py runserver

heroku_setup:
	python manage.py recreate_db
	
format:
	( \
		. .venv/bin/activate; \
		black api/; \
		black tests/; \
		black manage.py; \
	)
