"""
This script looks for any t('phrase') in every frontend source files .src/
extracts the strings into a new dictionary (en.json), and updates every other
locale dictionary by matching existing translations.
"""

import json
import os
import re
from collections import OrderedDict

from handcrafted import phrases

prefix = r"[^a-zA-Z]t\s*\(\s*\'"
suffix = r"(?:\'\,\s*\)|\'\,*\)|\'\)|\'\,\s*\{)"
match = r"(.*?[a-zA-Z].*?)"
pattern = f"{prefix}{match}{suffix}"

extensions = [".ts", ".tsx", ".js", "jsx"]
strings_dict = OrderedDict()
src_path = "../../src"
counter = 1

# Look for all matching i18n keys in src_path
for root, dirs, files in os.walk(src_path):
    dirs.sort()
    files.sort()
    for file in files:
        if file.endswith(tuple(extensions)):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                contents = f.read()
                matches = sorted(re.findall(pattern, contents))
                if len(matches) > 0:
                    rel_filepath_in_src = os.path.relpath(filepath, src_path)
                    strings_dict[f"#{counter}"] = f"Phrases in {rel_filepath_in_src}"
                    counter += 1
                    for match in matches:
                        strings_dict[match] = match

all_phrases = OrderedDict()
all_phrases.update(strings_dict)
all_phrases.update(phrases)

# Load existing locale dics and replace keys
locales = [f for f in os.listdir(".") if f.endswith(".json")]
for locale in locales:
    new_phrases = OrderedDict()
    with open(locale, "r", encoding="utf-8") as f:
        old_phrases = json.load(f, object_pairs_hook=OrderedDict)
        for key in all_phrases.keys():
            # update dictionary with new keys on /src/, but ignore the counter of files keys
            if key in old_phrases and not re.match(r"^#\d+$", key):
                new_phrases[key] = old_phrases[key]
            else:
                new_phrases[key] = all_phrases[key]

    # don't change the file if there aren't new keys (order matters)
    if new_phrases != old_phrases:
        with open(locale, "w", encoding="utf-8") as f:
            json.dump(new_phrases, f, ensure_ascii=False)

with open("./collected_phrases.json", "w", encoding="utf-8") as f:
    json.dump(all_phrases, f, ensure_ascii=False)
