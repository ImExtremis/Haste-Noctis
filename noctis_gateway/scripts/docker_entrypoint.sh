#!/usr/bin/env sh

set -eu

NODE_BASE_NAME="${NOCTIS_GATEWAY_NODE_BASENAME:-noctis_gateway}"

if [ -z "${NOCTIS_GATEWAY_NODE_FLAG:-}" ] && [ -n "${NOCTIS_GATEWAY_NODE_NAME:-}" ]; then
	case "${NOCTIS_GATEWAY_NODE_NAME}" in
		*@*)
			NOCTIS_GATEWAY_NODE_FLAG="-name"
			;;
		*)
			NOCTIS_GATEWAY_NODE_FLAG="-sname"
			;;
	esac
	export NOCTIS_GATEWAY_NODE_FLAG
fi

if [ -z "${NOCTIS_GATEWAY_NODE_HOST:-}" ]; then
	if [ -n "${HOSTNAME:-}" ]; then
		NOCTIS_GATEWAY_NODE_HOST="$HOSTNAME"
	else
		NOCTIS_GATEWAY_NODE_HOST="$(hostname)"
	fi
	export NOCTIS_GATEWAY_NODE_HOST
fi

if [ -n "${NOCTIS_GATEWAY_NODE_FLAG:-}" ]; then
	case "$NOCTIS_GATEWAY_NODE_FLAG" in
		-name | -sname)
			;;
		*)
			echo "Invalid NOCTIS_GATEWAY_NODE_FLAG: $NOCTIS_GATEWAY_NODE_FLAG" >&2
			exit 64
			;;
	esac
fi

if [ -z "${NOCTIS_GATEWAY_NODE_FLAG:-}" ]; then
	NODE_MODE=""
	if [ -n "${NOCTIS_GATEWAY_NODE_MODE:-}" ]; then
		NODE_MODE="$NOCTIS_GATEWAY_NODE_MODE"
	fi

	if [ -z "$NODE_MODE" ]; then
		FQDN_HOST=""
		if command -v hostname >/dev/null 2>&1; then
			FQDN_HOST="$(hostname -f 2>/dev/null || true)"
		fi

		if [ -n "$FQDN_HOST" ] && printf '%s' "$FQDN_HOST" | grep -q '\.'; then
			NODE_MODE="long"
			NOCTIS_GATEWAY_NODE_HOST="$FQDN_HOST"
		else
			if printf '%s' "$NOCTIS_GATEWAY_NODE_HOST" | grep -q '\.'; then
				NODE_MODE="long"
			else
				NODE_MODE="short"
			fi
		fi
	fi

	case "$NODE_MODE" in
		long)
			NOCTIS_GATEWAY_NODE_FLAG="-name"
			;;
		short)
			NOCTIS_GATEWAY_NODE_FLAG="-sname"
			;;
		*)
			echo "Invalid NOCTIS_GATEWAY_NODE_MODE: $NODE_MODE" >&2
			exit 64
			;;
	esac

	export NOCTIS_GATEWAY_NODE_FLAG
	export NOCTIS_GATEWAY_NODE_HOST
fi

if [ -z "${NOCTIS_GATEWAY_NODE_NAME:-}" ]; then
	if [ "$NOCTIS_GATEWAY_NODE_FLAG" = "-name" ]; then
		NOCTIS_GATEWAY_NODE_NAME="${NODE_BASE_NAME}@${NOCTIS_GATEWAY_NODE_HOST}"
	else
		SAFE_HOST="$(printf '%s' "$NOCTIS_GATEWAY_NODE_HOST" | tr -c 'A-Za-z0-9' '_' | tr 'A-Z' 'a-z')"
		NOCTIS_GATEWAY_NODE_NAME="${NODE_BASE_NAME}_${SAFE_HOST}"
	fi
	export NOCTIS_GATEWAY_NODE_NAME
fi

if [ "$NOCTIS_GATEWAY_NODE_FLAG" = "-sname" ]; then
	case "$NOCTIS_GATEWAY_NODE_NAME" in
		*@*)
			echo "NOCTIS_GATEWAY_NODE_NAME must not include '@' when using -sname." >&2
			exit 64
			;;
	esac
fi

exec /opt/noctis_gateway/bin/noctis_gateway foreground
