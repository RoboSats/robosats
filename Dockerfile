FROM python:3.11.9-slim-bookworm
ARG DEBIAN_FRONTEND=noninteractive
ARG DEVELOPMENT=False

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

COPY requirements_dev.txt ./
RUN if [ "$DEVELOPMENT" = "true" ]; then \
       pip install --no-cache-dir -r requirements_dev.txt; \
    fi

# copy current dir's content to container's WORKDIR root i.e. all the contents of the robosats app
COPY . .

# install lnd/cln grpc services
RUN sh scripts/generate_grpc.sh
RUN chmod +x scripts/entrypoint.sh

EXPOSE 8000
ENTRYPOINT [ "/usr/src/robosats/scripts/entrypoint.sh" ]

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
