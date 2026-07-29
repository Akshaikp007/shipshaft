import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeNetwork() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for the entire visualization
    const shipShaftNetwork = new THREE.Group();
    scene.add(shipShaftNetwork);

    // 1. The Global Sphere (Subtle wireframe)
    const globeGeo = new THREE.SphereGeometry(4, 48, 48);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    shipShaftNetwork.add(globe);

    // 2. Hub Nodes
    const hubCount = 12;
    const hubGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const hubs = [];

    for (let i = 0; i < hubCount; i++) {
      const hub = new THREE.Mesh(hubGeo, hubMat);
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const r = 4;

      hub.position.set(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta)
      );
      hubs.push(hub);
      shipShaftNetwork.add(hub);
    }

    // 3. Animated Data Paths (Arcs)
    const pathMat = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.3
    });

    const lines = [];

    function createCurve(p1, p2) {
      const v1 = p1.clone();
      const v2 = p2.clone();
      const mid = v1.clone().lerp(v2, 0.5).normalize().multiplyScalar(5);
      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, pathMat);
      lines.push(line);
      return line;
    }

    for (let i = 0; i < hubs.length; i++) {
      const next = (i + 1) % hubs.length;
      const jump = (i + 3) % hubs.length;
      shipShaftNetwork.add(createCurve(hubs[i].position, hubs[next].position));
      shipShaftNetwork.add(createCurve(hubs[i].position, hubs[jump].position));
    }

    // 4. Moving "Packages" (Light particles on paths)
    const packetCount = 40;
    const packets = [];
    const packetGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });

    for (let i = 0; i < packetCount; i++) {
      const packet = new THREE.Mesh(packetGeo, packetMat);
      const startHub = hubs[Math.floor(Math.random() * hubs.length)];
      const endHub = hubs[Math.floor(Math.random() * hubs.length)];

      packet.userData = {
        start: startHub.position.clone(),
        end: endHub.position.clone(),
        mid: startHub.position.clone().lerp(endHub.position, 0.5).normalize().multiplyScalar(5),
        t: Math.random(),
        speed: 0.002 + Math.random() * 0.005
      };

      shipShaftNetwork.add(packet);
      packets.push(packet);
    }

    function updatePackets() {
      packets.forEach(p => {
        p.userData.t += p.userData.speed;
        if (p.userData.t > 1) {
          p.userData.t = 0;
          const start = hubs[Math.floor(Math.random() * hubs.length)];
          const end = hubs[Math.floor(Math.random() * hubs.length)];
          p.userData.start.copy(start.position);
          p.userData.end.copy(end.position);
          p.userData.mid.copy(start.position.clone().lerp(end.position, 0.5).normalize().multiplyScalar(5));
        }

        const t = p.userData.t;
        const curve = new THREE.QuadraticBezierCurve3(p.userData.start, p.userData.mid, p.userData.end);
        p.position.copy(curve.getPoint(t));
      });
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x2563eb, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Animation Loop
    let animationId = null;
    function animate() {
      animationId = requestAnimationFrame(animate);
      shipShaftNetwork.rotation.y += 0.001;
      shipShaftNetwork.rotation.x += 0.0005;
      updatePackets();
      renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      
      // Dispose resources
      globeGeo.dispose();
      globeMat.dispose();
      hubGeo.dispose();
      hubMat.dispose();
      pathMat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
      
      lines.forEach(l => {
        l.geometry.dispose();
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] relative">
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />
      
      {/* Floating Active Nodes Overlay */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 glass-panel p-6 rounded-2xl shadow-lg animate-bounce-subtle select-none">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">hub</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Nodes Active</p>
            <p className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-2">
              14,294 
              <span className="text-tertiary text-xs font-semibold">+12%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
