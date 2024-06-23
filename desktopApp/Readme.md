# RoboSats Desktop App

RoboSats desktop app serves the RoboSats frontend app directly and redirects all API requests to RoboSats P2P market coordinator through your TOR proxy.

## How to Use

### Step 1: Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/RoboSats/robosats.git
cd robosats
```


### Step 2: Install Dependencies
```bash
cd desktopApp
npm install
```


### Step 3: Run the App Locally
```bash
npm run start
```

### Step 4: Package the App

To package the app for different platforms (Linux, Windows, macOS), use the corresponding npm commands:

```bash
npm run package-linux
npm run package-win
npm run package-mac
```

### Additional Information
This desktop app ensures all API requests are redirected through a TOR proxy to maintain privacy and anonymity while accessing the RoboSats P2P market coordinator.

