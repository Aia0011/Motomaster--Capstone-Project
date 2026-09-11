import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './OrbitControls.js';

export function initBatteryViewer(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (container.querySelector('canvas')) return;

    const {
        enableDrag = true,
        enableRotate = true,
        enableSelection = false,
    } = options;

    requestAnimationFrame(() => {
        // Get container dimensions - use defaults if hidden
        let w = container.clientWidth || 400;
        let h = container.clientHeight || 500;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);
        camera.position.set(0, 0, 2.5);
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
        canvas.style.zIndex = '1000';
        container.appendChild(canvas);

        let batteryModel = null;
        let batteryPivot = null;
        let controls = null;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        let isDragging = false;
        let isRotating = false;
        let dragOffset = new THREE.Vector3();
        let lastPointer = { x: 0, y: 0 };

        scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.0));

        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(2, 3, 2);
        scene.add(key);

        const fill = new THREE.DirectionalLight(0xffd7c2, 0.6);
        fill.position.set(-2, 1, -1);
        scene.add(fill);

        function animate() {
            requestAnimationFrame(animate);
            if (controls) controls.update();
            renderer.render(scene, camera);
        }

        // Start animation loop immediately
        animate();

        if (enableDrag || enableRotate || enableSelection) {
            canvas.style.cursor = 'grab';

            if (enableRotate) {
                try {
                    controls = new OrbitControls(camera, canvas);
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.08;
                    controls.enablePan = false;
                    controls.enableZoom = false;
                    controls.target.set(0, 0, 0);
                    controls.update();
                } catch (err) {
                    console.warn('Battery OrbitControls failed to initialize:', err);
                }
            }

            canvas.addEventListener('pointerdown', (event) => {
                if (!batteryPivot) return;

                const rect = container.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(batteryPivot.children, true);

                if (enableDrag && intersects.length > 0) {
                    isDragging = true;
                    canvas.style.cursor = 'grabbing';

                    const intersectPoint = intersects[0].point;
                    dragOffset.copy(batteryPivot.position).sub(intersectPoint);
                }
            }, { passive: true });

            window.addEventListener('pointermove', (event) => {
                if (!batteryPivot) return;

                const rect = container.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                if (!isDragging) return;

                raycaster.setFromCamera(mouse, camera);
                const intersectPoint = new THREE.Vector3();

                if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
                    // Constrain to car battery position area (x: -0.2 to 0.2, y: -0.15 to 0.15)
                    let newX = intersectPoint.x + dragOffset.x;
                    let newY = intersectPoint.y + dragOffset.y;

                    // Apply bounds (car battery position only)
                    newX = Math.max(-0.25, Math.min(0.25, newX));
                    newY = Math.max(-0.2, Math.min(0.2, newY));

                    batteryPivot.position.set(newX, newY, 0);

                    // Check if at target position (car battery position)
                    const distance = Math.sqrt(newX * newX + newY * newY);
                    if (distance < 0.05) {
                        // Snap to center (car battery position)
                        batteryPivot.position.set(0, 0, 0);
                        container.dispatchEvent(new CustomEvent('batteryPositioned'));
                    }
                }
            }, { passive: true });

            window.addEventListener('pointerup', (event) => {
                const wasDragging = isDragging;
                isDragging = false;
                canvas.style.cursor = 'grab';

                if (enableSelection && !wasDragging && batteryPivot) {
                    const rect = container.getBoundingClientRect();
                    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects(batteryPivot.children, true);
                    if (intersects.length > 0) {
                        const clicked = intersects[0].object;
                        container.dispatchEvent(new CustomEvent('batteryMeshClicked', {
                            detail: {
                                name: clicked.name || clicked.parent?.name || 'part',
                                object: clicked,
                            }
                        }));
                    }
                }
            }, { passive: true });

            canvas.addEventListener('pointerleave', () => {
                if (!isDragging) canvas.style.cursor = 'grab';
            }, { passive: true });
        }

        const loader = new GLTFLoader();
        loader.load(
            'models/Battery.glb',
            (gltf) => {
                const model = gltf.scene;

                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);

                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim > 0) model.scale.setScalar((1.0 / maxDim) * 1.4);

                batteryPivot = new THREE.Group();
                batteryPivot.add(model);
                // Start at offset position so user can drag to car battery position
                batteryPivot.position.set(-0.15, 0.12, 0);
                scene.add(batteryPivot);
                batteryModel = model;

                // Make nested meshes identifiable for click selection.
                model.traverse((child) => {
                    if (!child.isMesh) return;
                    child.userData.selectable = true;
                });

                // Camera looks at center (target position)
                camera.position.set(0, 0, 2.2);
                camera.lookAt(0, 0, 0);

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

                // Model loaded - it's already being rendered by the running animation loop
                container.dispatchEvent(new CustomEvent('batteryViewerReady', {
                    detail: { model: batteryModel, pivot: batteryPivot }
                }));
            },
            undefined,
            (err) => console.error('Failed to load Battery model:', err)
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

        // Fix canvas size when container becomes visible (for modals)
        function checkAndResize() {
            const cw = container.clientWidth || 400;
            const ch = container.clientHeight || 500;
            if (cw > 1 && ch > 1) {
                camera.aspect = cw / ch;
                camera.updateProjectionMatrix();
                renderer.setSize(cw, ch);
            }
        }
        // Check multiple times over 2 seconds to catch when modal becomes visible
        for (let i = 1; i <= 10; i++) {
            setTimeout(checkAndResize, i * 200);
        }
    });
}
