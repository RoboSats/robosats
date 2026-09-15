FROM debian:bullseye-slim as builder
ARG DEBIAN_FRONTEND=noninteractive

ARG LIGHTNINGD_VERSION=v25.09.3
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
RUN git clone https://github.com/daywalker90/holdinvoice.git /tmp/holdinvoice
# Pin to v4.0.0 (commit 82d34b02131cb94ed3e9350a0a727ae44d2763b9).
# IMPORTANT: Before upgrading this tag, verify the new version supports the
# CLN release used below (v25.09.x). See api/lightning/AGENTS.md for the
# holdinvoice ↔ CLN version constraint.
RUN cd /tmp/holdinvoice \
    && git checkout 82d34b02131cb94ed3e9350a0a727ae44d2763b9 \
    && cargo build --release

FROM elementsproject/lightningd:v25.09.3 as final

COPY --from=builder /tmp/holdinvoice/target/release/holdinvoice /tmp/holdinvoice
COPY config /tmp/config
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 9735 9835
ENTRYPOINT  [ "/usr/bin/tini", "-g", "--", "./entrypoint.sh" ]
