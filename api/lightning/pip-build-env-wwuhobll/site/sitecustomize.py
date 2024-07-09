import os
import site
import sys

# First, drop system-sites related paths.
original_sys_path = sys.path[:]
known_paths = set()
for path in {"/usr/local/lib/python3.12/site-packages"}:
    site.addsitedir(path, known_paths=known_paths)
system_paths = set(
    os.path.normcase(path) for path in sys.path[len(original_sys_path) :]
)
original_sys_path = [
    path for path in original_sys_path if os.path.normcase(path) not in system_paths
]
sys.path = original_sys_path

# Second, add lib directories.
# ensuring .pth file are processed.
for path in [
    "/tmp/pip-build-env-wwuhobll/overlay/lib/python3.12/site-packages",
    "/tmp/pip-build-env-wwuhobll/normal/lib/python3.12/site-packages",
]:
    assert path not in sys.path
    site.addsitedir(path)
