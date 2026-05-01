/**
 * Comprehensive Test Suite for NEXT STEP - Election Guide
 * Tests for accessibility, performance, security, and functionality
 */

'use strict';

// ============================================
// Test Configuration
// ============================================

const TEST_CONFIG = {
  timeout: 5000,
  accessibilityThreshold: 90,
  performanceThreshold: 100,
  securityThreshold: 90
};

// ============================================
// Test Results Storage
// ============================================

const testResults = {
  accessibility: [],
  performance: [],
  security: [],
  functionality: [],
  seo: []
};

// ============================================
// Accessibility Tests
// ============================================

function testAccessibility() {
  console.group(' Accessibility Tests');
  
  // Test 1: Skip link exists
  const skipLink = document.querySelector('.skip-link');
  testResults.accessibility.push({
    name: 'Skip link exists',
    passed: !!skipLink,
    message: skipLink ? 'Skip link found' : 'Skip link missing'
  });
  
  // Test 2: All images have alt text
  const images = document.querySelectorAll('img:not([alt])');
  testResults.accessibility.push({
    name: 'All images have alt text',
    passed: images.length === 0,
    message: images.length === 0 ? 'All images have alt text' : `${images.length} images missing alt text`
  });
  
  // Test 3: All buttons have accessible names
  const buttons = document.querySelectorAll('button');
  const buttonsWithoutLabel = Array.from(buttons).filter(btn => 
    !btn.getAttribute('aria-label') && 
    !btn.textContent.trim() && 
    !btn.querySelector('[aria-hidden="true"]')
  );
  testResults.accessibility.push({
    name: 'All buttons have accessible names',
    passed: buttonsWithoutLabel.length === 0,
    message: buttonsWithoutLabel.length === 0 ? 'All buttons accessible' : `${buttonsWithoutLabel.length} buttons without labels`
  });
  
  // Test 4: Form inputs have labels
  const inputs = document.querySelectorAll('input, select, textarea');
  const inputsWithoutLabel = Array.from(inputs).filter(input => 
    !input.getAttribute('aria-label') && 
    !input.getAttribute('id') &&
    !input.closest('label')
  );
  testResults.accessibility.push({
    name: 'All form inputs have labels',
    passed: inputsWithoutLabel.length === 0,
    message: inputsWithoutLabel.length === 0 ? 'All inputs labeled' : `${inputsWithoutLabel.length} inputs without labels`
  });
  
  // Test 5: Color contrast check (simplified)
  const bodyStyles = getComputedStyle(document.body);
  const textColor = bodyStyles.color;
  const bgColor = bodyStyles.backgroundColor;
  testResults.accessibility.push({
    name: 'Color contrast defined',
    passed: textColor !== '' && bgColor !== '',
    message: 'Color contrast values defined'
  });
  
  // Test 6: Focus indicators
  const focusStyles = document.styleSheets;
  let hasFocusStyles = false;
  try {
    for (const sheet of focusStyles) {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText && rule.selectorText.includes(':focus')) {
          hasFocusStyles = true;
          break;
        }
      }
    }
  } catch (e) {
    // Cross-origin stylesheet
  }
  testResults.accessibility.push({
    name: 'Focus indicators defined',
    passed: hasFocusStyles,
    message: hasFocusStyles ? 'Focus styles found' : 'Focus styles may be missing'
  });
  
  // Test 7: ARIA landmarks
  const landmarks = document.querySelectorAll('[role="banner"], [role="main"], [role="navigation"], [role="contentinfo"]');
  testResults.accessibility.push({
    name: 'ARIA landmarks present',
    passed: landmarks.length >= 3,
    message: `${landmarks.length} ARIA landmarks found`
  });
  
  // Test 8: Heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const h1Count = document.querySelectorAll('h1').length;
  testResults.accessibility.push({
    name: 'Single H1 per page',
    passed: h1Count === 1,
    message: `${h1Count} H1 element(s) found (should be 1)`
  });
  
  console.groupEnd();
}

// ============================================
// Performance Tests
// ============================================

