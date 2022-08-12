FROM python:3.10.2-bullseye
ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir -p /usr/src/robosats

# specifying the working dir inside the container
WORKDIR /usr/src/robosats

RUN apt-get update
RUN apt-get install -y postgresql-client

RUN python -m pip install --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy current dir's content to container's WORKDIR root i.e. all the contents of the robosats app
COPY . .

# install lnd grpc services
RUN sh generate_grpc.sh

EXPOSE 8000

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
