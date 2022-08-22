# RoboSats app for soverign nodes.

RoboSats app for soverign nodes ( Umbrel, Citadel, Start9 ...). This app serves the RoboSats frontend app directly from your own node and redirects all API requests to RoboSats P2P market coordinator through your node's TOR proxy.

At the moment it has no special integration with your local lightning wallet (e.g. LND). This can be achieved easily by installing a WebLN compatible extension in your browser (e.g. getAlby).

# How it works

The container launches two processes: 1) A `socat` that will expose RoboSats coordinator API over HTTP on localhost:81 using the docker orchestration TOR socks proxy and 2) a `http-server` that serves all static files (including the Javascript client app) directly from your own node (should reduce loading times by a lot). Every request that cannot be served by your node http-server will be forwarded to the RoboSats coordinator (that is: API calls and Robot avatar images).

# Why host your own RoboSats client

Advantages over a full over-the-internet RoboSats experience:
1. Dramatically faster load times.
2. Safer: you control what RoboSats client app you run.
3. Access RoboSats safely from any browser / device. No need to use TOR if you are on your local network or using VPN: your node backend handles the torification needed for anonymization.
4. Allows control over what P2P market coordinator you connect to (defaults to robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion)

# Future upgrades

1. Increase availability by procesing API requests via I2P when TOR is not available.