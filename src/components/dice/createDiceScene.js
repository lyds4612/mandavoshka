import {
    CircleGeometry, DirectionalLight, Euler, Group, HemisphereLight,
    Mesh, MeshStandardMaterial, OrthographicCamera, PCFSoftShadowMap,
    PlaneGeometry, Quaternion, Scene, ShadowMaterial, Vector3, WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DICE_FACES, PIP_POSITIONS } from './diceFaces';

const UP = new Vector3(0, 1, 0);
const FACE_FORWARD = new Vector3(0, 0, 1);
const REST_POSITIONS = [[-1.65, -2.6], [1.65, -2.9]];

export const getResultQuaternion = (value, yaw = 0) => {
    const face = DICE_FACES.find((candidate) => candidate.value === value);
    const alignFace = new Quaternion().setFromUnitVectors(new Vector3(...face.normal), UP);
    return new Quaternion().setFromAxisAngle(UP, yaw).multiply(alignFace);
};

const seededRandom = (id) => {
    let seed = Array.from(id).reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 1);
    return () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
};

const makeDie = (geometry, pipGeometry) => {
    const group = new Group();
    const material = new MeshStandardMaterial({ color: 0xfff5dc, roughness: 0.3, metalness: 0.05 });
    const pipMaterial = new MeshStandardMaterial({ color: 0x172431, roughness: 0.7 });
    const cube = new Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    group.add(cube);

    DICE_FACES.forEach(({ value, normal }) => {
        const face = new Group();
        face.quaternion.setFromUnitVectors(FACE_FORWARD, new Vector3(...normal));
        face.position.set(...normal).multiplyScalar(0.502);
        PIP_POSITIONS[value].forEach(([x, y]) => {
            const pip = new Mesh(pipGeometry, pipMaterial);
            pip.position.set(x * 0.235, y * 0.235, 0);
            face.add(pip);
        });
        group.add(face);
    });

    return { group, material, pipMaterial };
};

const bounceHeight = (progress) => {
    if (progress < 0.34) return 7 * (1 - (progress / 0.34) ** 2);
    const bounces = [[0.34, 0.62, 1.5], [0.62, 0.82, 0.4], [0.82, 1, 0.07]];
    const [start, end, height] = bounces.find(([, end]) => progress <= end) ?? bounces[2];
    const time = (progress - start) / (end - start);
    return Math.max(0, 4 * height * time * (1 - time));
};

// Keep the lowest corner on the board while a cube rocks onto its final face.
const supportHeight = (quaternion) => {
    const axes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
    return axes.reduce((height, axis) => height + Math.abs(axis.applyQuaternion(quaternion).y), 0) / 2;
};

export const createDiceScene = (container, onContextLost) => {
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new OrthographicCamera(-7, 7, 7, -7, 0.1, 80);
    camera.position.set(0, 24, 16);
    camera.lookAt(0, 0, 0);
    scene.add(new HemisphereLight(0xffffff, 0x8b7964, 2.5));
    const light = new DirectionalLight(0xffffff, 3);
    light.position.set(-4, 12, 6);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.1, far: 35 });
    light.shadow.normalBias = 0.035;
    scene.add(light);

    const floorGeometry = new PlaneGeometry(18, 24);
    const floorMaterial = new ShadowMaterial({ opacity: 0.22 });
    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const geometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.1);
    const pipGeometry = new CircleGeometry(0.078, 24);
    const dice = [makeDie(geometry, pipGeometry), makeDie(geometry, pipGeometry)];
    dice.forEach(({ group }) => scene.add(group));

    let frame = null;
    let activeThrow = null;
    let contextAvailable = true;
    const render = () => { if (contextAvailable) renderer.render(scene, camera); };
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; };
    const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        if (!width || !height) return;
        camera.left = -7 * width / height;
        camera.right = 7 * width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        render();
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(container);
    window.addEventListener('resize', resize);
    const handleContextLost = (event) => {
        event.preventDefault();
        contextAvailable = false;
        stop();
        onContextLost();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    resize();
    renderer.compile(scene, camera);
    dice.forEach(({ group }) => { group.visible = false; });
    render();

    const finish = () => {
        stop();
        if (!activeThrow) return;
        dice.forEach(({ group }, index) => {
            const motion = activeThrow.motions[index];
            group.quaternion.copy(motion.target);
            group.position.set(motion.endX, 0.5, motion.endZ);
        });
        render();
    };

    return {
        roll(values, id, duration, reducedMotion) {
            stop();
            const random = seededRandom(id);
            const motions = values.map((value, index) => {
                const spin = [Math.PI * (4 + random() * 4), Math.PI * (4 + random() * 4), Math.PI * (2 + random() * 2)];
                return {
                    startX: 5.5 - index * 1.5,
                    startZ: 1.5 + index,
                    endX: REST_POSITIONS[index][0] + (random() - 0.5) * 0.25,
                    endZ: REST_POSITIONS[index][1] + (random() - 0.5) * 0.3,
                    spin,
                    settleFrom: new Quaternion().setFromEuler(new Euler(...spin.map((angle) => angle * 0.76))),
                    target: getResultQuaternion(value, (random() - 0.5) * 0.65),
                };
            });
            activeThrow = { motions };
            dice.forEach(({ group }) => { group.visible = true; });
            if (reducedMotion) { finish(); return; }
            const startedAt = performance.now();
            const animate = (now) => {
                const progress = Math.min((now - startedAt) / duration, 1);
                dice.forEach(({ group }, index) => {
                    const motion = motions[index];
                    const time = Math.max(0, Math.min(1, (progress - index * 0.045) / (1 - index * 0.045)));
                    if (time < 0.76) {
                        group.quaternion.setFromEuler(new Euler(...motion.spin.map((angle) => angle * time)));
                    } else {
                        const settle = (time - 0.76) / 0.24;
                        group.quaternion.copy(motion.settleFrom).slerp(motion.target, settle * settle * (3 - 2 * settle));
                    }
                    const travel = 1 - (1 - time) ** 3;
                    group.position.set(
                        motion.startX + (motion.endX - motion.startX) * travel,
                        supportHeight(group.quaternion) + bounceHeight(time),
                        motion.startZ + (motion.endZ - motion.startZ) * travel,
                    );
                });
                render();
                if (progress < 1) frame = requestAnimationFrame(animate);
                else frame = null;
            };
            frame = requestAnimationFrame(animate);
        },
        finish,
        stop,
        clear() {
            stop();
            activeThrow = null;
            dice.forEach(({ group }) => { group.visible = false; });
            render();
        },
        updateState(availableDice, currentIndex, isRolling, visualTheme = 'classic') {
            const prison = visualTheme === 'prison';
            dice.forEach(({ material, pipMaterial }, index) => {
                const used = !isRolling && availableDice[index] === null;
                material.color.setHex(used ? (prison ? 0x87958c : 0xb7b5b0) : (prison ? 0xe2e7d9 : 0xfff5dc));
                pipMaterial.color.setHex(used ? 0x666a70 : (prison ? 0x243a32 : 0x172431));
                material.emissive.setHex(index === currentIndex && !isRolling ? (prison ? 0x39432a : 0x533200) : 0x000000);
                material.emissiveIntensity = 0.25;
            });
            if (frame === null) render();
        },
        dispose() {
            stop();
            observer?.disconnect();
            window.removeEventListener('resize', resize);
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            geometry.dispose();
            pipGeometry.dispose();
            floorGeometry.dispose();
            floorMaterial.dispose();
            dice.forEach(({ material, pipMaterial }) => { material.dispose(); pipMaterial.dispose(); });
            light.shadow.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        },
    };
};
