#!/bin/sh

# generate LND grpc definitions
cd api/lightning
[ -d googleapis ] || git clone https://github.com/googleapis/googleapis.git --depth=1 googleapis

echo "Downloading LND & CLN GRPC specs.."
curl --parallel -o lightning.proto https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/lightning.proto \
    -o invoices.proto https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/invoicesrpc/invoices.proto \
    -o router.proto https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/routerrpc/router.proto \
    -o signer.proto https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/signrpc/signer.proto \
    -o verrpc.proto https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/verrpc/verrpc.proto \
    -o hold.proto https://raw.githubusercontent.com/BoltzExchange/hold/main/protos/hold.proto \
    -o primitives.proto https://raw.githubusercontent.com/ElementsProject/lightning/v24.08/cln-grpc/proto/primitives.proto \
    -o node.proto https://raw.githubusercontent.com/ElementsProject/lightning/v24.08/cln-grpc/proto/node.proto

echo -n "Done\nBuilding api from GRPC specs..."
python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. lightning.proto invoices.proto router.proto signer.proto verrpc.proto
# `hold.proto` uses `proto3 optional` fields; grpc_tools.protoc requires the experimental flag.
python3 -m grpc_tools.protoc --experimental_allow_proto3_optional --proto_path=. --python_out=. --grpc_python_out=. node.proto hold.proto primitives.proto

# patch generated files relative imports
# LND
sed -i 's/^import .*_pb2 as/from . \0/' router_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' signer_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' invoices_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' verrpc_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' router_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' signer_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' lightning_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' invoices_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' verrpc_pb2_grpc.py

# CLN
sed -i 's/^import .*_pb2 as/from . \0/' hold_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' hold_pb2_grpc.py
sed -i 's/^import .*_pb2 as/from . \0/' node_pb2.py
sed -i 's/^import .*_pb2 as/from . \0/' node_pb2_grpc.py

# grpcio-tools currently pins protobuf < 6, but some environments may end up
# generating pb2 files with a newer protoc. The runtime version check added to
# generated *_pb2.py can then crash at import time. Strip that guard so images
# can run tests without forcing an incompatible protobuf pin.
for f in *_pb2.py; do
    sed -i \
        -e '/^from google\.protobuf import runtime_version as _runtime_version$/d' \
        -e '/^_runtime_version\.ValidateProtobufRuntimeVersion(/,/^[[:space:]]*)$/d' \
        "$f"
done

echo -n "Done\nDeleting googleapi..."
rm -rf googleapis # delete googleapis
echo "Done"

# On development environments the local volume will be mounted over these files. We copy pb2 and grpc files to /tmp/.
# This way, we can find if these files are missing with our entrypoint.sh and copy them into the volume.
cp -r *_pb2.py /tmp/
cp -r *_grpc.py /tmp/
