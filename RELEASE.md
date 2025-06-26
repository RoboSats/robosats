Every new version always follows these steps in order:

1. Create a Pull Request upgrading JS packages, mobile version count and the release template (ie. https://github.com/RoboSats/robosats/pull/2015)
2. Merge to main and add a new tag to the commit following our versioning structure: https://github.com/RoboSats/robosats/blob/main/.github/workflows/release.yml#L7
3. Monitor the triggered action until it's done. A new release draft will be created.
4. Fill the missing points in the release description.
5. Sign with PGP all the assets and upload their signatures.
6. Usually, Coordinators are prompted to upgrade before publishing the new release.
7. Mark the release as the latest and publish.
8. Every day at 19:00 GMT IzzyDroid checks automatically for new releases and download it to their repositories.
9. Announce the new version to Zapstore from `/mobile/android` by running `zapstore publish robosats`
9. SSH into the main server
10. Go to `/docs` and run `docker compose build && docker compose up -d`
11. Go to `/frontend` and run `npm run build`, that will generate 2 main files (`basic.html` and `pro.html`) and the `/static` folder in 2 different folders: `/nodeapp` and `/web`
12. Now `/nodeapp` should display the new version in the unsafe webapp and `/web` in the onion webapp
