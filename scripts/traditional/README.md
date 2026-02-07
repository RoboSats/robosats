# Robosats traditional environment

Robosats backend development and testing without docker and containers.

Binaries needed:
* postgresql (`postgres`, `initdb`, `psql`)
* redis (`redis-server`)
* bitcoin (`bitcoind`, `bitcoin-cli`)
* cln (`lightningd`, `lightning-cli`, `hold`)
* lnd (`lnd`, `lncli`)

## Preparation

Postgresql and redis can be found in all linux distros and bsds.

Some distros do not put postgresql binaries in `PATH`, if this is the
case simply link them somewhere in your `PATH`.

Example on debian:
```
ln -sf /usr/lib/postgresql/16/bin/postgres ~/.local/bin/
ln -sf /usr/lib/postgresql/16/bin/initdb ~/.local/bin/
ln -sf /usr/lib/postgresql/16/bin/psql ~/.local/bin/
```

Bitcoin nodes if not already installed need to be manually downloaded.
* bitcoin core binaries can be found here: https://bitcoincore.org/en/download
* cln binaries can be found here: https://github.com/ElementsProject/lightning/releases
* hold binary can be found here: https://github.com/BoltzExchange/hold/releases
* lnd binaries can be found here: https://github.com/lightningnetwork/lnd/releases

Example preparation:
```
$ python3 -m venv venv
$ . venv/bin/activate
$ pip install -r requirements_dev.txt
$ pip install -r requirements.txt

$ mkdir traditional
$ mkdir traditional/programs
$ cd traditional/programs

# if you do not have them already installed
$ mkdir bitcoin cln lnd
# download bitcoin, cln (and hold) and lnd binaries

# follow https://github.com/hoytech/strfry#compile
$ git clone https://github.com/hoytech/strfry
$ cd strfry
$ git submodule update --init
$ git checkout 1.0.4
$ make setup-golpe
$ make -j4

# if you want to use roboauto
# still in traditional/programs
$ git clone https://github.com/jerryfletcher21/roboauto
$ cd roboauto
$ pip install -r requirements.txt
$ pip install .
```

## env file

```
$ cp .env-sample .env
```
Edit `.env`, both robosats and traditional scripts will read from there.

Variables to change:
```
LNVENDOR = "CLN"
# LNVENDOR = "LND"

BITCOIND_RPCURL = "http://127.0.0.1:18443"
BITCOIND_RPCUSER = "test"
BITCOIND_RPCPASSWORD = "test"
CLN_DIR = "traditional/nodes/cln-coord/regtest/"
CLN_GRPC_HOST = "localhost:9999"
CLN_GRPC_HOLD_HOST = "localhost:9998"
LND_DIR = "traditional/nodes/lnd-coord/"
MACAROON_PATH = "data/chain/bitcoin/regtest/admin.macaroon"
LND_GRPC_HOST = "localhost:10009"
# POSTGRES_DB should not be postgres
POSTGRES_DB = "robosats"
# POSTGRES_USER should not be the same as $USER environment variable
POSTGRES_USER = "robosats"
POSTGRES_PASSWORD = "robosats"
USE_TOR = False
LOG_TO_CONSOLE = True
LOGGER_LEVEL = "INFO"
```

Variables to add:
```
DEVELOPMENT = True
TESTING = True
SKIP_FRONTEND_TESTS = True
TIMING_EXTRA_IN_TESTS = True

# LNVENDOR_USER is what robosats calls robot node in tests
LNVENDOR_USER = "LND"
# LNVENDOR_USER = "CLN"

DAPHNE_PORT = 9000
GUNICORN_PORT = 8080
RUNSERVER_PORT = 8000
STRFRY_HOST = localhost
STRFRY_PORT = 7778

BITCOIND_BIN = "traditional/programs/bitcoin/bin/bitcoind"
BITCOIN_CLI_BIN = "traditional/programs/bitcoin/bin/bitcoin-cli"
LIGHTNINGD_BIN = "traditional/programs/cln/bin/lightningd"
LIGHTNING_CLI_BIN = "traditional/programs/cln/bin/lightning-cli"
HOLD_PLUGIN_BIN = "traditional/programs/cln/hold"
LND_BIN = "traditional/programs/lnd/lnd"
LNCLI_BIN = "traditional/programs/lnd/lncli"
STRFRY_GIT_DIR = "traditional/programs/strfry"
ROBOAUTO_GIT_DIR = "traditional/programs/roboauto"
TRADITIONAL_NODES_DIR = "traditional/nodes"
TRADITIONAL_SERVICES_DIR = "traditional/services"
TRADITIONAL_LOGS_DIR = "traditional/logs"
GNUPG_DIR = "traditional/services/gnupg"

BITCOIN_TEST_ZMQ_BLOCK_PORT = 28432
BITCOIN_TEST_ZMQ_TX_PORT = 28433

# CLN_GRPC_HOST and CLN_GRPC_HOLD_HOST are for coord
CLN_TEST_COORD_LISTEN_PORT = 19846
CLN_TEST_USER_GRPC_PORT = 9989
CLN_TEST_USER_LISTEN_PORT = 19836

# LND_GRPC_HOST is for coord
LND_TEST_COORD_LISTEN_PORT = 19746
LND_TEST_COORD_REST_PORT = 8181
LND_TEST_COORD_MACAROON_PATH = "traditional/nodes/lnd-coord/data/chain/bitcoin/regtest/admin.macaroon"

LND_TEST_USER_GRPC_PORT = 10010
LND_TEST_USER_LISTEN_PORT = 19736
LND_TEST_USER_REST_PORT = 8182
LND_TEST_USER_MACAROON_PATH = "traditional/nodes/lnd-user/data/chain/bitcoin/regtest/admin.macaroon"
```

