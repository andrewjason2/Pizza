/* ----------------------------------------------------
   LivePizza E-Commerce State & Interactions App
   ---------------------------------------------------- */

// Custom Rumble CSS definition injected dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes rumble {
        0% { transform: translate(0, 0) rotate(0deg); }
        20% { transform: translate(-3px, 2px) rotate(-1deg); }
        40% { transform: translate(3px, -1px) rotate(1deg); }
        60% { transform: translate(-2px, -2px) rotate(0deg); }
        80% { transform: translate(2px, 1px) rotate(1deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
    }
    .rumble-active {
        animation: rumble 0.4s ease-in-out infinite;
    }
    .flying-pizza-particle {
        position: fixed;
        width: 60px;
        height: 60px;
        z-index: 9999;
        pointer-events: none;
        border-radius: 50%;
        box-shadow: 0 8px 20px rgba(255, 87, 34, 0.4);
        transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.8s ease;
    }
`;
document.head.appendChild(styleSheet);

// Core Cart Application State
class LivePizzaCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('live_pizza_cart')) || [];
        this.deliveryCost = 199.00; // PKR Delivery Fee
        this.taxRate = 0.16; // 16% GST
        
        this.DOM = {
            badge: document.getElementById('cart-badge'),
            drawerOverlay: document.getElementById('cart-drawer'),
            drawerCloseBtn: document.getElementById('cart-close-btn'),
            cartToggleBtn: document.getElementById('cart-toggle-btn'),
            emptyState: document.getElementById('cart-empty-state'),
            itemsList: document.getElementById('cart-items-list'),
            summarySection: document.getElementById('cart-summary-section'),
            subtotal: document.getElementById('summary-subtotal'),
            delivery: document.getElementById('summary-delivery'),
            tax: document.getElementById('summary-tax'),
            total: document.getElementById('summary-total'),
            checkoutBtn: document.getElementById('checkout-btn'),
            startShoppingBtn: document.getElementById('start-shopping-btn')
        };
        
        this.init();
    }

    init() {
        this.render();
        this.setupListeners();
    }

    setupListeners() {
        // Toggle cart drawer open
        this.DOM.cartToggleBtn.addEventListener('click', () => this.toggleDrawer(true));
        
        // Toggle cart drawer close
        this.DOM.drawerCloseBtn.addEventListener('click', () => this.toggleDrawer(false));
        this.DOM.drawerOverlay.addEventListener('click', (e) => {
            if (e.target === this.DOM.drawerOverlay) this.toggleDrawer(false);
        });

        // Start shopping redirects
        if (this.DOM.startShoppingBtn) {
            this.DOM.startShoppingBtn.addEventListener('click', () => {
                this.toggleDrawer(false);
                document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Add to Cart Card Triggers
        document.querySelectorAll('.menu-card').forEach(card => {
            const addBtn = card.querySelector('.btn-add-to-cart');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    const id = card.getAttribute('data-id');
                    const name = card.getAttribute('data-name');
                    const price = parseFloat(card.getAttribute('data-price'));
                    const imageSrc = card.querySelector('.pizza-image').getAttribute('src');
                    
                    this.addItem(id, name, price, imageSrc);
                    this.playCartSound('add');
                    this.triggerFlyAnimation(e.clientX, e.clientY, imageSrc);
                });
            }
        });

        // Quantity modifier bindings in items list (Event delegation)
        this.DOM.itemsList.addEventListener('click', (e) => {
            const btn = e.target;
            if (btn.classList.contains('qty-btn')) {
                const id = btn.getAttribute('data-id');
                const operation = btn.getAttribute('data-op');
                this.modifyQuantity(id, operation);
            } else if (btn.closest('.cart-item-delete')) {
                const deleteBtn = btn.closest('.cart-item-delete');
                const id = deleteBtn.getAttribute('data-id');
                this.removeItem(id);
            }
        });
    }

    toggleDrawer(open) {
        if (open) {
            this.DOM.drawerOverlay.classList.add('active');
            // Ensure e-commerce cart drawer container is visible, success and checkout reset
            document.getElementById('cart-view-container').classList.add('active');
            document.getElementById('checkout-container').classList.remove('active');
            document.getElementById('checkout-success-container').classList.remove('active');
        } else {
            this.DOM.drawerOverlay.classList.remove('active');
        }
    }

    addItem(id, name, price, imageSrc) {
        const existing = this.items.find(item => item.id === id);
        if (existing) {
            existing.quantity += 1;
            createToast(`Added another ${name} to your cart!`, 'info');
        } else {
            this.items.push({ id, name, price, imageSrc, quantity: 1 });
            createToast(`${name} added to cart!`, 'success');
        }
        this.save();
        this.render();
    }

    removeItem(id) {
        const item = this.items.find(i => i.id === id);
        this.items = this.items.filter(item => item.id !== id);
        if (item) {
            createToast(`Removed ${item.name} from your cart.`, 'info');
        }
        this.save();
        this.render();
    }

    modifyQuantity(id, op) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;

        if (op === 'plus') {
            item.quantity += 1;
        } else if (op === 'minus') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                this.removeItem(id);
                return;
            }
        }
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('live_pizza_cart', JSON.stringify(this.items));
    }

    getTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * this.taxRate;
        const total = subtotal > 0 ? (subtotal + tax + this.deliveryCost) : 0;
        return { subtotal, tax, total };
    }

    render() {
        // Render Badge Count
        const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        this.DOM.badge.textContent = count;
        
        // Dynamic bouncing badge animation
        this.DOM.badge.classList.remove('cart-badge-bounce');
        void this.DOM.badge.offsetWidth; // trigger reflow
        this.DOM.badge.classList.add('cart-badge-bounce');

        // Toggle Empty vs Filled layout
        if (this.items.length === 0) {
            this.DOM.emptyState.style.display = 'flex';
            this.DOM.itemsList.style.display = 'none';
            this.DOM.summarySection.style.display = 'none';
            document.getElementById('cart-count-title').textContent = '(0)';
        } else {
            this.DOM.emptyState.style.display = 'none';
            this.DOM.itemsList.style.display = 'flex';
            this.DOM.summarySection.style.display = 'block';
            document.getElementById('cart-count-title').textContent = `(${count})`;

            // Draw cart items list
            this.DOM.itemsList.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <img src="${item.imageSrc}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <span class="price">Rs. ${item.price.toLocaleString()}</span>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" data-id="${item.id}" data-op="minus">&minus;</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn" data-id="${item.id}" data-op="plus">+</button>
                    </div>
                    <button class="cart-item-delete" data-id="${item.id}" aria-label="Remove item">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                    </button>
                </div>
            `).join('');

            // Calculate numbers
            const { subtotal, tax, total } = this.getTotals();
            this.DOM.subtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
            this.DOM.tax.textContent = `Rs. ${Math.round(tax).toLocaleString()}`;
            this.DOM.total.textContent = `Rs. ${Math.round(total).toLocaleString()}`;
        }
    }

    triggerFlyAnimation(startX, startY, imgUrl) {
        // Spawn absolute element at user's click coordinates
        const particle = document.createElement('img');
        particle.src = imgUrl;
        particle.className = 'flying-pizza-particle';
        particle.style.left = `${startX - 30}px`;
        particle.style.top = `${startY - 30}px`;
        document.body.appendChild(particle);

        // Get coordinates of the Navbar cart toggle button
        const targetRect = this.DOM.cartToggleBtn.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        // Force browser layout repaint
        void particle.offsetWidth;

        // Animate flying via CSS transform
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        particle.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2) rotate(360deg)`;
        particle.style.opacity = '0.3';

        // Clean up flying elements
        setTimeout(() => {
            particle.remove();
        }, 800);
    }

    playCartSound(type) {
        let soundId = type === 'add' ? 'cart-add-sound' : 'success-sound';
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            // Play safely avoiding permission browser warnings
            audio.play().catch(() => {});
        }
    }

    clearCart() {
        this.items = [];
        this.save();
        this.render();
    }
}

// UI Toast Notification Creator
function createToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icons
    const icon = type === 'success' ? '🛸' : '🛰️';
    
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Fade out and remove
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ----------------------------------------------------
// Checkout Panel Form Wizard
// ----------------------------------------------------
class CheckoutWizard {
    constructor(cartInstance) {
        // Safe check: if we are not on index.html with the inline checkout wizard, return early
        if (!document.getElementById('checkout-form')) {
            return;
        }

        this.cart = cartInstance;
        this.currentStep = 1;

        this.DOM = {
            cartView: document.getElementById('cart-view-container'),
            checkoutView: document.getElementById('checkout-container'),
            successView: document.getElementById('checkout-success-container'),
            checkoutBtn: document.getElementById('checkout-btn'),
            backToCartBtn: document.getElementById('checkout-back-to-cart'),
            form: document.getElementById('checkout-form'),
            submitBtn: document.getElementById('checkout-submit-btn'),
            successCloseBtn: document.getElementById('success-close-btn'),
            
            // Steps navigation
            stepIndicators: document.querySelectorAll('.checkout-steps .step'),
            stepPanels: document.querySelectorAll('.checkout-step-content'),
            step1Next: document.getElementById('checkout-step1-next'),
            step2Prev: document.getElementById('checkout-step2-prev'),
            step2Next: document.getElementById('checkout-step2-next'),
            step3Prev: document.getElementById('checkout-step3-prev'),
            
            // Form values
            inputName: document.getElementById('c-name'),
            inputPhone: document.getElementById('c-phone'),
            inputAddress: document.getElementById('c-address'),
            inputCardNumber: document.getElementById('c-card'),
            inputExp: document.getElementById('c-exp'),
            inputCvv: document.getElementById('c-cvv'),
            inputTerms: document.getElementById('c-terms'),

            // Review anchors
            reviewName: document.getElementById('review-name'),
            reviewAddress: document.getElementById('review-address'),
            reviewPayment: document.getElementById('review-payment'),
            reviewTotal: document.getElementById('review-total')
        };

        this.init();
    }

    init() {
        this.setupListeners();
    }

    setupListeners() {
        // Trigger Checkout Entry
        this.DOM.checkoutBtn.addEventListener('click', () => {
            this.openCheckout();
        });

        // Go Back to Cart
        this.DOM.backToCartBtn.addEventListener('click', () => {
            this.DOM.checkoutView.classList.remove('active');
            this.DOM.cartView.classList.add('active');
        });

        // Step 1 -> Step 2
        this.DOM.step1Next.addEventListener('click', () => {
            if (this.validateStep1()) {
                this.goToStep(2);
            }
        });

        // Step 2 -> Step 1
        this.DOM.step2Prev.addEventListener('click', () => this.goToStep(1));

        // Step 2 -> Step 3
        this.DOM.step2Next.addEventListener('click', () => {
            if (this.validateStep2()) {
                this.populateReviewData();
                this.goToStep(3);
            }
        });

        // Step 3 -> Step 2
        this.DOM.step3Prev.addEventListener('click', () => this.goToStep(2));

        // Radio Transaction methods visibility toggling
        const radios = document.getElementsByName('payment-method');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Highlight choice block
                document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
                e.target.closest('.payment-option').classList.add('selected');

                // Toggle forms
                const method = e.target.value;
                document.querySelectorAll('.payment-fields').forEach(el => el.classList.add('hidden'));
                
                if (method === 'card') {
                    document.getElementById('card-payment-fields').classList.remove('hidden');
                } else if (method === 'crypt') {
                    document.getElementById('crypt-payment-fields').classList.remove('hidden');
                } else if (method === 'cash') {
                    document.getElementById('cash-payment-fields').classList.remove('hidden');
                }
            });
        });

        // Format Credit Card values nicely
        this.DOM.inputCardNumber.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = v.match(/\d{4,16}/g);
            let match = (matches && matches[0]) || '';
            let parts = [];

            for (let i = 0, len = match.length; i < len; i += 4) {
                parts.push(match.substring(i, i + 4));
            }

            if (parts.length > 0) {
                e.target.value = parts.join(' ');
            } else {
                e.target.value = v;
            }
        });

        // Format Expiry values
        this.DOM.inputExp.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            if (v.length >= 2) {
                e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
            } else {
                e.target.value = v;
            }
        });

        // Form Submit
        this.DOM.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });

        // Return from success view
        this.DOM.successCloseBtn.addEventListener('click', () => {
            this.cart.toggleDrawer(false);
        });
    }

    openCheckout() {
        this.DOM.cartView.classList.remove('active');
        this.DOM.checkoutView.classList.add('active');
        this.goToStep(1);
    }

    goToStep(stepNum) {
        this.currentStep = stepNum;
        
        // Set steps markers active states
        this.DOM.stepIndicators.forEach((el, index) => {
            if (index + 1 === stepNum) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Set steps views
        this.DOM.stepPanels.forEach((el, index) => {
            if (index + 1 === stepNum) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    validateStep1() {
        if (!this.DOM.inputName.value.trim()) {
            createToast('Please state your Astronaut Name.', 'info');
            this.DOM.inputName.focus();
            return false;
        }
        if (!this.DOM.inputPhone.value.trim()) {
            createToast('A secure communications phone is required.', 'info');
            this.DOM.inputPhone.focus();
            return false;
        }
        if (!this.DOM.inputAddress.value.trim()) {
            createToast('Where should our landing drone navigate?', 'info');
            this.DOM.inputAddress.focus();
            return false;
        }
        return true;
    }

    validateStep2() {
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        
        if (method === 'card') {
            const card = this.DOM.inputCardNumber.value.replace(/\s+/g, '');
            if (card.length < 16) {
                createToast('Invalid Cosmic Credit Card number length.', 'info');
                this.DOM.inputCardNumber.focus();
                return false;
            }
            if (this.DOM.inputExp.value.length < 5) {
                createToast('Please fill expiration date (MM/YY).', 'info');
                this.DOM.inputExp.focus();
                return false;
            }
            if (this.DOM.inputCvv.value.length < 3) {
                createToast('Invalid CVV credentials.', 'info');
                this.DOM.inputCvv.focus();
                return false;
            }
        }
        return true;
    }

    populateReviewData() {
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        let pLabel = '💳 Credit Card';
        if (method === 'crypt') pLabel = '🌌 PizzaCoin';
        if (method === 'cash') pLabel = '💵 Cash on Delivery';

        this.DOM.reviewName.textContent = this.DOM.inputName.value;
        this.DOM.reviewAddress.textContent = this.DOM.inputAddress.value;
        this.DOM.reviewPayment.textContent = pLabel;
        
        const { total } = this.cart.getTotals();
        this.DOM.reviewTotal.textContent = `$${total.toFixed(2)}`;
    }

    submitOrder() {
        if (!this.DOM.inputTerms.checked) {
            createToast('Please authorize our delivery driver permissions!', 'info');
            return;
        }

        // Change submit button to loading state
        const originalBtnText = this.DOM.submitBtn.innerHTML;
        this.DOM.submitBtn.disabled = true;
        this.DOM.submitBtn.innerHTML = `PLACING ORDER... 🍕`;

        // Simulate cooking and delivery dispatch sequence
        setTimeout(() => {
            // Play success sound
            this.cart.playCartSound('success');
            
            // Switch to success viewport
            this.DOM.checkoutView.classList.remove('active');
            this.DOM.successView.classList.add('active');
            
            // Clear cart state
            this.cart.clearCart();
            
            // Reset button
            this.DOM.submitBtn.disabled = false;
            this.DOM.submitBtn.innerHTML = originalBtnText;

            // Trigger beautiful spatial confetti shapes on our physics background canvas!
            if (window.pizzaPhysics) {
                window.pizzaPhysics.shakeUniverse();
            }

            createToast('Order placed successfully!', 'success');
        }, 2200);
    }
}

// Dynamic active navigation indicator highlighting based on URL pathname & scrolling
function highlightActiveNav() {
    const path = window.location.pathname;
    let pageFound = false;

    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        link.classList.remove('active');

        // Check exact match for separate files
        if (path.includes(href) && href !== 'index.html' && href.endsWith('.html')) {
            link.classList.add('active');
            pageFound = true;
        }
    });

    // Fallback to Home anchor scroll updates if we are on index
    if (!pageFound && (path === '/' || path.includes('index.html') || path.endsWith('/'))) {
        const sections = ['hero', 'menu', 'physics-info'];
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const top = el.offsetTop;
                const height = el.offsetHeight;
                if (scrollPos >= top && scrollPos < top + height) {
                    document.querySelectorAll('.nav-link').forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${id}` || href === `index.html#${id}` || (id === 'hero' && href === 'index.html')) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    }
}

document.addEventListener('scroll', highlightActiveNav);
window.addEventListener('load', highlightActiveNav);

// App Bootstrap execution
document.addEventListener('DOMContentLoaded', () => {
    const liveCart = new LivePizzaCart();
    new CheckoutWizard(liveCart);
});
