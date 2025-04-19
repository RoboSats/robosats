#!/bin/sh

# Start bitcoind in the background
bitcoind "$@" &

# Wait for bitcoind to be ready
while ! bitcoin-cli --regtest --rpcuser=test --rpcpassword=test getblockchaininfo 2>/dev/null | grep '"verificationprogress":'; do
    echo "Waiting for bitcoind to be ready..."
    sleep 1
done

# Run initialization commands
bitcoin-cli --regtest --rpcuser=test --rpcpassword=test createwallet default
bitcoin-cli --regtest --rpcuser=test --rpcpassword=test generatetoaddress 1 $(bitcoin-cli --regtest --rpcuser=test --rpcpassword=test getnewaddress)

# Bring bitcoind to the foreground
wait
