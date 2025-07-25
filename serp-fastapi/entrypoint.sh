#!/bin/bash

# Installing Dependencies
pip install --no-compile --no-cache-dir -r requirements.txt

#Making Migrations
echo "Migrating DB"

until alembic upgrade head
do
  echo "Try again"
  sleep 5
done

#Starting Server
echo "Starting Server"
#uvicorn main:app --host 0.0.0.0 --port 5001 --reload

python main.py runserver