#!/bin/sh

# generate grpc definitions
cd api/lightning
[ -d googleapis ] || git clone https://github.com/googleapis/googleapis.git googleapis
curl -o lightning.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/lightning.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. lightning.proto
curl -o invoices.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/invoicesrpc/invoices.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. invoices.proto
curl -o router.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/routerrpc/router.proto
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. router.proto

# patch generated files relative imports
sed -i 's/^import .*_pb2 as/from . \0/' router_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' invoices_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' router_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' lightning_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' invoices_pb2_grpc.py
