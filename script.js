// Intro Sequence Logic
const introTexts = [
    "You left the campus",
    "But the campus never left you",
    "A global network of excellence",
    "Reignite old friendships",
    "Welcome back to your legacy"
];

let currentIntroStep = 0;
let introInterval;

function startIntro() {
    const textEl = document.getElementById("intro-text");
    const progressBars = document.querySelectorAll(".progress-bar");
    if (!textEl) {
        isCountdownVisible = true;
        return;
    }

    introInterval = setInterval(() => {
        currentIntroStep++;

        if (currentIntroStep >= introTexts.length) {
            skipIntro();
            return;
        }

        // Fade out text
        textEl.style.opacity = 0;

        setTimeout(() => {
            textEl.innerText = introTexts[currentIntroStep];
            progressBars.forEach((bar, index) => {
                if (index <= currentIntroStep) {
                    bar.classList.add("active");
                }
            });
            textEl.style.opacity = 1;
        }, 500);

    }, 3000);
}

function skipIntro() {
    clearInterval(introInterval);
    const overlay = document.getElementById("intro-overlay");
    if (overlay) {
        overlay.style.opacity = 0;
        setTimeout(() => {
            overlay.style.visibility = "hidden";
            overlay.style.display = "none";
            isCountdownVisible = true;
            if (!isAudioEnabled) {
                const unmuteBtn = document.getElementById('unmute-btn');
                if (unmuteBtn) unmuteBtn.style.display = 'flex';
            }
        }, 1000);
    } else {
        isCountdownVisible = true;
        if (!isAudioEnabled) {
            const unmuteBtn = document.getElementById('unmute-btn');
            if (unmuteBtn) unmuteBtn.style.display = 'flex';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    startIntro();
});

// Audio Context for Ticking Sound
/** @type {AudioContext} */
let audioCtx;
let isAudioEnabled = false;

function removeAudioListeners() {
    ['click', 'keydown', 'touchstart', 'touchend', 'mousedown', 'pointerdown'].forEach(evt => {
        document.removeEventListener(evt, initAudio);
    });
}

function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            const resumePromise = audioCtx.resume();
            if (resumePromise !== undefined) {
                resumePromise.then(() => {
                    if (audioCtx.state === 'running') {
                        isAudioEnabled = true;
                        removeAudioListeners();
                        const unmuteBtn = document.getElementById('unmute-btn');
                        if (unmuteBtn) unmuteBtn.style.display = 'none';
                    }
                }).catch(() => { /* suppress desktop warning */ });
            }
        } else if (audioCtx.state === 'running') {
            isAudioEnabled = true;
            removeAudioListeners();
            const unmuteBtn = document.getElementById('unmute-btn');
            if (unmuteBtn) unmuteBtn.style.display = 'none';
        }
    } catch (e) {
        console.warn("Audio API not supported", e);
    }
}

// Enable audio on first successful interaction (covering all possible mobile/desktop gestures)
// We do NOT use { once: true } here because mobile browsers might block the first 'touchstart' gesture.
// The listeners will be removed manually by removeAudioListeners() only after the audio is confirmed unlocked.
['click', 'keydown', 'touchstart', 'touchend', 'mousedown', 'pointerdown'].forEach(evt => {
    document.addEventListener(evt, initAudio);
});

let isTick = true;

function playTickSound() {
    if (!isAudioEnabled || !audioCtx || audioCtx.state === 'suspended') return;

    // Wall clock "Click" (Heavy mechanism locking)
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    const clickFilter = audioCtx.createBiquadFilter();

    clickOsc.type = 'square';
    // Pitch drops incredibly fast to simulate a heavy click
    clickOsc.frequency.setValueAtTime(isTick ? 800 : 600, audioCtx.currentTime);
    clickOsc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.02);

    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = isTick ? 2500 : 1800;
    clickFilter.Q.value = 1.0;

    clickGain.gain.setValueAtTime(0, audioCtx.currentTime);
    clickGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(audioCtx.destination);

    // Wall clock "Thud/Resonance" (Wooden/Plastic Body echoing)
    const bodyOsc = audioCtx.createOscillator();
    const bodyGain = audioCtx.createGain();

    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(isTick ? 250 : 200, audioCtx.currentTime);
    bodyOsc.frequency.exponentialRampToValueAtTime(isTick ? 150 : 120, audioCtx.currentTime + 0.04);

    bodyGain.gain.setValueAtTime(0, audioCtx.currentTime);
    bodyGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.005);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(audioCtx.destination);

    clickOsc.start(audioCtx.currentTime);
    bodyOsc.start(audioCtx.currentTime);

    clickOsc.stop(audioCtx.currentTime + 0.04);
    bodyOsc.stop(audioCtx.currentTime + 0.07);

    isTick = !isTick; // alternate for the next second
}

