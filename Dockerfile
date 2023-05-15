FROM python:3.11.3-slim-bullseye
ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir -p /usr/src/robosats
WORKDIR /usr/src/robosats

RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
        git \
        libpq-dev \
        curl \
        build-essential \
        gnupg2

RUN python -m pip install --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy current dir's content to container's WORKDIR root i.e. all the contents of the robosats app
COPY . .

# install lnd/cln grpc services
RUN sh scripts/generate_grpc.sh
RUN chmod +x scripts/entrypoint.sh

EXPOSE 8000
ENTRYPOINT [ "/usr/src/robosats/scripts/entrypoint.sh" ]

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
