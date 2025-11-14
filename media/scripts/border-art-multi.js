/**
 * MULTI-STYLE BORDER ART SYSTEM
 *
 * Five distinct algorithmic art styles for borders:
 * 1. Liminal Flow - Particle density through noise fields
 * 2. Digital Weave - Intersecting sine waves creating textile patterns
 * 3. Thermal Drift - Layered gradient bands with organic movement
 * 4. Organic Noise - Pure Perlin noise with thermal color mapping
 * 5. Particle Storm - High-energy particle system with motion blur
 */

class BorderArtSystem {
    constructor() {
        this.sketches = [];
        this.currentStyle = 'thermal-drift'; // default
        this.styles = {
            'liminal-flow': 'Liminal Flow',
            'digital-weave': 'Digital Weave',
            'thermal-drift': 'Thermal Drift',
            'organic-noise': 'Organic Noise',
            'particle-storm': 'Particle Storm'
        };
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
        // Handle vertical borders
        const verticalBorders = document.querySelectorAll('.block-border');
        verticalBorders.forEach((border, index) => {
            border.style.background = 'none';
            // Clear any existing canvases
            border.innerHTML = '';

            const canvasContainer = document.createElement('div');
            canvasContainer.style.width = '100%';
            canvasContainer.style.height = '100%';
            canvasContainer.style.position = 'absolute';
            canvasContainer.style.top = '0';
            canvasContainer.style.left = '0';
            canvasContainer.id = `border-canvas-v-${index}`;
            border.appendChild(canvasContainer);

            this.createSketch(canvasContainer.id, index, 'vertical');
        });

        // Handle horizontal borders (top and bottom)
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
            container.id = 'border-canvas-top';
            topbar.appendChild(container);
            this.createSketch('border-canvas-top', 100, 'horizontal');
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
            container.id = 'border-canvas-bottom';
            bottombar.appendChild(container);
            this.createSketch('border-canvas-bottom', 200, 'horizontal');
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
        this.sketches.push(new p5(sketch));
    }

    getStyleFunction(styleName) {
        switch (styleName) {
            case 'liminal-flow':
                return this.liminalFlowStyle.bind(this);
            case 'digital-weave':
                return this.digitalWeaveStyle.bind(this);
            case 'thermal-drift':
                return this.thermalDriftStyle.bind(this);
            case 'organic-noise':
                return this.organicNoiseStyle.bind(this);
            case 'particle-storm':
                return this.particleStormStyle.bind(this);
            default:
                return this.liminalFlowStyle.bind(this);
        }
    }

    // STYLE 1: Liminal Flow - Particle density through noise fields
    liminalFlowStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;

        return (p) => {
            let particles = [];
            let densityMap = [];
            let noiseOffset1 = 0, noiseOffset2 = 0;
            let w, h;
            let canvasWidth, canvasHeight; // Actual pixel dimensions

            const params = {
                particleCount: orientation === 'vertical' ? 120 : 300,
                particleSpeed: orientation === 'vertical' ? 0.8 : 1.2,
                noiseScale: 0.015,
                noiseSpeed: 0.003,
                densityDecay: 0.95,
                maxDensity: 255,
                colors: {
                    hot: baseColor,
                    warm: baseColor.map(c => c * 0.8),
                    cool: baseColor.map(c => c * 0.5),
                    bg: [238, 236, 234]  // Page background color
                }
            };

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

                // Get actual canvas pixel dimensions (accounts for retina displays)
                canvasWidth = canvas.elt.width;
                canvasHeight = canvas.elt.height;

                p.randomSeed(seed * 1234);
                p.noiseSeed(seed * 5678);
                // Create density map at logical resolution for performance
                densityMap = Array(w).fill(0).map(() => Array(h).fill(0));
                for (let i = 0; i < params.particleCount; i++) {
                    particles.push(new Particle());
                }
                p.background(238, 236, 234);
                p.frameRate(30);
            };

