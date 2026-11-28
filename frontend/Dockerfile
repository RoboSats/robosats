FROM node:22-alpine

RUN mkdir -p /usr/src/frontend

WORKDIR /usr/src/frontend

RUN apk --no-cache add python3 make g++

# copy current workdir
COPY package.json package.json
COPY package-lock.json package-lock.json

# install packages
RUN npm ci
RUN mv node_modules /tmp/node_modules

# copy entrypoint
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

ENTRYPOINT [ "/usr/src/frontend/entrypoint.sh" ]
CMD ["npm", "run", "build"]