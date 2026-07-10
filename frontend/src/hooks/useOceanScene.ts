import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

export function useOceanScene(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  agentState: AgentState,
) {
  const finsRef = useRef<FinData[]>([]);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Scene setup ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();

    // Dark ocean fog — depth falloff
    scene.fog = new THREE.FogExp2(0x0a1929, 0.00015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 100);
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 0, 0);

    // ── Lighting ──
    // Bioluminescent ambient — deep blue-green
    scene.add(new THREE.AmbientLight(0x0a3d5c, 0.6));

    // Moonlight directional — cool blue from above
    const moonLight = new THREE.DirectionalLight(0x4488cc, 1.2);
    moonLight.position.set(5, 10, 3);
    scene.add(moonLight);

    // Bioluminescence point lights — teal/cyan pulsing from agents
    const bioLights: THREE.PointLight[] = [];
    const bioColors = [0x00cc99, 0x0099ff, 0x00ffaa]; // investment, debt, retirement

    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(bioColors[i], 0, 8);
      light.position.set((i - 1) * 3, -1, 0);
      scene.add(light);
      bioLights.push(light);
    }

    // ── Ocean surface (deformed plane) ──
    const oceanGeom = new THREE.PlaneGeometry(30, 30, 80, 80);
    oceanGeom.rotateX(-Math.PI / 2);

    // Displace center upward for subtle curvature
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

    // Wireframe overlay — subtle depth lines
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1a4a6a,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const wireOcean = new THREE.Mesh(oceanGeom.clone(), wireMat);
    wireOcean.position.copy(ocean.position);
    scene.add(wireOcean);

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

    // ── Fins (agent proxy shapes) ──
    const finGroup = new THREE.Group();
    scene.add(finGroup);

    // Create 12 fins spread across the scene
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
          emissiveIntensity: 0.3,
        }),
      );
      mesh.position.set(fin.x, fin.y, fin.z);
      mesh.rotation.y = fin.rotation;
      mesh.userData = { finId: fin.id, baseY: fin.y, speed: fin.speed };
      finGroup.add(mesh);
      // Glow ring
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

    // ── Resize handler ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();

      // Gentle ocean sway
      const verts = oceanGeom.attributes.position;
      for (let i = 0; i < verts.count; i++) {
        const x = verts.getX(i);
        const y = verts.getY(i);
        const dist = Math.sqrt(x * x + y * y);
        const wave = Math.sin(x * 0.8 + t * 0.6) * Math.cos(y * 0.7 + t * 0.5) * 0.15;
        verts.setZ(i, -0.3 * Math.exp(-dist * dist * 0.02) + wave);
      }
      oceanGeom.computeVertexNormals();
      oceanGeom.attributes.position.needsUpdate = true;

      // Wireframe follows same deformation
      wireOcean.geometry.dispose();
      wireOcean.geometry = oceanGeom.clone();

      // Fins bob and rotate
      finGroup.children.forEach((child) => {
        if (!child.userData.finId && child.userData.parentFinId === undefined) return;
        if (child.userData.parentFinId !== undefined) {
          // Ring: follow parent fin
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

      // Bioluminescence pulse based on agent state
      const states = [agentState.investment, agentState.debt, agentState.retirement];
      bioLights.forEach((light, i) => {
        const active = states[i] !== 'idle';
        const targetIntensity = active ? 2.5 + Math.sin(t * 2 + i) * 1.0 : 0.3;
        light.intensity += (targetIntensity - light.intensity) * 0.05;
        // Orbit slowly
        light.position.x = (i - 1) * 3 + Math.sin(t * 0.4 + i * 2) * 1.5;
        light.position.z = Math.cos(t * 0.4 + i * 2) * 1.5;
      });

      // Particles drift
      particles.rotation.y += 0.0003;
      const pSizes = particles.geometry.attributes.size;
      if (pSizes) {
        for (let i = 0; i < particleCount; i++) {
          pSizes.array[i] = (Math.sin(t * 3 + i) * 0.5 + 0.5) * 0.04 + 0.01;
        }
        pSizes.needsUpdate = true;
      }

      // Slow camera orbit
      camera.position.x = Math.sin(t * 0.1) * 12;
      camera.position.z = Math.cos(t * 0.1) * 12;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      oceanGeom.dispose();
      oceanMat.dispose();
      wireMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      finGeom.dispose();
      finGroup.children.forEach((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      });
      scene.clear();
    };
  }, [canvasRef, agentState]);
}