# WebTunnel

Pluggable Transport based on HTTP Upgrade(HTTPT)

WebTunnel is pluggable transport that attempt to imitate web browsing activities based on [HTTPT](https://censorbib.nymity.ch/#Frolov2020b).

## Client Usage
Connect to a WebTunnel server with a Tor configuration file like:
```
UseBridges 1
DataDirectory datadir

ClientTransportPlugin webtunnel exec ./client

Bridge webtunnel 192.0.2.3:1 url=https://akbwadp9lc5fyyz0cj4d76z643pxgbfh6oyc-167-71-71-157.sslip.io/5m9yq0j4ghkz0fz7qmuw58cvbjon0ebnrsp0

SocksPort auto

Log info
```
## Server Setup

#### Install Tor
On a Debian system, first install tor normally with
```
apt install apt-transport-https
lsb_release -c
nano /etc/apt/sources.list.d/tor.list
wget -qO- https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --dearmor | tee /usr/share/keyrings/tor-archive-keyring.gpg >/dev/null
apt update
apt install tor deb.torproject.org-keyring
```

### Disable default instance
The default Tor configuration is not useful for this setup, so the next step will be disabling them.
```
systemctl stop tor@default.service
systemctl mask tor@default.service
```

### Get Environment Ready
```
#copy server file to server
scp server root@$SERVER_ADDRESS:/var/lib/torwebtunnel/webtunnel
```

then create server torrc at `/var/lib/torwebtunnel/torrc`
```
BridgeRelay 1

ORPort 10000

ServerTransportPlugin webtunnel exec /var/lib/torwebtunnel/webtunnel

ServerTransportListenAddr webtunnel 127.0.0.1:11000

ExtORPort auto

ContactInfo WebTunnel email: tor.relay.email@torproject.net ciissversion:2

Nickname WebTunnelTest

PublishServerDescriptor 1
BridgeDistribution none

DataDirectory /var/lib/torwebtunnel/tor-data
CacheDirectory /tmp/tor-tmp-torwebtunnel

SocksPort 0
```

#### Configure service unit file
Create a service unit file as follow
```
[Unit]
Description=Tor Web Tunnel

[Service]
Type=simple
DynamicUser=yes
PrivateUsers=true
PrivateMounts=true
ProtectSystem=strict
PrivateTmp=true
PrivateDevices=true
ProtectClock=true
NoNewPrivileges=true
ProtectHome=tmpfs
ProtectKernelModules=true
ProtectKernelLogs=true

StateDirectory=torwebtunnel

ExecStart=/usr/bin/tor -f /var/lib/torwebtunnel/torrc --RunAsDaemon 0

[Install]
WantedBy=default.target
```

#### Obtain Certificate
WebTunnel Requires a valid TLS certificate, to obtain that
```
curl https://get.acme.sh | sh -s email=my@example.com
~/.acme.sh/acme.sh --issue --standalone --domain $SERVER_ADDRESS
```

#### Install & Configure Nginx
To coexist with other content at a single port, it is necessary to install a reverse proxy like nginx:
```
apt install nginx
```

And then configure HTTP Upgrade forwarding at /etc/nginx/nginx.conf.
```
--- a/before.conf
+++ b/after.conf
@@ -60,6 +60,13 @@ http {
 
        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*;
+
+       #WebSocket Support
+       map $http_upgrade $connection_upgrade {
+                       default upgrade;
+                       ''      close;
+       }
+
 }

```

Finally, add http forwarding setting to a new file at /etc/nginx/site-enabled .
```
server {
    listen [::]:443 ssl http2;
    listen 443 ssl http2;
    server_name $SERVER_ADDRESS;
    #ssl on;

    # certs sent to the client in SERVER HELLO are concatenated in ssl_certificate
    ssl_certificate /etc/nginx/ssl/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/key.key;


    ssl_session_timeout 15m;

    ssl_protocols TLSv1.2 TLSv1.3;

    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    ssl_prefer_server_ciphers off;

    ssl_session_cache shared:MozSSL:50m;
    #ssl_ecdh_curve secp521r1,prime256v1,secp384r1;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    
    location /$PATH {
        proxy_pass http://127.0.0.1:11000;
        proxy_http_version 1.1;

        ###Set WebSocket headers ####
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        ### Set Proxy headers ####
        proxy_set_header        Accept-Encoding   "";
        proxy_set_header        Host            $host;
        proxy_set_header        X-Real-IP       $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header        X-Forwarded-Proto $scheme;
        add_header              Front-End-Https   on;

        proxy_redirect     off;
}


}

```

## Docker Setup

Webtunnel is a new pluggable transport available for bridge operators.

### Prerequisites
An existing website using nginx balancer to handle traffic. (other load banlancer is currently untested)

Handle traffic directly, without CDN. (CDN passthrough is currently untested)

A container runtime like Docker.

### Configure nginx Forwarding
If you haven't already, configure websocket forwarding support in nginx by configure HTTP Upgrade forwarding at /etc/nginx/nginx.conf:
```
--- a/before.conf
+++ b/after.conf
@@ -60,6 +60,13 @@ http {
 
        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*;
+
+       #WebSocket Support
+       map $http_upgrade $connection_upgrade {
+                       default upgrade;
+                       ''      close;
+       }
+
 }
```
And add a forwarded path under one the served domain, typically defined in files within `/etc/nginx/sites-enabled/`, replace $PATH with a random string(which you could generate with `echo $(cat /dev/urandom | tr -cd "qwertyuiopasdfghjklzxcvbnmMNBVCXZLKJHGFDSAQWERTUIOP0987654321"|head -c 24)`):
```
location /$PATH {
        proxy_pass http://127.0.0.1:11000;
        proxy_http_version 1.1;

        ###Set WebSocket headers ####
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        ### Set Proxy headers ####
        proxy_set_header        Accept-Encoding   "";
        proxy_set_header        Host            $host;
        proxy_set_header        X-Real-IP       $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header        X-Forwarded-Proto $scheme;
        add_header              Front-End-Https   on;

        proxy_redirect     off;
}
``` 

### Install Docker Runtime(if necessary)
```
apt install curl sudo
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh ./get-docker.sh
```

### Run Dockerlized Webtunnel Server
Replace `URL` with your domain and path, and `OPERATOR_EMAIL` with your email address, then run:
```
truncate --size 0 .env
echo "URL=https://yourdomain/and/path" >> .env
echo "OPERATOR_EMAIL=your@email.org" >> .env
echo "BRIDGE_NICKNAME=WTBr$(cat /dev/urandom | tr -cd 'qwertyuiopasdfghjklzxcvbnmMNBVCXZLKJHGFDSAQWERTUIOP0987654321'|head -c 10)" >> .env
echo "GENEDORPORT=4$(cat /dev/urandom | tr -cd '0987654321'|head -c 4)" >> .env
```
This will create an environment file for the configuration of webtunnel bridge.

After creating the configure file, download the webtunnel docker compose file, and instancize it.
````shell
curl https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/webtunnel/-/raw/main/release/container/docker-compose.yml?inline=false > docker-compose.yml
docker compose up -d
````
It includes auto update by default, and will update webtunnel bridge server without any further action. Remove `watchtower` to disable this behavior.

### Get Bridgeline and Check it is Running
You can obtain bridgeline and verify if it is working by running
```shell
docker compose exec webtunnel-bridge get-bridge-line.sh
```
