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
            'digital-weave': 'Weave',
            'thermal-drift': 'Drift',
            'organic-noise': 'Noise'
        };
        // Randomly select a style on page load
        const styleKeys = Object.keys(this.styles);
        this.currentStyle = styleKeys[Math.floor(Math.random() * styleKeys.length)];
        // 24 colors: spectrum left-to-right, brightness/saturation top-to-bottom
        this.colorPalette = [
            // Row 1: Lighter/brighter versions across spectrum
            [255, 118, 117],  // Light red
            [252, 92, 125],   // Light pink
            [255, 177, 66],   // Light orange
            [255, 220, 116],  // Soft yellow
            [163, 203, 56],   // Yellow-lime
            [85, 239, 196],   // Mint
            [116, 185, 255],  // Sky blue
            [200, 180, 235],  // Lavender

            // Row 2: Medium saturation/brightness across spectrum
            [235, 77, 75],    // Medium red
            [255, 159, 64],   // Coral
            [245, 124, 0],    // Orange
            [241, 196, 15],   // Sunflower
            [39, 174, 96],    // Emerald
            [9, 132, 227],    // Bright blue
            [108, 92, 231],   // Periwinkle
            [162, 155, 254],  // Light purple

            // Row 3: Darker/richer versions across spectrum
            [214, 48, 49],    // Rich red
            [225, 112, 85],   // Terracotta
            [255, 195, 18],   // Golden orange
            [254, 211, 48],   // Bright gold
            [0, 148, 133],    // Teal
            [84, 160, 255],   // Azure
            [65, 105, 225],   // Royal blue
            [155, 89, 182]    // Deep purple
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
                // Set initial opacity to 0 immediately - before any delay
                document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                    el.style.opacity = '0';
                });

                // Add delay to ensure layout has been recalculated after images load
                setTimeout(() => {
                    this.createHUD();

                    // Set transition for smooth fade-in
                    document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                        el.style.transition = 'opacity 2.4s ease';  // Very slow, luxurious fade
                    });

                    this.createBorderSketches();
                    this.setupWindowResize();

                    // Fade in borders after creation with longer delay
                    setTimeout(() => {
                        document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                            el.style.opacity = '1';
                        });
                    }, 100);
                }, 200);
            });
        };

        if (document.readyState === 'complete') {
            initBorders();
        } else {
            window.addEventListener('load', initBorders);
        }
    }

    createHUD() {
        // Create customize panel container
        const hud = document.createElement('div');
        hud.id = 'border-art-customize';
        hud.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            padding: 6px 14px;
            border: 1px solid rgba(0, 0, 0, 0.15);
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1001;
            font-family: 'Whitney A', 'Whitney B', 'Lucida Grande', 'Helvetica', sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
        `;

        // Button text (shown when collapsed)
        const buttonText = document.createElement('div');
        buttonText.id = 'customize-button-text';
        buttonText.textContent = 'CUSTOMIZE';
        buttonText.style.cssText = `
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.8px;
            color: #623734;
            white-space: nowrap;
        `;

        // Content container (shown when expanded)
        const content = document.createElement('div');
        content.id = 'customize-content';
        content.style.cssText = `
            display: none;
        `;

        // Close button
        const closeBtn = document.createElement('div');
        closeBtn.id = 'customize-close';
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.05);
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 300;
            color: #623734;
            cursor: pointer;
            transition: background 0.2s ease;
        `;

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.1)';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.05)';
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCustomize();
        });

        // Pattern selector
        const patternLabel = document.createElement('div');
        patternLabel.textContent = 'Border Pattern';
        patternLabel.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            color: #623734;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        // Segmented control container
        const segmentedControl = document.createElement('div');
        segmentedControl.style.cssText = `
            display: flex;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 6px;
            padding: 2px;
            margin-bottom: 16px;
        `;

        // Create segments for each style
        Object.entries(this.styles).forEach(([key, name], index) => {
            const segment = document.createElement('div');
            const isActive = key === this.currentStyle;

            segment.className = 'pattern-segment';
            segment.dataset.styleKey = key;
            segment.textContent = name;
            segment.style.cssText = `
                flex: 1;
                padding: 6px 8px;
                text-align: center;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border-radius: 4px;
                color: ${isActive ? '#623734' : 'rgba(98, 55, 52, 0.5)'};
                background: ${isActive ? 'white' : 'transparent'};
                box-shadow: ${isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};
            `;

            segment.addEventListener('mouseenter', () => {
                if (!isActive) {
                    segment.style.color = 'rgba(98, 55, 52, 0.7)';
                }
            });

            segment.addEventListener('mouseleave', () => {
                if (!isActive) {
                    segment.style.color = 'rgba(98, 55, 52, 0.5)';
                }
            });

            segment.addEventListener('click', () => {
                this.switchStyleFromSegment(key);
            });

            segmentedControl.appendChild(segment);
        });

        const colorLabel = document.createElement('div');
        colorLabel.textContent = 'Color Palette';
        colorLabel.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
            color: #623734;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        const colorGrid = document.createElement('div');
        colorGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 7px;
            justify-items: stretch;
            align-items: stretch;
            margin: -4px;
        `;

        // Create color swatches
        this.colorPalette.forEach((color, index) => {
            const swatch = document.createElement('div');
            const isActive = JSON.stringify(this.currentColor) === JSON.stringify(color);
            swatch.className = 'color-swatch';
            swatch.dataset.colorIndex = index;
            swatch.style.cssText = `
                width: 100%;
                aspect-ratio: 1;
                border-radius: 4px;
                background: rgb(${color[0]}, ${color[1]}, ${color[2]});
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                box-shadow: ${isActive ? '0 0 0 2.5px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.12)'};
                transform: ${isActive ? 'scale(1.1)' : 'scale(1)'};
            `;

            swatch.addEventListener('mouseenter', () => {
                if (JSON.stringify(this.currentColor) !== JSON.stringify(color)) {
                    swatch.style.transform = 'scale(1.1)';
                }
            });

            swatch.addEventListener('mouseleave', () => {
                if (JSON.stringify(this.currentColor) !== JSON.stringify(color)) {
                    swatch.style.transform = 'scale(1)';
                }
            });

            swatch.addEventListener('click', () => {
                this.changeColor(color);
            });

            colorGrid.appendChild(swatch);
        });

        content.appendChild(patternLabel);
        content.appendChild(segmentedControl);
        content.appendChild(colorLabel);
        content.appendChild(colorGrid);

        hud.appendChild(buttonText);
        hud.appendChild(closeBtn);
        hud.appendChild(content);
        document.body.appendChild(hud);

        this.hudElement = hud;
        this.isExpanded = false;

        // Click handler for expanding
        hud.addEventListener('click', () => {
            if (!this.isExpanded) {
                this.toggleCustomize();
            }
        });

        // Hover effect when collapsed
        hud.addEventListener('mouseenter', () => {
            if (!this.isExpanded) {
                hud.style.background = 'rgba(255, 255, 255, 1)';
                hud.style.boxShadow = '0 3px 12px rgba(0,0,0,0.15)';
            }
        });

        hud.addEventListener('mouseleave', () => {
            if (!this.isExpanded) {
                hud.style.background = 'rgba(255, 255, 255, 0.95)';
                hud.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }
        });
    }

    toggleCustomize() {
        const hud = this.hudElement;
        const buttonText = document.getElementById('customize-button-text');
        const content = document.getElementById('customize-content');
        const closeBtn = document.getElementById('customize-close');

        if (this.isExpanded) {
            // Collapse back to button
            hud.style.width = 'auto';
            hud.style.height = 'auto';
            hud.style.padding = '6px 14px';
            hud.style.borderRadius = '20px';
            hud.style.cursor = 'pointer';
            buttonText.style.display = 'block';
            content.style.display = 'none';
            closeBtn.style.display = 'none';
            this.isExpanded = false;
        } else {
            // Expand to full panel
            hud.style.width = '340px';
            hud.style.height = 'auto';
            hud.style.padding = '20px';
            hud.style.borderRadius = '12px';
            hud.style.cursor = 'default';
            buttonText.style.display = 'none';
            content.style.display = 'block';
            closeBtn.style.display = 'flex';
            this.isExpanded = true;
        }
    }

    changeColor(newColor) {
        this.currentColor = newColor;

        // Update swatch highlights - use the color-swatch class
        const swatches = this.hudElement.querySelectorAll('.color-swatch');
        swatches.forEach((swatch) => {
            const colorIndex = parseInt(swatch.dataset.colorIndex);
            const color = this.colorPalette[colorIndex];
            const isActive = JSON.stringify(this.currentColor) === JSON.stringify(color);
            swatch.style.boxShadow = isActive ? '0 0 0 3px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)';
            swatch.style.transform = isActive ? 'scale(1.15)' : 'scale(1)';
        });

        // Fade out, redraw, fade in
        document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
            el.style.transition = 'opacity 0.2s ease';  // Faster fade for switching
            el.style.opacity = '0';
        });

        setTimeout(() => {
            this.redrawBorders();
            setTimeout(() => {
                document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                    el.style.opacity = '1';
                });
            }, 50);
        }, 200);  // Match the faster transition time
    }

    setupWindowResize() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.redrawBorders();
            }, 250);
        });
    }

    redrawBorders() {
        // Remove all existing sketches
        this.sketches.forEach(sketch => sketch.remove());
        this.sketches = [];
        this.sketchStates.clear();
        // Recreate with current style and color
        this.createBorderSketches();
    }

    switchStyleFromSegment(newStyle) {
        this.currentStyle = newStyle;

        // Update segment visual state
        document.querySelectorAll('.pattern-segment').forEach(segment => {
            const isActive = segment.dataset.styleKey === newStyle;
            segment.style.color = isActive ? '#623734' : 'rgba(98, 55, 52, 0.5)';
            segment.style.background = isActive ? 'white' : 'transparent';
            segment.style.boxShadow = isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none';
        });

        // Fade out, redraw, fade in
        document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
            el.style.transition = 'opacity 0.2s ease';  // Faster fade for switching
            el.style.opacity = '0';
        });

        setTimeout(() => {
            this.redrawBorders();
            setTimeout(() => {
                document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                    el.style.opacity = '1';
                });
            }, 50);
        }, 200);  // Match the faster transition time
    }

    switchStyle(newStyle) {
        this.switchStyleFromSegment(newStyle);
    }

    createBorderSketches() {
        // Handle full frame borders
        const frameBorders = document.querySelectorAll('.block-border');
        frameBorders.forEach((border, index) => {
            border.style.background = 'none';
            // Clear any existing canvases
            border.innerHTML = '';

            // Create ONLY left border
            const leftContainer = document.createElement('div');
            leftContainer.className = 'border-left';
            leftContainer.id = `border-canvas-left-${index}`;
            border.appendChild(leftContainer);

            // Create sketch only for left side
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

                // Smaller strips for vertical borders for smoother gradients
                const stripSize = orientation === 'vertical' ? 2 : 6;
                const xStep = orientation === 'vertical' ? 1 : 2;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x += xStep) {
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
                        // Same baseline for both orientations - approaches white
                        const baseline = 238;
                        const r = p.lerp(baseline, baseColor[0], p.pow(value, 1.2));
                        const g = p.lerp(baseline - 2, baseColor[1], value);
                        const b = p.lerp(baseline - 4, baseColor[2], value * 0.8);

                        p.fill(r, g, b);
                        p.noStroke();
                        p.rect(x, y, xStep, stripSize);
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
                const numBands = 2;  // Just 2 bands for maximum contrast
                for (let i = 0; i < numBands; i++) {
                    bands.push({
                        offset: p.random(1000),
                        speed: p.random(0.025, 0.06),  // Slowed down by 50%
                        scale: p.random(0.015, 0.05),  // Larger scale for bigger bands
                        intensity: p.random(8.0, 25.0)  // Much higher intensity
                    });
                }
                p.noStroke();
                p.frameRate(12);  // REDUCED from 60 for better performance
            };

            p.draw = () => {
                // Smaller strips for vertical borders for smoother gradients
                const stripSize = orientation === 'vertical' ? 2 : 6;
                const xStep = orientation === 'vertical' ? 1 : 2;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x += xStep) {
                        let heat = 0;

                        // Combine bands with multiplication for more extreme variation
                        let combinedHeat = 1;
                        bands.forEach(band => {
                            const pos = orientation === 'vertical' ? y : x;
                            const noiseVal = p.noise(
                                pos * band.scale,
                                offset + band.offset
                            );
                            combinedHeat *= (noiseVal * band.intensity);
                        });

                        // Normalize and apply extreme contrast curve
                        const normalized = p.constrain(combinedHeat, 0, 50) / 50;  // Much wider range
                        // Use a very aggressive curve for dramatic banding
                        const heatCurve = p.constrain(p.pow(normalized, 0.15), 0, 1);  // Even steeper

                        // Map to colors - darker baseline for vertical borders for visibility
                        const baseline = orientation === 'vertical' ? 100 : 80;  // Darker for vertical
                        const r = p.lerp(baseline, baseColor[0], heatCurve);
                        const g = p.lerp(baseline, baseColor[1], heatCurve);
                        const b = p.lerp(baseline, baseColor[2], heatCurve);

                        p.fill(r, g, b);
                        p.rect(x, y, xStep, stripSize);
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
                // Smaller strips for vertical borders for smoother gradients
                const stripSize = orientation === 'vertical' ? 2 : 6;
                const xStep = orientation === 'vertical' ? 1 : 2;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x += xStep) {
                        // Simplified to 2-octave noise for performance
                        const n1 = p.noise(x * 0.05, y * 0.05, zoff);
                        const n2 = p.noise(x * 0.1, y * 0.1, zoff * 0.5);

                        const combined = (n1 * 0.6 + n2 * 0.4);  // Removed third octave

                        // Same baseline for both orientations - approaches white
                        const baseline = 238;
                        const r = p.lerp(baseline, baseColor[0], p.pow(combined, 1.2));
                        const g = p.lerp(baseline - 2, baseColor[1], combined);
                        const b = p.lerp(baseline - 4, baseColor[2], combined * 0.8);

                        p.fill(r, g, b);
                        p.rect(x, y, xStep, stripSize);
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
