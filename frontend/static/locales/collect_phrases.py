"""
This script looks for any t('phrase') in every frontend source files .src/
extracts the strings into a new dictionary (en.json), and updates every other
locale dictionary by matching existing translations.
"""

import json
import os
import re

from handcrafted import phrases

prefix = r"[^a-zA-Z]t\s*\(\s*\'"
suffix = r"(?:\'\,\s*\)|\'\,*\)|\'\)|\'\,\s*\{)"
match = r"(.*?[a-zA-Z].*?)"
pattern = f"{prefix}{match}{suffix}"

extensions = [".ts", ".tsx", ".js", "jsx"]
strings_dict = {}
counter = 1

# Look for all matching i18n keys
for root, dirs, files in os.walk("../../src"):
    for file in files:
        if file.endswith(tuple(extensions)):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                contents = f.read()
                matches = re.findall(pattern, contents)
                if len(matches) > 0:
                    strings_dict[f"#{counter}"] = f"Phrases in {filepath[10:]}"
                    counter += 1
                for match in matches:
                    strings_dict[match] = match

# Load existing locale dics and replace keys
locales = [f for f in os.listdir(".") if f.endswith(".json")]
all_phrases = {**strings_dict, **phrases}
for locale in locales:
    new_phrases = {}
    with open(locale, "r", encoding="utf-8") as f:
        old_phrases = json.load(f)
        for key in all_phrases:
            # update dictionary with new keys on /src/
            if key in old_phrases:
                new_phrases[key] = old_phrases[key]
            else:
                new_phrases[key] = all_phrases[key]

    with open(locale, "w", encoding="utf-8") as f:
        json.dump(new_phrases, f, ensure_ascii=False)

with open("./collected_phrases.json", "w", encoding="utf-8") as f:
    json.dump(all_phrases, f, ensure_ascii=False)
