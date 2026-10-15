# CREATE — My Five Gifts · Olesia Dmytrush

A black-and-gold interactive portfolio presenting my five gifts: Resilience, Creativity, Connection, Problem-Solving and Leadership.

## Features

- **Hero:** my avatar portrait in a golden frame. It tilts gently with the mouse, and the five gifts sit around it.
- **Golden streams (WebGL, Three.js):** when the page opens, five streams of gold particles flow from the portrait to the five gifts, and each gift lights up as its stream arrives. After that, a single stream revisits one gift every few seconds. Gold dust floats across the page. **Replay animation** and **Pause** buttons control the effect.
- **Five gift cards:** each shows an image, number, title and short description. Select a card to open it and see its 2 jobs and 5 growth actions; select it again or press Esc to close it. There are also **Open all** and **Close all** buttons, and selecting a gift next to the portrait jumps to its card and opens it.
- **Reduce motion:** a button in the header turns all animations off. The site also follows the device's reduced-motion setting.
- Responsive layout for desktop, tablet and phone.

## Files

Every file sits in one folder (there are no subfolders), so you can upload everything to GitHub at once.

```
index.html            the website
style.css             design
main.js               page interactions
fx.js                 golden streams and gold dust (WebGL)
three.module.min.js   Three.js r169 library (MIT license, see three.LICENSE.txt)
avatar.webp           my avatar portrait
gift-1.webp … gift-5.webp   the five gift illustrations
og-image.jpg          preview image used when the link is shared
favicon.svg           browser tab icon
.nojekyll             tells GitHub Pages to serve the files as they are
```

## Publish on GitHub Pages

1. Open `https://github.com/odmytrush28/GIFT-NEW/upload/main`.
2. Select **choose your files**, open this folder, press **Ctrl + A** to select every file, then select **Open**.
3. Select **Commit changes**.
4. Go to **Settings → Pages**. Under Source choose **Deploy from a branch**, then choose **main** and **/(root)**, and select **Save**.
5. Wait 1–2 minutes, then open https://odmytrush28.github.io/GIFT-NEW/

## Preview on your computer

You can double-click `index.html` to open it, but the browser blocks the golden streams when a page is opened as a file. To see everything, run `python -m http.server 8000` in this folder and open http://localhost:8000.
