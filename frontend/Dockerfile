FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir -p /usr/src/frontend

# specifying the working dir inside the container
WORKDIR /usr/src/frontend

# copy current dir's content to container's WORKDIR root i.e. all the contents of the robosats app
COPY . .

RUN apt-get update
RUN apt-get -y install npm

# packages we use

RUN npm install 

# launch

CMD ["npm", "run", "build"]