Paths can be relative or absolute. Binaries should be paths, they are
not resolved with `PATH`.

Roboauto can be disabled by not setting `ROBOAUTO_GIT_DIR` or setting it
to `false`.

If some ports are already in use, change their value.

To check which port are already in use, `netstat -tulnp` with root
privileges can be used.

For example if there is alread an instance of postgresql running on the
default port, change `POSTGRES_PORT = "5433"`.

## Usage

For development and testing two scripts are provided:
* `traditional-services` for non bitcoin related services
* `regtest-nodes` for bitcoin and lightning nodes

`traditional-services` sets up the database and manages the services.

Everything is done locally, so no root privileges/service managers are
needed.

`regtest-nodes` is a script that should be sourced, it sets up a regtest
environment, with bitcoin core, cln, lnd and roboauto, connecting them
and creating channels. It then exposes the functions `btc_reg`,
`cln_coord`, `cln_user`, `lnd_coord`, `lnd_user`, `ra_reg` to interact
with the nodes and roboauto.

If the script is sourced in a `bash` shell, it will also source
completions for all the functions.

`regtest-nodes` can also be run without arguments to simply expose the
functions to start and remove the nodes and to create the channels
between them, without setting up a specific environment.

Setup:
```
# change .env file

$ . venv/bin/activate

# generate cln and lnd grpc
$ scripts/generate_grpc.sh

$ . scripts/traditional/regtest-nodes test

$ scripts/traditional/traditional-services postgres-setup

$ scripts/traditional/traditional-services postgres-database

$ scripts/traditional/traditional-services strfry-setup

# remove the nodes
$ robosats_regtest_stop_and_remove_all

# postgres-database will create the database specified by
# POSTGRES_DB in .env, it can be run multiple times with
# different values of POSTGRES_DB for different databases
```

Testing:
```
# edit .env setting LNVENDOR to either "CLN" or "LND"
# LNVENDOR_USER while running tests should be set to "LND"

# in the main window
$ . venv/bin/activate
$ . scripts/traditional/regtest-nodes test

# in a secondary window
$ . venv/bin/activate
# can be stopped with Control-C
$ scripts/traditional/traditional-services test

# back in the main window
$ python3 manage.py test

# after having run the tests run
$ robosats_regtest_stop_and_remove_all
# to remove the nodes, they will be recreated when
# running the tests again

# python3 manage.py test can be run multiple times with the same database
# to have a clean database either use a different value
# of POSTGRES_DB or use a different directory (and run again the setup)
# by moving traditional/services/postgres somewhere and the moving it back when
# you want to use the old database again
```

Development:
```
# edit .env setting LNVENDOR to either "CLN" or "LND"
# and LNVENDOR_USER to either "CLN" or "LND"

# in the main window
$ . venv/bin/activate
$ . scripts/traditional/regtest-nodes server

# in a secondary window
$ . venv/bin/activate
# can be stopped with Control-C
$ scripts/traditional/traditional-services server

# to see the output of the django runserver command
# in a third window
$ tail -f traditional/logs/runserver

# if roboauto is active, use it to test the backend
# back in the main window
$ ra_reg --help
...
$ ra_reg create-order "$(ra_reg generate-robot --loc)" type=buy currency=btc min_amount=0.001 max_amount=0.002 payment_method="On-Chain BTC" premium=-1.5
...
$ ra_reg take-order $(ra_reg generate-robot --loc) order-id
...
$ ra_reg escrow-pay RobotName
...
```

Production:
```
# edit .env setting LNVENDOR to either "CLN" or "LND"
DEVELOPMENT = False
TESTING = False
USE_TOR = True
LOG_TO_CONSOLE = False
LOGGER_LEVEL = "WARNING"
HOST_NAME = "coordinator_onion_address.onion"
HOST_NAME2 = "*"
ONION_LOCATION = "coordinator_onion_address.onion"

$ . venv/bin/activate

$ scripts/traditional/traditional-services postgres-setup

$ scripts/traditional/traditional-services postgres-database-production

$ scripts/traditional/traditional-services strfry-setup
$ scripts/traditional/traditional-services nginx-setup

# change commit_sha

$ scripts/traditional/traditional-services production
```

Update:
```
$ . venv/bin/activate

$ pip install -r requirements_dev.txt
$ pip install -r requirements.txt

$ scripts/generate_grpc.sh

# for testing:
# start just postgres and redis in an other window
$ scripts/traditional/traditional-services test
# in the main window
$ . scripts/traditional/regtest-nodes test

# for production:
# backup traditional folder
# update commit_sha
$ scripts/traditional/traditional-services production

# then for both testing and production, in the main window
$ python3 manage.py migrate
```
