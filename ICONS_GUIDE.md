# PWA Icons Guide

## Icon Requirements

You need to create 3 icon files and place them in the `public` folder:

1. **icon-192.png** (192x192 pixels)
2. **icon-512.png** (512x512 pixels)
3. **icon-maskable-512.png** (512x512 pixels with safe zone padding)

## Design Guidelines

### Basic Requirements
- **Square format**: All icons must be square (1:1 aspect ratio)
- **Format**: PNG with transparency
- **Colors**: Use your brand colors (purple-indigo gradient #667eea to #764ba2)

### Design Recommendations
- Keep the design simple and recognizable at small sizes
- Use a play button symbol integrated with a book or graduation cap
- For the maskable icon, keep important elements within the center 80% (safe zone)
- Avoid fine details that won't be visible when scaled down

## Creating Icons

### Option 1: Online Tools
- **Figma/Canva**: Design your icon and export as PNG
- **PWA Builder Image Generator**: https://www.pwabuilder.com/imageGenerator
- **RealFaviconGenerator**: https://realfavicongenerator.net/

### Option 2: Using Your Existing Logo
If you have a logo:
1. Resize to 512x512 pixels
2. Add appropriate padding
3. Export as PNG
4. Create 192x192 version by resizing

### Maskable Icon
For the maskable version:
- Add 20% padding on all sides
- Center your logo/design
- Fill the background with your brand color
- This ensures it looks good with any mask shape (circle, rounded square, etc.)

## Quick Start (Temporary Placeholder)

For testing purposes, you can use a solid color square:
1. Create a 512x512 PNG with purple background
2. Add a white play triangle in the center
3. Save as all 3 required names
4. The app will work, but replace with professional icons later

## Verification

After adding icons:
1. Open Chrome DevTools → Application → Manifest
2. Verify all 3 icons are listed and load correctly
3. Check for any console errors
4. Test installation on mobile/desktop
