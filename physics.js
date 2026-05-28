/* ----------------------------------------------------
   LivePizza 2D Canvas Anti-Gravity Physics Engine
   ---------------------------------------------------- */

class Ingredient {
    constructor(x, y, type, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.02;
        
        this.isDragged = false;
        this.mass = 1;
        this.damping = 0.985; // Air resistance in space
        this.bounce = 0.75; // Elastic bounce coefficient

        // Customize sizes, mass and colors based on ingredient type
        switch (type) {
            case 'pepperoni':
                this.radius = 28;
                this.mass = 1.2;
                this.color = '#d32f2f';
                break;
            case 'basil':
                this.radius = 24;
                this.mass = 0.6;
                this.color = '#388e3c';
                break;
            case 'mushroom':
                this.radius = 26;
                this.mass = 0.9;
                this.color = '#e0d6c8';
                break;
            case 'olive':
                this.radius = 18;
                this.mass = 0.5;
                this.color = '#212121';
                break;
            case 'tomato':
                this.radius = 22;
                this.mass = 0.8;
                this.color = '#ff5722';
                break;
            case 'box':
                this.radius = 48; // Pizza box is larger
                this.mass = 2.5;
                this.color = '#ff7043';
                break;
            default:
                this.radius = 20;
                this.mass = 1;
        }

        // Store positions for velocity calculation while dragging
        this.lastX = x;
        this.lastY = y;
    }

    update(canvasWidth, canvasHeight, mouse) {
        if (this.isDragged) {
            // Dragging: Follow the mouse smoothly with custom damping
            this.vx = (mouse.x - this.x) * 0.25;
            this.vy = (mouse.y - this.y) * 0.25;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Spin the element as it gets dragged
            this.angularVelocity = (this.x - this.lastX) * 0.005;
            this.angle += this.angularVelocity;
            
            this.lastX = this.x;
            this.lastY = this.y;
        } else {
            // Normal Physics: Apply velocities
            this.vx *= this.damping;
            this.vy *= this.damping;
            this.angularVelocity *= 0.96; // Angular damping

            // Anti-gravity drifting forces (very low gravity + ambient space-noise waves)
            const time = Date.now() * 0.001;
            const noiseX = Math.sin(time + this.x * 0.01) * 0.04;
            const noiseY = Math.cos(time + this.y * 0.01) * 0.04 - 0.03; // Slight upward bias

            this.vx += noiseX;
            this.vy += noiseY;

            this.x += this.vx;
            this.y += this.vy;
            this.angle += this.angularVelocity;

            // Boundary Collisions
            // Left & Right
            if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx = -this.vx * this.bounce;
                this.angularVelocity += this.vy * 0.02;
            } else if (this.x + this.radius > canvasWidth) {
                this.x = canvasWidth - this.radius;
                this.vx = -this.vx * this.bounce;
                this.angularVelocity -= this.vy * 0.02;
            }

            // Top & Bottom
            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.vy = -this.vy * this.bounce;
                this.angularVelocity -= this.vx * 0.02;
            } else if (this.y + this.radius > canvasHeight) {
                this.y = canvasHeight - this.radius;
                this.vy = -this.vy * this.bounce;
                this.angularVelocity += this.vx * 0.02;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Render procedures depending on ingredient type
        switch (this.type) {
            case 'pepperoni':
                this.drawPepperoni(ctx);
                break;
            case 'basil':
                this.drawBasil(ctx);
                break;
            case 'mushroom':
                this.drawMushroom(ctx);
                break;
            case 'olive':
                this.drawOlive(ctx);
                break;
            case 'tomato':
                this.drawTomato(ctx);
                break;
            case 'box':
                this.drawPizzaBox(ctx);
                break;
        }

        ctx.restore();
    }

    drawPepperoni(ctx) {
        // Main meaty circle with gradient
        const grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, this.radius);
        grad.addColorStop(0, '#ff5252');
        grad.addColorStop(0.6, '#d32f2f');
        grad.addColorStop(1, '#9a0007');
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Shaded crisp rim
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#5f090b';
        ctx.stroke();

