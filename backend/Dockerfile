# this dockerfile is used for product deployments
FROM python:3.9
LABEL maintainer "Kelley Chau <kelleyc2@illinois.edu>"

COPY requirements.txt requirements.txt
RUN apt-get update -y && \
    apt-get install -y python-pip python-dev

RUN pip install -r requirements.txt

COPY . /app
WORKDIR /app

ENTRYPOINT [ "python" ]

CMD [ "manage.py", "runprod" ]
