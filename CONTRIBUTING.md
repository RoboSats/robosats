# Contributing to Robosats

Anyone is welcome to contribute to Robosats. If you're looking for somewhere to start contributing, check out the [good first issue](https://github.com/reckless-satoshi/robosats/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+issue") list.


This contributing guide is based on the [Bisq contributing guide](https://github.com/bisq-network/bisq/blob/master/CONTRIBUTING.md). While the scope and complexity of RoboSats is more managable, following best practices is free.

## Communication Channels

Most communication about RoboSats happens on the main Telegram group. However public community driven support is available in other languages.
* EN [t.me/robosats](https://t.me/robosats) (main)
* ES [t.me/robosats_es](https://t.me/robosats_es)
* RU [t.me/robosats_ru](https://t.me/robosats_ru)
* PT [t.me/robosats_pt](https://t.me/robosats_pt)
* CN [t.me/robosats_cn](https://t.me/robosats_cn)

Discussion about code changes happens in GitHub issues and pull requests.


## Contributor Workflow

All RoboSats contributors submit changes via pull requests. The workflow is as follows:

 - Fork the repository
 - Create a topic branch from the `main` branch
 - Commit patches
 - Run formatter if the frontend was changed: `npm run format`
 - Squash redundant or unnecessary commits
 - Submit a pull request from your topic branch back to the `main` branch of the main repository
 - Make changes to the pull request if reviewers request them and request a re-review

Pull requests should be focused on a single change. Do not mix, for example, refactorings with a bug fix or implementation of a new feature. This practice makes it easier for fellow contributors to review each pull request.


## Reviewing Pull Requests

Robosats follows the review workflow established by the Bitcoin Core project. The following is adapted from the [Bitcoin Core contributor documentation](https://github.com/bitcoin/bitcoin/blob/master/CONTRIBUTING.md#peer-review):

Anyone may participate in peer review which is expressed by comments in the pull request. Typically reviewers will review the code for obvious errors, as well as test out the patch set and opine on the technical merits of the patch. Project maintainers take into account the peer review when determining if there is consensus to merge a pull request (remember that discussions may have been spread out over GitHub and Telegram). The following language is used within pull-request comments:

 - `ACK` means "I have tested the code and I agree it should be merged";
 - `NACK` means "I disagree this should be merged", and must be accompanied by sound technical justification. NACKs without accompanying reasoning may be disregarded;
 - `utACK` means "I have not tested the code, but I have reviewed it and it looks OK, I agree it can be merged";
 - `Concept ACK` means "I agree in the general principle of this pull request";
 - `Nit` refers to trivial, often non-blocking issues.

Please note that Pull Requests marked `NACK` and/or GitHub's `Change requested` are closed after 30 days if not addressed.

## Developer Compensation (Pilot Program)

At the moment RoboSats is a young and unfunded project. However, since launch, it has shown the ability to generate revenue, although it barely covers the running costs. A developer compensation program is the the best way to ensure the sustained support of the code base. For the time being, code contributions to the core project will be given small rewards: more akin to kudos than a meaningful monetary compensation. The pilot procedure for compensated development:

1) The developer opens a PR with the description of the work that will be done, optionally including the amount of Sats he thinks the work deserves.
2) An offer/negotiation takes place to set an amount of Sats until agreement. Everyone is welcome to express opinion on whether the compensation is right for the PR.
3) The work happens: buidl, buidl, buidl!
4) The review takes place. Once maintainers give the OK for the merge...
5) The developer submits a LN invoice (with a long expiration time). The invoice is paid at merge. 

Every step (negotiation, code submission, review and invoice submission) must take place publicly in GitHub (i.e., no private messaging). Please contact the team lead for development (@reckless-satoshi) upfront if you have doubts whether your contribution is suitable for compensation. Currently, only contributions to the frontend or backend core functionality and maintainence are eligible for compensations (that excludes, for the time being, art, translations, etc...).

## Style and Coding Conventions

### Configure Git user name and email metadata

See https://help.github.com/articles/setting-your-username-in-git/ for instructions.

### Write well-formed commit messages

From https://chris.beams.io/posts/git-commit/#seven-rules:

 1. Separate subject from body with a blank line
 2. Limit the subject line to 50 characters (*)
 3. Capitalize the subject line
 4. Do not end the subject line with a period
 5. Use the imperative mood in the subject line
 6. Wrap the body at 72 characters (*)
 7. Use the body to explain what and why vs. how


### Sign your commits with GPG

See https://github.com/blog/2144-gpg-signature-verification for background and
https://help.github.com/articles/signing-commits-with-gpg/ for instructions.

### Use an editor that supports Editorconfig

The [.editorconfig](.editorconfig) settings in this repository ensure consistent management of whitespace. Most modern editors support it natively or with plugin. See http://editorconfig.org for details.

### Keep the git history clean

It's very important to keep the git history clear, light and easily browsable. This means contributors must make sure their pull requests include only meaningful commits (if they are redundant or were added after a review, they should be removed) and _no merge commits_.