// Target date for the launch: July 31, 2026 at 6:00 PM
const targetDate = new Date("June 30, 2026 18:00:00").getTime();
let isCountdownVisible = false;

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        document.getElementById("days").innerText = "00";
        document.getElementById("hours").innerText = "00";
        document.getElementById("minutes").innerText = "00";
        document.getElementById("seconds").innerText = "00";

        // Release the button
        const launchBtn = document.getElementById("main-launch-btn");
        if (launchBtn) {
            launchBtn.disabled = false;
        }

        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("days").innerText = String(days).padStart(2, '0');
    document.getElementById("hours").innerText = String(hours).padStart(2, '0');
    document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
    document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');

    // Play tick sound every second if countdown is visible
    if (isCountdownVisible) {
        playTickSound();
    }
}

// Update the countdown every second
setInterval(updateCountdown, 1000);
updateCountdown();

// Handle Launch Button
function scrollToFeatures() {
    isCountdownVisible = false;
    const launchBtn = document.querySelector('.launch-btn-3d');
    if (launchBtn) {
        launchBtn.classList.add('pressed');
    }

    // Wait for button animation to progress
    setTimeout(() => {
        const crackerOverlay = document.getElementById("cracker-overlay");
        const countdownText = document.getElementById("countdown-text");

        if (crackerOverlay && countdownText) {
            crackerOverlay.classList.add("active");

            // Sequence: 3, 2, 1, Firework
            let count = 3;

            function animateNumber() {
                if (count > 0) {
                    countdownText.innerText = count;
                    countdownText.classList.remove("pop");
                    // trigger reflow
                    void countdownText.offsetWidth;
                    countdownText.classList.add("pop");

                    count--;
                    setTimeout(animateNumber, 1000);
                } else {
                    countdownText.style.display = "none";
                    crackerOverlay.classList.remove("active");

                    const heroSection = document.querySelector('.hero-section');
                    if (heroSection) heroSection.style.display = 'none';

                    // Reset things in case they go back
                    if (launchBtn) {
                        launchBtn.classList.remove('pressed');
                    }
                    countdownText.style.display = "block";

                    // Trigger premium awards-quality morphing logo portal sequence!
                    startLogoTransition();
                }
            }

            animateNumber();
        } else {
            // Fallback if overlay not found
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) heroSection.style.display = 'none';
            startLogoTransition();
        }

    }, 800); // delay to let the button fly away
}



