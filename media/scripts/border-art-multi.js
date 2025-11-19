/**
 * MULTI-STYLE BORDER ART SYSTEM
 *
 * Four distinct algorithmic art styles for borders:
 * 1. Digital Weave - Intersecting sine waves creating textile patterns
 * 2. Thermal Drift - Layered gradient bands with organic movement
 * 3. Organic Noise - Pure Perlin noise with thermal color mapping
 * 4. Kaleidoscope - Symmetric mirrored patterns with rotating color wheels
 */

class BorderArtSystem {
    constructor() {
        this.sketches = [];
        this.sketchStates = new Map(); // Track sketch visibility and state
        this.firstDrawComplete = new Map(); // Track which sketches have completed their first draw
        this.sketchHeights = new Map(); // Track height of each sketch to prevent unnecessary redraws
        this.lastRedrawTime = 0; // Track when we last redrew to prevent too-frequent redraws
        this.allSketchesReady = false;
        this.totalSketchesExpected = 0;
        this.styles = {
            'digital-weave': 'Weave',
            'thermal-drift': 'Drift',
            'organic-noise': 'Noise',
            'kaleidoscope': 'Kaleidoscope'
        };
        // Randomly select a style on page load
        const styleKeys = Object.keys(this.styles);
        this.currentStyle = styleKeys[Math.floor(Math.random() * styleKeys.length)];
        // 24 colors: organized for smooth gradient flow
        // Format: { color: [r, g, b], name: 'Color Name' }
        this.colorPalette = [
            // Row 1: Light/bright across spectrum
            { color: [240, 95, 64],   name: 'Persimmon' },
            { color: [252, 92, 125],  name: 'Fuchsia' },
            { color: [255, 177, 66],  name: 'Cantaloupe' },
            { color: [180, 235, 80],  name: 'Chartreuse' },
            { color: [163, 203, 56],  name: 'Lime' },
            { color: [85, 239, 196],  name: 'Mint' },
            { color: [120, 175, 230], name: 'Bluebell' },
            { color: [200, 180, 235], name: 'Lavender' },

            // Row 2: Medium brightness across spectrum
            { color: [235, 77, 75],   name: 'Scarlet' },
            { color: [225, 112, 85],  name: 'Terracotta' },
            { color: [255, 159, 64],  name: 'Coral' },
            { color: [39, 174, 96],   name: 'Emerald' },
            { color: [26, 188, 156],  name: 'Turquoise' },
            { color: [100, 149, 237], name: 'Cornflower' },
            { color: [84, 160, 255],  name: 'Azure' },
            { color: [153, 153, 238], name: 'Periwinkle' },

            // Row 3: Darker/richer across spectrum
            { color: [214, 48, 49],   name: 'Crimson' },
            { color: [245, 124, 0],   name: 'Burnt Orange' },
            { color: [241, 196, 15],  name: 'Sunflower' },
            { color: [0, 148, 133],   name: 'Teal' },
            { color: [15, 82, 186],   name: 'Sapphire' },
            { color: [28, 107, 196],  name: 'Cobalt' },
            { color: [38, 97, 156],   name: 'Lapis Lazuli' },
            { color: [155, 89, 182],  name: 'Amethyst' }
        ];
        // Pick ONE random color for this page load - all borders will use this color
        const randomIndex = Math.floor(Math.random() * this.colorPalette.length);
        this.currentColor = this.colorPalette[randomIndex].color;

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
        // Start rendering as soon as DOM is ready, don't wait for images
        const initBorders = () => {

            // Set initial opacity to 0 immediately
            document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                el.style.opacity = '0';
            });

            // Small delay to ensure DOM layout is stable
            setTimeout(() => {
                this.createHUD();

                // Set transition for smooth fade-in
                document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                    el.style.transition = 'opacity 2.4s ease';  // Very slow, luxurious fade
                });

                this.createBorderSketches();
                this.setupWindowResize();

                // Borders will fade in individually as each sketch completes its first draw
                // via the fadeInBorder() method called from each sketch's draw() function

