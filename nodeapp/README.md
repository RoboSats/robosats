# RoboSats app for soverign nodes.

RoboSats app for soverign nodes ( Umbrel, Citadel, Start9 ...). This app serves the RoboSats frontend app directly from your own node and redirects all API requests to RoboSats P2P market coordinator through your node's TOR proxy.

At the moment it has no special integration with your local lightning wallet (e.g. LND). This can be achieved easily by installing a WebLN compatible extension in your browser (e.g. getAlby).

The container launches two processes: 1) A `socat` that will expose RoboSats coordinator API over HTTP using the docker orchestration Tor socks proxy and 2) a `http-server` that will serve all static files (including the Javascript client app) directly from your own node (should reduce loading times by a lot). Every request that cannot be served by your node http-server will be forwarded to the RoboSats coordinator (that is: API calls and Robot avatar images).
