// --- Interactive Grid Background ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let points = [];
let width, height;
const spacing = 40; // Grid spacing
const mouse = { x: -1000, y: -1000 };

// Resize handling
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initPoints();
}
window.addEventListener('resize', resize);

// Mouse handling
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseout', () => {
    mouse.x = -1000;
    mouse.y = -1000;
});

// Point class
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.9;
        this.springFactor = 0.1;
    }

    update() {
        // Spring force to return to origin
        let dx = this.originX - this.x;
        let dy = this.originY - this.y;
        this.vx += dx * this.springFactor;
        this.vy += dy * this.springFactor;

        // Mouse interaction (Gravity Well / Indentation)
        let dxMouse = mouse.x - this.x;
        let dyMouse = mouse.y - this.y;
        let distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        let distThreshold = 800; // Massive radius (approx 4-5x original perception)

        if (distMouse < distThreshold) {
            // Attraction force (pulls points towards mouse - indentation)
            // Using a power function (squared) for a smoother "curved" falloff
            let rawForce = (distThreshold - distMouse) / distThreshold;
            let force = rawForce * rawForce; // Smooth ease-in

            let angle = Math.atan2(dyMouse, dxMouse);
            let strength = 2.4; // Reduced to 0.3x of previous (8.0 * 0.3)

            this.vx += Math.cos(angle) * force * strength;
            this.vy += Math.sin(angle) * force * strength;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
    }
}

function initPoints() {
    points = [];
    let rows = 0;
    // Initialize grid points
    // Store row count for connection logic
    let yCount = 0;
    for (let y = 0; y <= height + spacing; y += spacing) {
        yCount++;
    }
    rows = yCount;

    for (let x = 0; x <= width + spacing; x += spacing) {
        for (let y = 0; y <= height + spacing; y += spacing) {
            points.push(new Point(x, y));
        }
    }
    // Attach row count to the points array or module scope for draw function
    window.gridRows = rows;
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Check theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.strokeStyle = isDark ? 'rgba(88, 166, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;

    ctx.beginPath();

    const rows = window.gridRows || Math.ceil((height + spacing) / spacing);

    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        p.update();

        // Connect to next in column (down)
        // Points are added: loop X { loop Y { push } }
        // So i+1 is the next Y (down)
        if ((i + 1) % rows !== 0 && i + 1 < points.length) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
        }

        // Connect to next in row (right)
        // i + rows is the same Y in next X column
        if (i + rows < points.length) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(points[i + rows].x, points[i + rows].y);
        }
    }

    ctx.stroke();
    requestAnimationFrame(draw);
}

// Start
resize();
draw();