            p.draw = () => {
                // Decay density at logical resolution
                for (let x = 0; x < w; x++) {
                    for (let y = 0; y < h; y++) {
                        densityMap[x][y] *= params.densityDecay;
                    }
                }
                noiseOffset1 += params.noiseSpeed;
                noiseOffset2 += params.noiseSpeed * 0.5;

                for (let particle of particles) {
                    particle.update();
                    particle.addToDensityMap();
                }

                // Render at physical pixel resolution by scaling up
                p.loadPixels();
                const scaleX = canvasWidth / w;
                const scaleY = canvasHeight / h;

                for (let px = 0; px < canvasWidth; px++) {
                    for (let py = 0; py < canvasHeight; py++) {
                        // Map physical pixel to logical coordinate
                        const x = Math.floor(px / scaleX);
                        const y = Math.floor(py / scaleY);

                        const density = Math.min(densityMap[x][y], params.maxDensity);
                        const pos = orientation === 'vertical' ? y / h : x / w;
                        const c = getColorFromDensity(density, pos);
                        const index = (px + py * canvasWidth) * 4;
                        p.pixels[index] = c[0];
                        p.pixels[index + 1] = c[1];
                        p.pixels[index + 2] = c[2];
                        p.pixels[index + 3] = 255;
                    }
                }
                p.updatePixels();
            };

            function getColorFromDensity(density, pos) {
                if (density < 5) return params.colors.bg;
                if (density < 30) return lerpColor(params.colors.bg, params.colors.cool, density / 30);
                if (density < 80) {
                    const t = (density - 30) / 50;
                    const baseColor = lerpColor(params.colors.cool, params.colors.warm, t);
                    return lerpColor(baseColor, params.colors.hot, (1 - pos) * 0.3);
                }
                const t = (density - 80) / (params.maxDensity - 80);
                return lerpColor(params.colors.warm, params.colors.hot, t);
            }

            function lerpColor(c1, c2, t) {
                return [p.lerp(c1[0], c2[0], t), p.lerp(c1[1], c2[1], t), p.lerp(c1[2], c2[2], t)];
            }

            class Particle {
                constructor() {
                    this.x = p.random(w);
                    this.y = p.random(h);
                    this.vx = 0;
                    this.vy = orientation === 'vertical' ? params.particleSpeed : 0;
                    this.vx = orientation === 'horizontal' ? params.particleSpeed : 0;
                    this.life = p.random(100, 200);
                    this.maxLife = this.life;
                }

                update() {
                    const noiseVal = p.noise(
                        this.x * params.noiseScale + noiseOffset2,
                        this.y * params.noiseScale + noiseOffset1
                    );
                    const force = (noiseVal - 0.5) * 0.4;

                    if (orientation === 'vertical') {
                        this.vx = force;
                        this.vy = params.particleSpeed;
                    } else {
                        this.vx = params.particleSpeed;
                        this.vy = force;
                    }

                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.5;

                    if (this.x < 0) this.x = w;
                    if (this.x >= w) this.x = 0;
                    if (this.y < 0) this.y = h;
                    if (this.y >= h) this.y = 0;

                    if ((orientation === 'vertical' && this.y >= h) ||
                        (orientation === 'horizontal' && this.x >= w) ||
                        this.life <= 0) {
                        if (orientation === 'vertical') {
                            this.y = 0;
                            this.x = p.random(w);
                        } else {
                            this.x = 0;
                            this.y = p.random(h);
                        }
                        this.life = p.random(100, 200);
                        this.maxLife = this.life;
                    }
                }

