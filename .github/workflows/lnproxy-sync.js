const fs = require('fs');

let rawRelays = JSON.parse(fs.readFileSync('./lnproxy_relays.json'));
let formattedRelays = [];

let torCount = 0;
let i2pCount = 0;
let clearnetCount = 0;

for (let url of rawRelays) {
  let relayType;
  const LNPROXY_API_PATH = '/spec'
  const fqdn = url.replace(LNPROXY_API_PATH, '');
  if (fqdn.endsWith('.onion')) {
    relayType = "TOR";
    torCount++;
  }
  else if (fqdn.endsWith('i2p')) {
    relayType = "I2P";
    i2pCount++;
  }
  else {
    relayType = "Clearnet";
    clearnetCount++;
  }

  let relayName = `LNProxy ${relayType}${relayType === "TOR" ? torCount : ''}${relayType === "I2P" ? i2pCount : ''}${relayType === "Clearnet" ? clearnetCount : ''}`;

  formattedRelays.push({
    name: relayName,
    url: url,
    relayType: relayType,
    network: "mainnet" //TODO: testnet
  });
}

fs.writeFileSync('./frontend/static/lnproxies.json', JSON.stringify(formattedRelays, null, 2));