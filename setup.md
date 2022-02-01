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
## Install Celery for Django tasks
```
pip install celery
pip install django-celery-beat
pip install django-celery-results
```

Start up celery worker
`celery -A robosats worker --beat -l info -S django`

*Django 3.2.11 at the time of writting*
*Celery 5.2.3*

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
npm install websocket
npm install react-countdown
npm install @mui/icons-material
npm install @mui/x-data-grid
npm install react-responsive
npm install react-qr-reader
```
Note we are using mostly MaterialUI V5 (@mui/material) but Image loading from V4 (@material-ui/core) extentions (so both V4 and V5 are needed)

### Launch
from frontend/ directory
`npm run dev`

## Robosats background threads.

There is 3 processes that run asynchronously: two admin commands and a celery beat scheduler.
The celery worker will run the task of caching external API market prices and cleaning(deleting) the generated robots that were never used.
`celery -A robosats worker --beat -l debug -S django`

The admin commands are used to keep an eye on the state of LND hold invoices and check whether orders have expired
```
python3 manage.py follow_invoices
python3 manage.py clean_order
```

It might be best to set up system services to continuously run these background processes.

### Follow invoices admin command as system service

Create `/etc/systemd/system/follow_invoices.service` and edit with:

```
[Unit]
Description=RoboSats Follow LND Invoices
After=lnd.service
StartLimitIntervalSec=0

[Service]
WorkingDirectory=/home/<USER>/robosats/
StandardOutput=file:/home/<USER>/robosats/follow_invoices.log
StandardError=file:/home/<USER>/robosats/follow_invoices.log
Type=simple
Restart=always
RestartSec=1
User=<USER>
ExecStart=python3 manage.py follow_invoices

[Install]
WantedBy=multi-user.target
```

Then launch it with

```
systemctl start follow_invoices
systemctl enable follow_invoices
```
### Clean orders admin command as system service

Create `/etc/systemd/system/clean_orders.service` and edit with (replace <USER> for your username):

```
[Unit]
Description=RoboSats Clean Orders
After=lnd.service
StartLimitIntervalSec=0

[Service]
WorkingDirectory=/home/<USER>/robosats/
StandardOutput=file:/home/<USER>/robosats/clean_orders.log
StandardError=file:/home/<USER>/robosats/clean_orders.log
Type=simple
Restart=always
RestartSec=1
User=<USER>
ExecStart=python3 manage.py clean_orders

[Install]
WantedBy=multi-user.target
```

Then launch it with

```
systemctl start clean_orders
systemctl enable clean_orders
```