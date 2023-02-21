# Contributing Translations to RoboSats
RoboSats is a way to exchange BTC for **any currency of the world**. As such, for many users this tool might only be useful if it is available in a language they can understand. Translating RoboSats into a new language is one of the most valuable contributions to the project, as it makes it available to new audience, increasing the reach of this cool freedom tool.

There isn't a lot of text in RoboSats, however it might be bst to split the work with another contributor. You can poll in the telegram community @RoboSats and find users willing to split the task.

## How to contribute a new translation.

Simply create a new translation file in `frontend/src/locales` (Same folder where you are reading these instructions). In `locales` there is a single file with a json dictionary for every language. In order to create a new translation, simply copy `en.json` (the master text) into a new file named after the language's [ISO 639 two character code](https://www.loc.gov/standards/iso639-2/php/English_list.php).

## Guidelines

Each language .json dictionary contains pairs of keys and values in the following format { "key1":"value1", "key2":"value2", ...}. Most keys are the literal English sentence. These simply have to be translated on the right side, for example, in order to translate the `Make Order` button to Spanish we edit the json file to look like this `{... "Make Order":"Crear Orden",...}`.

1. **Not all keys are explicit sentences.** Some keys are not the English senstence but a variable names e.g. "phone_unsafe_alert". In this case you must take a look at the value originally in `en.json`.

2. **The language dictionary has keys to identify the file the phrase was found on.** These keys are for reference and start with `#number` and name of file. These do not need to be translated.

3. **Try to keep a similar length to the original sentence.** In most cases it will be okay if the translation is shorter. However, translations that result in a higher character count might break the UI! It might not always be possible to stick to the length of the English sentence. In those cases the UI might have to be changed, contact the responsible person for such a change.

4. **Some sentences contain variables**, for example, {{currencyCode}}. It will insert the currency code where the variable is found. E.g., `"Pay 30 {{currencyCode}}"` will render as "Pay 30 USD".

5. **Some sentences contain HTML tags.** These tags are usually hyperlinks. For example in `{"phone_unsafe_alert": "Use <1>Tor Browser</1> and visit the <3>Onion</3> site."}` the children text of <1> (Tor Browser) will link to the Tor Download website, and the children of <3> will link to the RoboSats Onion site.

6. **It is best to translate from top to bottom of the .json file**. Some text is high priority, some other text is low priority.** Some keys are likely to change soon or they might not be so relevant for the user of the app. The translation files are sorted from top to bottom by the priority of the translation.

7. Use a **spell checker** ;)

8. **Understand the context, where will this string be displayed?** Literal translations might not work well in some languages. While in English the wording is always similar regardless of the position in the UI, in some languages it might be very different if you are translating a button (the user is taking an action) or if you are simply translating a tooltip. It might be clever to translate the strings while looking at the app. However, many strings can only be found while trading. The testnet RoboSats site is great for this use, as you can explore the whole app simply interacting with it with a testnet lightning wallet. However, if you cannot find where a string is displayed, it might be faster to simply write a message on the telegram group @robosats.

9. **Congratulate yourself!** Seriously, it's so awesome you are looking into building up freedom tools!!

## For Developers

After adding or edditing components with new phrases on `frontend/src/` make sure to run the script `cd frontend/static/locales/` `python3 collect_phrases.py` it will generate update all locales keeping existing values for already translated keys. If you have built complex translation keys using `<Trans></Trans>` add first the new key and values to `handcrafted.py`.