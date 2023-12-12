# this dockerfile is used for product deployments
FROM python:3.9
LABEL maintainer "Kelley Chau <kelleyc2@illinois.edu>"

COPY requirements.txt requirements.txt
RUN apt-get update -y && \
    apt-get install -y python3-dev python3-pkg-resources python3-setuptools python3-wheel python3-pip 

RUN pip install -r requirements.txt

COPY . /app
WORKDIR /app

ENTRYPOINT [ "python" ]

CMD [ "manage.py", "runserver" ]
# CMD [ "manage.py", "runprod" ]