                // Fallback: if any sketches don't complete in 15 seconds, fade them in anyway
                setTimeout(() => {
                    const remaining = this.totalSketchesExpected - this.firstDrawComplete.size;
                    if (remaining > 0) {
                        // Fade in any remaining borders
                        document.querySelectorAll('.block-border, #topbar, #bottombar').forEach(el => {
                            if (el.style.opacity !== '1') {
                                el.style.opacity = '1';
                            }
                        });
                    }
                }, 15000);
            }, 100);
        };

        // Start as soon as DOM is ready, not when all images load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initBorders);
        } else {
            // DOM already ready
            initBorders();
        }
    }

    createHUD() {
        // Check if HUD already exists - prevent duplicates
        if (document.getElementById('border-art-customize')) {
            return;
        }

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

        const colorLabelContainer = document.createElement('div');
        colorLabelContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;

        const colorLabel = document.createElement('div');
        colorLabel.textContent = 'Color Palette';
        colorLabel.style.cssText = `
            font-weight: bold;
            color: #623734;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        const colorName = document.createElement('div');
        colorName.id = 'selected-color-name';
        colorName.style.cssText = `
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        colorLabelContainer.appendChild(colorLabel);
        colorLabelContainer.appendChild(colorName);

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
        this.colorPalette.forEach((colorEntry, index) => {
            const swatch = document.createElement('div');
            const color = colorEntry.color;
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
        content.appendChild(colorLabelContainer);
        content.appendChild(colorGrid);

        hud.appendChild(buttonText);
        hud.appendChild(closeBtn);
        hud.appendChild(content);
        document.body.appendChild(hud);

        // Set initial color name after HUD is in DOM
        this.updateColorName();

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

    updateColorName() {
        const colorNameElement = document.getElementById('selected-color-name');
        if (!colorNameElement) return;

        // Find the current color entry
        const colorEntry = this.colorPalette.find(
            entry => JSON.stringify(entry.color) === JSON.stringify(this.currentColor)
        );

        if (colorEntry) {
            colorNameElement.textContent = colorEntry.name;
            colorNameElement.style.color = `rgb(${this.currentColor[0]}, ${this.currentColor[1]}, ${this.currentColor[2]})`;
        }
    }

    changeColor(newColor) {
        this.currentColor = newColor;
        this.updateColorName();

        // Update swatch highlights - use the color-swatch class
        const swatches = this.hudElement.querySelectorAll('.color-swatch');
        swatches.forEach((swatch) => {
            const colorIndex = parseInt(swatch.dataset.colorIndex);
            const color = this.colorPalette[colorIndex].color;
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

    fadeInBorder(containerId) {
        // Find the border element associated with this sketch
        let borderElement;

        if (containerId.includes('page-top')) {
            borderElement = document.getElementById('topbar');
        } else if (containerId.includes('page-bottom')) {
            borderElement = document.getElementById('bottombar');
        } else {
            // For left borders, find the parent .block-border
            const container = document.getElementById(containerId);
            if (container) {
                borderElement = container.closest('.block-border');
            }
        }

        if (borderElement && !this.firstDrawComplete.has(containerId)) {
            this.firstDrawComplete.set(containerId, true);
            borderElement.style.opacity = '1';
        }
    }

    checkHeightsChanged() {
        // Check if any sketch heights have changed significantly
        // Use a threshold to ignore minor changes from Safari bounce scroll
        const THRESHOLD = 20; // Ignore changes smaller than 20px
        let heightsChanged = false;

        for (const [containerId, storedData] of this.sketchHeights.entries()) {
            const container = document.getElementById(containerId);
            if (!container) continue;

            let currentHeight;
            if (storedData.orientation === 'vertical') {
                const parent = container.parentElement;
                const grandparent = parent ? parent.parentElement : null;
                const sectionHeight = grandparent ? grandparent.scrollHeight : 0;

                // Cap at viewport height (same logic as createSketch)
                currentHeight = Math.min(sectionHeight, window.innerHeight);
            } else {
                currentHeight = container.offsetHeight || 42;
            }

            // Only count as changed if difference exceeds threshold
            const heightDiff = Math.abs(currentHeight - storedData.height);
            if (heightDiff > THRESHOLD) {
                heightsChanged = true;
                break;
            }
        }

        return heightsChanged;
    }

    setupWindowResize() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // On mobile, only redraw on orientation change (portrait/landscape)
            let currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

            window.addEventListener('resize', () => {
                const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
                if (newOrientation !== currentOrientation) {
                    currentOrientation = newOrientation;
                    // Small delay to let layout settle after rotation
                    setTimeout(() => {
                        this.redrawBordersIfNeeded();
                    }, 300);
                }
            });
        } else {
            // On desktop, redraw on resize with debounce
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.redrawBordersIfNeeded();
                }, 250);
            });
        }

        // Also check when images load (they can change layout heights)
        // Use a longer debounce to let layout settle
        let imageLoadTimeout;
        document.querySelectorAll('img').forEach(img => {
            // Only attach if not already loaded
            if (!img.complete) {
                img.addEventListener('load', () => {
                    clearTimeout(imageLoadTimeout);
                    imageLoadTimeout = setTimeout(() => {
                        this.redrawBordersIfNeeded();
                    }, 500); // Longer timeout to let layout fully settle
                }, { once: true });
            }
        });
    }

    redrawBordersIfNeeded() {
        const now = Date.now();
        const timeSinceLastRedraw = now - this.lastRedrawTime;

        // Don't redraw more than once every 2 seconds to prevent flashing
        if (timeSinceLastRedraw < 2000) {
            return;
        }

        // Only redraw if heights have actually changed
        if (this.checkHeightsChanged()) {
            this.redrawBorders();
        }
    }

    redrawBorders() {
        // Track when we redrew
        this.lastRedrawTime = Date.now();

        // Remove all existing sketches
        this.sketches.forEach(sketch => sketch.remove());
        this.sketches = [];
        this.sketchStates.clear();
        // Note: firstDrawComplete will be cleared in createBorderSketches()
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
        // Reset sketch tracking
        this.totalSketchesExpected = 0;
        this.firstDrawComplete.clear();
        this.sketchHeights.clear();

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
            return;
        }

        // Check if canvas already exists - prevent duplicate canvases
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) {
            console.log(`Canvas already exists in ${containerId}, skipping creation`);
            return;
        }

        // Check height - for vertical borders, check grandparent height
        let height;
        if (orientation === 'vertical') {
            const parent = container.parentElement;
            const grandparent = parent ? parent.parentElement : null;
            const sectionHeight = grandparent ? grandparent.scrollHeight : 0;

            // Cap at viewport height for performance - creates sticky viewport-height borders
            height = Math.min(sectionHeight, window.innerHeight);
        } else {
            height = container.offsetHeight || 42;
        }

        if (height <= 0) {
            return;
        }

        // Store the height for this sketch
        this.sketchHeights.set(containerId, { height, orientation });

        // Increment expected sketches count
        this.totalSketchesExpected++;

        const styleFunc = this.getStyleFunction(this.currentStyle);
        const sketch = styleFunc(containerId, seed, orientation);
        const p5Instance = new p5(sketch);
        this.sketches.push(p5Instance);

        // Store reference and observe for visibility
        this.sketchStates.set(containerId, { p5Instance, container });
        this.observer.observe(container);

        // Set explicit height on the border-left element for sticky positioning
        if (orientation === 'vertical') {
            container.style.height = `${height}px`;
        }
    }

    getStyleFunction(styleName) {
        switch (styleName) {
            case 'digital-weave':
                return this.digitalWeaveStyle.bind(this);
            case 'thermal-drift':
                return this.thermalDriftStyle.bind(this);
            case 'organic-noise':
                return this.organicNoiseStyle.bind(this);
            case 'kaleidoscope':
                return this.kaleidoscopeStyle.bind(this);
            default:
                return this.digitalWeaveStyle.bind(this);
        }
    }

    // STYLE 1: Digital Weave - Intersecting sine waves creating textile patterns
    digitalWeaveStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;
        const borderSystem = this; // Capture reference to BorderArtSystem

        return (p) => {
            let w, h, time = 0;
            let canvasWidth, canvasHeight;
            let frequencies = [];
            let firstDrawDone = false;

            p.setup = () => {
                const container = document.getElementById(containerId);
                w = container.offsetWidth || 20;
                // For vertical borders, use the grandparent's height (the .content block)
                if (orientation === 'vertical') {
                    const parent = container.parentElement; // .block-border
                    const grandparent = parent ? parent.parentElement : null; // .content
                    // Use scrollHeight to get full content height including any overflow
                    const sectionHeight = grandparent ? grandparent.scrollHeight : window.innerHeight;
                    // Cap at viewport height for performance - sticky borders
                    h = Math.min(sectionHeight, window.innerHeight);
                } else {
                    h = container.offsetHeight || 42;
                }

                // Skip if height is 0 or too small
                if (h <= 0) {
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

                // Notify system that first draw is complete
                if (!firstDrawDone) {
                    firstDrawDone = true;
                    borderSystem.fadeInBorder(containerId);
                }
            };
        };
    }

    // STYLE 2: Thermal Drift - Layered gradient bands with organic movement
    thermalDriftStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;
        const borderSystem = this; // Capture reference to BorderArtSystem

        return (p) => {
            let w, h, offset = 0;
            let bands = [];
            let firstDrawDone = false;

            p.setup = () => {
                const container = document.getElementById(containerId);
                w = container.offsetWidth || 20;
                // For vertical borders, use the grandparent's height (the .content block)
                if (orientation === 'vertical') {
                    const parent = container.parentElement; // .block-border
                    const grandparent = parent ? parent.parentElement : null; // .content
                    // Use scrollHeight to get full content height including any overflow
                    const sectionHeight = grandparent ? grandparent.scrollHeight : window.innerHeight;
                    // Cap at viewport height for performance - sticky borders
                    h = Math.min(sectionHeight, window.innerHeight);
                } else {
                    h = container.offsetHeight || 42;
                }

                // Skip if height is 0 or too small
                if (h <= 0) {
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

                        // Map to colors - same dark baseline for both orientations
                        const baseline = 80;  // Same dark baseline for maximum contrast
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

                // Notify system that first draw is complete
                if (!firstDrawDone) {
                    firstDrawDone = true;
                    borderSystem.fadeInBorder(containerId);
                }
            };
        };
    }

    // STYLE 3: Organic Noise - Pure Perlin noise with thermal color mapping
    organicNoiseStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;
        const borderSystem = this; // Capture reference to BorderArtSystem

        return (p) => {
            let w, h, zoff = 0;
            let firstDrawDone = false;

            p.setup = () => {
                const container = document.getElementById(containerId);
                w = container.offsetWidth || 20;
                // For vertical borders, use the grandparent's height (the .content block)
                if (orientation === 'vertical') {
                    const parent = container.parentElement; // .block-border
                    const grandparent = parent ? parent.parentElement : null; // .content
                    // Use scrollHeight to get full content height including any overflow
                    const sectionHeight = grandparent ? grandparent.scrollHeight : window.innerHeight;
                    // Cap at viewport height for performance - sticky borders
                    h = Math.min(sectionHeight, window.innerHeight);
                } else {
                    h = container.offsetHeight || 42;
                }

                // Skip if height is 0 or too small
                if (h <= 0) {
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

                // Notify system that first draw is complete
                if (!firstDrawDone) {
                    firstDrawDone = true;
                    borderSystem.fadeInBorder(containerId);
                }
            };
        };
    }

    // STYLE 4: Kaleidoscope - Symmetric mirrored patterns with rotating color wheels
    kaleidoscopeStyle(containerId, seed, orientation) {
        const baseColor = this.currentColor;
        const borderSystem = this; // Capture reference to BorderArtSystem

        // Calculate perceived brightness to determine if color is light or dark
        const brightness = (baseColor[0] * 0.299 + baseColor[1] * 0.587 + baseColor[2] * 0.114);
        const isLightColor = brightness > 180;

        return (p) => {
            let w, h, time = 0;
            let symmetryLayers = [];
            let firstDrawDone = false;

            p.setup = () => {
                const container = document.getElementById(containerId);
                w = container.offsetWidth || 20;
                // For vertical borders, use the grandparent's height (the .content block)
                if (orientation === 'vertical') {
                    const parent = container.parentElement; // .block-border
                    const grandparent = parent ? parent.parentElement : null; // .content
                    // Use scrollHeight to get full content height including any overflow
                    const sectionHeight = grandparent ? grandparent.scrollHeight : window.innerHeight;
                    // Cap at viewport height for performance - sticky borders
                    h = Math.min(sectionHeight, window.innerHeight);
                } else {
                    h = container.offsetHeight || 42;
                }

                // Skip if height is 0 or too small
                if (h <= 0) {
                    p.noLoop();
                    return;
                }

                const canvas = p.createCanvas(w, h);
                canvas.parent(containerId);
                p.randomSeed(seed * 8888);

                // Create multiple symmetry layers with different patterns
                const numLayers = 6;
                for (let i = 0; i < numLayers; i++) {
                    symmetryLayers.push({
                        freq: p.random(0.015, 0.04),     // Frequency of pattern
                        speed: p.random(-0.2, 0.2),      // Rotation speed
                        phase: p.random(p.TWO_PI),       // Phase offset
                        symmetry: p.floor(p.random(2, 5)), // Number of symmetry axes (2-4)
                        amplitude: p.random(0.5, 1.0),   // Pattern strength
                        colorShift: p.random(p.TWO_PI)   // Color wheel offset
                    });
                }
                p.noStroke();
                p.frameRate(12);
            };

            p.draw = () => {
                const stripSize = orientation === 'vertical' ? 2 : 6;
                const xStep = orientation === 'vertical' ? 1 : 2;
                const dimension = orientation === 'vertical' ? h : w;
                const crossDim = orientation === 'vertical' ? w : h;

                for (let y = 0; y < h; y += stripSize) {
                    for (let x = 0; x < w; x += xStep) {
                        const pos = orientation === 'vertical' ? y : x;
                        const cross = orientation === 'vertical' ? x : y;

                        let totalIntensity = 0;
                        let colorRotation = 0;

                        // Calculate symmetric pattern values
                        symmetryLayers.forEach(layer => {
                            // Create mirrored position (kaleidoscope effect)
                            const mirrorPos = Math.abs((pos % (dimension / layer.symmetry)) - (dimension / layer.symmetry / 2));

                            // Create radial-like pattern using both dimensions
                            const dist = p.sqrt(mirrorPos * mirrorPos + cross * cross * 0.5);

                            // Rotating wave pattern
                            const angle = p.atan2(cross - crossDim/2, mirrorPos - dimension/4);
                            const wave = p.sin(dist * layer.freq + angle * layer.symmetry + time * layer.speed + layer.phase);

                            // Secondary symmetry wave
                            const wave2 = p.cos(mirrorPos * layer.freq * 1.5 + time * layer.speed * 0.7);

                            // Combine waves with symmetry
                            const pattern = (wave + wave2) * 0.5 * layer.amplitude;
                            totalIntensity += Math.abs(pattern);

                            // Rotating color wheel
                            colorRotation += p.sin(time * 0.1 + layer.colorShift) * 0.3;
                        });

                        // Normalize and enhance
                        totalIntensity = totalIntensity / symmetryLayers.length;
                        totalIntensity = p.pow(p.constrain(totalIntensity, 0, 1), 0.6);

                        // Apply rotating color wheel effect
                        const hueShift = (time * 0.05 + colorRotation) % 1.0;

                        // Mix base color with color wheel rotation
                        // For light colors, use dark baseline and invert intensity
                        // For dark colors, use light baseline
                        let r, g, b;
                        if (isLightColor) {
                            // Light color: go from dark to light (inverted)
                            const baseline = 90;
                            const invertedIntensity = 1 - totalIntensity;
                            r = p.lerp(baseColor[0], baseline, invertedIntensity * (1 + p.sin(hueShift * p.TWO_PI) * 0.3));
                            g = p.lerp(baseColor[1], baseline - 8, invertedIntensity * (1 + p.sin(hueShift * p.TWO_PI + p.TWO_PI/3) * 0.3));
                            b = p.lerp(baseColor[2], baseline - 12, invertedIntensity * (1 + p.sin(hueShift * p.TWO_PI + 2*p.TWO_PI/3) * 0.3));
                        } else {
                            // Dark color: go from light to dark (normal)
                            const baseline = 220;
                            r = p.lerp(baseline, baseColor[0], totalIntensity * (1 + p.sin(hueShift * p.TWO_PI) * 0.3));
                            g = p.lerp(baseline - 8, baseColor[1], totalIntensity * (1 + p.sin(hueShift * p.TWO_PI + p.TWO_PI/3) * 0.3));
                            b = p.lerp(baseline - 12, baseColor[2], totalIntensity * (1 + p.sin(hueShift * p.TWO_PI + 2*p.TWO_PI/3) * 0.3));
                        }

                        p.fill(r, g, b);
                        p.rect(x, y, xStep, stripSize);
                    }
                }

                time += 0.18;  // Kaleidoscope rotation speed

                // Notify system that first draw is complete
                if (!firstDrawDone) {
                    firstDrawDone = true;
                    borderSystem.fadeInBorder(containerId);
                }
            };
        };
    }
}

// Initialize - only once
if (!window.borderArtSystemInitialized) {
    window.borderArtSystemInitialized = true;

    if (typeof p5 === 'undefined') {
        window.addEventListener('load', () => {
            if (typeof p5 !== 'undefined' && !window.borderArtSystemInstance) {
                window.borderArtSystemInstance = new BorderArtSystem();
                window.borderArtSystemInstance.init();
            }
        });
    } else {
        if (!window.borderArtSystemInstance) {
            window.borderArtSystemInstance = new BorderArtSystem();
            window.borderArtSystemInstance.init();
        }
    }
}
