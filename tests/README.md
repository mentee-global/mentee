# Mentee Test Suite

This folder contains automated tests for the Mentee application. Follow the instructions below to set up and run the tests.

## Prerequisites

Make sure you have the following software installed on your machine:

- Node.js (Version 20 LTS)

- npm (Node Package Manager)

- Docker

## Initial setup

1. Clone this repository to your local machine.

```bash
git clone https://github.com/hack4impact-uiuc/mentee.git
cd mentee
git checkout [branch-with-tests] 
```

2. Inside the backend directory, open the Dockerfile and change the very last line to 
```bash
CMD [ "manage.py", "runserver" ]
```

3. Create and setup the following:  
```bash
backend/firebase_service_key.json
backend/.env
backend/tests/.env
frontend/.env
tests/.env
tests/cypress.env.json
```


4. Build and run the docker containers

```bash
docker-compose up --build
```


## Run Frontend tests



When the docker is up and running, in a new terminal run the frontend tests using cypress

```bash
npm install
cd tests
npx cypress run --headless chrome
```

## Run Backend tests



1. Stopping docker-compose, build and run the backend docker container

```bash
cd backend
docker build -t mentee-backend .
docker run mentee-backend
```

2. Run the backend tests using pytest

```bash
docker exec -it mentee-backend
cd tests
pytest
```