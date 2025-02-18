---
layout: single
title: "Develop RoboSats"
permalink: /contribute/code/
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/code.svg"/>Code'
  nav: contribute
toc: true
toc_sticky: true
src: "_pages/contribute/01-development.md"
---

Everyone can contribute to the development of the RoboSats open source project. If you're looking for somewhere to start contributing, then check out the issue list sharing the ["good first issue"](https://github.com/RoboSats/robosats/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+issue") label; such issues are good for newcomers.

This contributing guide is based on the [Bisq contributing guide](https://github.com/bisq-network/bisq/blob/master/CONTRIBUTING.md). Following best FOSS practices helps development remain organized as the project grows with new features and is continually optimized. Future contibutors will thank you for following these best practices and making your work easier to build on!

## Communication Channels

*!!! Beware of scammers impersonating RoboSats admins. Admins will NEVER privately message/call you.*

- **Simplex:**
  - [RoboSats Main Group](https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D). Got questions or a problem? Find community-driven support in the public SimpleX group chat. If you're wanting to hang out with other cool robots and learn more about RoboSats, then those discussions happen in SimpleX, Nostr, and Matrix group chats.
  - [RoboSats Development Group](https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F6iIcWT_dF2zN_w5xzZEY7HI2Prbh3ldP07YTyDexPjE%3D%40smp10.simplex.im%2FKEkNLMlgM8vrrU3xjBt5emS7EsP0c4s1%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEABehx7Tgefl_vvOGOe2SThJCGACKRgSU2wiUdIJ5bQHw%253D%26srv%3Drb2pbttocvnbrngnwziclp2f4ckjq65kebafws6g4hy22cdaiv5dwjqd.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22gFi-9hvL3XgXXTgnlZPyJw%3D%3D%22%7D). Main developer communication group chat where open and technical discussions about development takes place. Discussion about code changes happens in GitHub issues and pull requests (PRs).

- **Nostr:** [RoboSats General Group](https://chachi.chat/groups.0xchat.com/925b1aa20cd1b68dd9a0130e35808d66772fe082cf3f95294dd5755c7ea1ed59). Hang out with other cool robots and do not hesitate to ask questions about RoboSats! Also, the [RoboSats Nostr account](https://njump.me/npub1gdfr0r0an32jalqryqlvpn3gsef2hu832wv6kp5p2gt2aqa2n8yqd42ffw) provides important project updates, tips and tricks of using RoboSats, and other privacy-centric commentary. Questions and engagement are welcome. Keep in mind: problems requiring RoboSats staff support should be directed to the main SimpleX group chat instead, where responses are quicker and staff can further investigate your problem.


## Contributor Workflow

All RoboSats contributors submit changes via pull requests. The workflow is as follows:
 - Fork the repository
 - Create a topic branch from the `main` branch
 - Commit patches
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

[Check the current state of the Developer Compensated tasks in the Github Project](https://github.com/users/Reckless-Satoshi/projects/2/views/5)

At the moment, RoboSats is a young and unfunded project, but has shown the ability to generate enough revenue to barely cover operational costs. A developer compensation program is the best way to ensure the sustained support of the code base. For the time being, code contributions to the core project will be given small rewards more akin to a tip than a meaningful monetary compensation. The pilot procedure for compensated development:

1. The developer opens a PR with the description of the work that will be done, optionally including the amount of Sats he thinks the work deserves.
2. An offer/negotiation takes place to set an amount of Sats until agreed upon. Everyone is welcome to express opinion on whether the compensation is right for the PR.
3. The work happens: buidl, buidl, buidl!
4. The review takes place. Once maintainers give the OK for the merge...
5. The developer submits an LN invoice (with a long expiration time). The invoice is paid at merge.

Every step (negotiation, code submission, review and invoice submission) must take place publicly in GitHub (i.e., no private messaging and the like). Please contact the team lead for development (@reckless-satoshi) upfront if you have doubts whether your contribution is suitable for compensation. Currently, only contributions to the frontend or backend core functionality and maintainence are eligible for compensations (for the time being, that excludes: art, translations, etc.).

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

### Mirros
- https://git.robosats.org/Robosats
- https://codeberg.org/Robosats
