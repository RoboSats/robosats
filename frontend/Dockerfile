FROM node:18-bullseye-slim

RUN mkdir -p /usr/src/frontend

# specifying the working dir inside the container
WORKDIR /usr/src/frontend

# copy current workdir
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

# install packages
RUN npm install
RUN mv node_modules /tmp/node_modules

ENTRYPOINT [ "/usr/src/frontend/entrypoint.sh" ]
CMD ["npm", "run", "build"]