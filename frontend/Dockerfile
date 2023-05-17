FROM node:18-bullseye-slim

RUN mkdir -p /usr/src/frontend

# specifying the working dir inside the container
WORKDIR /usr/src/frontend

RUN apt-get update && \
    apt-get install -y python3 \
    build-essential

# copy current workdir
COPY package.json package.json
COPY package-lock.json package-lock.json

# install packages
RUN npm install
RUN mv node_modules /tmp/node_modules

# copy entrypoint
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

ENTRYPOINT [ "/usr/src/frontend/entrypoint.sh" ]
CMD ["npm", "run", "build"]