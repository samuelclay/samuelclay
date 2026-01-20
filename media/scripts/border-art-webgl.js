/**
 * WEBGL BORDER ART SYSTEM
 *
 * Eight distinct algorithmic art styles rendered via WebGL shaders:
 * 1. Cirrus - Flowing aurora ribbons with shimmer
 * 2. Stratus - Dense layered wave bands
 * 3. Cumulus - Billowing smoke/cloud effect
 * 4. Nimbus - Ink-in-water swirling motion
 * 5. Aurora - Northern lights with vertical flowing bands
 * 6. Marble - Fluid marble with organic veins
 * 7. Ripple - Water interference patterns
 * 8. Plasma - Classic plasma with sine interference
 */

(function() {
    const FRAME_INTERVAL = 33; // ~30fps
    let initialized = false;
    let isPageVisible = true;
    let visibleCanvases = new Set();

    // Shared vertex shader - simple fullscreen quad
    const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_position;
        void main() {
            gl_Position = vec4(a_position, 0, 1);
            v_position = a_position;
        }
    `;

    // Common shader functions (noise, etc.)
    const shaderCommon = `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_isDark;
        uniform vec3 u_baseColor;
        uniform float u_orientation; // 0 = horizontal, 1 = vertical
        uniform float u_opacity; // For fade transitions
        varying vec2 v_position;

        // Cheap hash function
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return fract(sin(p) * 43758.5453);
        }

        // Simple value noise
        float vnoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                f.y
            );
        }

        // Get base background color (light or dark theme)
        vec3 getBaseBg() {
            vec3 lightBg = vec3(0.933, 0.918, 0.902); // #EEEAe7
            vec3 darkBg = vec3(0.15, 0.15, 0.17);
            return mix(lightBg, darkBg, u_isDark);
        }

        // Output final color with opacity fade applied
        void outputColor(vec3 color) {
            vec3 bg = getBaseBg();
            gl_FragColor = vec4(mix(bg, color, u_opacity), 1.0);
        }

        // Worley (cellular) noise for puffy cloud shapes
        float worley(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float minDist = 1.0;
            for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                    vec2 neighbor = vec2(float(x), float(y));
                    vec2 point = hash2(i + neighbor);
                    point = 0.5 + 0.5 * sin(u_time * 0.3 + 6.2831 * point);
                    float dist = length(neighbor + point - f);
                    minDist = min(minDist, dist);
                }
            }
            return minDist;
        }

        // Fractal Brownian Motion for turbulent clouds
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 5; i++) {
                value += amplitude * vnoise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }
    `;

    // STYLE 1: Nimbus - Ink-in-water swirling motion
    const fsNimbus = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Swirling distortion based on position
            float angle = u_time * 0.15;
            vec2 center = vec2(0.5 + sin(u_time * 0.1) * 0.3, 0.5 + cos(u_time * 0.12) * 0.2);
            vec2 toCenter = uv - center;
            float dist = length(toCenter);
            float swirl = sin(dist * 8.0 - u_time * 0.5) * 0.5;

            vec2 warped = uv + vec2(
                sin(uv.y * 10.0 + u_time * 0.3 + swirl) * 0.03,
                cos(uv.x * 8.0 + u_time * 0.25) * 0.03
            );

            // Layered noise with warped coordinates
            float n1 = vnoise(warped * 5.0 + u_time * 0.1);
            float n2 = vnoise(warped * 10.0 - u_time * 0.08 + 50.0);

            float value = n1 * 0.6 + n2 * 0.4;
            value = smoothstep(0.3, 0.7, value);
            value = 0.45 + value * 0.45; // Softer contrast

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 2: Stratus - Dense layered bands
    const fsStratus = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            float pos = mix(uv.x, uv.y, u_orientation);
            float cross = mix(uv.y, uv.x, u_orientation);

            // Many dense overlapping wave layers
            float w1 = sin(pos * 30.0 + u_time * 0.5 + cross * 4.0) * 0.5 + 0.5;
            float w2 = sin(pos * 45.0 - u_time * 0.4 + cross * 6.0 + 1.0) * 0.5 + 0.5;
            float w3 = sin(pos * 20.0 + u_time * 0.6 + cross * 3.0 + 2.0) * 0.5 + 0.5;
            float w4 = sin(pos * 55.0 - u_time * 0.3 + cross * 5.0 + 3.0) * 0.5 + 0.5;
            float w5 = sin(pos * 35.0 + u_time * 0.7 + cross * 7.0 + 4.0) * 0.5 + 0.5;

            // Noise for organic variation
            float n = vnoise(uv * 6.0 + u_time * 0.1) * 0.2;

            // Combine all waves densely
            float value = (w1 + w2 + w3 + w4 + w5) / 5.0 + n;
            value = smoothstep(0.3, 0.7, value);
            value = 0.4 + value * 0.5;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 3: Cirrus - Flowing aurora ribbons with shimmer
    const fsCirrus = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Create flowing ribbon effect
            float flow = uv.y + sin(uv.x * 6.0 + u_time * 0.4) * 0.15;
            flow += sin(uv.x * 12.0 - u_time * 0.3) * 0.08;
            flow += sin(uv.x * 3.0 + u_time * 0.2) * 0.2;

            // Multiple ribbon layers at different phases
            float ribbon1 = sin(flow * 8.0 + u_time * 0.5) * 0.5 + 0.5;
            float ribbon2 = sin(flow * 12.0 - u_time * 0.4 + 1.5) * 0.5 + 0.5;
            float ribbon3 = sin(flow * 5.0 + u_time * 0.6 + 3.0) * 0.5 + 0.5;

            // Add shimmer with high-frequency noise
            float shimmer = vnoise(uv * 30.0 + u_time * 0.8) * 0.2;
            float sparkle = pow(vnoise(uv * 50.0 + u_time * 1.2), 3.0) * 0.3;

            // Combine ribbons with soft glow
            float value = ribbon1 * 0.4 + ribbon2 * 0.35 + ribbon3 * 0.25;
            value = smoothstep(0.2, 0.8, value);
            value += shimmer + sparkle;
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 5: Aurora - Northern lights with vertical flowing bands
    const fsAurora = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Vertical curtain effect
            float curtain = uv.x * 10.0;
            curtain += sin(uv.y * 3.0 + u_time * 0.3) * 2.0;
            curtain += sin(uv.y * 7.0 - u_time * 0.2) * 1.0;

            // Flowing bands
            float band1 = sin(curtain + u_time * 0.4) * 0.5 + 0.5;
            float band2 = sin(curtain * 1.3 - u_time * 0.35 + 2.0) * 0.5 + 0.5;
            float band3 = sin(curtain * 0.7 + u_time * 0.5 + 4.0) * 0.5 + 0.5;

            // Vertical fade for aurora effect
            float fade = pow(1.0 - uv.y, 0.5);
            fade *= (0.5 + vnoise(vec2(uv.x * 5.0, u_time * 0.2)) * 0.5);

            // Dancing lights effect
            float dance = vnoise(vec2(uv.x * 8.0, uv.y * 2.0 + u_time * 0.3)) * 0.3;

            float value = (band1 * 0.5 + band2 * 0.3 + band3 * 0.2) * fade + dance;
            value = smoothstep(0.1, 0.7, value);
            value = 0.3 + value * 0.6;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 6: Marble - Fluid marble with veins and swirls
    const fsMarble = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Domain warping for organic marble veins
            vec2 p = uv * 3.0;
            float warp1 = fbm(p + u_time * 0.1);
            float warp2 = fbm(p + vec2(5.2, 1.3) + u_time * 0.08);

            vec2 q = vec2(warp1, warp2);
            float warp3 = fbm(p + 4.0 * q + vec2(1.7, 9.2) + u_time * 0.06);
            float warp4 = fbm(p + 4.0 * q + vec2(8.3, 2.8) + u_time * 0.05);

            vec2 r = vec2(warp3, warp4);
            float marble = fbm(p + 4.0 * r);

            // Create veins with sharper contrast
            float veins = sin(marble * 10.0 + uv.x * 5.0 + uv.y * 3.0) * 0.5 + 0.5;
            veins = pow(veins, 0.7);

            // Add fine detail
            float detail = vnoise(uv * 20.0 + u_time * 0.15) * 0.15;

            float value = marble * 0.6 + veins * 0.3 + detail;
            value = smoothstep(0.2, 0.8, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 7: Ripple - Water interference patterns
    const fsRipple = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Multiple ripple centers that move slowly
            vec2 center1 = vec2(0.3 + sin(u_time * 0.08) * 0.2, 0.4 + cos(u_time * 0.06) * 0.2);
            vec2 center2 = vec2(0.7 + cos(u_time * 0.07) * 0.2, 0.6 + sin(u_time * 0.09) * 0.2);
            vec2 center3 = vec2(0.5 + sin(u_time * 0.1) * 0.3, 0.3 + cos(u_time * 0.08) * 0.15);

            // Distance from each center
            float d1 = length(uv - center1);
            float d2 = length(uv - center2);
            float d3 = length(uv - center3);

            // Concentric waves with slower time
            float wave1 = sin(d1 * 30.0 - u_time * 0.8) * 0.5 + 0.5;
            float wave2 = sin(d2 * 25.0 - u_time * 0.7 + 1.0) * 0.5 + 0.5;
            float wave3 = sin(d3 * 35.0 - u_time * 0.9 + 2.0) * 0.5 + 0.5;

            // Fade waves by distance
            wave1 *= exp(-d1 * 2.0);
            wave2 *= exp(-d2 * 2.5);
            wave3 *= exp(-d3 * 2.0);

            // Interference pattern
            float value = wave1 + wave2 + wave3;
            value = value / 2.0; // Normalize

            // Add subtle caustics
            float caustics = vnoise(uv * 15.0 + vec2(u_time * 0.12, u_time * 0.08)) * 0.15;
            value += caustics;

            value = smoothstep(0.2, 0.8, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 8: Plasma - Classic plasma with sine interference
    const fsPlasma = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            float t = u_time * 0.5;

            // Classic plasma formula with multiple sine waves
            float v1 = sin(uv.x * 10.0 + t);
            float v2 = sin(uv.y * 10.0 + t * 1.1);
            float v3 = sin((uv.x + uv.y) * 10.0 + t * 0.9);
            float v4 = sin(length(uv - vec2(0.5)) * 15.0 - t * 1.2);

            // Rotating plasma component
            float angle = t * 0.3;
            vec2 rotUV = vec2(
                uv.x * cos(angle) - uv.y * sin(angle),
                uv.x * sin(angle) + uv.y * cos(angle)
            );
            float v5 = sin(rotUV.x * 12.0 + rotUV.y * 8.0 + t);

            // Combine all waves
            float plasma = (v1 + v2 + v3 + v4 + v5) / 5.0;
            plasma = plasma * 0.5 + 0.5; // Normalize to 0-1

            // Add pulsing energy effect
            float pulse = sin(length(uv - vec2(0.5)) * 20.0 - t * 3.0) * 0.1;
            pulse *= (1.0 - length(uv - vec2(0.5)) * 1.5);

            float value = plasma + pulse;
            value = smoothstep(0.2, 0.8, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 4: Cumulus - Billowing smoke/cloud effect
    const fsCumulus = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Create turbulent, billowing motion
            vec2 p = uv * 3.0;

            // Warp coordinates with noise for organic billowing
            float warp1 = vnoise(p + u_time * 0.15);
            float warp2 = vnoise(p * 1.5 + vec2(100.0, 0.0) + u_time * 0.12);
            p += vec2(warp1, warp2) * 0.4;

            // Multiple scales of noise for cloud texture
            float n1 = vnoise(p * 1.0 + u_time * 0.08);
            float n2 = vnoise(p * 2.0 + u_time * 0.1 + 50.0) * 0.5;
            float n3 = vnoise(p * 4.0 + u_time * 0.06 + 100.0) * 0.25;
            float n4 = vnoise(p * 8.0 + u_time * 0.04 + 150.0) * 0.125;

            // Combine for billowy cloud shape
            float clouds = n1 + n2 + n3 + n4;
            clouds = clouds / 1.875; // Normalize

            // Create puffy areas with threshold
            float puff = smoothstep(0.35, 0.65, clouds);

            // Add variation for more interesting shapes
            float detail = vnoise(uv * 12.0 + u_time * 0.2) * 0.15;
            float value = puff + detail;

            value = smoothstep(0.2, 0.9, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // ========== GEOMETRIC PATTERNS ==========

    // STYLE 9: Silk - Flowing wave ribbons
    const fsSilk = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Swap coordinates on vertical borders so ribbons flow along the length
            float along = mix(uv.x, uv.y, u_orientation);
            float across = mix(uv.y, uv.x, u_orientation);

            float pattern = 0.0;

            // Multiple flowing ribbon layers
            for (float i = 0.0; i < 6.0; i++) {
                float phase = i * 1.047; // ~PI/3 offset per layer
                float freq = 3.0 + i * 0.5;
                float amp = 0.15 - i * 0.015;
                float speed = 0.4 + i * 0.1;

                // Primary wave flows along the border length
                float wave = sin(along * freq * 6.28 + u_time * speed + phase);
                wave += sin(along * freq * 2.0 * 6.28 - u_time * speed * 0.7 + phase) * 0.3;
                wave *= amp;

                // Distance from wave center line (across the border width)
                float yOffset = 0.15 + i * 0.12;
                float dist = abs(across - (0.5 + wave + yOffset - 0.45));

                // Soft ribbon with glow
                float ribbon = smoothstep(0.04, 0.0, dist);
                ribbon += smoothstep(0.12, 0.04, dist) * 0.3;

                pattern += ribbon * (1.0 - i * 0.12);
            }

            // Add subtle noise texture
            float noise = vnoise(uv * 20.0 + u_time * 0.2) * 0.1;
            pattern += noise * 0.3;

            float value = 0.25 + pattern * 0.5;
            value = clamp(value, 0.0, 1.0);

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.8);
            outputColor(color);
        }
    `;

    // STYLE 10: Voronoi - Animated Voronoi cells
    const fsVoronoi = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            uv *= 5.0;

            vec2 id = floor(uv);
            vec2 gv = fract(uv);

            float minDist = 1.0;
            float minDist2 = 1.0;

            for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                    vec2 offset = vec2(float(x), float(y));
                    vec2 n = hash2(id + offset);
                    vec2 p = offset + sin(n * 6.28 + u_time * 0.3) * 0.4;
                    float d = length(gv - p);
                    if (d < minDist) {
                        minDist2 = minDist;
                        minDist = d;
                    } else if (d < minDist2) {
                        minDist2 = d;
                    }
                }
            }

            float edge = minDist2 - minDist;
            float value = smoothstep(0.0, 0.15, edge);
            value = 0.3 + value * 0.6;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 11: Chevron - Animated zigzag waves
    const fsChevron = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            float chevron = 0.0;
            for (float i = 0.0; i < 5.0; i++) {
                float freq = 3.0 + i * 2.0;
                float speed = 0.3 + i * 0.1;
                float amp = 1.0 / (i + 1.0);
                float y = uv.y + abs(sin(uv.x * freq + u_time * speed)) * 0.2;
                chevron += sin(y * 15.0 - u_time * 0.5 + i * 1.5) * amp;
            }
            chevron = chevron / 2.5;

            float value = chevron * 0.5 + 0.5;
            value = smoothstep(0.2, 0.8, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 12: Grid - Warped animated grid
    const fsGrid = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Warp the grid
            vec2 warp = vec2(
                sin(uv.y * 8.0 + u_time * 0.4) * 0.05,
                sin(uv.x * 6.0 + u_time * 0.3) * 0.05
            );
            uv += warp;

            // Create grid lines
            vec2 grid = abs(fract(uv * 12.0) - 0.5);
            float lines = min(grid.x, grid.y);
            lines = smoothstep(0.0, 0.08, lines);

            // Add dots at intersections
            vec2 gridId = floor(uv * 12.0);
            float dot = length(fract(uv * 12.0) - 0.5);
            float pulse = sin(hash(gridId) * 6.28 + u_time * 0.8) * 0.5 + 0.5;
            dot = 1.0 - smoothstep(0.1 * pulse, 0.15 * pulse + 0.05, dot);

            float value = lines + dot * 0.4;
            value = 0.3 + value * 0.6;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // ========== NOISE/KALEIDOSCOPIC PATTERNS ==========

    // STYLE 13: Kaleidoscope - Classic mirrored kaleidoscope
    const fsKaleidoscope = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec2 res = u_resolution;

            // For vertical borders, rotate 90 degrees by swapping coordinates
            if (u_orientation > 0.5) {
                uv = vec2(uv.y, uv.x);
                res = vec2(u_resolution.y, u_resolution.x);
            }

            // Center coordinates [-1, 1]
            uv = uv * 2.0 - 1.0;

            // Aspect ratio correction (uses swapped resolution for vertical)
            uv.x *= res.x / res.y;

            // Convert to polar
            float angle = atan(uv.y, uv.x);
            float radius = length(uv);

            // Create kaleidoscope segments
            float segments = 8.0;
            angle = mod(angle, 3.14159 * 2.0 / segments);
            angle = abs(angle - 3.14159 / segments);

            // Back to cartesian with rotation
            vec2 p = vec2(cos(angle), sin(angle)) * radius;
            p += u_time * 0.1;

            // Multi-layer noise pattern
            float n1 = vnoise(p * 3.0);
            float n2 = vnoise(p * 6.0 + 50.0);
            float n3 = vnoise(p * 12.0 + 100.0);

            float value = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
            value = smoothstep(0.3, 0.7, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 14: Swirl - Distributed swirling patterns without center focus
    const fsSwirl = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            float pattern = 0.0;

            // Multiple swirl centers distributed across the canvas
            for (float i = 0.0; i < 4.0; i++) {
                vec2 center = vec2(
                    0.25 + mod(i, 2.0) * 0.5,
                    0.25 + floor(i / 2.0) * 0.5
                );
                vec2 offset = uv - center;
                float r = length(offset);
                float a = atan(offset.y, offset.x);

                // Swirl pattern
                float swirl = sin(a * 3.0 + r * 15.0 - u_time * 0.8 + i * 1.57);
                swirl *= smoothstep(0.5, 0.1, r);
                pattern += swirl * 0.2;
            }

            // Warped turbulence throughout
            vec2 warped = uv;
            warped += vec2(
                sin(uv.y * 10.0 + u_time),
                cos(uv.x * 10.0 + u_time)
            ) * 0.03;
            float turb = vnoise(warped * 8.0 + u_time * 0.3);
            pattern += turb * 0.4;

            // Additional noise layer
            float n2 = vnoise(uv * 12.0 - u_time * 0.2);
            pattern += n2 * 0.25;

            // Moiré-like interference (not centered)
            float moire = sin(uv.x * 30.0 + uv.y * 20.0 + u_time * 0.5);
            moire *= sin(uv.x * 28.0 - uv.y * 22.0 - u_time * 0.4);
            pattern += moire * 0.1;

            float value = 0.5 + pattern * 0.35;
            value = clamp(value, 0.0, 1.0);

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.8);
            outputColor(color);
        }
    `;

    // STYLE 15: Turbulence - Pure turbulent noise
    const fsTurbulence = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Multi-octave turbulence
            float turb = 0.0;
            float amp = 1.0;
            float freq = 2.0;
            vec2 p = uv;

            for (int i = 0; i < 6; i++) {
                turb += abs(vnoise(p * freq + u_time * 0.1 * float(i + 1)) * 2.0 - 1.0) * amp;
                freq *= 2.0;
                amp *= 0.5;
                p += vec2(0.5, 0.3);
            }

            turb = turb / 2.0;
            float value = smoothstep(0.2, 0.9, turb);
            value = 0.3 + value * 0.6;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // STYLE 16: Electric - Lightning/electric pattern
    const fsElectric = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Rotate 90 degrees on vertical borders by swapping x/y
            float along = mix(uv.x, uv.y, u_orientation);  // Along the arc
            float across = mix(uv.y, uv.x, u_orientation); // Perpendicular to arc

            float electric = 0.0;

            // Multiple electric arcs - centered with tighter spacing
            for (float i = 0.0; i < 4.0; i++) {
                // Center the 4 arcs: positions at 0.275, 0.425, 0.575, 0.725
                float arcCenter = 0.275 + i * 0.15;
                float noise1 = vnoise(vec2(along * 8.0 + u_time * 2.0 + i * 50.0, i));
                float noise2 = vnoise(vec2(along * 16.0 - u_time * 1.5 + i * 30.0, i + 10.0)) * 0.5;
                float noise3 = vnoise(vec2(along * 32.0 + u_time * 3.0 + i * 20.0, i + 20.0)) * 0.25;

                float arc = abs(across - arcCenter - (noise1 + noise2 + noise3 - 0.875) * 0.2);
                arc = 1.0 - smoothstep(0.0, 0.03 + noise1 * 0.02, arc);
                electric = max(electric, arc * (0.5 + noise1 * 0.5));
            }

            // Add glow
            float glow = electric * 0.5;

            float value = electric + glow;
            value = smoothstep(0.0, 1.0, value);
            value = 0.3 + value * 0.6;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // ========== NEW NOISE PATTERNS ==========

    // Interference - Overlapping circular waves creating moire patterns
    const fsInterference = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Multiple wave centers
            vec2 c1 = vec2(0.2 + sin(u_time * 0.1) * 0.1, 0.3);
            vec2 c2 = vec2(0.8 + cos(u_time * 0.12) * 0.1, 0.4);
            vec2 c3 = vec2(0.5, 0.7 + sin(u_time * 0.08) * 0.1);

            // Concentric waves from each center
            float d1 = length(uv - c1);
            float d2 = length(uv - c2);
            float d3 = length(uv - c3);

            float wave1 = sin(d1 * 60.0 - u_time * 1.5) * 0.5 + 0.5;
            float wave2 = sin(d2 * 55.0 - u_time * 1.3 + 1.0) * 0.5 + 0.5;
            float wave3 = sin(d3 * 50.0 - u_time * 1.7 + 2.0) * 0.5 + 0.5;

            // Interference pattern from overlapping waves
            float interference = (wave1 + wave2 + wave3) / 3.0;
            interference = pow(interference, 0.8);

            float value = smoothstep(0.2, 0.8, interference);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.75);
            outputColor(color);
        }
    `;

    // Terrain - Domain warped noise with topographic contour lines
    const fsTerrain = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Domain warping for organic terrain shape
            vec2 q = vec2(
                fbm(uv * 2.0 + u_time * 0.05),
                fbm(uv * 2.0 + vec2(5.2, 1.3) + u_time * 0.03)
            );

            float height = fbm(uv * 3.0 + q * 2.0);

            // Create contour lines
            float contours = fract(height * 8.0);
            contours = smoothstep(0.0, 0.1, contours) * smoothstep(0.2, 0.1, contours);

            // Combine base height with contour lines
            float value = height * 0.7 + contours * 0.4;
            value = smoothstep(0.2, 0.8, value);
            value = 0.3 + value * 0.6;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.75);
            outputColor(color);
        }
    `;

    // Smoke - Billowing, flowing noise like rising smoke
    const fsSmoke = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;

            // Rising motion with turbulence
            vec2 flow = uv;
            flow.y -= u_time * 0.15; // Rising motion

            // Multiple layers of warped noise
            vec2 warp1 = vec2(
                vnoise(flow * 3.0 + u_time * 0.1),
                vnoise(flow * 3.0 + 100.0 - u_time * 0.08)
            ) * 0.3;

            vec2 warp2 = vec2(
                vnoise((flow + warp1) * 5.0 + u_time * 0.15),
                vnoise((flow + warp1) * 5.0 + 200.0)
            ) * 0.15;

            // Sample noise at warped coordinates
            float smoke1 = vnoise((flow + warp1 + warp2) * 4.0);
            float smoke2 = vnoise((flow + warp1) * 8.0 + 50.0) * 0.5;
            float smoke3 = vnoise(flow * 16.0 + warp2 * 2.0) * 0.25;

            float value = smoke1 + smoke2 + smoke3;
            value = smoothstep(0.3, 0.9, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    // Static - High frequency dithered noise with digital aesthetic
    const fsStatic = shaderCommon + `
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec2 pixelCoord = gl_FragCoord.xy;

            // High frequency noise layers
            float n1 = vnoise(uv * 50.0 + u_time * 2.0);
            float n2 = vnoise(uv * 100.0 - u_time * 1.5 + 50.0);
            float n3 = vnoise(uv * 25.0 + u_time * 0.5);

            // Scanline effect
            float scanline = sin(pixelCoord.y * 0.5 + u_time * 5.0) * 0.5 + 0.5;
            scanline = pow(scanline, 4.0) * 0.15;

            // Combine with dithering pattern
            float dither = mod(pixelCoord.x + pixelCoord.y, 2.0) * 0.05;

            float value = n1 * 0.5 + n2 * 0.3 + n3 * 0.2 + scanline + dither;
            value = smoothstep(0.25, 0.75, value);
            value = 0.35 + value * 0.55;

            vec3 bg = getBaseBg();
            vec3 color = mix(bg, u_baseColor / 255.0, value * 0.7);
            outputColor(color);
        }
    `;

    const shaders = {
        'stratus': fsStratus,
        'interference': fsInterference,
        'terrain': fsTerrain,
        'smoke': fsSmoke,
        'static': fsStatic,
        'aurora': fsAurora,
        'marble': fsMarble,
        'ripple': fsRipple,
        'silk': fsSilk,
        'voronoi': fsVoronoi,
        'kaleidoscope': fsKaleidoscope,
        'electric': fsElectric
    };

    // Border Art System class
    class BorderArtSystem {
        constructor() {
            this.effects = [];
            this.startTime = performance.now();
            this.lastFrameTime = 0;
            this.currentDpr = window.devicePixelRatio;

            this.styles = {
                'stratus': 'Stratus',
                'interference': 'Interference',
                'terrain': 'Terrain',
                'smoke': 'Smoke',
                'static': 'Static',
                'aurora': 'Aurora',
                'marble': 'Marble',
                'ripple': 'Ripple',
                'silk': 'Silk',
                'voronoi': 'Voronoi',
                'kaleidoscope': 'Kaleidoscope',
                'electric': 'Electric'
            };

            // Fade transition state
            this.fadeOpacity = 0.0; // Start at 0 for initial fade in
            this.fadeDirection = 1; // 1 = fading in, -1 = fading out
            this.fadeDuration = 200; // ms for style/color change transitions
            this.fadeStartTime = performance.now();
            this.pendingStyle = null; // Style to switch to after fade out
            this.firstFrameRendered = false; // Track if we've rendered the first frame

            // Color transition state
            this.targetColor = null;
            this.fadeStartColor = null;
            this.colorFadeProgress = 1.0;
            this.colorFadeStartTime = null;

            // Randomly select a style on page load
            const styleKeys = Object.keys(this.styles);
            this.currentStyle = styleKeys[Math.floor(Math.random() * styleKeys.length)];

            // 24 colors organized for smooth gradient flow
            this.colorPalette = [
                { color: [240, 95, 64], name: 'Persimmon' },
                { color: [252, 92, 125], name: 'Fuchsia' },
                { color: [255, 177, 66], name: 'Cantaloupe' },
                { color: [180, 235, 80], name: 'Chartreuse' },
                { color: [163, 203, 56], name: 'Lime' },
                { color: [85, 239, 196], name: 'Mint' },
                { color: [120, 175, 230], name: 'Bluebell' },
                { color: [200, 180, 235], name: 'Lavender' },
                { color: [235, 77, 75], name: 'Scarlet' },
                { color: [225, 112, 85], name: 'Terracotta' },
                { color: [255, 159, 64], name: 'Coral' },
                { color: [39, 174, 96], name: 'Emerald' },
                { color: [26, 188, 156], name: 'Turquoise' },
                { color: [100, 149, 237], name: 'Cornflower' },
                { color: [84, 160, 255], name: 'Azure' },
                { color: [153, 153, 238], name: 'Periwinkle' },
                { color: [214, 48, 49], name: 'Crimson' },
                { color: [245, 124, 0], name: 'Burnt Orange' },
                { color: [241, 196, 15], name: 'Sunflower' },
                { color: [0, 148, 133], name: 'Teal' },
                { color: [15, 82, 186], name: 'Sapphire' },
                { color: [28, 107, 196], name: 'Cobalt' },
                { color: [38, 97, 156], name: 'Lapis Lazuli' },
                { color: [155, 89, 182], name: 'Amethyst' }
            ];

            // Pick ONE random color for this page load
            const randomIndex = Math.floor(Math.random() * this.colorPalette.length);
            this.currentColor = this.colorPalette[randomIndex].color;

            // Setup visibility observer
            this.observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        visibleCanvases.add(entry.target);
                    } else {
                        visibleCanvases.delete(entry.target);
                    }
                }
            }, { threshold: 0 });
        }

        createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        createProgram(gl, fsSource) {
            const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
            const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
            if (!vs || !fs) return null;

            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(program));
                return null;
            }
            return program;
        }

        getIsDark() {
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'dark') return 1.0;
            if (theme === 'light') return 0.0;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 1.0 : 0.0;
        }

        // Convert RGB to HSL
        rgbToHsl(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return [h, s, l];
        }

        // Convert HSL to RGB
        hslToRgb(h, s, l) {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        // Calculate link colors that are readable on light/dark backgrounds
        getLinkColors(baseColor) {
            const [r, g, b] = baseColor;
            let [h, s, l] = this.rgbToHsl(r, g, b);

            // Light mode - adjust based on hue for readability
            let lightH = h;
            let lightS = s;
            let maxLightness;

            // Yellow hues (h ~0.1-0.2) look muddy when darkened - shift toward orange
            if (h >= 0.1 && h <= 0.2) {
                // Shift yellows toward orange (lower hue) for richer appearance when dark
                lightH = Math.max(0.06, h - 0.04);
                lightS = Math.max(s, 0.7);
                maxLightness = 0.42;
            } else if (h > 0.2 && h <= 0.45) {
                // Chartreuse, green, mint - boost saturation for vibrancy
                lightS = Math.max(s, 0.5);
                maxLightness = 0.38;
            } else if (h > 0.45 && h <= 0.55) {
                // Cyan/teal range
                maxLightness = 0.40;
            } else {
                // Reds, oranges, blues, purples - can be lighter
                maxLightness = 0.45;
            }

            let lightL = Math.min(l, maxLightness);
            const [lightR, lightG, lightB] = this.hslToRgb(lightH, lightS, lightL);

            // Dark mode - lighten dark colors for contrast on dark background
            let darkL = Math.max(l, 0.55);
            const [darkR, darkG, darkB] = this.hslToRgb(h, s, darkL);

            // Hover states - subtle shift
            const [lightHoverR, lightHoverG, lightHoverB] = this.hslToRgb(lightH, lightS, Math.max(0.2, lightL * 0.8));
            const [darkHoverR, darkHoverG, darkHoverB] = this.hslToRgb(h, s, Math.min(0.75, darkL * 1.1));

            return {
                light: `rgb(${lightR}, ${lightG}, ${lightB})`,
                lightHover: `rgb(${lightHoverR}, ${lightHoverG}, ${lightHoverB})`,
                dark: `rgb(${darkR}, ${darkG}, ${darkB})`,
                darkHover: `rgb(${darkHoverR}, ${darkHoverG}, ${darkHoverB})`
            };
        }

        // Update CSS variables for link colors
        updateLinkColors(color) {
            const linkColors = this.getLinkColors(color);
            const root = document.documentElement;

            root.style.setProperty('--link-color-light', linkColors.light);
            root.style.setProperty('--link-color-light-hover', linkColors.lightHover);
            root.style.setProperty('--link-color-dark', linkColors.dark);
            root.style.setProperty('--link-color-dark-hover', linkColors.darkHover);

        }

        getCurrentTheme() {
            return localStorage.getItem('theme') || 'auto';
        }

        getEffectiveTheme() {
            const theme = this.getCurrentTheme();
            if (theme === 'auto') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return theme;
        }

        initEffect(canvas, orientation) {
            if (!canvas) return null;

            const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
            if (!gl) {
                console.error('WebGL not supported');
                return null;
            }

            const fsSource = shaders[this.currentStyle];
            const program = this.createProgram(gl, fsSource);
            if (!program) return null;

            gl.useProgram(program);

            // Setup fullscreen quad
            const posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

            const posLoc = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            // Get uniform locations
            const uniforms = {
                resolution: gl.getUniformLocation(program, 'u_resolution'),
                time: gl.getUniformLocation(program, 'u_time'),
                isDark: gl.getUniformLocation(program, 'u_isDark'),
                baseColor: gl.getUniformLocation(program, 'u_baseColor'),
                orientation: gl.getUniformLocation(program, 'u_orientation'),
                opacity: gl.getUniformLocation(program, 'u_opacity')
            };

            // Set orientation (0 = horizontal, 1 = vertical)
            gl.uniform1f(uniforms.orientation, orientation === 'vertical' ? 1.0 : 0.0);

            return {
                canvas,
                gl,
                program,
                uniforms,
                orientation,
                needsResize: true
            };
        }

        createBorderCanvases() {
            // Clear existing effects
            this.effects = [];
            visibleCanvases.clear();

            // Handle topbar
            const topbar = document.getElementById('topbar');
            if (topbar) {
                topbar.innerHTML = '';
                topbar.style.background = 'none';
                const canvas = document.createElement('canvas');
                canvas.id = 'border-canvas-top';
                canvas.style.cssText = 'width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 0.6s ease-in;';
                topbar.appendChild(canvas);
                const effect = this.initEffect(canvas, 'horizontal');
                if (effect) {
                    this.effects.push(effect);
                    this.observer.observe(canvas);
                }
            }

            // Handle bottombar
            const bottombar = document.getElementById('bottombar');
            if (bottombar) {
                bottombar.innerHTML = '';
                bottombar.style.background = 'none';
                const canvas = document.createElement('canvas');
                canvas.id = 'border-canvas-bottom';
                canvas.style.cssText = 'width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 0.6s ease-in;';
                bottombar.appendChild(canvas);
                const effect = this.initEffect(canvas, 'horizontal');
                if (effect) {
                    this.effects.push(effect);
                    this.observer.observe(canvas);
                }
            }

            // Handle left borders
            const frameBorders = document.querySelectorAll('.block-border');
            frameBorders.forEach((border, index) => {
                border.innerHTML = '';
                border.style.background = 'none';

                const canvas = document.createElement('canvas');
                canvas.id = `border-canvas-left-${index}`;
                canvas.style.cssText = 'width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 0.6s ease-in; border-radius: 4px;';
                border.appendChild(canvas);

                const effect = this.initEffect(canvas, 'vertical');
                if (effect) {
                    this.effects.push(effect);
                    this.observer.observe(canvas);
                }
            });
        }

        rebuildWithStyle(newStyle) {
            this.currentStyle = newStyle;

            // Rebuild all effects with new shader
            for (const effect of this.effects) {
                const { canvas, gl, orientation } = effect;

                // Create new program with new shader
                const fsSource = shaders[newStyle];
                const program = this.createProgram(gl, fsSource);
                if (!program) continue;

                gl.useProgram(program);

                // Re-setup vertex attributes
                const posBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

                const posLoc = gl.getAttribLocation(program, 'a_position');
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

                // Update uniform locations
                effect.program = program;
                effect.uniforms = {
                    resolution: gl.getUniformLocation(program, 'u_resolution'),
                    time: gl.getUniformLocation(program, 'u_time'),
                    isDark: gl.getUniformLocation(program, 'u_isDark'),
                    baseColor: gl.getUniformLocation(program, 'u_baseColor'),
                    orientation: gl.getUniformLocation(program, 'u_orientation'),
                    opacity: gl.getUniformLocation(program, 'u_opacity')
                };

                gl.uniform1f(effect.uniforms.orientation, orientation === 'vertical' ? 1.0 : 0.0);
                effect.needsResize = true;
            }
        }

        render() {
            if (!isPageVisible || visibleCanvases.size === 0) {
                requestAnimationFrame(() => this.render());
                return;
            }

            const now = performance.now();
            if (now - this.lastFrameTime < FRAME_INTERVAL) {
                requestAnimationFrame(() => this.render());
                return;
            }
            this.lastFrameTime = now;

            const elapsed = (now - this.startTime) / 1000.0;
            const isDark = this.getIsDark();
            const dpr = window.devicePixelRatio;

            // Update fade opacity
            const fadeElapsed = now - this.fadeStartTime;
            const fadeProgress = Math.min(fadeElapsed / this.fadeDuration, 1.0);

            if (this.fadeDirection === 1) {
                // Fading in
                this.fadeOpacity = fadeProgress;
            } else if (this.fadeDirection === -1) {
                // Fading out
                this.fadeOpacity = 1.0 - fadeProgress;

                // Check if fade out complete and we have a pending style change
                if (fadeProgress >= 1.0 && this.pendingStyle) {
                    this.currentStyle = this.pendingStyle;
                    this.rebuildWithStyle(this.pendingStyle);
                    this.updatePatternSegments();
                    this.pendingStyle = null;
                    // Start fade in
                    this.fadeDirection = 1;
                    this.fadeStartTime = now;
                    this.fadeOpacity = 0.0;
                }
            }

            // Update color interpolation
            if (this.colorFadeStartTime !== null) {
                const colorElapsed = now - this.colorFadeStartTime;
                this.colorFadeProgress = Math.min(colorElapsed / this.fadeDuration, 1.0);

                if (this.colorFadeProgress >= 1.0) {
                    this.currentColor = this.targetColor;
                    this.colorFadeStartTime = null;
                    this.targetColor = null;
                    this.fadeStartColor = null;
                }
            }

            // Calculate display color (interpolated if transitioning)
            let displayColor = this.currentColor;
            if (this.colorFadeStartTime !== null && this.fadeStartColor && this.targetColor) {
                const t = this.colorFadeProgress;
                // Smooth easing
                const eased = t * t * (3 - 2 * t);
                displayColor = [
                    this.fadeStartColor[0] + (this.targetColor[0] - this.fadeStartColor[0]) * eased,
                    this.fadeStartColor[1] + (this.targetColor[1] - this.fadeStartColor[1]) * eased,
                    this.fadeStartColor[2] + (this.targetColor[2] - this.fadeStartColor[2]) * eased
                ];
            }

            // Update link colors to match border art color
            this.updateLinkColors(displayColor);

            // Detect DPI changes
            if (dpr !== this.currentDpr) {
                this.currentDpr = dpr;
                for (const effect of this.effects) {
                    effect.needsResize = true;
                }
            }

            for (const effect of this.effects) {
                const { canvas, gl, uniforms } = effect;

                if (!visibleCanvases.has(canvas)) continue;

                if (effect.needsResize) {
                    canvas.width = canvas.offsetWidth * dpr;
                    canvas.height = canvas.offsetHeight * dpr;
                    gl.viewport(0, 0, canvas.width, canvas.height);
                    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
                    effect.needsResize = false;
                }

                gl.uniform1f(uniforms.time, elapsed);
                gl.uniform1f(uniforms.isDark, isDark);
                gl.uniform1f(uniforms.opacity, this.fadeOpacity);
                gl.uniform3f(uniforms.baseColor,
                    displayColor[0],
                    displayColor[1],
                    displayColor[2]
                );
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }

            // After first frame renders, reveal all canvases and content with CSS transition
            if (!this.firstFrameRendered && this.effects.length > 0) {
                this.firstFrameRendered = true;
                // Use requestAnimationFrame to ensure the frame is painted before revealing
                requestAnimationFrame(() => {
                    for (const effect of this.effects) {
                        effect.canvas.style.opacity = '1';
                    }
                    // Trigger content fade-in at the same time as canvases
                    document.documentElement.classList.add('content-ready');
                });
            }

            requestAnimationFrame(() => this.render());
        }

        changeColor(newColor) {
            // If already this color, do nothing
            if (JSON.stringify(newColor) === JSON.stringify(this.currentColor) &&
                !this.targetColor) return;

            // If already transitioning to a color, update start color to current interpolated value
            if (this.colorFadeStartTime !== null && this.fadeStartColor && this.targetColor) {
                const t = this.colorFadeProgress;
                const eased = t * t * (3 - 2 * t);
                this.fadeStartColor = [
                    this.fadeStartColor[0] + (this.targetColor[0] - this.fadeStartColor[0]) * eased,
                    this.fadeStartColor[1] + (this.targetColor[1] - this.fadeStartColor[1]) * eased,
                    this.fadeStartColor[2] + (this.targetColor[2] - this.fadeStartColor[2]) * eased
                ];
            } else {
                this.fadeStartColor = [...this.currentColor];
            }

            this.targetColor = newColor;
            this.colorFadeStartTime = performance.now();
            this.colorFadeProgress = 0.0;

            // Update UI immediately to show selection
            this.currentColor = newColor; // For UI purposes
            this.updateColorName();
            this.updateSwatchHighlights();
            // Restore for interpolation
            this.currentColor = this.fadeStartColor;
        }

        updateColorName() {
            const colorNameElement = document.getElementById('selected-color-name');
            if (!colorNameElement) return;

            const colorEntry = this.colorPalette.find(
                entry => JSON.stringify(entry.color) === JSON.stringify(this.currentColor)
            );

            if (colorEntry) {
                colorNameElement.textContent = colorEntry.name;
                colorNameElement.style.color = `rgb(${this.currentColor[0]}, ${this.currentColor[1]}, ${this.currentColor[2]})`;
            }
        }

        updateSwatchHighlights() {
            const swatches = document.querySelectorAll('.color-swatch');
            swatches.forEach((swatch) => {
                const colorIndex = parseInt(swatch.dataset.colorIndex);
                const color = this.colorPalette[colorIndex].color;
                const isActive = JSON.stringify(this.currentColor) === JSON.stringify(color);
                swatch.style.boxShadow = isActive ? '0 0 0 3px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)';
                swatch.style.transform = isActive ? 'scale(1.15)' : 'scale(1)';
            });
        }

        switchStyle(newStyle) {
            // If already on this style, do nothing
            if (newStyle === this.currentStyle && !this.pendingStyle) return;

            // If already fading out to a style, just update the pending style
            if (this.fadeDirection === -1) {
                this.pendingStyle = newStyle;
                return;
            }

            // Start fade out, set pending style
            this.pendingStyle = newStyle;
            this.fadeDirection = -1;
            this.fadeStartTime = performance.now();
        }

        updatePatternSegments() {
            const segments = document.querySelectorAll('.pattern-segment');
            const isDark = this.getEffectiveTheme() === 'dark';

            segments.forEach(segment => {
                const isActive = segment.dataset.styleKey === this.currentStyle;
                segment.style.color = isActive ? '#623734' : (isDark ? '#e8e8e8' : 'rgba(98, 55, 52, 0.6)');
                segment.style.background = isActive ? 'white' : 'transparent';
                segment.style.boxShadow = isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none';
            });
        }

        switchTheme(theme) {
            localStorage.setItem('theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
            this.updateHUDColors();
        }

        updateHUDColors() {
            const hud = document.getElementById('border-art-customize');
            const buttonText = document.getElementById('customize-button-text');
            if (!hud) return;

            const isDark = this.getEffectiveTheme() === 'dark';

            hud.style.background = isDark ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            hud.style.border = isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)';

            if (buttonText) {
                buttonText.style.color = isDark ? '#e8e8e8' : '#623734';
            }

            // Update labels
            const labels = hud.querySelectorAll('.hud-label');
            labels.forEach(label => {
                if (label.id !== 'selected-color-name') {
                    label.style.color = isDark ? '#e8e8e8' : '#623734';
                }
            });

            // Update segmented controls
            const controls = hud.querySelectorAll('.hud-segmented-control');
            controls.forEach(control => {
                control.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            });

            this.updatePatternSegments();
            this.updateThemeSegments();

            // Update close button
            const closeBtn = hud.querySelector('#customize-close');
            if (closeBtn) {
                closeBtn.style.color = isDark ? '#e8e8e8' : '#623734';
                closeBtn.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            }
        }

        updateThemeSegments() {
            const segments = document.querySelectorAll('.theme-segment');
            const currentTheme = this.getCurrentTheme();
            const isDark = this.getEffectiveTheme() === 'dark';

            segments.forEach(segment => {
                const isActive = segment.dataset.theme === currentTheme;
                segment.style.color = isActive ? '#623734' : (isDark ? '#e8e8e8' : 'rgba(98, 55, 52, 0.6)');
                segment.style.background = isActive ? 'white' : 'transparent';
                segment.style.boxShadow = isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none';
            });
        }

        createHUD() {
            if (document.getElementById('border-art-customize')) return;

            const hud = document.createElement('div');
            hud.id = 'border-art-customize';
            hud.className = 'customize-hud';
            hud.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 6px 14px;
                border-radius: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 1001;
                font-family: 'Whitney A', 'Whitney B', 'Lucida Grande', 'Helvetica', sans-serif;
                cursor: pointer;
                transition: all 0.3s ease;
                overflow: hidden;
            `;

            const buttonText = document.createElement('div');
            buttonText.id = 'customize-button-text';
            buttonText.textContent = 'CUSTOMIZE';
            buttonText.style.cssText = `
                font-size: 9px;
                font-weight: 600;
                letter-spacing: 0.8px;
                white-space: nowrap;
                transition: color 0.3s ease;
            `;

            const content = document.createElement('div');
            content.id = 'customize-content';
            content.style.display = 'none';

            const closeBtn = document.createElement('div');
            closeBtn.id = 'customize-close';
            closeBtn.innerHTML = '&times;';
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
                cursor: pointer;
                transition: background 0.2s ease;
            `;

            // Pattern selector
            const patternLabel = document.createElement('div');
            patternLabel.textContent = 'Border Pattern';
            patternLabel.className = 'hud-label';
            patternLabel.style.cssText = `
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;

            const segmentedControl = document.createElement('div');
            segmentedControl.className = 'hud-segmented-control';
            segmentedControl.style.cssText = `
                border-radius: 6px;
                padding: 4px;
                margin-bottom: 16px;
            `;

            // Cloud patterns row
            const cloudRow = document.createElement('div');
            cloudRow.style.cssText = `
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                margin-bottom: 4px;
            `;

            const row1Patterns = ['stratus', 'interference', 'terrain', 'smoke'];
            row1Patterns.forEach(key => {
                const segment = document.createElement('div');
                segment.className = 'pattern-segment';
                segment.dataset.styleKey = key;
                segment.textContent = this.styles[key];
                segment.style.cssText = `
                    padding: 6px 4px;
                    text-align: center;
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 4px;
                `;
                segment.addEventListener('click', () => this.switchStyle(key));
                cloudRow.appendChild(segment);
            });

            // Second row
            const row2 = document.createElement('div');
            row2.style.cssText = `
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                margin-bottom: 4px;
            `;

            const row2Patterns = ['static', 'aurora', 'marble', 'ripple'];
            row2Patterns.forEach(key => {
                const segment = document.createElement('div');
                segment.className = 'pattern-segment';
                segment.dataset.styleKey = key;
                segment.textContent = this.styles[key];
                segment.style.cssText = `
                    padding: 6px 4px;
                    text-align: center;
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 4px;
                `;
                segment.addEventListener('click', () => this.switchStyle(key));
                row2.appendChild(segment);
            });

            // Third row
            const row3 = document.createElement('div');
            row3.style.cssText = `
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
            `;

            const row3Patterns = ['silk', 'voronoi', 'kaleidoscope', 'electric'];
            row3Patterns.forEach(key => {
                const segment = document.createElement('div');
                segment.className = 'pattern-segment';
                segment.dataset.styleKey = key;
                segment.textContent = this.styles[key];
                segment.style.cssText = `
                    padding: 6px 4px;
                    text-align: center;
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 4px;
                `;
                segment.addEventListener('click', () => this.switchStyle(key));
                row3.appendChild(segment);
            });

            segmentedControl.appendChild(cloudRow);
            segmentedControl.appendChild(row2);
            segmentedControl.appendChild(row3);

            // Color palette
            const colorLabelContainer = document.createElement('div');
            colorLabelContainer.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            `;

            const colorLabel = document.createElement('div');
            colorLabel.textContent = 'Color Palette';
            colorLabel.className = 'hud-label';
            colorLabel.style.cssText = `
                font-weight: bold;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;

            const colorName = document.createElement('div');
            colorName.id = 'selected-color-name';
            colorName.className = 'hud-label';
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
                margin: -4px;
            `;

            this.colorPalette.forEach((colorEntry, index) => {
                const swatch = document.createElement('div');
                const color = colorEntry.color;
                swatch.className = 'color-swatch';
                swatch.dataset.colorIndex = index;
                swatch.style.cssText = `
                    width: 100%;
                    aspect-ratio: 1;
                    border-radius: 4px;
                    background: rgb(${color[0]}, ${color[1]}, ${color[2]});
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                `;
                swatch.addEventListener('click', () => this.changeColor(color));
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
                colorGrid.appendChild(swatch);
            });

            // Theme selector
            const themeLabel = document.createElement('div');
            themeLabel.textContent = 'Theme';
            themeLabel.className = 'hud-label';
            themeLabel.style.cssText = `
                font-weight: bold;
                margin-top: 16px;
                margin-bottom: 8px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;

            const themeControl = document.createElement('div');
            themeControl.className = 'hud-segmented-control';
            themeControl.style.cssText = `
                display: flex;
                border-radius: 6px;
                padding: 2px;
            `;

            ['Auto', 'Light', 'Dark'].forEach((themeName) => {
                const segment = document.createElement('div');
                segment.className = 'theme-segment';
                segment.dataset.theme = themeName.toLowerCase();
                segment.textContent = themeName;
                segment.style.cssText = `
                    flex: 1;
                    padding: 6px 8px;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 4px;
                `;
                segment.addEventListener('click', () => this.switchTheme(themeName.toLowerCase()));
                themeControl.appendChild(segment);
            });

            content.appendChild(patternLabel);
            content.appendChild(segmentedControl);
            content.appendChild(colorLabelContainer);
            content.appendChild(colorGrid);
            content.appendChild(themeLabel);
            content.appendChild(themeControl);

            hud.appendChild(buttonText);
            hud.appendChild(closeBtn);
            hud.appendChild(content);
            document.body.appendChild(hud);

            this.hudElement = hud;
            this.isExpanded = false;

            // Event handlers
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCustomize();
            });

            hud.addEventListener('click', () => {
                if (!this.isExpanded) this.toggleCustomize();
            });

            hud.addEventListener('mouseenter', () => {
                if (!this.isExpanded) {
                    const isDark = this.getEffectiveTheme() === 'dark';
                    hud.style.background = isDark ? 'rgba(42, 42, 42, 1)' : 'rgba(255, 255, 255, 1)';
                    hud.style.boxShadow = '0 3px 12px rgba(0,0,0,0.15)';
                }
            });

            hud.addEventListener('mouseleave', () => {
                if (!this.isExpanded) {
                    const isDark = this.getEffectiveTheme() === 'dark';
                    hud.style.background = isDark ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
                    hud.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
            });

            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.getCurrentTheme() === 'auto') {
                    this.updateHUDColors();
                }
            });

            // Initialize colors and states
            this.updateHUDColors();
            this.updateColorName();
            this.updateSwatchHighlights();
        }

        toggleCustomize() {
            const hud = this.hudElement;
            const buttonText = document.getElementById('customize-button-text');
            const content = document.getElementById('customize-content');
            const closeBtn = document.getElementById('customize-close');

            if (this.isExpanded) {
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

        init() {
            if (initialized) return;
            initialized = true;

            // Initialize theme
            const savedTheme = this.getCurrentTheme();
            document.documentElement.setAttribute('data-theme', savedTheme);

            // Create canvases and effects
            this.createBorderCanvases();
            this.createHUD();

            // Set initial link colors to match the randomly selected color
            this.updateLinkColors(this.currentColor);

            if (this.effects.length === 0) {
                console.warn('No border effects initialized');
                return;
            }

            // Track page visibility
            document.addEventListener('visibilitychange', () => {
                isPageVisible = !document.hidden;
            });

            // Handle resize
            window.addEventListener('resize', () => {
                for (const effect of this.effects) {
                    effect.needsResize = true;
                }
            });

            // Start render loop
            this.render();
        }
    }

    // Initialize when DOM is ready
    window.borderArtSystem = new BorderArtSystem();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.borderArtSystem.init());
    } else {
        window.borderArtSystem.init();
    }
})();
