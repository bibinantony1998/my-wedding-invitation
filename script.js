document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize PageFlip
    const bookEl = document.getElementById('book');
    const pageFlip = new St.PageFlip(bookEl, {
        width: 350, // base page width
        height: 500, // base page height
        size: "stretch",
        minWidth: 300,
        maxWidth: 450,
        minHeight: 400,
        maxHeight: 650,
        maxShadowOpacity: 0.5,
        showCover: true,
        mobileScrollSupport: false,
        useMouseEvents: true
    });

    // Load pages from HTML
    pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));

    // Fix for the left shadow on the cover page
    bookEl.setAttribute('data-current-page', '0');
    
    pageFlip.on('flip', (e) => {
        bookEl.setAttribute('data-current-page', e.data); // e.data is the new page number
        
        // Hide the finger animation on interaction
        if (fingerIndicator && fingerIndicator.style.display !== 'none') {
            fingerIndicator.style.display = 'none';
        }
    });

    // 2. Hide Finger Indicator logic
    const fingerIndicator = document.getElementById('fingerIndicator');
    const updateFingerPosition = () => {
        const bookRect = bookEl.getBoundingClientRect();
        if(fingerIndicator) {
            fingerIndicator.style.left = (bookRect.right - 40) + 'px';
            fingerIndicator.style.top = (bookRect.bottom - 40) + 'px';
        }
    };
    setTimeout(updateFingerPosition, 500);
    window.addEventListener('resize', updateFingerPosition);

    // 3. Hidden Objects Game Logic
    const gameContainer = document.getElementById('gameContainer');
    const hintText = document.querySelector('.game-hint');
    const totalRings = 5;
    let foundRings = 0;

    // Define safe spawn zones (percentages) to avoid the centered book
    const spawnZones = [
        { top: [5, 20], left: [5, 25] },     // Top Left
        { top: [5, 20], left: [70, 90] },    // Top Right
        { top: [75, 90], left: [5, 25] },    // Bottom Left
        { top: [75, 90], left: [70, 90] },   // Bottom Right
        { top: [5, 15], left: [40, 60] },    // Top Center
    ];

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Spawn the rings
    spawnZones.forEach(zone => {
        const ring = document.createElement('div');
        ring.className = 'hidden-ring';
        ring.innerHTML = '💍'; // You can change this to an image if you prefer
        
        // Position them based on the zone percentages
        ring.style.top = getRandom(zone.top[0], zone.top[1]) + '%';
        ring.style.left = getRandom(zone.left[0], zone.left[1]) + '%';
        
        // Random slight rotation for natural look
        const rot = getRandom(-30, 30);
        ring.style.transform = `rotate(${rot}deg)`;
        
        // On click event
        ring.addEventListener('click', function() {
            if (this.classList.contains('found')) return;
            
            this.classList.add('found');
            foundRings++;
            
            if (foundRings < totalRings) {
                hintText.innerHTML = `Found ${foundRings}/${totalRings} rings! Keep looking! 💍`;
            } else {
                hintText.innerHTML = `You found all the rings! 🎉`;
                hintText.style.color = '#28a745'; // green success
                triggerConfetti();
            }
            
            // Remove element after animation
            setTimeout(() => this.remove(), 300);
        });
        
        gameContainer.appendChild(ring);
    });

    // Confetti Celebration
    function triggerConfetti() {
        if (typeof confetti === 'function') {
            const duration = 3000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#d4af37', '#f3e5ab', '#b76e79', '#ffffff']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#d4af37', '#f3e5ab', '#b76e79', '#ffffff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }
});
