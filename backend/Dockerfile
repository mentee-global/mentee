# this dockerfile is used for product deployments
FROM python:3.9
LABEL maintainer "Kelley Chau <kelleyc2@illinois.edu>"

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENTRYPOINT [ "python" ]

CMD [ "manage.py", "runserver" ]
# CMD [ "manage.py", "runprod" ]