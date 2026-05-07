// Interactive Image Panner for High-Res Mosaic
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('mosaicPanContainer');
    const image = document.getElementById('mosaicImage');
    
    if (container && image) {
        container.addEventListener('mousemove', (e) => {
            // Get dimensions
            const containerRect = container.getBoundingClientRect();
            
            // Calculate mouse position relative to container (0 to 1)
            const xPercent = (e.clientX - containerRect.left) / containerRect.width;
            const yPercent = (e.clientY - containerRect.top) / containerRect.height;
            
            // Calculate the maximum scroll amount
            const maxX = image.clientWidth - containerRect.width;
            const maxY = image.clientHeight - containerRect.height;
            
            // Apply transform based on percentage
            const translateX = -xPercent * maxX;
            const translateY = -yPercent * maxY;
            
            image.style.transform = `translate(${translateX}px, ${translateY}px)`;
        });
        
        // Reset when mouse leaves
        container.addEventListener('mouseleave', () => {
            image.style.transform = `translate(0px, 0px)`;
            image.style.transition = 'transform 0.5s ease';
            
            setTimeout(() => {
                image.style.transition = 'transform 0.1s ease-out';
            }, 500);
        });
    }

    // Add intersection observer for scroll animations
    const sections = document.querySelectorAll('.section-container');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.8s ease-out';
        observer.observe(section);
    });
});
