const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class UIAnalyzer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      layoutIssues: [],
      accessibilityIssues: [],
      responsiveIssues: [],
      usabilityIssues: [],
      performance: {},
      screenshots: []
    };
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for visual inspection
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();

    // Enable JavaScript and CSS
    await this.page.setJavaScriptEnabled(true);

    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  }

  async analyzeLayout() {
    console.log('🔍 Analyzing layout and visual design...');

    try {
      // Navigate to the application
      await this.page.goto('http://localhost:3000', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });

      // Wait for main content to load
      await this.page.waitForSelector('body', { timeout: 5000 });

      // Take full page screenshot
      await this.takeScreenshot('full-page-desktop');

      // Analyze header/navigation
      await this.analyzeNavigation();

      // Analyze main content area
      await this.analyzeMainContent();

      // Analyze footer
      await this.analyzeFooter();

      // Test responsive design
      await this.testResponsiveDesign();

      // Test color contrast and accessibility
      await this.analyzeAccessibility();

      // Test user interactions
      await this.testUserInteractions();

    } catch (error) {
      this.results.layoutIssues.push({
        type: 'critical',
        message: `Failed to load application: ${error.message}`,
        element: 'page',
        recommendation: 'Ensure development server is running on localhost:3000'
      });
    }
  }

  async analyzeNavigation() {
    console.log('📐 Analyzing navigation...');

    try {
      // Check if navigation exists and is visible
      const nav = await this.page.$('nav, header, [role="navigation"]');
      if (!nav) {
        this.results.layoutIssues.push({
          type: 'warning',
          message: 'No navigation element found',
          element: 'navigation',
          recommendation: 'Add semantic navigation markup'
        });
        return;
      }

      // Get navigation bounds
      const navBounds = await nav.boundingBox();
      if (navBounds) {
        // Check if navigation is at the top
        if (navBounds.y > 50) {
          this.results.layoutIssues.push({
            type: 'suggestion',
            message: 'Navigation is not positioned at the top',
            element: 'navigation',
            recommendation: 'Consider moving navigation to the top for better UX'
          });
        }

        // Check navigation height
        if (navBounds.height > 100) {
          this.results.layoutIssues.push({
            type: 'warning',
            message: 'Navigation height is quite large',
            element: 'navigation',
            recommendation: 'Consider reducing navigation height to save screen space'
          });
        }
      }

      // Check for logo/brand
      const logo = await this.page.$('[class*="logo"], [class*="brand"], img[alt*="logo"]');
      if (!logo) {
        this.results.usabilityIssues.push({
          type: 'suggestion',
          message: 'No logo or brand element found in navigation',
          element: 'navigation',
          recommendation: 'Add a logo or brand element for better brand recognition'
        });
      }

      // Check navigation links
      const navLinks = await this.page.$$('nav a, header a, [role="navigation"] a');
      if (navLinks.length === 0) {
        this.results.layoutIssues.push({
          type: 'warning',
          message: 'No navigation links found',
          element: 'navigation',
          recommendation: 'Add navigation links for better site navigation'
        });
      }

      // Test navigation link spacing
      for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
        const link = navLinks[i];
        const bounds = await link.boundingBox();
        if (bounds && bounds.width < 44 || bounds.height < 44) {
          this.results.accessibilityIssues.push({
            type: 'warning',
            message: `Navigation link ${i + 1} is too small for touch targets`,
            element: 'navigation-link',
            recommendation: 'Ensure touch targets are at least 44px x 44px'
          });
        }
      }

    } catch (error) {
      this.results.layoutIssues.push({
        type: 'error',
        message: `Navigation analysis failed: ${error.message}`,
        element: 'navigation'
      });
    }
  }

  async analyzeMainContent() {
    console.log('📋 Analyzing main content area...');

    try {
      // Check for main content container
      const main = await this.page.$('main, [role="main"], .main-content');
      if (!main) {
        this.results.layoutIssues.push({
          type: 'warning',
          message: 'No semantic main content area found',
          element: 'main',
          recommendation: 'Use <main> element or role="main" for better accessibility'
        });
      }

      // Analyze content width and centering
      const contentWidth = await this.page.evaluate(() => {
        const main = document.querySelector('main, [role="main"], .main-content, body > div');
        if (main) {
          const rect = main.getBoundingClientRect();
          return {
            width: rect.width,
            left: rect.left,
            right: rect.right,
            screenWidth: window.innerWidth
          };
        }
        return null;
      });

      if (contentWidth) {
        // Check if content is too wide
        if (contentWidth.width > 1400) {
          this.results.layoutIssues.push({
            type: 'suggestion',
            message: 'Main content area is very wide',
            element: 'main-content',
            recommendation: 'Consider adding max-width and centering for better readability'
          });
        }

        // Check if content is centered
        const leftMargin = contentWidth.left;
        const rightMargin = contentWidth.screenWidth - contentWidth.right;
        const marginDiff = Math.abs(leftMargin - rightMargin);

        if (marginDiff > 50 && contentWidth.width < contentWidth.screenWidth * 0.9) {
          this.results.layoutIssues.push({
            type: 'suggestion',
            message: 'Main content appears off-center',
            element: 'main-content',
            recommendation: 'Center the main content area for better visual balance'
          });
        }
      }

      // Check for proper spacing between sections
      const sections = await this.page.$$('section, .section, [class*="section"]');
      if (sections.length > 1) {
        for (let i = 0; i < sections.length - 1; i++) {
          const current = await sections[i].boundingBox();
          const next = await sections[i + 1].boundingBox();

          if (current && next) {
            const gap = next.y - (current.y + current.height);
            if (gap < 16) {
              this.results.layoutIssues.push({
                type: 'suggestion',
                message: `Insufficient spacing between section ${i + 1} and ${i + 2}`,
                element: 'sections',
                recommendation: 'Add more spacing between sections for better visual separation'
              });
            }
          }
        }
      }

    } catch (error) {
      this.results.layoutIssues.push({
        type: 'error',
        message: `Main content analysis failed: ${error.message}`,
        element: 'main-content'
      });
    }
  }

  async analyzeFooter() {
    console.log('🦶 Analyzing footer...');

    const footer = await this.page.$('footer, [role="contentinfo"]');
    if (!footer) {
      this.results.layoutIssues.push({
        type: 'suggestion',
        message: 'No footer element found',
        element: 'footer',
        recommendation: 'Consider adding a footer with important links and information'
      });
    }
  }

  async testResponsiveDesign() {
    console.log('📱 Testing responsive design...');

    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await this.page.setViewport(viewport);
      await this.page.waitForTimeout(1000); // Allow layout to adjust

      // Take screenshot
      await this.takeScreenshot(`responsive-${viewport.name}`);

      // Check for horizontal scroll
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        this.results.responsiveIssues.push({
          type: 'warning',
          message: `Horizontal scroll detected on ${viewport.name}`,
          viewport: viewport.name,
          recommendation: 'Fix overflow issues to prevent horizontal scrolling'
        });
      }

      // Check if navigation is mobile-friendly
      if (viewport.name === 'mobile') {
        const navLinks = await this.page.$$('nav a, header a');
        const visibleLinks = [];

        for (const link of navLinks) {
          const isVisible = await link.isIntersectingViewport();
          if (isVisible) {
            const bounds = await link.boundingBox();
            if (bounds) visibleLinks.push(bounds);
          }
        }

        if (visibleLinks.length > 4) {
          this.results.responsiveIssues.push({
            type: 'suggestion',
            message: 'Too many navigation links visible on mobile',
            viewport: 'mobile',
            recommendation: 'Consider using a hamburger menu for mobile navigation'
          });
        }
      }
    }

    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async analyzeAccessibility() {
    console.log('♿ Analyzing accessibility...');

    try {
      // Check for alt text on images
      const images = await this.page.$$('img');
      for (let i = 0; i < images.length; i++) {
        const alt = await images[i].getAttribute('alt');
        if (!alt || alt.trim() === '') {
          this.results.accessibilityIssues.push({
            type: 'warning',
            message: `Image ${i + 1} missing alt text`,
            element: 'img',
            recommendation: 'Add descriptive alt text for screen readers'
          });
        }
      }

      // Check for form labels
      const inputs = await this.page.$$('input, textarea, select');
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');

        let hasLabel = false;
        if (id) {
          const label = await this.page.$(`label[for="${id}"]`);
          hasLabel = !!label;
        }

        if (!hasLabel && !ariaLabel && !placeholder) {
          this.results.accessibilityIssues.push({
            type: 'warning',
            message: `Input field ${i + 1} has no label`,
            element: 'input',
            recommendation: 'Add proper labels for form inputs'
          });
        }
      }

      // Check color contrast (basic check)
      const elements = await this.page.$$('body, p, h1, h2, h3, h4, h5, h6, a, button');
      for (const element of elements.slice(0, 10)) { // Check first 10 elements
        const styles = await this.page.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        }, element);

        // Simple contrast check (this is basic - real contrast checking needs more sophisticated color analysis)
        if (styles.color === styles.backgroundColor) {
          this.results.accessibilityIssues.push({
            type: 'error',
            message: 'Text color same as background color',
            element: 'text',
            recommendation: 'Ensure sufficient color contrast between text and background'
          });
        }
      }

    } catch (error) {
      this.results.accessibilityIssues.push({
        type: 'error',
        message: `Accessibility analysis failed: ${error.message}`,
        element: 'general'
      });
    }
  }

  async testUserInteractions() {
    console.log('🖱️ Testing user interactions...');

    try {
      // Test button interactions
      const buttons = await this.page.$$('button, [role="button"], input[type="submit"]');
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const button = buttons[i];
        const isVisible = await button.isIntersectingViewport();

        if (isVisible) {
          // Test hover state
          await button.hover();
          await this.page.waitForTimeout(100);

          // Check if button has hover styles
          const hasHoverStyle = await this.page.evaluate((btn) => {
            const computed = window.getComputedStyle(btn, ':hover');
            const normal = window.getComputedStyle(btn);
            return computed.backgroundColor !== normal.backgroundColor ||
                   computed.color !== normal.color ||
                   computed.transform !== normal.transform;
          }, button);

          if (!hasHoverStyle) {
            this.results.usabilityIssues.push({
              type: 'suggestion',
              message: `Button ${i + 1} has no hover state`,
              element: 'button',
              recommendation: 'Add hover states to buttons for better user feedback'
            });
          }
        }
      }

      // Test link interactions
      const links = await this.page.$$('a[href]');
      for (let i = 0; i < Math.min(links.length, 3); i++) {
        const link = links[i];
        const href = await link.getAttribute('href');

        if (href && href !== '#' && !href.startsWith('javascript:')) {
          const isVisible = await link.isIntersectingViewport();
          if (isVisible) {
            await link.hover();
            await this.page.waitForTimeout(100);
          }
        }
      }

    } catch (error) {
      this.results.usabilityIssues.push({
        type: 'error',
        message: `User interaction testing failed: ${error.message}`,
        element: 'interactions'
      });
    }
  }

  async takeScreenshot(name) {
    try {
      const screenshotPath = path.join(__dirname, 'screenshots', `${name}-${Date.now()}.png`);

      // Ensure screenshots directory exists
      const screenshotsDir = path.dirname(screenshotPath);
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      this.results.screenshots.push({
        name,
        path: screenshotPath,
        timestamp: new Date().toISOString()
      });

      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      console.error(`Failed to take screenshot ${name}:`, error.message);
    }
  }

  async measurePerformance() {
    console.log('⚡ Measuring performance...');

    try {
      const metrics = await this.page.metrics();
      this.results.performance = {
        ...metrics,
        timestamp: new Date().toISOString()
      };

      // Measure page load time
      const pageLoadTime = await this.page.evaluate(() => {
        return performance.timing.loadEventEnd - performance.timing.navigationStart;
      });

      this.results.performance.pageLoadTime = pageLoadTime;

      if (pageLoadTime > 3000) {
        this.results.usabilityIssues.push({
          type: 'warning',
          message: `Page load time is ${pageLoadTime}ms`,
          element: 'page',
          recommendation: 'Optimize page load time - target under 3 seconds'
        });
      }

    } catch (error) {
      this.results.performance.error = error.message;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.results.layoutIssues.length +
                    this.results.accessibilityIssues.length +
                    this.results.responsiveIssues.length +
                    this.results.usabilityIssues.length,
        layoutIssues: this.results.layoutIssues.length,
        accessibilityIssues: this.results.accessibilityIssues.length,
        responsiveIssues: this.results.responsiveIssues.length,
        usabilityIssues: this.results.usabilityIssues.length
      },
      details: this.results
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'reports', `ui-analysis-${Date.now()}.json`);
    const reportsDir = path.dirname(reportPath);

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 UI Analysis Report Generated');
    console.log('================================');
    console.log(`Total Issues Found: ${report.summary.totalIssues}`);
    console.log(`- Layout Issues: ${report.summary.layoutIssues}`);
    console.log(`- Accessibility Issues: ${report.summary.accessibilityIssues}`);
    console.log(`- Responsive Issues: ${report.summary.responsiveIssues}`);
    console.log(`- Usability Issues: ${report.summary.usabilityIssues}`);
    console.log(`\nDetailed report saved to: ${reportPath}`);

    return report;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.analyzeLayout();
      await this.measurePerformance();
      return this.generateReport();
    } catch (error) {
      console.error('UI Analysis failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Export for use in other scripts
module.exports = UIAnalyzer;

// Run analysis if called directly
if (require.main === module) {
  (async () => {
    const analyzer = new UIAnalyzer();
    try {
      await analyzer.run();
    } catch (error) {
      console.error('Analysis failed:', error);
      process.exit(1);
    }
  })();
}