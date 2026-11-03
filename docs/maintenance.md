# Profile maintenance

Run `node scripts/build.mjs` to rebuild the native README and stone navigation plaques. Run `node --test` for the content and asset checks. Introductory and optional personal copy remain comments in the generator until supplied.

The banner uses the approved artwork in `art/scene.png` and weather in `art/weather.js`. To export it again, make Playwright available to Node, install its Edge browser, and put FFmpeg on PATH; run `node scripts/render-art.cjs`. The export is 830 × 361, 12 fps, with a four-second loop and an 8 MB limit. Daily project refreshes do not render artwork.

GitHub cannot run the original canvas or project-selection script. The README uses a GIF, a static PNG selected for reduced motion, stone SVG navigation links, native headings and expandable project descriptions. Essential copy is readable without images. GitHub also provides animated-image autoplay controls in its accessibility settings. The fixed image palette and loop boundary are limits of this adaptation.

The three featured descriptions are maintained in `scripts/build.mjs`; project links point to their GitHub repositories. No third-party metrics service or personal contact destination is required.