                addToDensityMap() {
                    const px = Math.floor(this.x);
                    const py = Math.floor(this.y);
                    if (px >= 0 && px < w && py >= 0 && py < h) {
                        const contribution = (this.life / this.maxLife) * 8;
                        densityMap[px][py] += contribution;
                    }
                }
            }
        };
    }

    // STYLE 2: Digital Weave - Intersecting sine waves
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

                // Generate harmonic frequencies
                const numWaves = orientation === 'vertical' ? 6 : 10;
                for (let i = 0; i < numWaves; i++) {
                    frequencies.push({
                        freq: p.random(0.02, 0.08),
                        phase: p.random(p.TWO_PI),
                        amp: p.random(0.5, 1.3)  // Higher amplitude for more intense variation
                    });
                }
                p.frameRate(30);
            };

            p.draw = () => {
                // Smooth, moderate animation speed
                time += orientation === 'vertical' ? 0.06 : 0.05;

                // Use strip-based rendering for smooth performance
                const stripSize = 3;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x++) {
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
                        p.rect(x, y, 1, stripSize);
                    }
                }
            };
        };
    }

    // STYLE 3: Thermal Drift - Layered gradient bands (optimized)
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

                // Create thermal bands
                const numBands = 10;
                for (let i = 0; i < numBands; i++) {
                    bands.push({
                        offset: p.random(1000),
                        speed: p.random(0.015, 0.04),  // 30% faster for more visible animation
                        scale: p.random(0.006, 0.02),  // Slightly larger scale for more variation
                        intensity: p.random(0.5, 1.2)  // Higher intensity range
                    });
                }
                p.noStroke();
                p.frameRate(60);  // Smoother animation
            };

            p.draw = () => {
                // Use strip-based rendering for performance
                const stripSize = 3;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x++) {
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

                        // Map heat from background to the palette color
                        const r = p.lerp(238, baseColor[0], p.pow(heat, 0.8));
                        const g = p.lerp(236, baseColor[1], p.pow(heat, 1.2));
                        const b = p.lerp(234, baseColor[2], p.pow(heat, 1.0));

                        p.fill(r, g, b);
                        p.rect(x, y, 1, stripSize);
                    }
                }

                // Update band offsets for animation
                bands.forEach(band => {
                    band.offset += band.speed;
                });
            };
        };
    }

    // STYLE 4: Organic Noise - Pure Perlin noise (optimized)
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
                p.frameRate(60);  // Higher framerate for smoother animation
            };

            p.draw = () => {
                // Use strip-based rendering - much faster than pixel manipulation
                const stripHeight = 4;  // Render in 4px tall strips

                for (let y = 0; y < h; y += stripHeight) {
                    for (let x = 0; x < w; x++) {
                        // Multi-octave noise
                        const n1 = p.noise(x * 0.05, y * 0.05, zoff);
                        const n2 = p.noise(x * 0.1, y * 0.1, zoff * 0.5);
                        const n3 = p.noise(x * 0.02, y * 0.02, zoff * 2);

                        const combined = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);

                        const r = p.lerp(238, baseColor[0], p.pow(combined, 1.2));
                        const g = p.lerp(236, baseColor[1], combined);
                        const b = p.lerp(234, baseColor[2], combined * 0.8);

                        p.fill(r, g, b);
                        p.rect(x, y, 1, stripHeight);
                    }
                }

                zoff += 0.05;  // Smooth, visible animation
            };
        };
    }

    // STYLE 5: Particle Storm - High-energy particles
    particleStormStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;

        return (p) => {
            let particles = [];
            let w, h;

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
                p.randomSeed(seed * 8888);

                const count = orientation === 'vertical' ? 100 : 250;
                for (let i = 0; i < count; i++) {
                    particles.push(new FastParticle());
                }
                p.background(238, 236, 234);
                p.frameRate(60);
            };

            p.draw = () => {
                p.fill(238, 236, 234, 40);
                p.noStroke();
                p.rect(0, 0, w, h);

                particles.forEach(particle => {
                    particle.update();
                    particle.show();
                });
            };

            class FastParticle {
                constructor() {
                    this.reset();
                }

                reset() {
                    if (orientation === 'vertical') {
                        this.x = p.random(w);
                        this.y = 0;
                        this.vy = p.random(2, 6);
                        this.vx = p.random(-0.5, 0.5);
                    } else {
                        this.x = 0;
                        this.y = p.random(h);
                        this.vx = p.random(2, 6);
                        this.vy = p.random(-0.5, 0.5);
                    }
                    this.hue = p.random([0, 5, 10, 15]);
                }

                update() {
                    this.x += this.vx;
                    this.y += this.vy;

                    if ((orientation === 'vertical' && this.y > h) ||
                        (orientation === 'horizontal' && this.x > w)) {
                        this.reset();
                    }
                }

                show() {
                    const speed = orientation === 'vertical' ? this.vy : this.vx;
                    const brightness = p.map(speed, 2, 6, 100, 255);
                    const hueShift = this.hue / 15; // Normalize hue to 0-1 range
                    const r = baseColor[0] + (hueShift * 30);
                    const g = baseColor[1] + (hueShift * 20);
                    const b = baseColor[2] + (hueShift * 10);
                    p.stroke(r, g, b, brightness);
                    p.strokeWeight(p.random(1, 2));
                    p.point(this.x, this.y);
                }
            }
        };
    }
}

// Initialize
const borderArtSystem = new BorderArtSystem();
borderArtSystem.init();
