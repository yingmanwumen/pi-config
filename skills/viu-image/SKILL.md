---
name: viu-image
description: Display or preview image files in a separate terminal window with viu. Use when the user asks to show an image in a terminal.
---

# viu-image

1. Check that `viu` is available.
2. If unavailable, state this and offer `cargo install viu`. If Cargo is unavailable, offer the platform's package-manager command instead. Do not install without request.
3. Detect the platform's configured or available terminal launcher.
4. Open a new terminal window and run `viu <image-path>`, keeping the window open.
5. If no terminal launcher is available, report this and offer `viu <image-path>` for the user to run directly.
