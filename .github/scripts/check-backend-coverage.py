#!/usr/bin/env python3
import json
import sys

if len(sys.argv) != 3:
    print(
        "Usage: check-backend-coverage.py <baseline.json> <current.json>",
        file=sys.stderr,
    )
    sys.exit(1)

baseline_path, current_path = sys.argv[1], sys.argv[2]

try:
    with open(baseline_path) as f:
        baseline_pct = json.load(f)["totals"]["percent_covered"]
except FileNotFoundError:
    print(f"No baseline found at {baseline_path} — skipping regression check.")
    sys.exit(0)

with open(current_path) as f:
    current_pct = json.load(f)["totals"]["percent_covered"]

delta = round(current_pct - baseline_pct, 2)
sign = "+" if delta >= 0 else ""
print(f"baseline={baseline_pct:.2f}%  current={current_pct:.2f}%  delta={sign}{delta}%")

if current_pct < baseline_pct:
    print(
        f"\nCoverage regression: {baseline_pct:.2f}% → {current_pct:.2f}% ({delta}%)",
        file=sys.stderr,
    )
    sys.exit(1)

print("\nNo coverage regression.")
