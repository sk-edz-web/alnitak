const card = document.getElementById('tilt-card');
const container = document.querySelector('.container-3d');

// Mouse move animation
container.addEventListener('mousemove', (e) => {
    // Get the dimensions of the card
    const rect = card.getBoundingClientRect();
    
    // Calculate mouse position relative to the center of the card
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Calculate rotation angles (Adjust the divisor to control the effect intensity)
    const rotateX = -(y / 15); 
    const rotateY = (x / 15);

    // Apply the 3D transformation
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

// Reset animation when mouse leaves
container.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.5s ease';
    card.style.transform = `rotateX(0deg) rotateY(0deg)`;
    
    // Remove transition after it resets so the hover effect stays sharp
    setTimeout(() => {
        card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
    }, 500);
});

// Add entry animation when page loads
window.addEventListener('load', () => {
    card.animate([
        { opacity: 0, transform: 'translateY(50px) scale(0.9) rotateX(-20deg)' },
        { opacity: 1, transform: 'translateY(0px) scale(1) rotateX(0deg)' }
    ], {
        duration: 1000,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        fill: 'forwards'
    });
});