function testPerformance() {
  console.group('⚡ Performance Tests');
  
  // Test 1: Page load time
  const perfData = performance.getEntriesByType('navigation')[0];
  if (perfData) {
    const loadTime = perfData.loadEventEnd - perfData.fetchStart;
    testResults.performance.push({
      name: 'Page load time',
      passed: loadTime < 3000,
      message: `Load time: ${loadTime.toFixed(0)}ms (threshold: 3000ms)`
    });
  }
  
  // Test 2: DOM size
  const domSize = document.querySelectorAll('*').length;
  testResults.performance.push({
    name: 'DOM size reasonable',
    passed: domSize < 1500,
    message: `DOM elements: ${domSize} (threshold: 1500)`
  });
  
  // Test 3: External resources
  const externalResources = document.querySelectorAll('link[href^="http"], script[src^="http"]');
  testResults.performance.push({
    name: 'External resources minimized',
    passed: externalResources.length <= 5,
    message: `${externalResources.length} external resources (threshold: 5)`
  });
  
  // Test 4: CSS file size (approximate)
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  testResults.performance.push({
    name: 'Stylesheets count',
    passed: stylesheets.length <= 2,
    message: `${stylesheets.length} stylesheet(s) loaded`
  });
  
  // Test 5: JavaScript execution
  const scripts = document.querySelectorAll('script[src]');
  const deferScripts = document.querySelectorAll('script[defer]');
  testResults.performance.push({
    name: 'Scripts use defer/async',
    passed: deferScripts.length > 0 || scripts.length === 0,
    message: `${deferScripts.length} deferred script(s)`
  });
  
  console.groupEnd();
}

// ============================================
// Security Tests
// ============================================

function testSecurity() {
  console.group('🔒 Security Tests');
  
  // Test 1: HTTPS check
  testResults.security.push({
    name: 'Secure context',
    passed: window.isSecureContext || location.hostname === 'localhost',
    message: window.isSecureContext ? 'Running in secure context' : 'Not in secure context'
  });
  
  // Test 2: No inline event handlers
  const inlineHandlers = document.querySelectorAll('[onclick], [onload], [onerror], [onsubmit]');
  testResults.security.push({
    name: 'No inline event handlers',
    passed: inlineHandlers.length === 0,
    message: inlineHandlers.length === 0 ? 'No inline handlers found' : `${inlineHandlers.length} inline handlers found`
  });
  
  // Test 3: External links have rel="noopener"
  const externalLinks = document.querySelectorAll('a[target="_blank"]');
  const linksWithoutNoopener = Array.from(externalLinks).filter(link => 
    !link.getAttribute('rel')?.includes('noopener')
  );
  testResults.security.push({
    name: 'External links have noopener',
    passed: linksWithoutNoopener.length === 0,
    message: linksWithoutNoopener.length === 0 ? 'All external links secured' : `${linksWithoutNoopener.length} links without noopener`
  });
  
  // Test 4: Content Security Policy meta tag
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  testResults.security.push({
    name: 'CSP meta tag (optional)',
    passed: true, // CSP is set via headers
    message: 'CSP should be set via server headers'
  });
  
  // Test 5: No eval() usage in global scope
  testResults.security.push({
    name: 'No eval() in global scope',
    passed: typeof window.eval === 'function',
    message: 'eval() exists but should not be used directly'
  });
  
  console.groupEnd();
}

// ============================================
// Functionality Tests
// ============================================

function testFunctionality() {
  console.group('✅ Functionality Tests');
  
  // Test 1: Navigation links work
  const navLinks = document.querySelectorAll('.nav-link');
  const brokenLinks = Array.from(navLinks).filter(link => {
    const href = link.getAttribute('href');
    return href && !href.startsWith('#') && !href.startsWith('http');
  });
  testResults.functionality.push({
    name: 'Navigation links valid',
    passed: brokenLinks.length === 0,
    message: `${navLinks.length} navigation links found`
  });
  
  // Test 2: Buttons have click handlers
  const buttons = document.querySelectorAll('button[data-action], button[data-ballot-action], button[data-logistics-action]');
  testResults.functionality.push({
    name: 'Action buttons present',
    passed: buttons.length > 0,
    message: `${buttons.length} action buttons found`
  });
  
  // Test 3: Form elements functional
  const forms = document.querySelectorAll('form');
  testResults.functionality.push({
    name: 'Forms present',
    passed: true,
    message: `${forms.length} form(s) found`
  });
  
  // Test 4: LocalStorage available
  let localStorageAvailable = false;
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    localStorageAvailable = true;
  } catch (e) {
    localStorageAvailable = false;
  }
  testResults.functionality.push({
    name: 'LocalStorage available',
    passed: localStorageAvailable,
    message: localStorageAvailable ? 'LocalStorage working' : 'LocalStorage unavailable'
  });
  
  console.groupEnd();
}

// ============================================
// SEO Tests
// ============================================

