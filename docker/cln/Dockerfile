FROM debian:bullseye-slim as builder
ARG DEBIAN_FRONTEND=noninteractive

ARG LIGHTNINGD_VERSION=v24.08
RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
        autoconf \
        automake \
        build-essential \
        ca-certificates \
        curl \
        git \
        protobuf-compiler

ENV RUST_PROFILE=release
ENV PATH=$PATH:/root/.cargo/bin/
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN rustup toolchain install stable --component rustfmt --allow-downgrade

WORKDIR /opt/lightningd
RUN git clone https://github.com/BoltzExchange/hold.git /tmp/hold
RUN cd /tmp/hold \
    && cargo build --release

FROM elementsproject/lightningd:v24.08 as final

COPY --from=builder /tmp/hold/target/release/hold /tmp/hold
COPY config /tmp/config
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 9735 9835
ENTRYPOINT  [ "/usr/bin/tini", "-g", "--", "./entrypoint.sh" ]