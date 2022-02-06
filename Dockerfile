FROM python:3.9

RUN mkdir -p /usr/src/robosats

WORKDIR /usr/src/robosats  # specifying the working dir inside the container

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy current dir's content to container's WORKDIR root i.e. all the contents of the robosats app
COPY . .

# fit lnd grpc services
RUN	pip install grpcio grpcio-tools googleapis-common-protos
RUN cd api/lightning && git clone https://github.com/googleapis/googleapis.git
RUN cd api/lightning && curl -o lightning.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/lightning.proto
RUN cd api/lightning && python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. lightning.proto
RUN cd api/lightning && curl -o invoices.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/invoicesrpc/invoices.proto
RUN cd api/lightning && python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. invoices.proto
RUN cd api/lightning && curl -o router.proto -s https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/routerrpc/router.proto 
RUN cd api/lightning && python3 -m grpc_tools.protoc --proto_path=googleapis:. --python_out=. --grpc_python_out=. router.proto

# patch generated files relative imports
RUN sed -i 's/^import .*_pb2 as/from . \0/' api/lightning/router_pb2.py
RUN sed -i 's/^import .*_pb2 as/from . \0/' api/lightning/invoices_pb2.py
RUN sed -i 's/^import .*_pb2 as/from . \0/' api/lightning/router_pb2_grpc.py
RUN sed -i 's/^import .*_pb2 as/from . \0/' api/lightning/lightning_pb2_grpc.py
RUN sed -i 's/^import .*_pb2 as/from . \0/' api/lightning/invoices_pb2_grpc.py

EXPOSE 8000

CMD ["gunicorn", "--bind", ":8000", "robosats.wsgi:application"]