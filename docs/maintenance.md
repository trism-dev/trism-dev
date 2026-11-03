# Profile maintenance

Run `node scripts/build.mjs` to rebuild the native README and stone navigation plaques. Run `node --test` for the content and asset checks. Introductory and optional personal copy remain comments in the generator until supplied.

The banner uses the approved artwork in `art/scene.png` and weather in `art/weather.js`. To export it again, make Playwright available to Node, install its Edge browser, and put FFmpeg on PATH; run `node scripts/render-art.cjs`. The export is 830 × 361, 12 fps, with a four-second loop and an 8 MB limit. Daily project refreshes do not render artwork.

GitHub cannot run the original canvas or project-selection script. The README uses a GIF, a static PNG selected for reduced motion, stone SVG navigation links, native headings and expandable project descriptions. Essential copy is readable without images. GitHub also provides animated-image autoplay controls in its accessibility settings. The fixed image palette and loop boundary are limits of this adaptation.

The three featured descriptions are maintained in `scripts/build.mjs`; project links point to their GitHub repositories. No third-party metrics service or personal contact destination is required.

## Latest projects

Run `node scripts/refresh.mjs` for a complete public repository scan. The generator fetches all pages from GitHub's public user-repositories endpoint, validates links and metadata, and escapes public descriptions. It shows up to three public owned repositories, excluding forks, archived repositories, this profile and `lore-tool-pages`. Featured projects remain eligible. Missing descriptions are omitted rather than invented.

`data/discovery.json` records repository IDs and first public discovery timestamps. The initial seed uses creation dates. Later discoveries use the scan time, allowing older repositories made public to lead the list. Renames, pushes and visibility toggles do not reset discovery. History is retained by ID while only currently eligible public repositories appear. A failed or incomplete scan changes neither registry nor README; an unchanged result makes no commit.

The Profile workflow runs checks on pull requests and relevant source pushes. On main it refreshes after relevant pushes, on manual dispatch, and daily at 09:17 UTC. Only the refresh job has content-write permission, and its commit is limited to `README.md` and `data/discovery.json`. No PAT, external scheduler or keepalive is used. GitHub may delay scheduled runs and disables scheduled workflows after 60 days without repository activity; re-enable the workflow and run it manually if needed.

Sources: [public repository API](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user), [scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [workflow inactivity](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows), [image motion preferences](https://docs.github.com/en/account-and-profile/how-tos/account-settings/managing-accessibility-settings).
