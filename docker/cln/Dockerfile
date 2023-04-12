# Forked of https://github.com/ElementsProject/lightning/blob/2c9b043be97ee4aeca1334d29c2f0ad99da69d34/Dockerfile
# Changes over base core-lightning Dockerfile:
# Adds hodlvoice grpc plugin
# ARG DEVELOPER=0

# This dockerfile is meant to compile a core-lightning x64 image
# It is using multi stage build:
# * downloader: Download bitcoin and qemu binaries needed for core-lightning
# * builder: Compile core-lightning dependencies, then core-lightning itself with static linking
# * final: Copy the binaries required at runtime
# The resulting image uploaded to dockerhub will only contain what is needed for runtime.
# From the root of the repository, run "docker build -t yourimage:yourtag ."
FROM debian:bullseye-slim as downloader
ARG DEBIAN_FRONTEND=noninteractive
RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr wget

WORKDIR /opt

RUN wget -qO /opt/tini "https://github.com/krallin/tini/releases/download/v0.18.0/tini" \
    && echo "12d20136605531b09a2c2dac02ccee85e1b874eb322ef6baf7561cd93f93c855 /opt/tini" | sha256sum -c - \
    && chmod +x /opt/tini

ARG BITCOIN_VERSION=24.0.1
ENV BITCOIN_TARBALL bitcoin-${BITCOIN_VERSION}-x86_64-linux-gnu.tar.gz
ENV BITCOIN_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/$BITCOIN_TARBALL
ENV BITCOIN_ASC_URL https://bitcoincore.org/bin/bitcoin-core-$BITCOIN_VERSION/SHA256SUMS

RUN mkdir /opt/bitcoin && cd /opt/bitcoin \
    && wget -qO $BITCOIN_TARBALL "$BITCOIN_URL" \
    && wget -qO bitcoin "$BITCOIN_ASC_URL" \
    && grep $BITCOIN_TARBALL bitcoin | tee SHA256SUMS \
    && sha256sum -c SHA256SUMS \
    && BD=bitcoin-$BITCOIN_VERSION/bin \
    && tar -xzvf $BITCOIN_TARBALL $BD/bitcoin-cli --strip-components=1 \
    && rm $BITCOIN_TARBALL

FROM debian:bullseye-slim as builder
ARG DEBIAN_FRONTEND=noninteractive

ARG LIGHTNINGD_VERSION=v23.02.2

RUN apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends \
        autoconf \
        automake \
        build-essential \
        ca-certificates \
        curl \
        dirmngr \
        gettext \
        git \
        gnupg \
        libpq-dev \
        libtool \
        libffi-dev \
        protobuf-compiler \
        python3 \
        python3-dev \
        python3-mako \
        python3-pip \
        python3-venv \
        python3-setuptools \
        wget

# RUN apt-get install -y --no-install-recommends \
#     postgresql-common \
#     postgresql-14 \
#     libpq-dev=14.* \
#     && rm -rf /var/lib/apt/lists/*

RUN wget -q https://zlib.net/fossils/zlib-1.2.13.tar.gz \
    && tar xvf zlib-1.2.13.tar.gz \
    && cd zlib-1.2.13 \
    && ./configure \
    && make \
    && make install && cd .. && \
    rm zlib-1.2.13.tar.gz && \
    rm -rf zlib-1.2.13

RUN apt-get install -y --no-install-recommends unzip tclsh \
    && wget -q https://www.sqlite.org/2019/sqlite-src-3290000.zip \
    && unzip sqlite-src-3290000.zip \
    && cd sqlite-src-3290000 \
    && ./configure --enable-static --disable-readline --disable-threadsafe --disable-load-extension \
    && make \
    && make install && cd .. && rm sqlite-src-3290000.zip && rm -rf sqlite-src-3290000

RUN wget -q https://gmplib.org/download/gmp/gmp-6.1.2.tar.xz \
    && tar xvf gmp-6.1.2.tar.xz \
    && cd gmp-6.1.2 \
    && ./configure --disable-assembly \
    && make \
    && make install && cd .. && rm gmp-6.1.2.tar.xz && rm -rf gmp-6.1.2

ENV RUST_PROFILE=release
ENV PATH=$PATH:/root/.cargo/bin/
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN rustup toolchain install stable --component rustfmt --allow-downgrade

WORKDIR /opt/lightningd
# Clone git repo into /tmp/lightning
RUN git clone --recursive --branch $LIGHTNINGD_VERSION https://github.com/ElementsProject/lightning.git /tmp/lightning
RUN git clone --recursive /tmp/lightning . && \
    git checkout $(git --work-tree=/tmp/lightning --git-dir=/tmp/lightning/.git rev-parse HEAD)

RUN git clone --recursive --branch hodlvoice https://github.com/daywalker90/lightning.git /tmp/hodlvoice
RUN cd /tmp/hodlvoice/plugins/grpc-plugin \
    && cargo build --release

ENV PYTHON_VERSION=3
RUN curl -sSL https://install.python-poetry.org | python3 - \
    && pip3 install -U pip \
    && pip3 install -U wheel \
    && /root/.local/bin/poetry install

RUN ./configure --prefix=/tmp/lightning_install --enable-static && \
    make DEVELOPER=${DEVELOPER} && \
    /root/.local/bin/poetry run make install

FROM debian:bullseye-slim as final

COPY --from=downloader /opt/tini /usr/bin/tini

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      socat \
      inotify-tools \
      python3 \
      python3-pip \
      libpq5 && \
    rm -rf /var/lib/apt/lists/*

ENV LIGHTNINGD_DATA=/root/.lightning
ENV LIGHTNINGD_RPC_PORT=9835
ENV LIGHTNINGD_PORT=9735
ENV LIGHTNINGD_NETWORK=bitcoin

RUN mkdir $LIGHTNINGD_DATA && \
    touch $LIGHTNINGD_DATA/config
VOLUME [ "/root/.lightning" ]
COPY --from=builder /tmp/lightning_install/ /usr/local/
COPY --from=builder /tmp/hodlvoice/target/release/cln-grpc-hodl /tmp/cln-grpc-hodl
COPY --from=downloader /opt/bitcoin/bin /usr/bin
COPY config /tmp/config
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 9735 9835
ENTRYPOINT  [ "/usr/bin/tini", "-g", "--", "./entrypoint.sh" ]