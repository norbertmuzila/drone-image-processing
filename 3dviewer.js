import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Setup
const container = document.getElementById('threeViewer');
const loadingEl = document.getElementById('loading3d');
container.style.position = 'relative';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e17);

// Fog for depth perception
scene.fog = new THREE.FogExp2(0x0a0e17, 0.00015);

const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100000);
camera.position.set(0, 500, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotateSpeed = 1.2;

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(0, 1000, 500);
scene.add(dirLight);

// GUI
const gui = new GUI({ autoPlace: false, title: 'SfM Controls' });
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '12px';
gui.domElement.style.right = '12px';
gui.domElement.style.zIndex = '100';
container.appendChild(gui.domElement);

const params = {
    pointSize: 1.0,
    pointOpacity: 1.0,
    colorBoost: 1.4,
    mapOpacity: 0.55,
    showMap: true,
    bgColor: '#0a0e17',
    autoRotate: false,
    fogDensity: 0.00015
};

// Circular disc sprite for soft point rendering
const spriteCanvas = document.createElement('canvas');
spriteCanvas.width = 64; spriteCanvas.height = 64;
const sctx = spriteCanvas.getContext('2d');
const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
grad.addColorStop(0, 'rgba(255,255,255,1)');
grad.addColorStop(0.6, 'rgba(255,255,255,0.8)');
grad.addColorStop(1, 'rgba(255,255,255,0)');
sctx.fillStyle = grad;
sctx.fillRect(0, 0, 64, 64);
const sprite = new THREE.CanvasTexture(spriteCanvas);

// Georef Map Plane
const texLoader = new THREE.TextureLoader();
let mapPlane;
texLoader.load('assets/mosaic.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(100, 100);
    const mat = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        opacity: params.mapOpacity,
        side: THREE.DoubleSide
    });
    mapPlane = new THREE.Mesh(geo, mat);
    mapPlane.rotation.x = -Math.PI / 2;
    mapPlane.position.y = -5;
    mapPlane.visible = params.showMap;
    scene.add(mapPlane);
});

// Load PLY
const loader = new PLYLoader();
let pointsMesh;

loader.load(
    'assets/point_cloud.ply',
    function (geometry) {
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = new THREE.Vector3();
        box.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        // Boost vertex colours for vibrancy
        const hasColor = geometry.hasAttribute('color');
        if (hasColor) {
            const colors = geometry.getAttribute('color');
            for (let i = 0; i < colors.count; i++) {
                colors.setXYZ(i,
                    Math.min(colors.getX(i) * params.colorBoost, 1.0),
                    Math.min(colors.getY(i) * params.colorBoost, 1.0),
                    Math.min(colors.getZ(i) * params.colorBoost, 1.0)
                );
            }
            colors.needsUpdate = true;
        }

        const material = new THREE.PointsMaterial({
            size: maxDim / 60,
            vertexColors: hasColor,
            map: sprite,
            alphaTest: 0.01,
            transparent: true,
            opacity: params.pointOpacity,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        if (!hasColor) {
            material.color.setHex(0x00e5ff);
        }

        pointsMesh = new THREE.Points(geometry, material);
        pointsMesh.rotation.x = -Math.PI / 2;
        scene.add(pointsMesh);

        // Hide loading
        loadingEl.style.display = 'none';

        // Fit map plane
        if (mapPlane) {
            mapPlane.geometry.dispose();
            mapPlane.geometry = new THREE.PlaneGeometry(size.x * 1.3, size.y * 1.3);
            mapPlane.position.y = -(size.z / 2) - (maxDim * 0.05);
        }

        // Adjust camera planes to accommodate massive global scales
        camera.near = Math.max(0.1, maxDim / 10000);
        camera.far = Math.max(100000, maxDim * 10);
        camera.updateProjectionMatrix();

        // Camera
        camera.position.set(maxDim * 0.4, maxDim * 0.6, maxDim * 1.0);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.maxDistance = maxDim * 5;
        controls.update();

        // Fog
        scene.fog.density = 1.0 / maxDim;
        params.fogDensity = scene.fog.density;

        // GUI
        params.pointSize = material.size;

        const sfm = gui.addFolder('Point Cloud');
        sfm.add(params, 'pointSize', maxDim / 1000, maxDim / 10).name('Point Size').onChange(v => material.size = v);
        sfm.add(params, 'pointOpacity', 0.05, 1.0).name('Opacity').onChange(v => material.opacity = v);
        sfm.add(params, 'colorBoost', 0.5, 3.0).name('Color Boost').onChange(v => {
            if (!hasColor) return;
            params.colorBoost = v;
        });

        const mapF = gui.addFolder('Georef Map');
        mapF.add(params, 'showMap').name('Visible').onChange(v => { if (mapPlane) mapPlane.visible = v; });
        mapF.add(params, 'mapOpacity', 0.0, 1.0).name('Opacity').onChange(v => { if (mapPlane) mapPlane.material.opacity = v; });

        const env = gui.addFolder('Environment');
        env.addColor(params, 'bgColor').name('Background').onChange(v => {
            scene.background.set(v);
            scene.fog.color.set(v);
        });
        env.add(params, 'autoRotate').name('Auto Rotate').onChange(v => controls.autoRotate = v);
        env.add(params, 'fogDensity', 0, 5.0 / maxDim).name('Fog').onChange(v => scene.fog.density = v);

        gui.open();
    },
    function (xhr) {
        if (xhr.lengthComputable) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            loadingEl.querySelector('span').textContent = `Loading Dense 3D Model... ${pct}%`;
        }
    },
    function (error) {
        console.error('PLY load error:', error);
        loadingEl.innerHTML = '<span style="color:#ff4444">Failed to load 3D Model</span>';
    }
);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    if (container.clientWidth > 0) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});