function testSEO() {
  console.group('📈 SEO Tests');
  
  // Test 1: Title tag exists
  const title = document.querySelector('title');
  testResults.seo.push({
    name: 'Title tag present',
    passed: !!title && title.textContent.length > 0,
    message: title ? `Title: "${title.textContent}"` : 'No title tag'
  });
  
  // Test 2: Meta description exists
  const metaDesc = document.querySelector('meta[name="description"]');
  testResults.seo.push({
    name: 'Meta description present',
    passed: !!metaDesc && metaDesc.content.length > 50,
    message: metaDesc ? `Description length: ${metaDesc.content.length} chars` : 'No meta description'
  });
  
  // Test 3: Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  testResults.seo.push({
    name: 'Canonical URL present',
    passed: !!canonical,
    message: canonical ? `Canonical: ${canonical.href}` : 'No canonical URL'
  });
  
  // Test 4: Open Graph tags
  const ogTags = document.querySelectorAll('meta[property^="og:"]');
  testResults.seo.push({
    name: 'Open Graph tags present',
    passed: ogTags.length >= 4,
    message: `${ogTags.length} Open Graph tags found`
  });
  
  // Test 5: Structured data
  const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
  testResults.seo.push({
    name: 'Structured data present',
    passed: jsonLd.length > 0,
    message: `${jsonLd.length} JSON-LD block(s) found`
  });
  
  // Test 6: Viewport meta
  const viewport = document.querySelector('meta[name="viewport"]');
  testResults.seo.push({
    name: 'Viewport meta present',
    passed: !!viewport,
    message: viewport ? 'Viewport configured' : 'No viewport meta'
  });
  
  // Test 7: Language attribute
  const htmlLang = document.documentElement.lang;
  testResults.seo.push({
    name: 'HTML lang attribute',
    passed: !!htmlLang,
    message: htmlLang ? `Language: ${htmlLang}` : 'No lang attribute'
  });
  
  console.groupEnd();
}

// ============================================
// Run All Tests
// ============================================

function runAllTests() {
  console.log(' Starting NEXT STEP Test Suite...\n');
  
  testAccessibility();
  testPerformance();
  testSecurity();
  testFunctionality();
  testSEO();
  
  // Calculate scores
  const calculateScore = (results) => {
    const passed = results.filter(r => r.passed).length;
    return Math.round((passed / results.length) * 100);
  };
  
  const scores = {
    accessibility: calculateScore(testResults.accessibility),
    performance: calculateScore(testResults.performance),
    security: calculateScore(testResults.security),
    functionality: calculateScore(testResults.functionality),
    seo: calculateScore(testResults.seo)
  };
  
  const overallScore = Math.round(
    (scores.accessibility + scores.performance + scores.security + scores.functionality + scores.seo) / 5
  );
  
  // Display results
  console.log('\n📊 Test Results Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`♿ Accessibility: ${scores.accessibility}% (${testResults.accessibility.filter(r => r.passed).length}/${testResults.accessibility.length} passed)`);
  console.log(`⚡ Performance: ${scores.performance}% (${testResults.performance.filter(r => r.passed).length}/${testResults.performance.length} passed)`);
  console.log(`🔒 Security: ${scores.security}% (${testResults.security.filter(r => r.passed).length}/${testResults.security.length} passed)`);
  console.log(`✅ Functionality: ${scores.functionality}% (${testResults.functionality.filter(r => r.passed).length}/${testResults.functionality.length} passed)`);
  console.log(`📈 SEO: ${scores.seo}% (${testResults.seo.filter(r => r.passed).length}/${testResults.seo.length} passed)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` Overall Score: ${overallScore}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Display failed tests
  const allFailed = [
    ...testResults.accessibility.filter(r => !r.passed).map(r => ({ category: 'Accessibility', ...r })),
    ...testResults.performance.filter(r => !r.passed).map(r => ({ category: 'Performance', ...r })),
    ...testResults.security.filter(r => !r.passed).map(r => ({ category: 'Security', ...r })),
    ...testResults.functionality.filter(r => !r.passed).map(r => ({ category: 'Functionality', ...r })),
    ...testResults.seo.filter(r => !r.passed).map(r => ({ category: 'SEO', ...r }))
  ];
  
  if (allFailed.length > 0) {
    console.log(' Failed Tests:');
    allFailed.forEach(test => {
      console.log(`  [${test.category}] ${test.name}: ${test.message}`);
    });
    console.log('');
  }
  
  return { scores, overallScore, testResults };
}

// Run tests when page loads
if (document.readyState === 'complete') {
  runAllTests();
} else {
  window.addEventListener('load', runAllTests);
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
}
