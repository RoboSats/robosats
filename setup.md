# Set up
*Attention: to use RoboSats you do not need to run the stack, simply visit the website and that's it! This setup guide is intended for developer contributors and platform operators.*

# Frontend Development Only
Running the full stack is not easy, since RoboSats needs of many services. However, contributing to the frontend development can be done with a minimal setup!
## With Docker
You can develop frontend-only features using the mainnet backend of the platform by simply running the sorverign node app locally and the `npm-dev` container. The orchestration in `/nodeapp/docker-compose.yml` will run a Tor proxy and torify all requests, as well as, watch for changes to the frontend source files, build it, and place it in the right `/static/`

```bash
cd nodeapp
docker-compose up
# Press Ctrl+C to exit the process
# Visit 127.0.0.1:12596
```

You can edit the frontend code in `/frontend/src/` to make the changes you want. Within a few seconds, the `npm-dev` container process will pack the code into the local `main.js`. Visit `127.0.0.1:12596` and you will see your changes on the frontend.


## Without Docker

*Set up time ~10 min. Tested in Firefox in Ubuntu.* (Does not work in Chromium)

------------------------

0. `git clone {robosats-project}`

1. `cd robosats/frontend`

2. `npm install`

3. `npm run dev` (leave it running)

4. On another terminal `npm install -g http-server`

5. Then run `http-server "robosats/frontend/static/`

6. Install [Requestly](https://requestly.io/) extension in your browser, it's a lightweight proxy. We want to use it so our browser grabs our local `main.js` instead of the remote. There are many alternatives to Requestly (be aware that Requestly might not respect your privacy. Didn't research it).

7. Pick a RoboSats backend to test the new frontend: e.g. "robosats.onion.moe", or "unsafe.testnet.robosats.com". You can also use the onion services also if you are using Brave or Tor Browser (untested!)

8. Open Requestly extension and add a new redirect rule. Make  "{robosats-site}/static/frontend/main.js" redirect to "127.0.0.1:8080/frontend/main.js" and save the changes.

-------------------

**You are ready to go!** Edit the frontend code in `/frontend/src/` to make the changes you want. Within a few seconds, the `npm run dev` process will pack the code into the local `main.js`. Visit your selected {robosats-site} and you will see your new awesome frontend! :)

Every time you save changes to files in `/frontend/src` you will be able to see them in your browser after a few seconds using force refresh (Ctrl+Shift+R). 

If you need to edit CSS or other static files in `/frontend/static`, simply add them to Requestly in the same way.

i.e: index.css 
Make "{robosats-site}/static/css/index.css" redirect to "127.0.0.1:8080/css/index.css"

# Documentation Jekyll Site Only
Simply run the de docker-compose within /docs/ in order to watch files, build and serve the Learn RoboSats site locally.
```bash
cd docs
docker-compose up
# press Ctrl+C to exit the process
```
Then visit `127.0.0.1:4000` on your browser. Once you save changes on a file it will take around 10s for the site to update (press <Ctrl+Shift+R> to force-refresh your browser).

# Full Stack Development
## The Easy Way: Docker-compose (-dev containers running on testnet)

*Set up time, anywhere between ~45 min and 1 full day (depending on experience, whether you have a copy of the testnet blockchain, etc). Tested in Ubuntu.

Spinning up docker for the first time
```bash
docker-compose build --no-cache
# Install LND python dependencies into local repository
docker run --mount type=bind,src=$(pwd),dst=/usr/src/robosats backend sh generate_grpc.sh
docker-compose up -d
docker exec -it django-dev python3 manage.py makemigrations api control chat
docker exec -it django-dev python3 manage.py migrate
docker exec -it django-dev python3 manage.py createsuperuser
# Once requested for the new superuser name, make sure to use the same name you have in the .env-sample variable ESCROW_USERNAME. By default 'admin'.
docker-compose restart
```
Copy the `.env-sample` file into `.env` and check the environmental variables are right for your development.

**All set!**

Commands you will need to startup:

* Spinning up the docker orchestration:
`docker-compose up -d`

* Then monitor in a terminal the Django dev docker service
`docker attach django-dev`

* And the NPM dev docker service
`docker attach npm-dev`

* You could also just check all services logs
`docker-compose logs -f`

You will need these commands also often or eventually:

* Use `unlock` or `create` your lnd node
`docker exec -it lnd-dev lncli unlock`

* Create p2wkh addresses
`docker exec -it lnd-dev lncli --network=testnet newaddress p2wkh`

* Wallet balance
`docker exec -it lnd-dev lncli --network=testnet walletbalance`

* Connect to peer
`docker exec -it lnd-dev lncli --network=testnet connect node_id@ip:9735`

* Open channel
`docker exec -it lnd-dev lncli --network=testnet openchannel node_id --local_amt LOCAL_AMT --push_amt PUSH_AMT`

* Lock a bond from your own `lnd-dev` node
`docker exec -it lnd-dev lncli -network=testnet payinvoice <BOLT_11_INVOICE> --allow_self_payment`

**RoboSats development site should be accessible on 127.0.0.1:8000**