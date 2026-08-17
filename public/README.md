# Public Assets Folder

This folder contains static assets that are served directly without bundling. Place your website icons, logos, and other static files here.

## Folder Structure

### `/icons`
Store favicon and other icon files here:
- `favicon.ico` - Main favicon
- `favicon-16x16.png` - Small favicon
- `favicon-32x32.png` - Standard favicon
- `apple-touch-icon.png` - Apple touch icon for iOS
- `android-chrome-icon.png` - Android chrome icon

### `/logos`
Store SmartMenu logos and branding assets:
- `logo-dark.png` - Dark version logo
- `logo-light.png` - Light version logo
- `logo-color.png` - Full color logo
- `smartmenu-horizontal.png` - Horizontal layout logo
- `smartmenu-vertical.png` - Vertical layout logo

## Usage

In your HTML head tag, reference the favicon:
```html
<link rel="icon" type="image/x-icon" href="/icons/favicon.ico" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

In your React/Vue/etc components, reference logos:
```jsx
<img src="/logos/logo-color.png" alt="SmartMenu Logo" />
```

## Notes

- Files in the `/public` folder are served at the root path (`/`)
- These files are NOT processed by the bundler
- Use this folder for assets that don't need bundling (favicons, static images, etc.)
- For assets that need bundling/optimization, use the `/assets` or `/src` folder instead
