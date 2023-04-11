#!/bin/sh

# generate grpc definitions
cd api/lightning
[ -d googleapis ] || git clone https://github.com/googleapis/googleapis.git googleapis

# LND Lightning proto
curl -o lightning.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/lightning.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. lightning.proto

# LND Invoices proto
curl -o invoices.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/invoicesrpc/invoices.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. invoices.proto

# LND Router proto
curl -o router.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/routerrpc/router.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. router.proto

# LND Signer proto
curl -o signer.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/signrpc/signer.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. signer.proto

# LND Versioner proto
curl -o verrpc.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/verrpc/verrpc.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. verrpc.proto

# generate cln grpc definitions
curl -o node.proto -s https://raw.githubusercontent.com/daywalker90/lightning/master/cln-grpc/proto/node.proto
python3 -m grpc_tools.protoc --proto_path=. --python_out=. --grpc_python_out=. node.proto
curl -o primitives.proto -s https://raw.githubusercontent.com/daywalker90/lightning/master/cln-grpc/proto/primitives.proto
python3 -m grpc_tools.protoc --proto_path=. --python_out=. --grpc_python_out=. primitives.proto

# delete googleapis
rm -r googleapis

# patch generated files relative imports
sed -i 's/^import .*_pb2 as/from . \0/' router_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' signer_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' invoices_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' verrpc_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' router_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' signer_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' lightning_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' invoices_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' verrpc_pb2_grpc.py

# On development environments the local volume will be mounted over these files. We copy pb2 and grpc files to /tmp/.
# This way, we can find if these files are missing with our entrypoint.sh and copy them into the volume.

cp -r *_pb2.py /tmp/
cp -r *_grpc.py /tmp/