import { useEffect, useRef, useState } from "react";
import sculpture from "@/assets/nest-treasury-sculpture.jpg";

/** Three is imported after mount so the wallet-heavy server bundle stays small. */
export function TreasuryScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let cleanup = () => {};
    void (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      element.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0.6, 16);
      camera.lookAt(0, 0, 0);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      const css = getComputedStyle(document.documentElement);
      const material = new THREE.MeshPhysicalMaterial({ color: css.getPropertyValue("--scene-coral").trim(), metalness: 0.25, roughness: 0.19, clearcoat: 1, clearcoatRoughness: 0.12 });
      const silver = new THREE.MeshStandardMaterial({ color: css.getPropertyValue("--scene-silver").trim(), metalness: 0.95, roughness: 0.21 });
      const group = new THREE.Group();
      group.scale.setScalar(1.35);
      scene.add(group);
      const nest = new THREE.Group();
      group.add(nest);
      const ringGeometry = new THREE.TorusGeometry(1.8, 0.49, 24, 96);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(ringGeometry, material);
        ring.rotation.set(Math.PI / 3, i * Math.PI * 2 / 3, i * 0.6);
        nest.add(ring);
      }
      nest.rotation.set(0.25, 0.2, -0.15);
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = textureCanvas.height = 256;
      const ctx = textureCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = css.getPropertyValue("--scene-coin").trim();
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = css.getPropertyValue("--scene-ink").trim();
      ctx.lineWidth = 8;
      for (const offset of [0, Math.PI]) {
        ctx.beginPath(); ctx.arc(128, 128, 92, offset - 1, offset + 1); ctx.stroke();
      }
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = "bold 142px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", 128, 134);
      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const face = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.2, roughness: 0.35 });
      const cylinder = new THREE.CylinderGeometry(0.66, 0.66, 0.18, 64);
      const disc = new THREE.CircleGeometry(0.61, 64);
      const coins: { group: InstanceType<typeof THREE.Group>; y: number }[] = [];
      for (const [x, y, z, rotation] of [[-3.35, 0.8, 0.4, -0.25], [3.2, -0.8, 0.6, 0.35], [2.7, 2, -0.5, -0.3]]) {
        const coin = new THREE.Group();
        const edge = new THREE.Mesh(cylinder, silver);
        edge.rotation.x = Math.PI / 2;
        coin.add(edge);
        const front = new THREE.Mesh(disc, face);
        front.position.z = 0.095;
        coin.add(front);
        coin.position.set(x, y, z);
        coin.rotation.set(0.1, rotation, rotation);
        group.add(coin);
        coins.push({ group: coin, y });
      }
      const light = new THREE.DirectionalLight(css.getPropertyValue("--scene-ink").trim(), 3);
      light.position.set(-3, 5, 6);
      scene.add(light);
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let frame = 0;
      let visible = true;
      let pointerX = 0;
      let pointerY = 0;
      const draw = (time: number) => {
        if (disposed) return;
        const t = time / 1000;
        if (!motion.matches) {
          nest.rotation.y = 0.2 + Math.sin(t * 0.2) * 0.16;
          coins.forEach((coin, i) => { coin.group.position.y = coin.y + Math.sin(t * 0.8 + i * 2) * 0.13; });
          group.rotation.y += (pointerX * 0.16 - group.rotation.y) * 0.035;
          group.rotation.x += (pointerY * 0.06 - group.rotation.x) * 0.035;
        }
        renderer.render(scene, camera);
        if (visible && !motion.matches) frame = requestAnimationFrame(draw);
      };
      const resize = () => {
        const { width, height } = element.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.position.z = camera.aspect < 1.2 ? 20 : 15;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      const pointer = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
        pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
      };
      const resume = () => { cancelAnimationFrame(frame); draw(performance.now()); };
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; cancelAnimationFrame(frame); if (visible) draw(performance.now()); });
      const sizeObserver = new ResizeObserver(resize);
      cleanup = () => {
        cancelAnimationFrame(frame); observer.disconnect(); sizeObserver.disconnect();
        element.removeEventListener("pointermove", pointer); motion.removeEventListener("change", resume);
        ringGeometry.dispose(); cylinder.dispose(); disc.dispose(); material.dispose(); silver.dispose(); face.dispose(); texture.dispose();
        environment.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
      resize(); draw(0); setReady(true);
      observer.observe(element); sizeObserver.observe(element);
      element.addEventListener("pointermove", pointer, { passive: true });
      motion.addEventListener("change", resume);
    })().catch(() => { cleanup(); if (!disposed) setReady(false); });
    return () => { disposed = true; cleanup(); };
  }, []);

  return (
    <div className="treasury-art" aria-label="A sculptural Nest surrounded by USDC coins" role="img">
      {!ready && <img className="treasury-art-fallback" src={sculpture} alt="" width={1536} height={1024} fetchPriority="high" />}
      <div ref={host} className="treasury-canvas" aria-hidden="true" />
    </div>
  );
}