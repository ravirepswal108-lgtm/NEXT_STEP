# NEXT STEP - Interactive Election Guide

A modern, accessible, and performant web application that helps users understand election timelines, voting steps, and common questions. Built with a focus on code quality, security, accessibility, and performance.

## Features

- **Interactive Ballot Builder** - Practice voting with a mock ballot that saves selections locally
- **Candidate Comparison** - Side-by-side comparison of candidates on key issues
- **Election Timeline** - Visual timeline of election phases with filtering
- **Step-by-Step Checklist** - Track your progress through the election process
- **AI-Powered Chatbot** - Get answers to election questions with Wikipedia integration
- **Accessibility Tools** - Read aloud, simple English mode, multi-language support
- **Offline Support** - Service worker for offline functionality
- **Dark Mode** - Automatic dark mode based on system preferences

## Project Structure

```
NEXT_STEP/
├── index.html          # Home page with guided assistant
├── ballot.html         # Mock ballot builder
├── candidates.html     # Candidate comparison matrix
├── logistics.html      # Polling station finder
├── timeline.html       # Election timeline visualization
├── steps.html          # Step-by-step checklist
├── faq.html            # Frequently asked questions
├── help.html           # Help and support page
├── styles.css          # Main stylesheet with dark mode
├── script.js           # Main JavaScript with utilities
├── sw.js               # Service worker for offline support
├── manifest.json       # PWA manifest
├── tests.js            # Comprehensive test suite
├── .htaccess           # Security headers and caching
├── robots.txt          # SEO robots configuration
└── README.md           # This file
```

## Code Quality

### JavaScript Best Practices
- `'use strict'` mode enabled
- Debounce and throttle utilities for performance
- Input sanitization to prevent XSS attacks
- Safe JSON parsing with error handling
- Comprehensive error handling throughout
- Modular function design

### CSS Best Practices
- CSS custom properties for theming
- Dark mode support via `prefers-color-scheme`
- Reduced motion support via `prefers-reduced-motion`
- Print styles for better printing
- Mobile-first responsive design
- Efficient selectors and animations

### HTML Best Practices
- Semantic HTML5 elements
- ARIA landmarks and roles
- Skip navigation links
- Proper heading hierarchy
- Form labels and associations
- Meta tags for SEO and social sharing

## Security Features

### Content Security Policy
- Restricts script sources
- Prevents inline script execution
- Controls frame embedding
- Limits external connections

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HSTS)
- `Permissions-Policy` for feature restrictions

### Input Validation
- ZIP code validation with regex
- HTML sanitization for user content
- Safe URL construction
- External link security (`rel="noopener noreferrer"`)

## Accessibility (WCAG 2.1 AA)

### Implemented Features
- Skip navigation link
- ARIA landmarks (banner, main, navigation, contentinfo)
- ARIA labels and descriptions
- Focus management and visible focus indicators
- Keyboard navigation support
- Screen reader announcements (`aria-live`)
- Color contrast compliance
- Reduced motion support
- Read aloud functionality
- Simple English mode
- Multi-language support

### Testing
Run the accessibility tests in browser console:
```javascript
// Load tests
const script = document.createElement('script');
script.src = 'tests.js';
document.head.appendChild(script);

// Run tests
runAllTests();
```

## Performance Optimizations

### Loading
- Deferred JavaScript loading
- Preconnect for external resources
- DNS prefetch for analytics
- Async script loading where appropriate

### Caching
- Service worker for offline support
- Cache-Control headers for static assets
- LocalStorage for user preferences
- SessionStorage for chat history

### Rendering
- CSS containment where applicable
- Efficient DOM queries
- Debounced event handlers
- Throttled scroll handlers

### Metrics Tracked
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

## SEO & Google Services

### Meta Tags
- Title and description
- Open Graph tags for Facebook
- Twitter Card tags
- Canonical URLs
- Robots meta directives

### Structured Data
- JSON-LD for WebApplication
- FAQPage schema
- BreadcrumbList (planned)

### Google Services Integration
- Google Analytics 4 (GA4)
- Google Search Console (via sitemap)
- Google Maps integration for logistics

## PWA Features

### Manifest
- App name and short name
- Theme and background colors
- Icon set for all sizes
- Display mode: standalone

### Service Worker
- Static asset caching
- Dynamic content caching
- Offline fallback
- Cache versioning

## Testing

### Test Categories
1. **Accessibility** - Skip links, ARIA, labels, contrast
2. **Performance** - Load time, DOM size, resources
3. **Security** - HTTPS, inline handlers, external links
4. **Functionality** - Navigation, forms, storage
5. **SEO** - Meta tags, structured data, canonical

### Running Tests
```javascript
// In browser console
runAllTests();
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Requirements
- HTTPS enabled
- Static file hosting
- Gzip/Brotli compression
- Cache headers configured

### Files to Configure
1. Update `manifest.json` with your app details
2. Replace `G-XXXXXXXXXX` in `script.js` with your GA4 ID
3. Update canonical URLs in all HTML files
4. Add your domain to `.htaccess`
5. Create icon files in `/icons/` directory

## Contributing

1. Follow existing code style
2. Add comments for complex logic
3. Test accessibility changes
4. Update tests for new features
5. Document new functionality

## License

This project is built for educational purposes as part of the Hack2Skill competition.

## Acknowledgments

- Wikipedia API for election information
- Zippopotam.us for ZIP code verification
- Google Fonts for typography
- Manrope font family

---

Built with ❤️ for making the election process easier to follow.
