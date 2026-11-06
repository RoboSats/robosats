#!/bin/sh
set -u

failures=0

fail() {
    echo "ERROR: $1"
    failures=$((failures + 1))
}

NODEAPP_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
NGINX_CONF="$NODEAPP_DIR/nginx.conf"
CLIENT_SH="$NODEAPP_DIR/robosats-client.sh"
COORDS_DIR="$NODEAPP_DIR/coordinators"
FEDERATION_JSON="$NODEAPP_DIR/../frontend/static/federation.json"

for required_file in "$NGINX_CONF" "$CLIENT_SH" "$FEDERATION_JSON"; do
    if [ ! -f "$required_file" ]; then
        fail "required file missing: $required_file"
    fi
done
if [ ! -d "$COORDS_DIR" ]; then
    fail "coordinators directory missing: $COORDS_DIR"
fi

if [ "$failures" -gt 0 ]; then
    echo "nodeapp consistency check: FAILED ($failures error(s))"
    exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

strip_empty() {
    sed '/^$/d'
}

echo "=== nginx.conf includes vs coordinators/ directories ==="

declared_aliases=$(cd "$COORDS_DIR" && ls -d */ 2>/dev/null | sed 's|/$||' | sort | strip_empty)
printf '%s\n' "$declared_aliases" | strip_empty | sort > "$TMP_DIR/declared_aliases"
if [ ! -s "$TMP_DIR/declared_aliases" ]; then
    fail "no coordinator directories found in $COORDS_DIR"
fi

grep -oE 'include /etc/nginx/conf\.d/[a-z0-9_]+/upstreams\.conf' "$NGINX_CONF" \
    | sed -E 's|include /etc/nginx/conf\.d/([a-z0-9_]+)/upstreams\.conf|\1|' \
    | sort > "$TMP_DIR/include_upstream_aliases"
grep -oE 'include /etc/nginx/conf\.d/[a-z0-9_]+/locations\.conf' "$NGINX_CONF" \
    | sed -E 's|include /etc/nginx/conf\.d/([a-z0-9_]+)/locations\.conf|\1|' \
    | sort > "$TMP_DIR/include_location_aliases"

for include_set in include_upstream_aliases include_location_aliases; do
    if ! diff "$TMP_DIR/$include_set" "$TMP_DIR/declared_aliases" > "$TMP_DIR/$include_set.diff"; then
        fail "nginx.conf $include_set includes do not match coordinators/ directories:" >&2
        sed 's/^/  /' "$TMP_DIR/$include_set.diff" >&2
    fi
    if [ "$(wc -l < "$TMP_DIR/$include_set")" -ne "$(sort -u "$TMP_DIR/$include_set" | wc -l)" ]; then
        fail "duplicate nginx.conf includes found for: $(sort "$TMP_DIR/$include_set" | uniq -d | tr '\n' ' ')"
    fi
done

for alias_dir in $declared_aliases; do
    for conf_file in upstreams.conf locations.conf; do
        if [ ! -f "$COORDS_DIR/$alias_dir/$conf_file" ]; then
            fail "coordinator directory '$alias_dir' is missing $conf_file"
        fi
    done
done

echo "=== robosats-client.sh socat bridges ==="

grep -oE '^[a-z0-9]+_[a-z0-9]+_socat=' "$CLIENT_SH" | sed 's/=$//' | sort -u > "$TMP_DIR/socat_defined"
run_line=$(grep -vE '^[[:space:]]*(#|$)' "$CLIENT_SH" | tail -n 1)
printf '%s\n' "$run_line" | grep -oE '\$[a-z0-9]+_[a-z0-9]+_socat' | sed 's/^\$//' | sort -u > "$TMP_DIR/socat_launched"

if [ ! -s "$TMP_DIR/socat_defined" ]; then
    fail "no socat bridge variables defined in robosats-client.sh"
fi
if [ ! -s "$TMP_DIR/socat_launched" ]; then
    fail "no socat bridges launched in the final run line of robosats-client.sh"
fi

if ! diff "$TMP_DIR/socat_defined" "$TMP_DIR/socat_launched" > "$TMP_DIR/socat.diff"; then
    fail "socat bridges defined vs launched in robosats-client.sh do not match:" >&2
    sed 's/^/  /' "$TMP_DIR/socat.diff" >&2
    echo "  (< defined but never launched, > launched but never defined)" >&2
