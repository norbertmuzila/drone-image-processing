// Initialize Leaflet Map
function initMap() {
    // Exact GPS Bounds from Python Script
    const bounds = [[48.52117, 7.73573], [48.52360, 7.73789]];
    
    // Create map centered on the orthomosaic
    const map = L.map('leafletMap').fitBounds(bounds);
    
    // Add OpenStreetMap dark basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Overlay the orthomosaic Image
    // Since TIFF doesn't render in browser natively, we use the high-res mosaic.jpg 
    // mapped to the exact TIFF GPS boundaries.
    const imageUrl = 'assets/mosaic.jpg';
    L.imageOverlay(imageUrl, bounds, {
        opacity: 0.9,
        interactive: true
    }).addTo(map);
}

// Load Gallery Data
async function loadGalleries() {
    try {
        const response = await fetch('assets/data.json');
        const data = await response.json();
        
        // Populate Video GIFs and Real Video
        const videoGrid = document.getElementById('videoGallery');
        
        // Add the real 32MB MP4 video manually first
        const realVidItem = document.createElement('div');
        realVidItem.className = 'video-item';
        realVidItem.innerHTML = `
            <video controls style="width: 100%; height: auto; display: block;" preload="metadata">
                <source src="assets/videos/DJI_20260507105418_0063_D.MP4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="video-label">Full Quality MP4 (32MB)</div>
        `;
        videoGrid.appendChild(realVidItem);

        data.videos.forEach(vid => {
            if(vid.endsWith('.gif')) {
                // Skip the gif for the one we just added the real video for
                if(vid.includes('0063')) return;
                
                const item = document.createElement('div');
                item.className = 'video-item';
                item.innerHTML = `
                    <img src="assets/videos/${vid}" alt="Drone Telemetry Clip" loading="lazy">
                    <div class="video-label">${vid.replace('.gif', '')} (GIF Preview)</div>
                `;
                videoGrid.appendChild(item);
            }
        });

        // Populate Image Thumbnails -> Link to High Res
        const imageGrid = document.getElementById('imageGallery');
        data.gallery.forEach(img => {
            if(img.startsWith('thumb_')) {
                const originalName = img.replace('thumb_', '');
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.innerHTML = `
                    <a href="assets/gallery/high_res/${originalName}" target="_blank">
                        <img src="assets/gallery/${img}" alt="Raw Drone Image" loading="lazy">
                    </a>
                `;
                imageGrid.appendChild(item);
            }
        });
        
    } catch (e) {
        console.error("Failed to load gallery data:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadGalleries();
    
    // Intersection Observer for scroll animations
    const sections = document.querySelectorAll('.section-container');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.8s ease-out';
        observer.observe(section);
    });
});
