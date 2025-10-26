cat > script.js << 'EOF'
// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll animations for device mockups
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const deviceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe device mockups when page loads
window.addEventListener('DOMContentLoaded', () => {
    const phoneMockup = document.querySelector('.phone-mockup-3d');
    const laptopMockup = document.querySelector('.laptop-mockup-3d');
    
    if (phoneMockup) {
        deviceObserver.observe(phoneMockup);
        console.log('Phone mockup observer added');
    }
    
    if (laptopMockup) {
        deviceObserver.observe(laptopMockup);
        console.log('Laptop mockup observer added');
    }
});
EOF
