# RoboSats client app for sovereign nodes

RoboSats app for sovereign nodes ( Umbrel, Citadel, Start9 ...). This app serves the RoboSats frontend app directly from your own node and redirects all API requests to RoboSats P2P market coordinator through your node's Tor proxy.

At the moment it has no special integration with your local lightning wallet (e.g. LND). This can be achieved easily by installing a WebLN compatible extension in your browser (e.g. getAlby).

# How it works

The container launches two processes: 1) A set of `socat` that will expose RoboSats coordinators API over HTTP on localhost:81 using the docker orchestration Tor socks proxy and 2) Nginx, used to direct every request where needed and serve the client app locally.

# Docker compose example
You can run the client locally with the provided example orchestration. It has both, a Tor proxy container and the robosats client.
`docker-compose -f docker-compose-example.yml up`
Then just visit http://localhost:12596

# Why host your own RoboSats client

Advantages over a full over-the-internet RoboSats experience:
1. Dramatically faster load times.
2. Safer: you control what RoboSats client app you run.
3. Access RoboSats safely from any browser / device. No need to use Tor if you are on your local network or using VPN: your node backend handles the torification needed for anonymization.
4. Allows control over what P2P market coordinator you connect to (defaults to robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion)

# Future upgrades

1. Increase availability by processing API requests via I2P when Tor is not available.
