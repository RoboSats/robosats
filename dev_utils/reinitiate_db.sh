#!/bin/bash
rm db.sqlite3

rm -R api/migrations
rm -R frontend/migrations
rm -R frontend/static/assets/avatars

python3 manage.py makemigrations
python3 manage.py makemigrations api

python3 manage.py migrate

python3 manage.py createsuperuser

python3 manage.py runserver