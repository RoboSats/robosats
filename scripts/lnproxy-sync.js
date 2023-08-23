const fs = require('fs');

let incomingRelays = JSON.parse(fs.readFileSync('./lnproxy_tmplist.json'));
let existingRelays = JSON.parse(fs.readFileSync('./frontend/static/lnproxies.json'))

let newRelays = [];

let torCount = 0;
let i2pCount = 0;
let clearnetCount = 0;

//Merge relay lists. URL is the unique ID used to merge records and only inserts supported. No updates or deletes
let existingRelayURLs = existingRelays.map((relay) => relay.url);
let newIncomingRelays = incomingRelays.filter((relay)=> existingRelayURLs.indexOf(relay) === -1)

for (let url of newIncomingRelays) {
  let relayType;
  const LNPROXY_API_PATH = '/spec'
  const fqdn = url.replace(LNPROXY_API_PATH, '');
  if (fqdn.endsWith('.onion')) {
    relayType = "Tor";
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

  let relayName = `${relayType}${relayType === "Tor" ? torCount : ''}${relayType === "I2P" ? i2pCount : ''}${relayType === "Clearnet" ? clearnetCount : ''} ${url.split('/')[2].substring(0,6)}`

  newRelays.push({
    name: relayName,
    url: url,
    relayType: relayType,
    network: "mainnet" //TODO: testnet
  });
}

if (newRelays.length > 0) {
  existingRelays.push(...newRelays);
  fs.writeFileSync('./frontend/static/lnproxies.json', JSON.stringify(existingRelays, null, 2));
}
