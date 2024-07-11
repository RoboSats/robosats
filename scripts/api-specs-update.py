#!/usr/bin/env python3

"""Update the latest api specs file from a running django server"""

import sys

import urllib.request
import urllib.error


try:
    urllib.request.urlretrieve(
        "http://127.0.0.1:8000/api/schema", "docs/assets/schemas/api-latest.yaml"
    )
except urllib.error.URLError as e:
    print(f"Could not fetch latests API specs: {e}", file=sys.stderr)
    print("Make sure that the django server is running", file=sys.stderr)
    sys.exit(1)

print("Api specs successfully updated")
