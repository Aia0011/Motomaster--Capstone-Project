import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';

export function initBakingViewer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.querySelector('canvas')) return;

    requestAnimationFrame(() => {
        const w = container.clientWidth || 130;
        const h = container.clientHeight || 100;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);
        camera.position.set(0, 0, 2.2);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(w, h);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        const canvas = renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.cursor = 'grab';
        container.appendChild(canvas);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.autoRotate = false;
        controls.minDistance = 0.6;
        controls.maxDistance = 5.0;

        canvas.addEventListener('pointerdown', () => { canvas.style.cursor = 'grabbing'; }, { passive: true });
        window.addEventListener('pointerup', () => { canvas.style.cursor = 'grab'; }, { passive: true });
        canvas.addEventListener('pointerleave', () => { canvas.style.cursor = 'grab'; }, { passive: true });

        scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.0));
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(2, 3, 2);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffd7c2, 0.6);
        fill.position.set(-2, 1, -1);
        scene.add(fill);

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        const loader = new GLTFLoader();
        console.log('BakingViewer: loading model models/Baking_Soda.glb');
        loader.load(
            'models/Baking_Soda.glb',
            (gltf) => {
                console.log('BakingViewer: model loaded');
                const model = gltf.scene;

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);

                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) model.scale.setScalar((1.0 / maxDim) * 1.2);

                const pivot = new THREE.Group();
                pivot.add(model);
                scene.add(pivot);

                const box2 = new THREE.Box3().setFromObject(pivot);
                const center2 = box2.getCenter(new THREE.Vector3());
                const size2 = box2.getSize(new THREE.Vector3());
                console.log('BakingViewer: pivot bounds', { size: size2, center: center2 });

                const maxDim2 = Math.max(size2.x, size2.y, size2.z);
                if (maxDim2 > 0) {
                    const distance = maxDim2 * 1.6 + 0.4;
                    camera.position.set(center2.x, center2.y + maxDim2 * 0.45, center2.z + distance);
                    camera.lookAt(center2);
                    controls.target.copy(center2);
                    controls.update();
                }

                model.traverse((child) => {
                    if (!child.isMesh) return;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m) => {
                        if (!m) return;
                        m.side = THREE.DoubleSide;
                        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                        m.needsUpdate = true;
                    });
                });

                animate();
            },
            undefined,
            (err) => console.error('Failed to load Baking_Soda model:', err)
        );

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                const cw = container.clientWidth || 1;
                const ch = container.clientHeight || 1;
                camera.aspect = cw / ch;
                camera.updateProjectionMatrix();
                renderer.setSize(cw, ch);
            });
            ro.observe(container);
        }
    });
}
