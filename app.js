// Initialize Leaflet Map
function initMap() {
    const bounds = [[48.52117, 7.73573], [48.52360, 7.73789]];
    const map = L.map('leafletMap').fitBounds(bounds);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

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

        const videoGrid = document.getElementById('videoGallery');
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
            if (vid.endsWith('.gif')) {
                if (vid.includes('0063')) return;
                const item = document.createElement('div');
                item.className = 'video-item';
                item.innerHTML = `
                    <img src="assets/videos/${vid}" alt="Drone Telemetry Clip" loading="lazy">
                    <div class="video-label">${vid.replace('.gif', '')} (GIF Preview)</div>
                `;
                videoGrid.appendChild(item);
            }
        });

        const imageGrid = document.getElementById('imageGallery');
        data.gallery.forEach(img => {
            if (img.startsWith('thumb_')) {
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

// Robust PDF download fallback (works even if browser download attribute is unreliable)
async function robustDownload(url, filename) {
    try {
        const r = await fetch(url);
        if (!r.ok) throw new Error('Network response was not ok');
        const blob = await r.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || url.split('/').pop();
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error('Download fallback failed, opening file in new tab:', err);
        window.open(url, '_blank');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadGalleries();

    // Attach robust download handler to ISU report link
    const reportLink = document.getElementById('downloadReport');
    if (reportLink) {
        reportLink.addEventListener('click', (e) => {
            e.preventDefault();
            robustDownload(reportLink.href, 'Drone_GIS_Report.pdf');
        });
    }

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
