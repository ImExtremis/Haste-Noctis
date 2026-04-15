FROM erlang:28-slim AS build

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
	git \
	curl \
	make \
	gcc \
	g++ \
	libc6-dev \
	ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://github.com/erlang/rebar3/releases/download/3.24.0/rebar3 -o /usr/local/bin/rebar3 && \
	chmod +x /usr/local/bin/rebar3

COPY rebar.config rebar.lock* ./
RUN rebar3 compile --deps_only

COPY . .
RUN rebar3 as prod release

FROM erlang:28-slim

WORKDIR /opt/noctis_relay

RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	curl \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /usr/src/app/_build/prod/rel/noctis_relay .

RUN useradd -r -s /sbin/nologin -d /opt/noctis_relay noctis && \
	chown -R noctis:noctis /opt/noctis_relay

USER noctis

EXPOSE 8080 8081

ENTRYPOINT ["/opt/noctis_relay/bin/noctis_relay", "foreground"]
