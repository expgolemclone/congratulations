import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// The original Formwork scenes, scoped to one illustration instead of owning page UI.
export function createArtwork(canvas, kind) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene(), group = new THREE.Group();
  scene.add(group);
  const camera = kind === 'island' ? new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100) :
    new THREE.PerspectiveCamera(48, 1, 0.1, 160);
  camera.position.set(...(kind === 'island' ? [9, 10, 9] : [0, 1, 8]));
  camera.lookAt(0, 0, 0);
  const ambient = new THREE.AmbientLight(0xffffff, 1.6);
  const sun = new THREE.DirectionalLight(0xffe8cf, 3);
  sun.position.set(5, 8, 6);
  scene.add(ambient, sun);
  let environment, chromePositions, width = 0, height = 0;
  const water = [], trees = [], tracks = [];
  const mesh = (geometry, material, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z); group.add(object); return object;
  };

  if (kind === 'chrome' || kind === 'knot') {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    let geometry = kind === 'knot' ? new THREE.TorusKnotGeometry(1.35, 0.42, 128, 24, 2, 3) : new THREE.IcosahedronGeometry(1.6, 16);
    if (kind === 'chrome') {
      const p = geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const factor = 1 + 0.22 * Math.sin(p.getX(i) * 2.7) * Math.cos(p.getY(i) * 2) * Math.sin(p.getZ(i) * 3);
        p.setXYZ(i, p.getX(i) * factor, p.getY(i) * factor, p.getZ(i) * factor);
      }
      geometry.deleteAttribute('normal'); geometry.deleteAttribute('uv');
      const merged = mergeVertices(geometry);
      geometry.dispose(); geometry = merged;
      geometry.computeVertexNormals();
      chromePositions = geometry.attributes.position.array.slice();
    }
    mesh(geometry, new THREE.MeshStandardMaterial({ color: kind === 'chrome' ? 0xc5b6ee : 0xc2c6ce,
      metalness: 1, roughness: kind === 'chrome' ? 0.12 : 0.3 }));
  } else if (kind === 'island') {
    const materials = [0x4db6e8, 0xf0d79a, 0x7ec850, 0x69b545, 0x9aa0a6, 0xf4f7fb]
      .map(color => new THREE.MeshLambertMaterial({ color }));
    const box = new THREE.BoxGeometry(0.94, 1, 0.94);
    for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) {
      const level = Math.max(0, Math.round((1 - Math.hypot((i - 5) / 5, (j - 5) / 5)) * 4.2 +
        Math.sin(i * 0.9) * 0.5 + Math.cos(j * 0.75) * 0.5 - 0.4));
      const height = level + 0.6;
      const tile = mesh(box, materials[Math.min(level, 5)], i - 5, height / 2 - 2, j - 5);
      tile.scale.y = height;
      if (level === 0) water.push(tile);
      if (level >= 2 && (i * 7 + j * 3) % 5 === 0) {
        trees.push(mesh(new THREE.ConeGeometry(0.3, 0.8, 6), materials[3], i - 5, height - 1.6, j - 5));
      }
    }
    mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.5, 10), materials[5], 0, 2.9, 0);
    mesh(new THREE.ConeGeometry(0.5, 0.5, 10), new THREE.MeshLambertMaterial({ color: 0xef8d5a }), 0, 3.9, 0);
    mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffd76e }), 0, 3.5, 0.3);
    group.scale.setScalar(0.85);
    const beacon = new THREE.PointLight(0xffd76e, 3, 8); beacon.position.set(0, 3.5, 0.3); group.add(beacon);
  } else if (kind === 'galaxy') {
    const count = 6000, positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
    const inner = new THREE.Color('#ffd9a0'), outer = new THREE.Color('#5a6cff');
    for (let i = 0; i < count; i++) {
      const radius = ((i * 0.61803398875) % 1) ** 1.4 * 5;
      const angle = (i % 4) / 4 * Math.PI * 2 + radius * 0.9;
      positions[i * 3] = Math.cos(angle) * radius + Math.sin(i * 17) * radius * 0.15;
      positions[i * 3 + 1] = Math.sin(i * 13) * radius * 0.08;
      positions[i * 3 + 2] = Math.sin(angle) * radius + Math.cos(i * 11) * radius * 0.15;
      inner.clone().lerp(outer, radius / 5).toArray(colors, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.025, vertexColors: true })));
    camera.position.set(0, 4.5, 7.5); camera.lookAt(0, 0, 0);
  } else if (kind === 'neon') {
    camera.position.set(0, 2.5, 7); camera.lookAt(0, 1, -15);
    scene.fog = new THREE.FogExp2(0x170d2b, 0.035);
    const geometry = new THREE.PlaneGeometry(45, 65, 45, 65);
    geometry.rotateX(-Math.PI / 2);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const edge = Math.max(0, (Math.abs(p.getX(i)) - 6) / 16);
      p.setY(i, edge ** 1.6 * (8 + 2 * Math.sin(p.getX(i))) + Math.sin(p.getZ(i) * 0.6) * edge);
    }
    const material = new THREE.MeshBasicMaterial({ color: 0x2de2e6, wireframe: true });
    for (let i = 0; i < 2; i++) tracks.push(mesh(geometry, material, 0, -1, -20 - i * 65));
    mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshBasicMaterial({ color: 0xff2e97 }), 0, 3, -32);
  } else {
    renderer.dispose(); throw Error(`Unknown artwork: ${kind}`);
  }

  return {
    draw(time, value, framing = 1) {
      if (camera.zoom !== framing) { camera.zoom = framing; camera.updateProjectionMatrix(); }
      if (width !== canvas.clientWidth || height !== canvas.clientHeight) {
        width = canvas.clientWidth; height = canvas.clientHeight;
        renderer.setSize(width, height, false);
        if (camera.isOrthographicCamera) { camera.left = -6 * width / height; camera.right = 6 * width / height; }
        else camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      if (kind === 'neon') tracks.forEach((track, i) => { track.position.z = -20 - i * 65 + time * 6 % 65; });
      else group.rotation.y = 0.6 + value / 100 * Math.PI * 2 + time * 0.22;
      if (kind === 'chrome') {
        const geometry = group.children[0].geometry, p = geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const offset = i * 3, x = chromePositions[offset], y = chromePositions[offset + 1], z = chromePositions[offset + 2];
          p.setXYZ(i, x * (1 + 0.12 * Math.sin(time * 0.8 + y)), y * (1 + 0.1 * Math.cos(time * 0.7 + z)), z * (1 + 0.1 * Math.sin(time * 0.6 + x)));
        }
        p.needsUpdate = true; geometry.computeVertexNormals();
        group.rotation.x = Math.sin(time * 0.4) * 0.2;
      }
      if (kind === 'knot') { group.rotation.x = 0.3 + Math.sin(time * 0.4) * 0.3; group.position.y = Math.sin(time * 0.8) * 0.12; }
      if (kind === 'galaxy') { group.rotation.x = Math.sin(time * 0.2) * 0.12; group.children[0].material.size = 0.025 + Math.sin(time * 0.8) * 0.004; }
      if (kind === 'island') {
        ambient.intensity = value >= 100 ? 0.5 : 1.6; sun.intensity = value >= 100 ? 0.4 : 3;
        water.forEach(tile => { tile.position.y = -1.7 + Math.sin(time * 1.4 + tile.position.x * 0.6 + tile.position.z * 0.5) * 0.06; });
        trees.forEach((tree, i) => { tree.rotation.z = Math.sin(time * 1.5 + i) * 0.05; });
      }
      sun.position.set(Math.cos(time * 0.25) * 6, 8, Math.sin(time * 0.25) * 6);
      renderer.render(scene, camera);
    },
    dispose() {
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) materials.add(object.material);
      });
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
      environment?.dispose(); renderer.dispose();
    },
  };
}
