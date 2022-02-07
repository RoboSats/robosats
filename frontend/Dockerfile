FROM alpine

RUN mkdir -p /usr/src/robosats/frontend

# specifying the working dir inside the container
WORKDIR /usr/src/robosats/frontend

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy current dir's content to container's WORKDIR root i.e. all the contents of the robosats app
COPY . .

RUN apt install RUN

# packages we use

RUN npm init -y
RUN npm i webpack webpack-cli --save-dev
RUN npm i @babel/core babel-loader @babel/preset-env @babel/preset-react --save-dev
RUN npm i react react-dom --save-dev
RUN npm install @material-ui/core
RUN npm install @babel/plugin-proposal-class-properties
RUN npm install react-router-dom@5.2.0
RUN npm install @material-ui/icons
RUN npm install material-ui-image
RUN npm install @mui/system @emotion/react @emotion/styled
RUN npm install react-native
RUN npm install react-native-svg
RUN npm install react-qr-code
RUN npm install @mui/material
RUN npm install websocket
RUN npm install react-countdown
RUN npm install @mui/icons-material
RUN npm install @mui/x-data-grid
RUN npm install react-responsive
RUN npm install react-qr-reader

# launch

CMD ["npm", "run", "dev"]