fi

echo "=== socat ports vs upstreams.conf ==="

grep -oE '^[a-z0-9]+_[a-z0-9]+_port=[0-9]+' "$CLIENT_SH" > "$TMP_DIR/port_lines"
if [ ! -s "$TMP_DIR/port_lines" ]; then
    fail "no socat port variables defined in robosats-client.sh"
fi

duplicate_ports=$(cut -d= -f2 "$TMP_DIR/port_lines" | sort | uniq -d)
if [ -n "$duplicate_ports" ]; then
    fail "duplicate socat ports assigned to multiple coordinators: $(echo "$duplicate_ports" | tr '\n' ' ')"
fi

while IFS= read -r port_line; do
    net=${port_line%%_*}
    rest=${port_line#*_}
    alias=${rest%%_port=*}
    port=${rest#*_port=}
    if [ ! -f "$COORDS_DIR/$alias/upstreams.conf" ]; then
        fail "robosats-client.sh defines ${net}_${alias}_port but coordinators/$alias/upstreams.conf does not exist"
        continue
    fi
    actual_port=$(sed -n "/upstream ${net}_${alias} {/,/^}/ s/.*server 127\.0\.0\.1:\([0-9][0-9]*\);.*/\1/p" "$COORDS_DIR/$alias/upstreams.conf")
    if [ "$actual_port" != "$port" ]; then
        fail "port mismatch for $net/$alias: robosats-client.sh socat listens on $port but upstreams.conf declares '$actual_port'"
    fi
done < "$TMP_DIR/port_lines"

echo "=== upstream names vs proxy_pass per coordinator ==="

for alias_dir in $declared_aliases; do
    upstreams_file="$COORDS_DIR/$alias_dir/upstreams.conf"
    locations_file="$COORDS_DIR/$alias_dir/locations.conf"
    [ -f "$upstreams_file" ] && [ -f "$locations_file" ] || continue
    grep -oE 'upstream (mainnet|testnet)_[a-z0-9]+' "$upstreams_file" | awk '{print $2}' | sort -u > "$TMP_DIR/upstream_defined"
    grep -oE 'proxy_pass http://(mainnet|testnet)_[a-z0-9]+' "$locations_file" | sed 's|proxy_pass http://||' | sort -u > "$TMP_DIR/upstream_used"
    if [ ! -s "$TMP_DIR/upstream_defined" ]; then
        fail "coordinators/$alias_dir/upstreams.conf defines no upstream blocks"
    fi
    if [ ! -s "$TMP_DIR/upstream_used" ]; then
        fail "coordinators/$alias_dir/locations.conf references no upstreams via proxy_pass"
    fi
    if ! diff "$TMP_DIR/upstream_defined" "$TMP_DIR/upstream_used" > "$TMP_DIR/upstream.diff"; then
        fail "upstream names vs proxy_pass mismatch in coordinators/$alias_dir/:" >&2
        sed 's/^/  /' "$TMP_DIR/upstream.diff" >&2
        echo "  (< defined in upstreams.conf, > used in locations.conf)" >&2
    fi
done

echo "=== federation.json shortAlias vs coordinators/ directories ==="

grep -oE '"shortAlias"[[:space:]]*:[[:space:]]*"[^"]+"' "$FEDERATION_JSON" \
    | sed -E 's/"shortAlias"[[:space:]]*:[[:space:]]*"([^"]+)"/\1/' \
    | sort > "$TMP_DIR/federation_aliases"
if [ ! -s "$TMP_DIR/federation_aliases" ]; then
    fail "no shortAlias entries found in $FEDERATION_JSON"
fi

if ! diff "$TMP_DIR/federation_aliases" "$TMP_DIR/declared_aliases" > "$TMP_DIR/federation.diff"; then
    fail "federation.json shortAlias set does not match coordinators/ directories:" >&2
    sed 's/^/  /' "$TMP_DIR/federation.diff" >&2
    echo "  (< in federation.json only, > in coordinators/ only)" >&2
fi

echo "=== robosats-client.sh shell syntax ==="

if ! sh -n "$CLIENT_SH"; then
    fail "robosats-client.sh has a shell syntax error"
fi

if [ "$failures" -eq 0 ]; then
    echo "nodeapp consistency check: PASSED"
    exit 0
fi
echo "nodeapp consistency check: FAILED ($failures error(s))"
exit 1