function startRealisticFireworks(duration) {
    const canvas = document.getElementById('firework-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const particles = [];
    const colors = [
        { r: 212, g: 175, b: 55 },   // Gold
        { r: 255, g: 255, b: 255 },  // White
        { r: 247, g: 231, b: 206 },  // Champagne
        { r: 255, g: 215, b: 0 },    // Bright Gold
        { r: 184, g: 115, b: 51 }    // Copper
    ];

    // Screen flash element
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.backgroundColor = '#fff';
    flash.style.opacity = '0';
    flash.style.zIndex = '240';
    flash.style.pointerEvents = 'none';
    flash.style.transition = 'opacity 0.8s ease-out';
    document.getElementById('cracker-overlay').appendChild(flash);

    function triggerFlash() {
        flash.style.opacity = '0.4';
        flash.style.transition = 'none';
        setTimeout(() => {
            flash.style.transition = 'opacity 1.5s ease-out';
            flash.style.opacity = '0';
        }, 50);
    }

    function createExplosion(x, y, isGrand = false) {
        if (isGrand) triggerFlash();
        const count = isGrand ? 350 : 120 + Math.random() * 80;
        const power = isGrand ? 18 : 6 + Math.random() * 5;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.pow(Math.random(), 0.5) * power;
            const color = colors[Math.floor(Math.random() * colors.length)];

            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: (Math.random() * 0.015 + 0.008) * (isGrand ? 0.6 : 1),
                color: color,
                size: Math.random() * 2 + 1,
                sparkle: Math.random() > 0.7
            });
        }
    }

    let lastTime = Date.now();

    // Launch sequence
    let fireworkInterval = setInterval(() => {
        createExplosion(
            Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
            Math.random() * canvas.height * 0.6 + canvas.height * 0.1
        );
    }, 450);

    // Initial grand burst in center
    setTimeout(() => createExplosion(canvas.width / 2, canvas.height / 2.5, true), 100);

    function drawParticle(p) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        const alpha = p.sparkle ? p.life * (0.5 + Math.random() * 0.5) : p.life;

        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`); // hot white core
        gradient.addColorStop(0.2, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function animate() {
        if (Date.now() - lastTime > duration && particles.length === 0) {
            canvas.style.display = 'none';
            if (flash.parentNode) flash.parentNode.removeChild(flash);
            return;
        }
        requestAnimationFrame(animate);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'screen';

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.vx *= 0.97; // air resistance
            p.vy *= 0.97;
            p.life -= p.decay;

            if (p.life <= 0) {
                particles.splice(i, 1);
            } else {
                drawParticle(p);
            }
        }
    }

    animate();

    setTimeout(() => {
        clearInterval(fireworkInterval);
    }, duration - 1000);
}


let ytPlayer;
let isPlayerReady = false;

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('reveal-video', {
        videoId: 'c1CGLbLwrlE',
        playerVars: {
            'playsinline': 1,
            'rel': 0,
            'enablejsapi': 1,
            'origin': window.location.origin !== 'null' ? window.location.origin : 'http://localhost'
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        const placeholder = document.querySelector('.video-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        
        const videoEl = document.getElementById('reveal-video');
        if (videoEl) {
            videoEl.style.opacity = '1';
        }
    }
    if (event.data === YT.PlayerState.ENDED) {
        goToNextPage();
    }
}

function goToNextPage() {
    const videoPage = document.getElementById('video-page');
    const legacyPage = document.getElementById('legacy-page');
    
    if (videoPage) {
        gsap.to(videoPage, {
            opacity: 0,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
                videoPage.classList.remove('active');
                if (legacyPage) {
                    legacyPage.style.display = 'block';
                    legacyPage.classList.add('active');
                    gsap.fromTo(legacyPage, { opacity: 0 }, { opacity: 1, duration: 1.0, onComplete: playLegacyAnimations });
                }
            }
        });
    }
}

function playLegacyAnimations() {
    const title = document.getElementById('legacy-title');
    if (!title) return;
    
    const originalTitle = title.innerText;
    title.innerHTML = '';
    originalTitle.split(' ').forEach((word, wIdx) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';

        word.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.innerText = char;
            charSpan.style.display = 'inline-block';
            charSpan.style.opacity = 0;
            charSpan.style.transform = 'translateY(50px) scale(0.6) rotate(15deg)';
            charSpan.style.filter = 'blur(10px)';
            wordSpan.appendChild(charSpan);
        });
        title.appendChild(wordSpan);

        if (wIdx < originalTitle.split(' ').length - 1) {
            const space = document.createElement('span');
            space.innerHTML = '&nbsp;';
            title.appendChild(space);
        }
    });

    // Animate character spans
    gsap.to('#legacy-title span span', {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        filter: 'blur(0px)',
        duration: 1.2,
        stagger: 0.05,
        ease: "back.out(1.7)"
    });

    // Supporting text animation (Fade Up + Opacity + Blur)
    const desc = document.getElementById('legacy-desc');
    gsap.fromTo(desc,
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, delay: 0.8, ease: "power2.out" }
    );

    // CTA Button Reveal
    const ctaBtn = document.getElementById('explore-cta-btn');
    if (ctaBtn) {
        gsap.fromTo(ctaBtn,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1.0, delay: 1.2, ease: "power2.out", onComplete: typeof initCtaInteractions !== 'undefined' ? initCtaInteractions : undefined }
        );
    }
}

// Function to play reveal video when play button is clicked
function playVideo() {
    const placeholder = document.querySelector('.video-placeholder');
    const videoEl = document.getElementById('reveal-video');

    if (placeholder) placeholder.style.display = 'none';

    if (videoEl) {
        videoEl.style.opacity = '1';
        videoEl.style.pointerEvents = 'auto';

        if (ytPlayer && isPlayerReady && typeof ytPlayer.playVideo === 'function') {
            ytPlayer.playVideo();
        } else if (videoEl.tagName === 'IFRAME') {
            // Fallback
            videoEl.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } else if (typeof videoEl.play === 'function') {
            // Play standard HTML5 video
            videoEl.play().catch(err => {
                console.warn("Video playback failed: ", err);
            });
        }
    }
}

// Event Delegation for play button (bulletproof)
document.addEventListener('click', (e) => {
    if (e.target.closest('.play-btn')) {
        playVideo();
    }
});

// ==========================================================================
// VARIABLE PROXIMITY TEXT EFFECT (VANILLA JS PORT OF REACT BITS COMPONENT)
// ==========================================================================

function splitTextNodes(node, letterRefs) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        // Don't split if it's just spacing or empty
        if (!text.trim() && text.length <= 1) return;

        const fragment = document.createDocumentFragment();
        // Split by space and word boundaries while keeping spaces
        const parts = text.split(/(\s+)/);

        parts.forEach(part => {
            if (part.trim() === '') {
                // Keep whitespace as a normal text node to preserve natural word wrapping
                fragment.appendChild(document.createTextNode(part));
            } else {
                // Word node
                const wordSpan = document.createElement('span');
                wordSpan.style.display = 'inline-block';
                wordSpan.style.whiteSpace = 'nowrap';

                part.split('').forEach(letter => {
                    const letterSpan = document.createElement('span');
                    letterSpan.style.display = 'inline-block';
                    letterSpan.innerText = letter;
                    wordSpan.appendChild(letterSpan);
                    letterRefs.push(letterSpan);
                });
                fragment.appendChild(wordSpan);
            }
        });

        node.parentNode.replaceChild(fragment, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR' || node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
        const children = Array.from(node.childNodes);
        children.forEach(child => {
            splitTextNodes(child, letterRefs);
        });
    }
}

function initVariableProximity(containerSelector, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const {
        fromSettings = { wght: 400, opsz: 9 },
        toSettings = { wght: 1000, opsz: 40 },
        radius = 120,
        falloff = 'linear'
    } = options;

    container.classList.add('variable-proximity');

    const letterRefs = [];
    splitTextNodes(container, letterRefs);

    // Track mouse position relative to container
    let mousePos = { x: -1000, y: -1000 };
    let lastMousePos = { x: -1000, y: -1000 };

    function updateMousePos(clientX, clientY) {
        const rect = container.getBoundingClientRect();
        mousePos.x = clientX - rect.left;
        mousePos.y = clientY - rect.top;
    }

    window.addEventListener('mousemove', (e) => {
        updateMousePos(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
        }
    });

    // Reset position when mouse leaves the viewport
    document.addEventListener('mouseleave', () => {
        mousePos = { x: -1000, y: -1000 };
    });

    const calculateDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    const calculateFalloff = (distance) => {
        const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
        switch (falloff) {
            case 'exponential':
                return Math.pow(norm, 2);
            case 'gaussian':
                return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
            case 'linear':
            default:
                return norm;
        }
    };

    function tick() {
        if (lastMousePos.x === mousePos.x && lastMousePos.y === mousePos.y) {
            requestAnimationFrame(tick);
            return;
        }
        lastMousePos.x = mousePos.x;
        lastMousePos.y = mousePos.y;

        const containerRect = container.getBoundingClientRect();

        letterRefs.forEach(letterRef => {
            if (!letterRef) return;
            const rect = letterRef.getBoundingClientRect();
            const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
            const letterCenterY = rect.top + rect.height / 2 - containerRect.top;

            const distance = calculateDistance(mousePos.x, mousePos.y, letterCenterX, letterCenterY);

            if (distance >= radius) {
                letterRef.style.fontVariationSettings = `'wght' ${fromSettings.wght}, 'opsz' ${fromSettings.opsz}`;
                return;
            }

            const falloffVal = calculateFalloff(distance);
            const wghtVal = fromSettings.wght + (toSettings.wght - fromSettings.wght) * falloffVal;
            const opszVal = fromSettings.opsz + (toSettings.opsz - fromSettings.opsz) * falloffVal;

            letterRef.style.fontVariationSettings = `'wght' ${wghtVal}, 'opsz' ${opszVal}`;
        });

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

// Initialize VariableProximity on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    initVariableProximity('.hero-headline', {
        fromSettings: { wght: 400, opsz: 9 },
        toSettings: { wght: 1000, opsz: 40 },
        radius: 120,
        falloff: 'linear'
    });
});

// ==========================================================================
// AWWWARDS MORPHING LOGO TRANSITION PORTAL AND CANVAS ENGINE
// ==========================================================================

function startLogoTransition() {
    const overlay = document.getElementById('transition-overlay');
    if (!overlay) return;

    // Show overlay screen with absolute fade-in
    overlay.style.display = 'block';
    gsap.to(overlay, { opacity: 1, duration: 0.8, ease: "power2.out" });

    const canvas = document.getElementById('logo-canvas');
    const ctx = canvas.getContext('2d');

    // Resize canvas
    function resize() {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Center and scale the normalized company logo points
    const logoPoints = [];
    const scaleFactor = Math.min(w * 0.55, h * 0.55, 300);

    if (typeof companyLogoPoints !== 'undefined') {
        companyLogoPoints.forEach(pt => {
            logoPoints.push({
                x: w / 2 + pt.x * scaleFactor,
                y: h / 2 + pt.y * scaleFactor,
                c: pt.c || '#ffd700' // real pixel color from logo
            });
        });
    } else {
        // Fallback circle if points not loaded
        for (let i = 0; i < 2000; i++) {
            const a = (i / 2000) * Math.PI * 2;
            logoPoints.push({
                x: w / 2 + 120 * Math.cos(a),
                y: h / 2 + 120 * Math.sin(a),
                c: '#ffd700'
            });
        }
    }

    // Helper to parse hex color to RGB object
    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 215, b: 0 };
    }

    // Initialize Particles — each gets the actual pixel color from the logo image
    const particles = [];
    const particleCount = logoPoints.length;

    // Ambient floating colors (before morph — used only in ambient phase)
    const ambientColors = ['#ffd700', '#2e6eff', '#ffffff', '#ff8c00', '#00cfff'];

    for (let i = 0; i < particleCount; i++) {
        const ambHex = ambientColors[Math.floor(Math.random() * ambientColors.length)];
        const logoHex = logoPoints[i].c;
        const aRgb = hexToRgb(ambHex);
        let lRgb = hexToRgb(logoHex);

        // Detect dark blue / purple pixels that are hard to read on a dark background, and replace with bright gold
        if (lRgb.b > 70 && lRgb.g < 115 && lRgb.b > lRgb.g) {
            lRgb = { r: 255, g: 215, b: 0 }; // Bright gold (#ffd700)
        }

        const pAlpha = Math.random() * 0.6 + 0.3;

        // Start floating randomly
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            ox: Math.random() * w, // original floating anchors
            oy: Math.random() * h,
            tx: logoPoints[i].x,
            ty: logoPoints[i].y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 0.8 + 0.4,
            aRgb: aRgb,
            lRgb: lRgb,
            alpha: pAlpha,
            ambientColor: `rgba(${aRgb.r}, ${aRgb.g}, ${aRgb.b}, ${pAlpha})`,
            logoColor: `rgba(${lRgb.r}, ${lRgb.g}, ${lRgb.b}, ${pAlpha})`,
            morphProgress: 0,
            angle: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.02
        });
    }

    let transitionPhase = 'ambient'; // ambient -> morph -> zoom -> finished
    let canvasOpacity = 1;
    let logoScale = 1;
    let fillOpacity = 0;
    let outlineProgress = 0;

    // Create GSAP Timeline for transition stages
    const tl = gsap.timeline();

    // STEP 1: Ambient floating (starts automatically)
    // STEP 2 & 3: Gather particles to form Logo outline & Shape (after 1.5s)
    tl.to({}, { duration: 1.5 })
        .add(() => {
            transitionPhase = 'morph';
            // Ease morphProgress of all particles to 1
            particles.forEach((p, index) => {
                gsap.to(p, {
                    morphProgress: 1,
                    duration: 2.2 + Math.random() * 0.8,
                    ease: "power3.inOut",
                    delay: Math.random() * 0.3
                });
            });
        })
        // STEP 3: Outline connections & Shape Fill (starts after particles settle)
        .to({}, { duration: 2.8 })
        .add(() => {
            // Draw solid gold fill of logo
            gsap.to({ val: 0 }, {
                val: 1,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: function () {
                    fillOpacity = this.targets()[0].val;
                }
            });
            // Draw outline lines
            gsap.to({ val: 0 }, {
                val: 1,
                duration: 1.2,
                ease: "power1.inOut",
                onUpdate: function () {
                    outlineProgress = this.targets()[0].val;
                }
            });
        })
        // STEP 4: Golden glow & float animation
        .to({}, { duration: 1.8 })
        // STEP 5 & 6: Zoom Camera (Scale 1 to 8) to act as visual mask
        .add(() => {
            transitionPhase = 'zoom';

            // Scale logo canvas on zoom
            gsap.to({ val: 1 }, {
                val: 8,
                duration: 3.5,
                ease: "power3.in",
                onUpdate: function () {
                    logoScale = this.targets()[0].val;
                    canvas.style.transform = `scale(${logoScale})`;
                }
            });

            // Fade out the particle canvas
            gsap.to({ val: 1 }, {
                val: 0,
                duration: 3.2,
                ease: "power2.in",
                onUpdate: function () {
                    canvasOpacity = this.targets()[0].val;
                    canvas.style.opacity = canvasOpacity;
                }
            });
        })
        // STEP 7: Logo dissolves completely, transition directly to video page
        .to({}, { duration: 3.5 })
        .add(() => {
            transitionPhase = 'finished';
            // Clean up resize listener
            window.removeEventListener('resize', resize);

            // Fade out the overlay and show video
            const overlay = document.getElementById('transition-overlay');
            gsap.to(overlay, {
                opacity: 0,
                duration: 1.0,
                ease: "power2.inOut",
                onComplete: () => {
                    overlay.style.display = 'none';

                    // Open the main video reveal page
                    const videoPage = document.getElementById('video-page');
                    if (videoPage) {
                        videoPage.classList.add('active');
                        playVideo(); // trigger play automatic reveal
                    }
                }
            });
        });

    // Request Animation Frame loop for Canvas Drawing
    let frameId;
    let mouse = { x: w / 2, y: h / 2 };
    let targetMouse = { x: w / 2, y: h / 2 };

    // Capture mouse movement to create slight tilt/particles interaction
    window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX;
        targetMouse.y = e.clientY;
    });

    // Cache the glow gradient to prevent recreating it every single frame (huge performance boost)
    const glowRad = Math.min(w * 0.25, h * 0.25, 140);
    const cachedGlowGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, glowRad);
    cachedGlowGrad.addColorStop(0, `rgba(212, 175, 55, 0.22)`);
    cachedGlowGrad.addColorStop(0.5, `rgba(212, 175, 55, 0.05)`);
    cachedGlowGrad.addColorStop(1, 'rgba(212, 175, 55, 0)'); // Use transparent gold, not transparent black, to fix blending artifact

    function draw() {
        if (transitionPhase === 'finished') {
            cancelAnimationFrame(frameId);
            return;
        }

        ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

        // Smooth interpolate mouse tracking
        mouse.x += (targetMouse.x - mouse.x) * 0.06;
        mouse.y += (targetMouse.y - mouse.y) * 0.06;

        // Apply global scale and tilt offset for 3D depth feeling
        const tiltX = (mouse.x - w / 2) * 0.03;
        const tiltY = (mouse.y - h / 2) * 0.03;

        ctx.save();
        ctx.translate(tiltX, tiltY);

        // Draw soft backlighting glow behind the logo particles during settle phase
        if (fillOpacity > 0 && transitionPhase !== 'zoom') {
            ctx.fillStyle = cachedGlowGrad;
            ctx.globalAlpha = fillOpacity;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, glowRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Floating animation parameters (yoyo)
        let floatOffset = 0;
        if (transitionPhase === 'morph' || fillOpacity > 0) {
            floatOffset = Math.sin(Date.now() * 0.002) * 10;
        }

        // Apply same float and tilt to canvas translate (no img to sync)

        ctx.globalAlpha = canvasOpacity;

        // Draw and update particles
        particles.forEach((p, idx) => {
            let px = p.x;
            let py = p.y;

            if (transitionPhase === 'ambient') {
                // Random floating particle movement
                p.angle += p.spinSpeed;
                p.x += p.vx + Math.sin(p.angle) * 0.15;
                p.y += p.vy + Math.cos(p.angle) * 0.15;

                // Bounce off boundaries
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                px = p.x;
                py = p.y;
            } else {
                // Morphing to logo targets + adding floating floatOffset
                const targetX = p.tx;
                const targetY = p.ty + floatOffset;

                p.x = p.ox + (targetX - p.ox) * p.morphProgress;
                p.y = p.oy + (targetY - p.oy) * p.morphProgress;

                px = p.x;
                py = p.y;
            }

            // Avoid expensive string allocations (garbage collection pauses) when particles are not actively morphing
            if (p.morphProgress <= 0) {
                ctx.fillStyle = p.ambientColor;
            } else if (p.morphProgress >= 1) {
                ctx.fillStyle = p.logoColor;
            } else {
                const r = p.aRgb.r + (p.lRgb.r - p.aRgb.r) * p.morphProgress;
                const g = p.aRgb.g + (p.lRgb.g - p.aRgb.g) * p.morphProgress;
                const b = p.aRgb.b + (p.lRgb.b - p.aRgb.b) * p.morphProgress;
                ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${p.alpha})`;
            }

            // Draw particle using fast fillRect instead of arc
            // Multiply size by 1.5 because p.size was used as radius
            ctx.fillRect(px, py, p.size * 1.5, p.size * 1.5);
        });

        // Reset globalAlpha for outlines
        ctx.globalAlpha = 1;

        // Draw outlines matching settle progress
        if (outlineProgress > 0 && transitionPhase !== 'zoom') {
            ctx.strokeStyle = `rgba(255, 215, 0, ${outlineProgress * 0.25})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();

            // Connect letters outlines
            for (let i = 0; i < particles.length; i += 8) {
                const p1 = particles[i];
                const p2 = particles[(i + 4) % particles.length];
                if (p1.morphProgress > 0.9 && p2.morphProgress > 0.9) {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    if (dx * dx + dy * dy < 100) { // Limit connection to very nearby particles
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                }
            }
            ctx.stroke();
        }

        ctx.restore();
        frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);


}



// Magnetic interactive handler for Awwwards CTA Button (STEP 10)
function initCtaInteractions() {
    const ctaWrap = document.querySelector('.cta-wrap');
    const ctaBtn = document.getElementById('explore-cta-btn');
    const ripple = ctaBtn.querySelector('.cta-ripple');

    // Magnetic effect
    ctaWrap.addEventListener('mousemove', (e) => {
        const rect = ctaBtn.getBoundingClientRect();
        // Mouse offset from center
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);

        // Pull button slightly toward cursor (Max 15px)
        gsap.to(ctaBtn, {
            x: relX * 0.35,
            y: relY * 0.35,
            duration: 0.3,
            ease: "power2.out"
        });
    });

    ctaWrap.addEventListener('mouseleave', () => {
        // Return back to center smoothly
        gsap.to(ctaBtn, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1.1, 0.45)"
        });
    });

    // Ripple click animation
    ctaBtn.addEventListener('click', (e) => {
        const rect = ctaBtn.getBoundingClientRect();
        const rippleX = e.clientX - rect.left;
        const rippleY = e.clientY - rect.top;

        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${rippleX - size / 2}px`;
        ripple.style.top = `${rippleY - size / 2}px`;

        ripple.classList.remove('animate');
        void ripple.offsetWidth; // trigger reflow
        ripple.classList.add('animate');
    });
}
