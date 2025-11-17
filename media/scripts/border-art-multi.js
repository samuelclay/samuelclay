/**
 * MULTI-STYLE BORDER ART SYSTEM
 *
 * Three distinct algorithmic art styles for borders:
 * 1. Digital Weave - Intersecting sine waves creating textile patterns
 * 2. Thermal Drift - Layered gradient bands with organic movement
 * 3. Organic Noise - Pure Perlin noise with thermal color mapping
 */

class BorderArtSystem {
    constructor() {
        this.sketches = [];
        this.sketchStates = new Map(); // Track sketch visibility and state
        this.styles = {
            'digital-weave': 'Digital Weave',
            'thermal-drift': 'Thermal Drift',
            'organic-noise': 'Organic Noise'
        };
        // Randomly select a style on page load
        const styleKeys = Object.keys(this.styles);
        this.currentStyle = styleKeys[Math.floor(Math.random() * styleKeys.length)];
        // 20 saturated, off-center colors (not too white, black, or gray)
        this.colorPalette = [
            [255, 107, 129],  // Coral pink
            [64, 224, 208],   // Turquoise
            [220, 20, 180],   // Deep magenta
            [255, 159, 28],   // Vibrant orange
            [147, 51, 234],   // Purple
            [50, 205, 50],    // Lime green
            [255, 69, 185],   // Hot pink
            [30, 144, 255],   // Dodger blue
            [255, 195, 0],    // Gold
            [199, 21, 133],   // Medium violet red
            [0, 191, 255],    // Deep sky blue
            [255, 99, 71],    // Tomato
            [138, 43, 226],   // Blue violet
            [255, 140, 0],    // Dark orange
            [72, 209, 204],   // Medium turquoise
            [220, 120, 255],  // Light purple
            [34, 139, 34],    // Forest green
            [255, 20, 147],   // Deep pink
            [100, 149, 237],  // Cornflower blue
            [255, 215, 0]     // Bright gold
        ];
        // Pick ONE random color for this page load - all borders will use this color
        const randomIndex = Math.floor(Math.random() * this.colorPalette.length);
        this.currentColor = this.colorPalette[randomIndex];

        // Setup Intersection Observer for performance
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        // Only animate borders that are visible in viewport
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const state = this.sketchStates.get(entry.target.id);
                if (state && state.p5Instance) {
                    if (entry.isIntersecting) {
                        state.p5Instance.loop();
                    } else {
                        state.p5Instance.noLoop();
                    }
                }
            });
        }, {
            rootMargin: '100px' // Start animating slightly before entering viewport
        });
    }

    init() {
        // Wait for full page load including images to ensure correct height calculation
        const initBorders = () => {
            // Wait for all images to load before calculating heights
            const images = Array.from(document.querySelectorAll('img'));
            const imagePromises = images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', resolve); // Resolve even on error
                });
            });

            Promise.all(imagePromises).then(() => {
                // Add delay to ensure layout has been recalculated after images load
                setTimeout(() => {
                    this.createStyleSelector();
                    this.createBorderSketches();
                }, 200);
            });
        };

        if (document.readyState === 'complete') {
            initBorders();
        } else {
            window.addEventListener('load', initBorders);
        }
    }

    createStyleSelector() {
        // Create a simple style selector at the top of the page
        const selector = document.createElement('div');
        selector.id = 'border-art-selector';
        selector.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: 'Whitney A', 'Whitney B', 'Lucida Grande', 'Helvetica', sans-serif;
            font-size: 14px;
        `;

        const label = document.createElement('div');
        label.textContent = 'Border Art:';
        label.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            color: #623734;
            font-size: 12px;
            text-transform: uppercase;
        `;

        const select = document.createElement('select');
        select.style.cssText = `
            width: 100%;
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
        `;

        Object.entries(this.styles).forEach(([key, name]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = name;
            if (key === this.currentStyle) option.selected = true;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            this.switchStyle(e.target.value);
        });

        selector.appendChild(label);
        selector.appendChild(select);
        document.body.appendChild(selector);
    }

    switchStyle(newStyle) {
        this.currentStyle = newStyle;
        // Remove all existing sketches
        this.sketches.forEach(sketch => sketch.remove());
        this.sketches = [];
        // Recreate with new style
        this.createBorderSketches();
    }

    createBorderSketches() {
        // Handle full frame borders
        const frameBorders = document.querySelectorAll('.block-border');
        frameBorders.forEach((border, index) => {
            border.style.background = 'none';
            // Clear any existing canvases
            border.innerHTML = '';

            // Find the header element (previous sibling of .content which contains .block-border)
            const content = border.parentElement;
            const header = content ? content.previousElementSibling : null;

            // Create top border in the header (if it exists)
            if (header && header.classList.contains('header')) {
                const topContainer = document.createElement('div');
                topContainer.className = 'header-border-top';
                topContainer.id = `border-canvas-top-${index}`;
                header.appendChild(topContainer);
                this.createSketch(`border-canvas-top-${index}`, index, 'horizontal');
            }

            // Create right border
            const rightContainer = document.createElement('div');
            rightContainer.className = 'border-right';
            rightContainer.id = `border-canvas-right-${index}`;
            border.appendChild(rightContainer);

            // Create bottom border
            const bottomContainer = document.createElement('div');
            bottomContainer.className = 'border-bottom';
            bottomContainer.id = `border-canvas-bottom-${index}`;
            border.appendChild(bottomContainer);

            // Create left border
            const leftContainer = document.createElement('div');
            leftContainer.className = 'border-left';
            leftContainer.id = `border-canvas-left-${index}`;
            border.appendChild(leftContainer);

            // Create sketches for right, bottom, left sides
            this.createSketch(`border-canvas-right-${index}`, index, 'vertical');
            this.createSketch(`border-canvas-bottom-${index}`, index, 'horizontal');
            this.createSketch(`border-canvas-left-${index}`, index, 'vertical');
        });

        // Handle page-level horizontal borders (top and bottom bars)
        const topbar = document.getElementById('topbar');
        const bottombar = document.getElementById('bottombar');

        if (topbar) {
            topbar.style.background = 'none';
            topbar.innerHTML = '';
            const container = document.createElement('div');
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.id = 'border-canvas-page-top';
            topbar.appendChild(container);
            this.createSketch('border-canvas-page-top', 100, 'horizontal');
        }

        if (bottombar) {
            bottombar.style.background = 'none';
            bottombar.innerHTML = '';
            const container = document.createElement('div');
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.id = 'border-canvas-page-bottom';
            bottombar.appendChild(container);
            this.createSketch('border-canvas-page-bottom', 200, 'horizontal');
        }
    }

    createSketch(containerId, seed, orientation) {
        // Check if container exists and has valid dimensions before creating p5 instance
        const container = document.getElementById(containerId);
        if (!container) {
            console.log('Skipping sketch for', containerId, '- container not found');
            return;
        }

        // Check height - for vertical borders, check grandparent height
        let height;
        if (orientation === 'vertical') {
            const parent = container.parentElement;
            const grandparent = parent ? parent.parentElement : null;
            height = grandparent ? grandparent.scrollHeight : 0;
        } else {
            height = container.offsetHeight || 42;
        }

        if (height <= 0) {
            console.log('Skipping sketch for', containerId, '- height is', height);
            return;
        }

        const styleFunc = this.getStyleFunction(this.currentStyle);
        const sketch = styleFunc(containerId, seed, orientation);
        const p5Instance = new p5(sketch);
        this.sketches.push(p5Instance);

        // Store reference and observe for visibility
        this.sketchStates.set(containerId, { p5Instance, container });
        this.observer.observe(container);
    }

    getStyleFunction(styleName) {
        switch (styleName) {
            case 'digital-weave':
                return this.digitalWeaveStyle.bind(this);
            case 'thermal-drift':
                return this.thermalDriftStyle.bind(this);
            case 'organic-noise':
                return this.organicNoiseStyle.bind(this);
            default:
                return this.digitalWeaveStyle.bind(this);
        }
    }

    // STYLE 1: Digital Weave - Intersecting sine waves creating textile patterns
    digitalWeaveStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;

        return (p) => {
            let w, h, time = 0;
            let canvasWidth, canvasHeight;
            let frequencies = [];

            p.setup = () => {
                const container = document.getElementById(containerId);
                w = container.offsetWidth || 20;
                // For vertical borders, use the grandparent's height (the .content block)
                if (orientation === 'vertical') {
                    const parent = container.parentElement; // .block-border
                    const grandparent = parent ? parent.parentElement : null; // .content
                    // Use scrollHeight to get full content height including any overflow
                    h = grandparent ? grandparent.scrollHeight : window.innerHeight;
                } else {
                    h = container.offsetHeight || 42;
                }

                // Skip if height is 0 or too small
                if (h <= 0) {
                    console.log('Skipping canvas creation for', containerId, '- height is', h);
                    p.noLoop();
                    return;
                }

                const canvas = p.createCanvas(w, h);
                canvas.parent(containerId);
                canvasWidth = canvas.elt.width;
                canvasHeight = canvas.elt.height;
                p.randomSeed(seed * 9999);

                // Generate harmonic frequencies - REDUCED for performance
                const numWaves = orientation === 'vertical' ? 3 : 5;
                for (let i = 0; i < numWaves; i++) {
                    frequencies.push({
                        freq: p.random(0.02, 0.08),
                        phase: p.random(p.TWO_PI),
                        amp: p.random(0.5, 1.3)  // Higher amplitude for more intense variation
                    });
                }
                p.frameRate(12); // REDUCED from 30 for better performance
            };

            p.draw = () => {
                // Smooth, moderate animation speed
                time += orientation === 'vertical' ? 0.06 : 0.05;

                // Use larger strips for better performance
                const stripSize = 6;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x += 2) {  // Skip every other pixel horizontally
                        let value = 0;

                        frequencies.forEach(freq => {
                            if (orientation === 'vertical') {
                                value += p.sin(y * freq.freq + freq.phase + time) * freq.amp;
                            } else {
                                value += p.sin(x * freq.freq + freq.phase + time) * freq.amp;
                            }
                        });

                        // Normalize and map to color from palette
                        value = (value + frequencies.length) / (frequencies.length * 2);
                        const r = p.lerp(238, baseColor[0], p.pow(value, 1.2));
                        const g = p.lerp(236, baseColor[1], value);
                        const b = p.lerp(234, baseColor[2], value * 0.8);

                        p.fill(r, g, b);
                        p.noStroke();
                        p.rect(x, y, 2, stripSize);  // Wider rectangles to match x skip
                    }
                }
            };
        };
    }

    // STYLE 2: Thermal Drift - Layered gradient bands with organic movement
    thermalDriftStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;

        return (p) => {
            let w, h, offset = 0;
            let bands = [];

            p.setup = () => {
                const container = document.getElementById(containerId);
                w = container.offsetWidth || 20;
                // For vertical borders, use the grandparent's height (the .content block)
                if (orientation === 'vertical') {
                    const parent = container.parentElement; // .block-border
                    const grandparent = parent ? parent.parentElement : null; // .content
                    // Use scrollHeight to get full content height including any overflow
                    h = grandparent ? grandparent.scrollHeight : window.innerHeight;
                } else {
                    h = container.offsetHeight || 42;
                }

                // Skip if height is 0 or too small
                if (h <= 0) {
                    console.log('Skipping canvas creation for', containerId, '- height is', h);
                    p.noLoop();
                    return;
                }

                const canvas = p.createCanvas(w, h);
                canvas.parent(containerId);
                p.randomSeed(seed * 7777);
                p.noiseSeed(seed * 3333);

                // Create thermal bands - REDUCED for performance
                const numBands = 5;
                for (let i = 0; i < numBands; i++) {
                    bands.push({
                        offset: p.random(1000),
                        speed: p.random(0.02, 0.06),  // Even faster for more visible animation
                        scale: p.random(0.003, 0.012),  // Larger scale for bigger, more visible bands
                        intensity: p.random(0.8, 2.0)  // Much higher intensity range
                    });
                }
                p.noStroke();
                p.frameRate(12);  // REDUCED from 60 for better performance
            };

            p.draw = () => {
                // Use larger strips for better performance
                const stripSize = 6;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x += 2) {  // Skip every other pixel
                        let heat = 0;

                        bands.forEach(band => {
                            const pos = orientation === 'vertical' ? y : x;
                            const noiseVal = p.noise(
                                pos * band.scale,
                                offset + band.offset
                            );
                            heat += noiseVal * band.intensity;
                        });

                        heat /= bands.length;

                        // Map heat with MUCH more dramatic color variation
                        // Use steeper curves and wider range for visible bands
                        const heatCurve = p.pow(heat, 0.4);  // Very aggressive curve
                        const r = p.lerp(250, baseColor[0], heatCurve);
                        const g = p.lerp(250, baseColor[1], heatCurve);
                        const b = p.lerp(250, baseColor[2], heatCurve);

                        p.fill(r, g, b);
                        p.rect(x, y, 2, stripSize);  // Wider to match x skip
                    }
                }

                // Update band offsets for animation
                bands.forEach(band => {
                    band.offset += band.speed;
                });
            };
        };
    }

    // STYLE 3: Organic Noise - Pure Perlin noise with thermal color mapping
    organicNoiseStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;

        return (p) => {
            let w, h, zoff = 0;

            p.setup = () => {
                const container = document.getElementById(containerId);
                w = container.offsetWidth || 20;
                // For vertical borders, use the grandparent's height (the .content block)
                if (orientation === 'vertical') {
                    const parent = container.parentElement; // .block-border
                    const grandparent = parent ? parent.parentElement : null; // .content
                    // Use scrollHeight to get full content height including any overflow
                    h = grandparent ? grandparent.scrollHeight : window.innerHeight;
                } else {
                    h = container.offsetHeight || 42;
                }

                // Skip if height is 0 or too small
                if (h <= 0) {
                    console.log('Skipping canvas creation for', containerId, '- height is', h);
                    p.noLoop();
                    return;
                }

                const canvas = p.createCanvas(w, h);
                canvas.parent(containerId);
                p.noiseSeed(seed * 4444);
                p.noStroke();
                p.frameRate(12);  // REDUCED from 60 for better performance
            };

            p.draw = () => {
                // Use larger strips for better performance
                const stripHeight = 6;  // Increased from 4px

                for (let y = 0; y < h; y += stripHeight) {
                    for (let x = 0; x < w; x += 2) {  // Skip every other pixel
                        // Simplified to 2-octave noise for performance
                        const n1 = p.noise(x * 0.05, y * 0.05, zoff);
                        const n2 = p.noise(x * 0.1, y * 0.1, zoff * 0.5);

                        const combined = (n1 * 0.6 + n2 * 0.4);  // Removed third octave

                        const r = p.lerp(238, baseColor[0], p.pow(combined, 1.2));
                        const g = p.lerp(236, baseColor[1], combined);
                        const b = p.lerp(234, baseColor[2], combined * 0.8);

                        p.fill(r, g, b);
                        p.rect(x, y, 2, stripHeight);  // Wider to match x skip
                    }
                }

                zoff += 0.05;  // Smooth, visible animation
            };
        };
    }
}

// Initialize
const borderArtSystem = new BorderArtSystem();
borderArtSystem.init();