        // Little fat spots / meat textures
        ctx.fillStyle = '#ff8a80';
        const spots = [
            {x: -12, y: -6, r: 2}, {x: -4, y: -12, r: 2.5},
            {x: 8, y: -10, r: 3}, {x: 12, y: 4, r: 2},
            {x: 2, y: 12, r: 2.5}, {x: -10, y: 10, r: 3},
            {x: 0, y: 0, r: 4}
        ];
        spots.forEach(spot => {
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Specular glow highlight
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
    }

    drawBasil(ctx) {
        // Beautiful procedural green leaf shape using Bezier curves
        const grad = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
        grad.addColorStop(0, '#81c784');
        grad.addColorStop(0.7, '#388e3c');
        grad.addColorStop(1, '#1b5e20');

        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        // Left side of leaf
        ctx.bezierCurveTo(-this.radius * 1.5, -this.radius * 0.5, -this.radius * 1.2, this.radius * 0.7, 0, this.radius);
        // Right side of leaf
        ctx.bezierCurveTo(this.radius * 1.2, this.radius * 0.7, this.radius * 1.5, -this.radius * 0.5, 0, -this.radius);
        
        ctx.fillStyle = grad;
        ctx.fill();

        // Outline glow border
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(129, 199, 132, 0.5)';
        ctx.stroke();

        // Leaf veins
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(0, this.radius * 0.85);
        ctx.strokeStyle = '#a5d6a7';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Side veins
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * 0.4);
        ctx.quadraticCurveTo(-8, -this.radius * 0.5, -14, -this.radius * 0.4);
        ctx.moveTo(0, -this.radius * 0.4);
        ctx.quadraticCurveTo(8, -this.radius * 0.5, 14, -this.radius * 0.4);

        ctx.moveTo(0, this.radius * 0.1);
        ctx.quadraticCurveTo(-10, 0, -16, this.radius * 0.2);
        ctx.moveTo(0, this.radius * 0.1);
        ctx.quadraticCurveTo(10, 0, 16, this.radius * 0.2);

        ctx.strokeStyle = 'rgba(165, 214, 167, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawMushroom(ctx) {
        // Render slice of mushroom
        ctx.fillStyle = '#f5ede3';
        ctx.strokeStyle = '#c7bca9';
        ctx.lineWidth = 2.5;

        // Draw Cap
        ctx.beginPath();
        ctx.moveTo(-this.radius, 0);
        ctx.bezierCurveTo(-this.radius, -this.radius * 1.2, this.radius, -this.radius * 1.2, this.radius, 0);
        ctx.bezierCurveTo(this.radius * 0.7, this.radius * 0.3, -this.radius * 0.7, this.radius * 0.3, -this.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw Stem
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.3, this.radius * 0.1);
        ctx.lineTo(-this.radius * 0.25, this.radius * 0.95);
        ctx.quadraticCurveTo(0, this.radius * 1.15, this.radius * 0.25, this.radius * 0.95);
        ctx.lineTo(this.radius * 0.3, this.radius * 0.1);
        ctx.closePath();
        ctx.fillStyle = '#ece4d8';
        ctx.fill();
        ctx.stroke();

        // Mushroom Gills detail
        ctx.strokeStyle = '#c4b69d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.6, 0);
        ctx.lineTo(-this.radius * 0.6, -4);
        ctx.moveTo(-this.radius * 0.3, 0);
        ctx.lineTo(-this.radius * 0.3, -7);
        ctx.moveTo(0, -this.radius * 0.1);
        ctx.lineTo(0, -9);
        ctx.moveTo(this.radius * 0.3, 0);
        ctx.lineTo(this.radius * 0.3, -7);
        ctx.moveTo(this.radius * 0.6, 0);
        ctx.lineTo(this.radius * 0.6, -4);
        ctx.stroke();
    }

    drawOlive(ctx) {
        // Olive ring
        ctx.strokeStyle = '#151516';
        ctx.lineWidth = 8;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circle fill
        ctx.fillStyle = '#26262b';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 8, 0, Math.PI * 2);
        ctx.fill();

        // Highlight shininess
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.35, -this.radius * 0.35, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTomato(ctx) {
        // Glowing tomato wedge
        const grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, this.radius);
        grad.addColorStop(0, '#ff7043');
        grad.addColorStop(0.7, '#ff3d00');
        grad.addColorStop(1, '#b71c1c');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Outer skin stroke
        ctx.strokeStyle = '#800c0c';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Tomato segments / chambers
        ctx.fillStyle = '#e64a19';
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI * 2) / 3);
            ctx.beginPath();
            ctx.arc(this.radius * 0.4, 0, this.radius * 0.32, 0, Math.PI * 2);
            ctx.fill();

            // Seeds
            ctx.fillStyle = '#ffb74d';
            ctx.beginPath();
            ctx.arc(this.radius * 0.4, -2, 1.8, 0, Math.PI * 2);
            ctx.arc(this.radius * 0.45, 2, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawPizzaBox(ctx) {
        // Levitating LivePizza delivery box
        const size = this.radius * 2;
        
        // Shadow base
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-this.radius + 6, -this.radius + 6, size, size);

        // Core box cardboard gradient
        const boxGrad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
        boxGrad.addColorStop(0, '#f5d3b3');
        boxGrad.addColorStop(1, '#d7a174');
        ctx.fillStyle = boxGrad;
        ctx.fillRect(-this.radius, -this.radius, size, size);

        // Outer brown frame
        ctx.strokeStyle = '#8d5a36';
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.radius, -this.radius, size, size);

        // Box flap lines / 3D detailing
        ctx.strokeStyle = '#ac7047';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.radius, -this.radius + 10);
        ctx.lineTo(this.radius, -this.radius + 10);
        ctx.moveTo(-this.radius, this.radius - 10);
        ctx.lineTo(this.radius, this.radius - 10);
        ctx.stroke();

        // Neon logo circle in center
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.48, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner pizza wedge logo
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * 0.25);
        ctx.lineTo(this.radius * 0.22, this.radius * 0.22);
        ctx.lineTo(-this.radius * 0.22, this.radius * 0.22);
        ctx.closePath();
        ctx.fill();
    }
}

class PhysicsEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.ingredients = [];
        this.isMobile = window.innerWidth <= 768;
        
        // Mouse and Drag state tracking
        this.mouse = { x: 0, y: 0, lastX: 0, lastY: 0, isDown: false, repulsionRadius: 180 };
        this.draggedItem = null;
        
        this.init();
        this.setupEventListeners();
        this.startLoop();
    }

    init() {
        this.resizeCanvas();
        this.spawnIngredients();
    }

    resizeCanvas() {
        const rect = this.canvas.parentNode.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.isMobile = window.innerWidth <= 768;
        this.mouse.repulsionRadius = this.isMobile ? 100 : 180;
    }

    spawnIngredients() {
        this.ingredients = [];
        const quantity = this.isMobile ? 10 : 25;
        const types = ['pepperoni', 'basil', 'mushroom', 'olive', 'tomato', 'box'];

        for (let i = 0; i < quantity; i++) {
            // Pick a balanced type set
            let type = types[i % types.length];
            // On mobile, let's limit boxes since they are heavy
            if (this.isMobile && type === 'box' && i > 3) {
                type = 'basil';
            }

            // Spawn at random coordinates inside the safe area
            const r = 48; // safe margin
            const x = r + Math.random() * (this.canvas.width - r * 2);
            const y = r + Math.random() * (this.canvas.height - r * 2);

            this.ingredients.push(new Ingredient(x, y, type, this.canvas.width, this.canvas.height));
        }
    }

    shakeUniverse() {
        // Triggered by "Shake Universe" button
        this.ingredients.forEach(item => {
            item.vx += (Math.random() - 0.5) * 16;
            item.vy += (Math.random() - 0.5) * 16;
            item.angularVelocity += (Math.random() - 0.5) * 0.15;
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            const oldWidth = this.canvas.width;
            const oldHeight = this.canvas.height;
            this.resizeCanvas();
            
            // Re-scale ingredient positions to fit new dimensions
            this.ingredients.forEach(item => {
                item.x = (item.x / oldWidth) * this.canvas.width;
                item.y = (item.y / oldHeight) * this.canvas.height;
            });
        });

        // Mouse Down
        const handleDown = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = clientX - rect.left;
            this.mouse.y = clientY - rect.top;
            this.mouse.isDown = true;

            // Check if user clicked on any ingredient
            for (let i = this.ingredients.length - 1; i >= 0; i--) {
                const item = this.ingredients[i];
                const dist = Math.hypot(this.mouse.x - item.x, this.mouse.y - item.y);
                if (dist < item.radius + 10) { // small buffer for easier grabbing
                    this.draggedItem = item;
                    item.isDragged = true;
                    item.lastX = item.x;
                    item.lastY = item.y;
                    
                    // Put clicked item at the top of draw order
                    this.ingredients.splice(i, 1);
                    this.ingredients.push(item);
                    break;
                }
            }
        };

        // Mouse Move (apply magnetic repulsion & follow drag)
        const handleMove = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.lastX = this.mouse.x;
            this.mouse.lastY = this.mouse.y;
            this.mouse.x = clientX - rect.left;
            this.mouse.y = clientY - rect.top;

            // If not dragging, apply dynamic repulsion forcefield to close elements
            if (!this.draggedItem) {
                this.ingredients.forEach(item => {
                    const dx = item.x - this.mouse.x;
                    const dy = item.y - this.mouse.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < this.mouse.repulsionRadius && dist > 1) {
                        // Repel proportional to closeness
                        const force = (this.mouse.repulsionRadius - dist) / this.mouse.repulsionRadius;
                        const factor = this.isMobile ? 0.35 : 0.8;
                        item.vx += (dx / dist) * force * factor;
                        item.vy += (dy / dist) * force * factor;
                    }
                });
            }
        };

        // Mouse Up / Throw release
        const handleUp = () => {
            if (this.draggedItem) {
                this.draggedItem.isDragged = false;
                
                // Calculate release speed based on mouse velocity delta
                const throwX = this.mouse.x - this.mouse.lastX;
                const throwY = this.mouse.y - this.mouse.lastY;
                
                // Clamp throw velocity to reasonable values
                this.draggedItem.vx = Math.max(-15, Math.min(15, throwX * 0.8));
                this.draggedItem.vy = Math.max(-15, Math.min(15, throwY * 0.8));
                this.draggedItem.angularVelocity = (Math.random() - 0.5) * 0.15;
                
                this.draggedItem = null;
            }
            this.mouse.isDown = false;
        };

        // Desktop Pointer Listeners
        this.canvas.addEventListener('mousedown', e => handleDown(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', handleUp);

        // Touch mobile Listeners
        this.canvas.addEventListener('touchstart', e => {
            if (e.touches.length > 0) {
                handleDown(e.touches[0].clientX, e.touches[0].clientY);
                // Prevent scrolling when playing with canvas
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', e => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', handleUp);
    }

    handleCollisions() {
        const len = this.ingredients.length;
        for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
                const item1 = this.ingredients[i];
                const item2 = this.ingredients[j];

                // Don't collide objects if one of them is actively dragged
                if (item1.isDragged || item2.isDragged) continue;

                const dx = item2.x - item1.x;
                const dy = item2.y - item1.y;
                const dist = Math.hypot(dx, dy);
                const minDist = item1.radius + item2.radius;

                if (dist < minDist) {
                    // Collision Detected: Push overlapping items apart
                    const overlap = minDist - dist;
                    const pushX = (dx / dist) * overlap * 0.5;
                    const pushY = (dy / dist) * overlap * 0.5;

                    item1.x -= pushX;
                    item1.y -= pushY;
                    item2.x += pushX;
                    item2.y += pushY;

                    // Elastic collision math (momentum transfer)
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Relative velocity along normal vector
                    const kx = item1.vx - item2.vx;
                    const ky = item1.vy - item2.vy;
                    const relativeVelocity = kx * nx + ky * ny;

                    // Only resolve if objects are moving towards each other
                    if (relativeVelocity > 0) {
                        const impulse = (2 * relativeVelocity) / (item1.mass + item2.mass);
                        
                        item1.vx -= impulse * item2.mass * nx;
                        item1.vy -= impulse * item2.mass * ny;
                        item2.vx += impulse * item1.mass * nx;
                        item2.vy += impulse * item1.mass * ny;

                        // Add visual spinning as they collide
                        const spinFactor = 0.08;
                        item1.angularVelocity += relativeVelocity * (Math.random() - 0.5) * spinFactor;
                        item2.angularVelocity -= relativeVelocity * (Math.random() - 0.5) * spinFactor;
                    }
                }
            }
        }
    }

    startLoop() {
        const loop = () => {
            // Subtle semi-transparent canvas wipe for cosmic ghost trails!
            this.ctx.fillStyle = 'rgba(7, 4, 14, 0.25)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw galactic stardust background (faint stars inside canvas)
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            const time = Date.now() * 0.0003;
            // Static but gently flickering stardust
            for (let i = 0; i < (this.isMobile ? 15 : 40); i++) {
                const sx = (Math.sin(i * 199.12) * 0.5 + 0.5) * this.canvas.width;
                const sy = (Math.cos(i * 321.43) * 0.5 + 0.5) * this.canvas.height;
                const size = Math.abs(Math.sin(time + i)) * 1.5;
                this.ctx.fillRect(sx, sy, size, size);
            }

            // Update & Draw items
            this.ingredients.forEach(item => {
                item.update(this.canvas.width, this.canvas.height, this.mouse);
                item.draw(this.ctx);
            });

            this.handleCollisions();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// Instantiate physics canvas after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pizzaPhysics = new PhysicsEngine('physics-canvas');

    const shakeBtn = document.getElementById('gravity-shake-btn');
    if (shakeBtn) {
        shakeBtn.addEventListener('click', () => {
            if (window.pizzaPhysics) {
                window.pizzaPhysics.shakeUniverse();
                
                // Add a dynamic CSS rumble to the page for immersion!
                document.body.classList.add('rumble-active');
                setTimeout(() => {
                    document.body.classList.remove('rumble-active');
                }, 400);
            }
        });
    }
});
