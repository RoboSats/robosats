FROM node:18-bullseye-slim

RUN mkdir -p /usr/src/frontend

# specifying the working dir inside the container
WORKDIR /usr/src/frontend

# copy current dir's content to container's WORKDIR root i.e. all the contents of the robosats app
COPY package.json package.json
COPY package-lock.json package-lock.json

# packages we use
# Remove --legacy-peer-deps once @nivo/core and @nivo/line are react18 compatible
RUN npm install --legacy-peer-deps

# launch

CMD ["npm", "run", "build"]