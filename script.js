document.addEventListener('DOMContentLoaded', function() {
    const bookContainer = document.querySelector('.book-container');
    const bookEl = document.getElementById('book');
    
    // 1. Initialize PageFlip
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

    // Fix for the left shadow and binding string visibility on cover
    bookContainer.setAttribute('data-current-page', '0');
    
    pageFlip.on('flip', (e) => {
        bookContainer.setAttribute('data-current-page', e.data);
        
        // Hide the finger animation on interaction
        const fingerIndicator = document.getElementById('fingerIndicator');
        if (e.data > 0 && fingerIndicator && fingerIndicator.style.display !== 'none') {
            fingerIndicator.style.display = 'none';
        }
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
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.fill();
            
            // Add a subtle glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.globalAlpha = 1; // Reset for other drawing
            ctx.shadowBlur = 0;
        }

        update() {
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

    // Burst effect on click
    window.addEventListener('mousedown', (e) => {
        // Don't burst if clicking on the book
        if (e.target.closest('.book-container')) return;
        
        for(let i = 0; i < 30; i++) {
            particles.push(new Particle(e.x, e.y, true));
        }
    });

    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });
});
