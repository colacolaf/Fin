import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

interface FinData {
  id: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  speed: number;
  hue: number;
}

interface AgentState {
  investment: string;
  debt: string;
  retirement: string;
  lastSync: number | null;
}

interface OceanSceneOptions {
  /** Stable ref that always points at the latest { x, y } mouse offset. The hook reads `mouseRef.current` on each animation frame, so deps never re-fire. */
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  /** Honour prefers-reduced-motion. Disables orbit swirl, parallax shifts, camera tilt. */
  reducedMotion: boolean;
}

const WIRE_NORMAL_RECOMPUTE_INTERVAL = 5; // frames
const PARALLAX_LAYERS = 3; // 3 haze planes (Phase 22 fix #1)
const PARALLAX_BASE_Z = [-3.2, -1.6, -0.4];
const PARALLAX_OPACITY = [0.06, 0.10, 0.16];

// Lightweight radial vignette — sits between bloom and OutputPass.
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 0.55 },
    radius: { value: 0.85 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float darkness;
    uniform float radius;
    varying vec2 vUv;
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      vec2 uv = vUv - 0.5;
      float d = length(uv) / radius;
      float vig = smoothstep(1.0, 0.4, d);
      col.rgb *= mix(1.0 - darkness, 1.0, vig);
      gl_FragColor = col;
    }
  `,
};

export function useOceanScene(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  agentState: AgentState,
  options: OceanSceneOptions,
) {
  const finsRef = useRef<FinData[]>([]);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  // Cache camera baseline so parallax offsets return to neutral cleanly.
  const cameraBaseRef = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: 3,
    z: 12,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = options.reducedMotion;
    const mouse = options.mouseRef;

    // ── Scene setup ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1929, 0.00015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 100);
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 0, 0);
    cameraBaseRef.current = { x: 0, y: 3, z: 12 };

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0x0a3d5c, 0.6));

    const moonLight = new THREE.DirectionalLight(0x4488cc, 1.2);
    moonLight.position.set(5, 10, 3);
    scene.add(moonLight);

    const bioLights: THREE.PointLight[] = [];
    const bioColors = [0x00cc99, 0x0099ff, 0x00ffaa];
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(bioColors[i], 0, 8);
      light.position.set((i - 1) * 3, -1, 0);
      scene.add(light);
      bioLights.push(light);
    }

    // ── Ocean surface — SHARED BufferGeometry across ocean + wireframe (Phase 19 rule) ──
    const oceanGeom = new THREE.PlaneGeometry(30, 30, 80, 80);
    oceanGeom.rotateX(-Math.PI / 2);

    const posAttr = oceanGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      posAttr.setZ(i, -0.3 * Math.exp(-dist * dist * 0.02));
    }
    oceanGeom.computeVertexNormals();

    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0a2a44,
      roughness: 0.4,
      metalness: 0.1,
      wireframe: false,
      flatShading: false,
    });

    const ocean = new THREE.Mesh(oceanGeom, oceanMat);
    ocean.position.y = -2;
    scene.add(ocean);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1a4a6a,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const wireOcean = new THREE.Mesh(oceanGeom, wireMat);
    wireOcean.position.copy(ocean.position);
    scene.add(wireOcean);

    // ── Phase 22 fix #1: Parallax haze planes (3 layers — no geometry churn) ──
    const hazeLayers: THREE.Mesh[] = [];
    if (!reducedMotion) {
      for (let i = 0; i < PARALLAX_LAYERS; i++) {
        const layerGeom = new THREE.PlaneGeometry(60, 30);
        const layerMat = new THREE.MeshBasicMaterial({
          color: i === 0 ? 0x0c2a44 : i === 1 ? 0x14406a : 0x1f5a85,
          transparent: true,
          opacity: PARALLAX_OPACITY[i],
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(layerGeom, layerMat);
        mesh.position.set(0, -1, PARALLAX_BASE_Z[i]);
        scene.add(mesh);
        hazeLayers.push(mesh);
      }
    }

    // ── Particles (bioluminescent plankton) ──
    const particleCount = 400;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 20;
      particlePositions[i * 3 + 1] = -1.5 + Math.random() * 0.8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      particleSizes[i] = Math.random() * 0.04 + 0.01;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0x44ddaa,
      size: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.5,
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // ── Fins (3D agent proxy shapes) ──
    const finGroup = new THREE.Group();
    scene.add(finGroup);

    finsRef.current = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 16,
      y: -1.8 + Math.random() * 0.4,
      z: (Math.random() - 0.5) * 8 - 2,
      rotation: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
      hue: bioColors[i % 3],
    }));

    const finGeom = new THREE.ConeGeometry(0.15, 0.6, 4);
    finGeom.rotateX(Math.PI / 2);
    finGeom.translate(0, 0, 0.3);

    finsRef.current.forEach((fin) => {
      const mesh = new THREE.Mesh(
        finGeom,
        new THREE.MeshStandardMaterial({
          color: fin.hue,
          roughness: 0.3,
          metalness: 0.5,
          emissive: fin.hue,
          // Phase 22 fix #4: selective bloom — emissive fins glow above the bloom threshold.
          emissiveIntensity: 0.6,
        }),
      );
      mesh.position.set(fin.x, fin.y, fin.z);
      mesh.rotation.y = fin.rotation;
      mesh.userData = { finId: fin.id, baseY: fin.y, speed: fin.speed };
      finGroup.add(mesh);
      const ringGeom = new THREE.TorusGeometry(0.2, 0.03, 8, 12);
      const ring = new THREE.Mesh(
        ringGeom,
        new THREE.MeshBasicMaterial({
          color: fin.hue,
          transparent: true,
          opacity: 0.4,
        }),
      );
      ring.position.copy(mesh.position);
      ring.userData = { parentFinId: fin.id };
      finGroup.add(ring);
    });

    // ── Phase 22 fix #4: Post-processing pipeline (selective bloom + vignette + output) ──
    // Skipped under reduced-motion per the brief; CSS vignette provides fallback lighting.
    const composer = !reducedMotion
      ? (() => {
          const c = new EffectComposer(renderer);
          c.addPass(new RenderPass(scene, camera));
          const bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.35, // strength
            0.85, // radius
            0.55, // threshold — only emissive (>0.55 luma) elements bloom
          );
          c.addPass(bloom);
          c.addPass(new ShaderPass(VignetteShader));
          c.addPass(new OutputPass());
          return c;
        })()
      : null;

    // ── Resize handler (covers renderer, composer, and post-processing) ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──
    let animId: number;
    let frame = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      frame++;
      const t = clockRef.current.getElapsedTime();

      // Gentle ocean sway — update positions in place (no clone / no dispose).
      const verts = oceanGeom.attributes.position;
      for (let i = 0; i < verts.count; i++) {
        const x = verts.getX(i);
        const y = verts.getY(i);
        const dist = Math.sqrt(x * x + y * y);
        const wave = Math.sin(x * 0.8 + t * 0.6) * Math.cos(y * 0.7 + t * 0.5) * 0.15;
        verts.setZ(i, -0.3 * Math.exp(-dist * dist * 0.02) + wave);
      }
      verts.needsUpdate = true;

      if (frame % WIRE_NORMAL_RECOMPUTE_INTERVAL === 0) {
        oceanGeom.computeVertexNormals();
      }

      finGroup.children.forEach((child) => {
        if (!child.userData.finId && child.userData.parentFinId === undefined) return;
        if (child.userData.parentFinId !== undefined) {
          const parent = finGroup.children.find(
            (c) => c.userData.finId === child.userData.parentFinId,
          );
          if (parent) child.position.copy(parent.position);
          return;
        }
        const { baseY, speed } = child.userData;
        child.position.y = baseY + Math.sin(t * speed * 1.5) * 0.25;
        child.rotation.z = Math.sin(t * speed) * 0.2;
        child.rotation.y += 0.003 * speed;
      });

      const states = [agentState.investment, agentState.debt, agentState.retirement];
      bioLights.forEach((light, i) => {
        const active = states[i] !== 'idle';
        const targetIntensity = active ? 2.5 + Math.sin(t * 2 + i) * 1.0 : 0.3;
        light.intensity += (targetIntensity - light.intensity) * 0.05;
        light.position.x = (i - 1) * 3 + Math.sin(t * 0.4 + i * 2) * 1.5;
        light.position.z = Math.cos(t * 0.4 + i * 2) * 1.5;
      });

      particles.rotation.y += 0.0003;
      const pSizes = particles.geometry.attributes.size;
      if (pSizes) {
        for (let i = 0; i < particleCount; i++) {
          pSizes.array[i] = (Math.sin(t * 3 + i) * 0.5 + 0.5) * 0.04 + 0.01;
        }
        pSizes.needsUpdate = true;
      }

      // ── Phase 22 fix #1: mouse-tilt camera offset (gated by reducedMotion) ──
      // Under prefers-reduced-motion the camera anchors to its base position.
      if (!reducedMotion) {
        const targetX = cameraBaseRef.current.x + mouse.current.x * 0.6;
        const targetY = cameraBaseRef.current.y + mouse.current.y * -0.4;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;
        camera.position.z = cameraBaseRef.current.z + Math.sin(t * 0.1) * 0.6;
      }
      camera.lookAt(0, 0, 0);

      // ── Phase 22 fix #1: parallax haze planes drift with mouse (motion-gated) ──
      for (let i = 0; i < hazeLayers.length; i++) {
        const mesh = hazeLayers[i];
        const k = (i + 1) * 0.4; // farther layers move more
        mesh.position.x = mouse.current.x * k;
        mesh.position.y = mouse.current.y * k * 0.5;
      }

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      // oceanGeom is shared with wireOcean — single dispose covers both meshes.
      oceanGeom.dispose();
      oceanMat.dispose();
      wireMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      finGeom.dispose();
      hazeLayers.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      finGroup.children.forEach((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      });
      scene.clear();
    };
  }, [canvasRef, agentState, options.reducedMotion]);
}
