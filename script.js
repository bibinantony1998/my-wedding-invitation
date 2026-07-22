document.addEventListener('DOMContentLoaded', function() {
    // 0. Asset Preloader Logic
    const preloader = document.getElementById('preloader');
    const assetsToLoad = [
        'assets/book_bg.webp',
        'assets/bride_solo.webp',
        'assets/caricature_bl.webp',
        'assets/caricature_br.webp',
        'assets/caricature_tl.webp',
        'assets/caricature_tr.webp',
        'assets/cover_couple.webp',
        'assets/final_couple.webp',
        'assets/floral_divider.webp',
        'assets/groom_solo.webp'
    ];

    const loadPromises = assetsToLoad.map(src => {
        return new Promise(resolve => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve; // Resolve on error so it doesn't block
        });
    });

    // Also wait for background music (fallback to 1.5s max to prevent blocking on slow connections or mobile restrictions)
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
        loadPromises.push(new Promise(resolve => {
            if (bgMusic.readyState >= 3) {
                resolve();
            } else {
                bgMusic.addEventListener('canplaythrough', resolve, { once: true });
                bgMusic.addEventListener('error', resolve, { once: true });
                setTimeout(resolve, 1500); 
            }
        }));
    }

    Promise.all(loadPromises).then(() => {
        if (preloader) {
            preloader.classList.add('hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800); // Matches CSS transition duration
        }
    });

    const bookContainer = document.querySelector('.book-container');
    const bookEl = document.getElementById('book');
    
    // Audio Initialization
    const flipSound = document.getElementById('flipSound');
    const audioToggle = document.getElementById('audioToggle');
    const iconMuted = document.getElementById('icon-muted');
    const iconUnmuted = document.getElementById('icon-unmuted');
    
    let isMusicPlaying = false;
    let userHasInteracted = false;

    // Autoplay music on first interaction
    const startAudio = () => {
        if (!userHasInteracted) {
            userHasInteracted = true;
            bgMusic.volume = 1.0; // Full volume
            bgMusic.play().then(() => {
                isMusicPlaying = true;
                iconMuted.style.display = 'none';
                iconUnmuted.style.display = 'block';
            }).catch(e => console.log("Audio autoplay prevented"));
        }
    };
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('touchstart', startAudio, { once: true, passive: true });

    // Audio Toggle Button Logic
    audioToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent global click from re-triggering
        if (isMusicPlaying) {
            bgMusic.pause();
            isMusicPlaying = false;
            iconMuted.style.display = 'block';
            iconUnmuted.style.display = 'none';
        } else {
            bgMusic.play();
            isMusicPlaying = true;
            iconMuted.style.display = 'none';
            iconUnmuted.style.display = 'block';
        }
    });

    const isMobile = window.innerWidth <= 600;
    // Portrait mode on mobile: one full-width page, with 12px padding each side
    const mobilePad = 12;
    const mobilePageW = isMobile ? window.innerWidth - mobilePad * 2 : 350;
    const mobilePageH = isMobile ? Math.floor(window.innerHeight * 0.92) : 500;

    // 1. Initialize PageFlip
    const pageFlip = new St.PageFlip(bookEl, {
        width:     isMobile ? mobilePageW : 350,
        height:    isMobile ? mobilePageH : 500,
        size:      isMobile ? 'fixed'     : 'stretch',
        minWidth:  isMobile ? mobilePageW : 300,
        maxWidth:  isMobile ? mobilePageW : 450,
        minHeight: isMobile ? mobilePageH : 400,
        maxHeight: isMobile ? mobilePageH : 650,
        maxShadowOpacity: 0.5,
        drawShadow: true,
        startZIndex: isMobile ? 10 : 0,
        flippingTime: isMobile ? 700 : 1000,
        showCover: true,
        mobileScrollSupport: false,
        useMouseEvents: true,   // Must be true — controls touch drag on mobile too
        usePortrait: true       // Portrait: one full-width page at a time on mobile
    });

    let mobileResizeTimer;
    function onMobileResize() {
        if (!isMobile) return;
        clearTimeout(mobileResizeTimer);
        mobileResizeTimer = setTimeout(() => {
            const half = Math.floor(window.innerWidth / 2);
            pageFlip.getSettings().width = half;
            pageFlip.getSettings().minWidth = half;
            pageFlip.getSettings().maxWidth = half;
            pageFlip.getSettings().height = Math.floor(window.innerHeight * 0.92);
            pageFlip.update();
        }, 120);
    }

    // Load pages from HTML
    pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));
    
    // Set initial cover state
    bookContainer.classList.add('is-cover');

    // Pin exact pixel half-page offset so CSS transforms use px not vw/% (avoids iOS Safari vw != innerWidth)
    if (isMobile) {
        const halfPx = mobilePageW; // mobilePageW = innerWidth/2 = one page width
        document.documentElement.style.setProperty('--page-half', `${halfPx}px`);
    }

    // Fix for the left shadow and binding string visibility on cover
    bookContainer.setAttribute('data-current-page', '0');
    
    let flipSoundPlayed = false;
    pageFlip.on('changeState', (e) => {
        if (isMobile) {
            const flipStates = new Set(['flipping', 'user_fold', 'fold_corner']);
            bookContainer.classList.toggle('is-flipping', flipStates.has(e.data));
        }
        
        // Play flip sound immediately when flip starts
        if (e.data === 'flipping' || e.data === 'user_fold') {
            if (userHasInteracted && !flipSoundPlayed) {
                flipSound.currentTime = 0;
                flipSound.play().catch(err => console.log(err));
                flipSoundPlayed = true;
            }
        } else if (e.data === 'read') {
            flipSoundPlayed = false; // Reset when page is resting
        }
    });
    
    if (isMobile) {
        window.addEventListener('resize', onMobileResize);
    }

    pageFlip.on('flip', (e) => {
        bookContainer.setAttribute('data-current-page', e.data);
        
        // Dynamic Book Centering (last spread reports left page index, not last page)
        const totalPages = pageFlip.getPageCount();
        bookContainer.classList.toggle('is-cover', e.data === 0);
        bookContainer.classList.toggle('is-back-cover', e.data >= totalPages - 2);
        bookContainer.classList.toggle('is-open', e.data > 0 && e.data < totalPages - 2);
        
        // Hide the finger animation on interaction
        const fingerIndicator = document.getElementById('fingerIndicator');
        if (e.data > 0 && fingerIndicator && fingerIndicator.style.display !== 'none') {
            fingerIndicator.style.display = 'none';
        }
    });

    // Navigation Buttons Logic
    document.getElementById('prevBtn').addEventListener('click', () => {
        pageFlip.flipPrev();
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
        pageFlip.flipNext();
    });

    // 3. Ambient Particle Canvas Game
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000, radius: 100 };

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = ['#d4af37', '#f3e5ab', '#b76e79', '#ffffff'];

    class Particle {
        constructor(x, y, isBurst = false) {
            this.x = x || Math.random() * canvas.width;
            this.y = y || Math.random() * canvas.height;
            this.size = Math.random() * 5 + 2; // Increased size
            
            // If part of a click burst, give them higher initial velocity
            const speedMult = isBurst ? 5 : 0.5;
            this.vx = (Math.random() - 0.5) * speedMult;
            this.vy = (Math.random() - 0.5) * speedMult;
            
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.baseAlpha = Math.random() * 0.6 + 0.4; // Increased visibility
            this.alpha = this.baseAlpha;
            this.life = isBurst ? Math.random() * 60 + 40 : Infinity; // Burst particles die
            
            this.angle = Math.random() * Math.PI * 2;
            this.spin = (Math.random() - 0.5) * 0.05;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            
            // Add a subtle glow
            ctx.shadowBlur = 3;
            ctx.shadowColor = this.color;
            
            // Draw 5 petals
            const numPetals = 5;
            const petalDistance = this.size * 0.8;
            const petalRadius = this.size * 0.6;
            
            for (let i = 0; i < numPetals; i++) {
                ctx.beginPath();
                const angle = (i * Math.PI * 2) / numPetals;
                const px = Math.cos(angle) * petalDistance;
                const py = Math.sin(angle) * petalDistance;
                ctx.arc(px, py, petalRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw center
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
            if (this.color === '#ffffff') {
                // Give white flowers a gold center ring so it doesn't blend in
                ctx.fillStyle = '#d4af37'; 
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            }
            ctx.fill();
            
            ctx.restore();
        }

        update() {
            this.angle += this.spin;
            
            // Mouse interaction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Repel particles from mouse slightly
            if (distance < mouse.radius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                
                this.vx -= forceDirectionX * force * 0.2;
                this.vy -= forceDirectionY * force * 0.2;
                
                // Brighten when near mouse
                this.alpha = Math.min(1, this.baseAlpha + force);
            } else {
                // Fade back to normal
                if (this.alpha > this.baseAlpha) {
                    this.alpha -= 0.01;
                }
            }

            // Apply velocity with some friction
            this.vx *= 0.98;
            this.vy *= 0.98;
            
            // Add a little random drift (Brownian motion)
            this.vx += (Math.random() - 0.5) * 0.1;
            this.vy += (Math.random() - 0.5) * 0.1;

            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

            // Handle lifespan for burst particles
            if (this.life !== Infinity) {
                this.life--;
                if (this.life < 20) {
                    this.alpha = Math.max(0, this.alpha - 0.05);
                }
            }
        }
    }

    // Initialize ambient particles
    const particleCount = (window.innerWidth * window.innerHeight) / 3000; // Increased count
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();

    // Event Listeners for Particle Interaction
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    // Touch support for ambient particles
    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, {passive: true});

    // Burst effect on click or tap
    const handleBurst = (e) => {
        // Don't burst if clicking on the book
        if (e.target.closest('.book-container')) return;
        
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (x !== undefined && y !== undefined) {
            for(let i = 0; i < 30; i++) {
                particles.push(new Particle(x, y, true));
            }
        }
    };

    window.addEventListener('mousedown', handleBurst);
    window.addEventListener('touchstart', handleBurst, {passive: true});

    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    window.addEventListener('touchend', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // 4. Countdown Timer Logic
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        const weddingDate = new Date("Dec 28, 2026 14:00:00").getTime();
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                countdownEl.innerHTML = "It's Wedding Time!";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownEl.innerHTML = `${days} days ${hours} hours ${minutes} min ${seconds} sec`;
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
});
