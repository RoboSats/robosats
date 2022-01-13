# Set up
## Django development environment
### Install Python and pip
`sudo apt install python3 python3 pip`

### Install virtual environments
```
pip install virtualenvwrapper
```

### Add to .bashrc

```
export WORKON_HOME=$HOME/.virtualenvs
export VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3
export VIRTUALENVWRAPPER_VIRTUALENV_ARGS=' -p /usr/bin/python3 '
export PROJECT_HOME=$HOME/Devel
source /usr/local/bin/virtualenvwrapper.sh
```

### Reload startup file
`source ~/.bashrc`

### Create virtual environment
`mkvirtualenv robosats_env`

### Activate environment
`workon robosats_env`

### Install Django and Restframework
`pip3 install django djangorestframework`

## Install Django admin relational links
`pip install django-admin-relation-links`

## Install dependencies for websockets
Install Redis
`apt-get install redis-server`
Test redis-server
`redis-cli ping`

Install python dependencies
```
pip install channels
pip install django-redis
pip install channels-redis
```

*Django 4.0 at the time of writting*

### Launch the local development node

```
python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py runserver
```

### Install other python dependencies
```
pip install robohash
pip install python-decouple
pip install ring
```

### Install LND python dependencies
```
cd api/lightning
pip install grpcio grpcio-tools googleapis-common-protos
git clone https://github.com/googleapis/googleapis.git
curl -o lightning.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/lightning.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. lightning.proto
```
We also use the *Invoices* and *Router* subservices for invoice validation and payment routing.
```
curl -o invoices.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/invoicesrpc/invoices.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. invoices.proto
curl -o router.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/routerrpc/router.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. router.proto
```
Relative imports are not working at the moment, so some editing is needed in
`api/lightning` files `lightning_pb2_grpc.py`, `invoices_pb2_grpc.py`, `invoices_pb2.py`, `router_pb2_grpc.py` and `router_pb2.py`. 

For example in `lightning_pb2_grpc.py` , add "from . " :

`import lightning_pb2 as lightning__pb2`

to

`from . import lightning_pb2 as lightning__pb2`

Same for every other file

## React development environment
### Install npm
`sudo apt install npm`

npm packages we use
```
cd frontend
npm init -y
npm i webpack webpack-cli --save-dev
npm i @babel/core babel-loader @babel/preset-env @babel/preset-react --save-dev
npm i react react-dom --save-dev
npm install @material-ui/core
npm install @babel/plugin-proposal-class-properties
npm install react-router-dom@5.2.0
npm install @material-ui/icons
npm install material-ui-image
npm install @mui/system @emotion/react @emotion/styled
npm install react-native
npm install react-native-svg
npm install react-qr-code
npm install @mui/material
npm install react-markdown
```
Note we are using mostly MaterialUI V5 (@mui/material) but Image loading from V4 (@material-ui/core) extentions (so both V4 and V5 are needed)

### Launch the React render
from frontend/ directory
`npm run dev`