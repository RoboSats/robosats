"""
This script looks for any t('phrase') in every frontend source files .src/
extracts the strings into a new dictionary (en.json), and updates every other
locale dictionary by matching existing translations.
"""

import json
import os
import re

prefix = r"[^a-zA-Z]t\s*\(\s*\'"
suffix = r"(?:\'\,\s*\)|\'\,*\)|\'\))"
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

# Load existing dics
locales = [f for f in os.listdir(".") if f.endswith(".json")]
for locale in locales:
    new_locale_dict = {}
    with open(locale, "r", encoding="utf-8") as f:
        old_locale_dict = json.load(f)
        for key in strings_dict:
            # update dictionary with new keys on /src/
            if key in old_locale_dict:
                new_locale_dict[key] = old_locale_dict[key]
            else:
                new_locale_dict[key] = strings_dict[key]

    with open(locale, "w", encoding="utf-8") as f:
        json.dump(new_locale_dict, f, ensure_ascii=False)

with open("./collected_phrases.json", "w", encoding="utf-8") as f:
    json.dump(strings_dict, f, ensure_ascii=False)
