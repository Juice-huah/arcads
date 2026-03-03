// ─── src/hamsterball/GameEngine.jsx ───────────────────────────────────────────
import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { BALL_RADIUS, CAM_DIST, CAM_UP, CAM_FOV, LANE_W, TRACK_W, WORLDS, SKINS, LANE_TARGETS } from "./gameData.js";

const PLAT_H   = 1.0;
const WALL_H   = 6.0;
const RING_RAD = 3.2;

export function useGameEngine(canvasRef) {
  const T        = useRef({});
  const trackR   = useRef({
    objects: [], platforms: [], gates: [], checkpoints: [],
    questionRings: [], movingPlatforms: [], ramps: [],
    seeds: [], dashPads: [], // 🟢 NEW COLLECTIBLES & PADS
    finishZ: -300, safetyWalls: [],
  });
  const hamR       = useRef({});
  const ballRotX   = useRef(0);
  const ballRotZ   = useRef(0);
  const hintMeshR  = useRef(null);
  const particlesR = useRef([]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(CAM_FOV, innerWidth / innerHeight, 0.1, 700);
    camera.position.set(0, CAM_UP + BALL_RADIUS, CAM_DIST);
    camera.lookAt(0, 0, 0);

    const amb  = new THREE.AmbientLight(0xffffff, 0.75);
    const sun  = new THREE.DirectionalLight(0xffeedd, 2.6);
    sun.position.set(8, 18, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { near: .1, far: 200, left: -80, right: 80, top: 80, bottom: -80 });
    const fill = new THREE.HemisphereLight(0x87ceeb, 0x3a7d3a, 0.65);
    scene.add(amb, sun, fill);

    T.current = { renderer, scene, camera, amb, sun, fill };

    const onResize = () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); renderer.dispose(); };
  }, []);

  function box(w, h, d, color, rough = .8, metalness = 0.04, emit = false) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness });
    if (emit) { mat.emissive = new THREE.Color(color); mat.emissiveIntensity = .45; }
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function addObj(mesh) {
    T.current.scene.add(mesh);
    trackR.current.objects.push(mesh);
    return mesh;
  }

  function addPlatform(px, py, pz, pw, pd, world, opts = {}) {
    const tr = trackR.current;
    const m = box(pw, PLAT_H, pd, world.tile, .85, .04);
    m.position.set(px, py - PLAT_H / 2 - .01, pz);
    m.receiveShadow = true;
    addObj(m);
    const trim = box(pw + .08, .05, pd + .08, world.tileDark, .9);
    trim.position.set(px, py + .025, pz); addObj(trim);
    const col = parseInt(world.color.replace("#", ""), 16);
    const edgeM = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .07 });
    const edge = new THREE.Mesh(new THREE.BoxGeometry(pw, .02, pd), edgeM);
    edge.position.set(px, py + .04, pz); addObj(edge);
    tr.platforms.push({ mesh: m, x: px, y: py, z: pz, w: pw, h: PLAT_H, d: pd, type: "static" });
    return m;
  }

  function addRamp(px, py, pz, pw, pd, riseH, world) {
    const tr = trackR.current;
    const clampedRise = Math.max(-0.45, Math.min(0.45, riseH)); 
    const rampMat = new THREE.MeshStandardMaterial({ color: world.tileDark, roughness: .85 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(pw, .4, pd), rampMat);
    m.position.set(px, py - .2 + clampedRise / 2, pz);
    m.rotation.x = Math.atan2(clampedRise, pd) * (clampedRise > 0 ? -1 : 1) * .5;
    m.receiveShadow = true;
    addObj(m);

    const arrowC = document.createElement("canvas"); arrowC.width = 128; arrowC.height = 48;
    const ac = arrowC.getContext("2d");
    ac.fillStyle = world.color + "aa"; ac.font = "bold 32px sans-serif";
    ac.textAlign = "center"; ac.textBaseline = "middle";
    ac.fillText(clampedRise > 0 ? "↗ RAMP" : "↘", 64, 24);
    const arrow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .72),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(arrowC), transparent: true, side: THREE.DoubleSide }));
    arrow.position.set(px, py + .8, pz); addObj(arrow);

    tr.ramps.push({
      x: px, w: pw,
      zStart: pz - pd / 2,
      zEnd:   pz + pd / 2,
      yStart: py,
      yEnd:   py + clampedRise,
    });
    tr.platforms.push({ mesh: null, x: px, y: py + clampedRise * .5, z: pz, w: pw, h: .2, d: pd, type: "static" });
  }

  function addMovingPlatform(px, py, pz, pw, pd, world, axis = "x", range = 2.0, speed = 0.005) {
    const tr = trackR.current;
    const col = parseInt(world.altColor.replace("#", ""), 16);
    const mat = new THREE.MeshStandardMaterial({
      color: col, roughness: .5, metalness: .15,
      emissive: new THREE.Color(col), emissiveIntensity: .35,
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(pw, .35, pd), mat);
    m.position.set(px, py + .175, pz);
    m.castShadow = true; m.receiveShadow = true;
    addObj(m);

    const outMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .5, side: THREE.BackSide });
    const out = new THREE.Mesh(new THREE.BoxGeometry(pw + .3, .5, pd + .3), outMat);
    out.position.copy(m.position); addObj(out);

    const labelC = document.createElement("canvas"); labelC.width = 128; labelC.height = 48;
    const lctx = labelC.getContext("2d");
    lctx.fillStyle = world.color; lctx.font = "bold 28px sans-serif";
    lctx.textAlign = "center"; lctx.textBaseline = "middle";
    lctx.fillText(axis === "x" ? "↔ SLIDE" : "↕", 64, 24);
    const lSign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, .72),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelC), transparent: true, side: THREE.DoubleSide }));
    lSign.rotation.x = -Math.PI / 2; lSign.position.set(px, py + .55, pz); addObj(lSign);

    const pl2 = new THREE.PointLight(col, 0.8, 8);
    pl2.position.set(px, py + 1.2, pz);
    T.current.scene.add(pl2); tr.objects.push(pl2);

    const platRecord = { mesh: m, x: px, y: py, z: pz, w: pw, h: .35, d: pd, type: "moving" };
    tr.movingPlatforms.push({
      mesh: m, outMesh: out, labelSign: lSign, lightRef: pl2,
      axis, range, speed: Math.min(speed, 0.007),
      _t: Math.random() * Math.PI * 2,
      baseX: px, baseY: py, baseZ: pz,
    });
    tr.platforms.push(platRecord);
    return m;
  }

  function addSafetyWall(px, py, pz, pw, pd) {
    trackR.current.safetyWalls.push({ x: px, y: py + WALL_H / 2, z: pz, w: pw, h: WALL_H, d: pd });
  }

  // 🟢 NEW: Golden Seed Collectibles
  function addSeed(px, py, pz) {
    const tr = trackR.current;
    const geo = new THREE.OctahedronGeometry(0.3, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8, emissive: 0xffaa00, emissiveIntensity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    T.current.scene.add(mesh);
    tr.objects.push(mesh);
    tr.seeds.push({ mesh, x: px, y: py, z: pz, collected: false, _t: Math.random() * 10 });
  }

  // 🟢 NEW: Dash Pads for Speed Boosts
  function addDashPad(px, py, pz) {
    const tr = trackR.current;
    const geo = new THREE.PlaneGeometry(1.8, 3.5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(px, py + 0.05, pz);
    
    const c = document.createElement("canvas"); c.width = 128; c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(249,115,22,0.5)"; ctx.fillRect(0,0,128,256);
    ctx.fillStyle = "#fff"; ctx.font = "bold 80px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("⏫", 64, 110); ctx.fillText("⏫", 64, 210);
    mesh.material.map = new THREE.CanvasTexture(c);

    T.current.scene.add(mesh);
    tr.objects.push(mesh);
    tr.dashPads.push({ mesh, x: px, y: py, z: pz });
  }

  function addGate(px, py, pz, world, idx) {
    const { scene } = T.current; const tr = trackR.current;
    const col = parseInt(world.color.replace("#", ""), 16);
    const gateW = TRACK_W + 4.0;
    const g = new THREE.Group();
    [-1, 1].forEach(s => {
      const pillar = box(.35, 4.8, .35, world.tile, .5, .1);
      pillar.position.set(s * (gateW / 2 + .18), 2.4, 0);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(.09, 4.4, .09),
        new THREE.MeshStandardMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: 2.2, roughness: .05 }));
      strip.position.copy(pillar.position);
      g.add(pillar, strip);
    });
    const arch = box(gateW + 1.1, .4, .4, world.tile, .5, .1);
    arch.position.set(0, 4.8, 0); g.add(arch);
    const doorMat = new THREE.MeshStandardMaterial({
      color: col, transparent: true, opacity: .18, roughness: .05,
      emissive: new THREE.Color(col), emissiveIntensity: .4, side: THREE.DoubleSide,
    });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(gateW, 4.4), doorMat);
    door.position.set(0, 2.2, 0); g.add(door);
    const ringMat = new THREE.MeshStandardMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: 3.2, roughness: .04 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.95, .11, 10, 36), ringMat);
    ring.position.set(0, 2.5, 0); g.add(ring);
    const nc = document.createElement("canvas"); nc.width = 80; nc.height = 80;
    const nctx = nc.getContext("2d");
    nctx.fillStyle = world.color; nctx.font = "bold 52px 'Fredoka One',sans-serif";
    nctx.textAlign = "center"; nctx.textBaseline = "middle"; nctx.fillText(idx + 1, 40, 40);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(nc), transparent: true, side: THREE.DoubleSide }));
    sign.position.set(0, 3.9, .15); g.add(sign);
    const pl = new THREE.PointLight(col, 1.2, 10);
    pl.position.set(0, 2.2, 0); g.add(pl);
    g.position.set(px, py, pz); scene.add(g); tr.objects.push(g);
    tr.gates.push({ group: g, door, ring, z: pz, idx, open: false, pl, world, gateW });
  }

  function addQuestionRing(px, py, pz, word, world, idx) {
    const { scene } = T.current; const tr = trackR.current;
    const col = parseInt(world.color.replace("#", ""), 16);
    const g = new THREE.Group();

    const outerMat = new THREE.MeshStandardMaterial({
      color: col, emissive: new THREE.Color(col), emissiveIntensity: 2.2,
      roughness: .05, transparent: true, opacity: .9,
    });
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(RING_RAD, .22, 14, 54), outerMat);
    outerRing.rotation.x = -Math.PI / 2; g.add(outerRing);

    const circleMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .14, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(new THREE.CircleGeometry(RING_RAD - .2, 52), circleMat);
    circle.rotation.x = -Math.PI / 2; circle.position.y = .02; g.add(circle);

    const innerMat = new THREE.MeshStandardMaterial({
      color: col, emissive: new THREE.Color(col), emissiveIntensity: 1.6, roughness: .08,
      transparent: true, opacity: .65,
    });
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(RING_RAD * .65, .1, 10, 40), innerMat);
    innerRing.rotation.x = -Math.PI / 2; innerRing.position.y = .4; g.add(innerRing);

    const pl = new THREE.PointLight(col, 1.8, 10);
    pl.position.set(0, 1.5, 0); g.add(pl);

    g.position.set(px, py, pz); scene.add(g); tr.objects.push(g);
    tr.questionRings.push({
      group: g, outerRing, innerRing, circle, pl,
      x: px, y: py, z: pz, r: RING_RAD,
      word, idx,
      active: false,
      answered: false,
      _t: 0,
    });
  }

  function addCheckpoint(px, py, pz, world, idx) {
    const { scene } = T.current; const tr = trackR.current;
    const col = 0x22d3ee;
    const arch = new THREE.Group();
    const archMat = new THREE.MeshStandardMaterial({
      color: col, emissive: new THREE.Color(col), emissiveIntensity: 1.8, roughness: .08,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, .2, 12, 44), archMat.clone());
    ring.rotation.y = Math.PI / 2; ring.position.set(px, py + 2.9, pz); arch.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 9.5, 8),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .25 }));
    beam.position.set(px, py + 5, pz); arch.add(beam);
    const circle = new THREE.Mesh(new THREE.CircleGeometry(2.9, 32),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .14, side: THREE.DoubleSide }));
    circle.rotation.x = -Math.PI / 2; circle.position.set(px, py + .03, pz); arch.add(circle);
    scene.add(arch); tr.objects.push(arch);
    tr.checkpoints.push({ group: arch, ring, beam, x: px, y: py, z: pz, w: TRACK_W + 5, idx, hit: false });
  }

  function addTree(px, py, pz, world, size = 1.0) {
    const g = new THREE.Group();
    const trunk = box(.22 * size, 1.3 * size, .22 * size, world.treeTrunk || 0x5c3a1e, .9);
    trunk.position.set(0, .65 * size, 0); g.add(trunk);
    const fMat = new THREE.MeshStandardMaterial({ color: world.groundColor || 0x4a9140, roughness: .9 });
    [1.3, .96, .65].forEach((s, i) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(.58 * s * size, .95 * s * size, 7), fMat.clone());
      cone.position.set(0, 1.3 * size + i * .58 * size, 0); g.add(cone);
    });
    g.position.set(px, py, pz); T.current.scene.add(g); trackR.current.objects.push(g);
  }

  const buildLevel = useCallback((lvlId, skinId = 0, teacherCfg = {}) => {
    const { scene, amb, sun, fill } = T.current; const tr = trackR.current;

    tr.objects.forEach(o => scene.remove(o));
    Object.keys(tr).forEach(k => { if (Array.isArray(tr[k])) tr[k].length = 0; });
    tr.finishZ = -320;
    particlesR.current.forEach(p => { if (p.mesh) scene.remove(p.mesh); });
    particlesR.current = [];

    const world = WORLDS[lvlId - 1];
    scene.background = new THREE.Color(world.sky);
    scene.fog = new THREE.FogExp2(world.fog, world.fogDensity);
    amb.color.setHex(world.amb); amb.intensity = 0.75;
    sun.color.setHex(world.sun);
    if (fill) { fill.color.setHex(world.sky); fill.groundColor.setHex(world.groundColor); }

    if (lvlId === 5) {
      const cnt = 450; const pos = new Float32Array(cnt * 3);
      for (let i = 0; i < cnt; i++) { pos[i * 3] = (Math.random() - .5) * 130; pos[i * 3 + 1] = Math.random() * 32 + 2; pos[i * 3 + 2] = -Math.random() * 400; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: .18, transparent: true, opacity: .8 }));
      scene.add(pts); tr.objects.push(pts);
    }

    const trackLen  = 300;
    const mainW     = TRACK_W + 5.5;   
    const gateCount = world.gateCount;
    const secLen    = (trackLen - 40) / gateCount;

    tr.finishZ = -(trackLen - 10);

    const gndMat = new THREE.MeshStandardMaterial({ color: world.groundColor, roughness: 1.0 });
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(240, trackLen + 100), gndMat);
    gnd.rotation.x = -Math.PI / 2; gnd.position.set(0, -1.4, -(trackLen / 2 - 4));
    gnd.receiveShadow = true; addObj(gnd);

    tr.platforms.push({ mesh: null, x: 0, y: -16, z: -(trackLen / 2), w: 600, h: 1, d: trackLen + 100, type: "static" });

    addPlatform(0, 0, -14, mainW + 7, 36, world);

    addSafetyWall(-(mainW / 2 + 1.5), 0, -(trackLen / 2), 0.5, trackLen + 60);
    addSafetyWall( (mainW / 2 + 1.5), 0, -(trackLen / 2), 0.5, trackLen + 60);

    const startCol = parseInt(world.color.replace("#", ""), 16);
    const archM = new THREE.MeshStandardMaterial({ color: startCol, emissive: new THREE.Color(startCol), emissiveIntensity: .85 });
    [-1, 1].forEach(s => {
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 5.5, 8), archM.clone());
      p2.position.set(s * (mainW / 2 + 3), 2.75, -4); addObj(p2);
    });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, mainW + 7, 8), archM.clone());
    bar.rotation.z = Math.PI / 2; bar.position.set(0, 5.5, -4); addObj(bar);

    const sc2 = document.createElement("canvas"); sc2.width = 260; sc2.height = 80;
    const sctx2 = sc2.getContext("2d");
    sctx2.fillStyle = "rgba(0,0,0,.82)"; sctx2.roundRect(4, 4, 252, 72, 14); sctx2.fill();
    sctx2.fillStyle = world.color; sctx2.font = "bold 36px 'Fredoka One',sans-serif";
    sctx2.textAlign = "center"; sctx2.textBaseline = "middle"; sctx2.fillText("🏁 START", 130, 40);
    const startSign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, .9),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc2), transparent: true, side: THREE.DoubleSide }));
    startSign.position.set(0, 6.2, -4); addObj(startSign);

    const startingWords = teacherCfg.startingWords || ["apple", "river", "sun", "tree", "egg"];
    let z = -36;

    for (let gi = 0; gi < gateCount; gi++) {
      const segMid = z - secLen / 2;
      const ringZ = z - secLen * .80;

      addPlatform(0, 0, segMid, mainW, secLen - 2, world);

      for (let d = 0; d < 6; d++) {
        const dz = z - d * (secLen / 6) - secLen * .06;
        const sz = .75 + Math.random() * .5;
        if ((d + gi) % 2 === 0) { addTree(-(mainW / 2 + 3 + Math.random() * 2), 0, dz, world, sz); }
        else { addTree(   (mainW / 2 + 3 + Math.random() * 2), 0, dz, world, sz); }
      }

      // 🟢 Add Seeds (Coins) along the track
      for (let s = 0; s < 5; s++) {
        const sz = z - Math.random() * (secLen - 5);
        const laneX = LANE_TARGETS[Math.floor(Math.random() * 3)];
        if (Math.abs(sz - ringZ) > 6) { // Don't put seeds inside the word ring
           addSeed(laneX, 0.4, sz);
        }
      }

      // 🟢 Add Dash Pads occasionally
      if (Math.random() > 0.5) {
        const dz = z - secLen * 0.55;
        const laneX = LANE_TARGETS[Math.floor(Math.random() * 3)];
        addDashPad(laneX, 0, dz);
      }

      if (gi === 1) {
        const rz = z - secLen * .35;
        addRamp(0, 0, rz - secLen * .07, mainW * .88, secLen * .12, 0.35, world);
        addPlatform(0, 0.35, rz - secLen * .17, mainW * .88, secLen * .09, world);
        addRamp(0, 0.35, rz - secLen * .25, mainW * .88, secLen * .10, -0.35, world);
      }

      if (gi === 2) {
        const gapZ = z - secLen * .38;
        const gapLen = 1.4; 
        addPlatform(0, 0, gapZ - gapLen / 2 - secLen * .08, mainW, secLen * .12, world); 
        addPlatform(0, 0, gapZ + gapLen / 2 + secLen * .06, mainW, secLen * .10, world); 
      }

      if (gi === 3) {
        const mpZ = z - secLen * .4;
        const platW = mainW * .65; 
        addMovingPlatform(0, 0, mpZ, platW, secLen * .12, world, "x", LANE_W * .65, 0.0045);
      }

      if (gi >= 4) {
        const rz2 = z - secLen * .28;
        addRamp(0, 0, rz2 - secLen * .05, mainW * .85, secLen * .09, 0.35, world);
        addPlatform(0, 0.35, rz2 - secLen * .13, mainW * .85, secLen * .07, world);
        addRamp(0, 0.35, rz2 - secLen * .20, mainW * .85, secLen * .08, -0.35, world);

        const gapZ2 = z - secLen * .52;
        const gapLen2 = 1.6;
        addPlatform(0, 0, gapZ2 - gapLen2 / 2 - secLen * .06, mainW * .9, secLen * .09, world);
        addPlatform(0, 0, gapZ2 + gapLen2 / 2 + secLen * .05, mainW * .9, secLen * .08, world);
      }

      if (gi > 0 && gi % 2 === 0) {
        addCheckpoint(0, 0, z - secLen * .5, world, gi);
      }

      const word = startingWords[gi % startingWords.length];
      addQuestionRing(0, 0, ringZ, word, world, gi);
      addPlatform(0, 0, ringZ, mainW + 3, secLen * .18, world);

      const gz = z - secLen * .93;
      addGate(0, 0, gz, world, gi);
      addPlatform(0, 0, gz - 6, mainW, 12, world);
      addPlatform(0, 0, gz + 5, mainW, 10, world);

      z -= secLen;
    }

    addPlatform(0, 0, z - 18, mainW, 38, world);

    const finMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: new THREE.Color(0xfbbf24), emissiveIntensity: .85 });
    const fin = new THREE.Mesh(new THREE.BoxGeometry(mainW + 6, .09, 3), finMat);
    fin.position.set(0, .06, tr.finishZ); addObj(fin);
    [-1, 1].forEach(s => {
      const fp = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 5.8, 8), finMat.clone());
      fp.position.set(s * (mainW / 2 + 3), 2.9, tr.finishZ); addObj(fp);
      const fb = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, mainW + 7, 8), finMat.clone());
      fb.rotation.z = Math.PI / 2; fb.position.set(0, 5.8, tr.finishZ); addObj(fb);
    });
    const fc = document.createElement("canvas"); fc.width = 260; fc.height = 84;
    const fctx = fc.getContext("2d");
    fctx.fillStyle = "rgba(0,0,0,.86)"; fctx.roundRect(4, 4, 252, 76, 14); fctx.fill();
    fctx.fillStyle = "#fbbf24"; fctx.font = "bold 38px 'Fredoka One',sans-serif";
    fctx.textAlign = "center"; fctx.textBaseline = "middle"; fctx.fillText("🏆 FINISH!", 130, 42);
    const finSign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, .95),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc), transparent: true, side: THREE.DoubleSide }));
    finSign.position.set(0, 6.5, tr.finishZ); addObj(finSign);
    const finLight = new THREE.PointLight(0xfbbf24, 2.4, 16);
    finLight.position.set(0, 4, tr.finishZ); addObj(finLight);
  }, []);

  const buildHamster = useCallback((skinId = 0) => {
    const { scene } = T.current; const skin = SKINS[skinId] || SKINS[0];
    if (hamR.current.ballGroup) scene.remove(hamR.current.ballGroup);
    const bg = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 42, 42),
      new THREE.MeshPhysicalMaterial({
        color: skin.ballTint, transparent: true, opacity: .15,
        roughness: 0, transmission: .93, thickness: .5, clearcoat: 1, clearcoatRoughness: 0,
      }));
    ball.castShadow = true; bg.add(ball);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS * .28, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .3 }));
    hl.position.set(-.18, .28, .42); bg.add(hl);
    const bandG = new THREE.Group();
    [skin.body, skin.belly, 0xffffff].forEach((c, i) => {
      const b = new THREE.Mesh(new THREE.TorusGeometry(BALL_RADIUS * .96, .05, 10, 44),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .42 }));
      b.rotation.y = (i / 3) * Math.PI; bandG.add(b);
    });
    bg.add(bandG);
    const hg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(.38, 20, 18),
      new THREE.MeshStandardMaterial({ color: skin.body, roughness: .85 }));
    body.scale.set(1, .95, 1.05); hg.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 12),
      new THREE.MeshStandardMaterial({ color: skin.belly, roughness: 1 }));
    belly.position.set(0, -.05, .20); belly.scale.z = .5; hg.add(belly);
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 10),
        new THREE.MeshStandardMaterial({ color: skin.ear, roughness: .9 }));
      ear.position.set(s * .27, .28, .09); hg.add(ear);
      const earI = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff9999, roughness: 1 }));
      earI.position.set(s * .29, .29, .18); hg.add(earI);
      const pouch = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 10),
        new THREE.MeshStandardMaterial({ color: skin.ear, roughness: .88 }));
      pouch.position.set(s * .25, -.03, .24); hg.add(pouch);
    });
    const eyes = {};
    [-1, 1].forEach((s, i) => {
      const em = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .04 }));
      em.position.set(s * .14, .10, .31); hg.add(em);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(.030, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      shine.position.set(s * .15, .115, .375); hg.add(shine);
      eyes[i === 0 ? "L" : "R"] = em;
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.042, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xff8888, roughness: .5 }));
    nose.position.set(0, .01, .368); hg.add(nose);
    [-1, 1].forEach(s => {
      for (let w = 0; w < 3; w++) {
        const wPts = [new THREE.Vector3(s * .07, -.01 + w * .011, .36), new THREE.Vector3(s * .26, -.02 + w * .015, .34)];
        const wGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wPts), 3, .0055, 4, false);
        hg.add(new THREE.Mesh(wGeo, new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: .65 })));
      }
    });
    const legM = new THREE.MeshStandardMaterial({ color: skin.ear, roughness: .9 });
    const legG = new THREE.CylinderGeometry(.055, .065, .20, 7);
    const legs = {};
    [["FL", -.17, -.29, .20], ["FR", .17, -.29, .20], ["BL", -.17, -.29, -.14], ["BR", .17, -.29, -.14]].forEach(([n, x, y, z]) => {
      const l = new THREE.Mesh(legG, legM); l.position.set(x, y, z); hg.add(l); legs[n] = l;
    });
    [["FL", -.17, -.40, .22], ["FR", .17, -.40, .22], ["BL", -.17, -.40, -.12], ["BR", .17, -.40, -.12]].forEach(([n, x, y, z]) => {
      hg.add(new THREE.Mesh(new THREE.SphereGeometry(.065, 8, 8),
        new THREE.MeshStandardMaterial({ color: skin.belly }))).position.set(x, y, z);
    });
    const tail = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 8),
      new THREE.MeshStandardMaterial({ color: skin.belly, roughness: .9 }));
    tail.position.set(0, -.12, -.36); hg.add(tail);
    hg.rotation.y = Math.PI;
    bg.add(hg);
    scene.add(bg);
    hamR.current = {
      ballGroup: bg, hamsterGroup: hg, bandGroup: bandG, outerBall: ball,
      eyeL: eyes.L, eyeR: eyes.R,
      legFL: legs.FL, legFR: legs.FR, legBL: legs.BL, legBR: legs.BR,
    };
    ballRotX.current = 0; ballRotZ.current = 0;
  }, []);

  const animHamster = useCallback((dt, fwdSpeed, lateralDiff, g) => {
    const h = hamR.current; if (!h.ballGroup) return;
    ballRotX.current -= fwdSpeed / BALL_RADIUS * 1.1;
    ballRotZ.current += (lateralDiff * .1) / BALL_RADIUS * .5;
    if (h.bandGroup) { h.bandGroup.rotation.x = ballRotX.current; h.bandGroup.rotation.z = ballRotZ.current * .4; }
    if (h.hamsterGroup) {
      h.hamsterGroup.rotation.x = -ballRotX.current * .9;
      h.hamsterGroup.rotation.z = Math.max(-.35, Math.min(.35, -lateralDiff * .20));
      h.hamsterGroup.rotation.y = g.dizzy > 0 ? Math.PI + Date.now() * .020 : Math.PI;
    }
    const t = Date.now() * .006, ls = Math.min(fwdSpeed * 14, 18);
    if (h.legFL) h.legFL.rotation.x = Math.sin(t * ls) * .55;
    if (h.legFR) h.legFR.rotation.x = Math.sin(t * ls + Math.PI) * .55;
    if (h.legBL) h.legBL.rotation.x = Math.sin(t * ls + Math.PI) * .55;
    if (h.legBR) h.legBR.rotation.x = Math.sin(t * ls) * .55;
    if (g.blinkTimer !== undefined) {
      g.blinkTimer -= dt;
      if (g.blinkTimer <= 0) {
        const b = g.blinkTimer > -.12;
        if (h.eyeL) h.eyeL.scale.y = b ? .08 : 1;
        if (h.eyeR) h.eyeR.scale.y = b ? .08 : 1;
        if (!b) g.blinkTimer = 2.5 + Math.random() * 2.5;
      }
    }
    if (h.outerBall) {
      h.outerBall.material.opacity = g.inRing ? .35 : g.boost > 0 ? .34 : .15;
      h.outerBall.material.color.setHex(g.inRing ? 0xfbbf24 : g.boost > 0 ? 0xffaa44 : 0xffffff);
    }
  }, []);

  const spawnParticles = useCallback((bx, by, bz, colorHex = 0x4ade80, count = 18) => {
    const { scene } = T.current;
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(.065 + Math.random() * .065, 5, 5),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: .95 }));
      const angle = (i / count) * Math.PI * 2, speed = .05 + Math.random() * .08;
      m.position.set(bx, by + .4, bz); scene.add(m);
      particlesR.current.push({
        mesh: m, vx: Math.cos(angle) * speed,
        vy: .065 + Math.random() * .10,
        vz: Math.sin(angle) * speed * .5, life: 1.0,
      });
    }
  }, []);

  const openGate = useCallback((gate) => {
    gate.open = true;
    let f = 0;
    const anim = () => {
      if (gate.door) {
        gate.door.material.opacity = Math.max(0, gate.door.material.opacity - .05);
        if (gate.door.material.opacity <= 0) gate.door.visible = false;
      }
      if (f++ < 15) requestAnimationFrame(anim);
    };
    anim();
    gate.ring.material.color.setHex(0x4ade80);
    gate.ring.material.emissive.setHex(0x4ade80);
    gate.ring.material.emissiveIntensity = 5;
    if (gate.pl) gate.pl.color.setHex(0x4ade80);
  }, []);

  const tickWorld = useCallback((dt, slowMo = false) => {
    const tr = trackR.current; const now = Date.now();
    tr.gates.forEach(g => { if (!g.open) g.ring.rotation.z += .025; });
    tr.checkpoints.forEach(cp => { cp.ring.material.emissiveIntensity = 1.6 + Math.sin(now * .003 + cp.idx) * .55; });
    
    // 🟢 Animate Seeds
    tr.seeds.forEach(s => {
        if (!s.collected) {
            s._t += dt;
            s.mesh.rotation.y += 0.05;
            s.mesh.position.y = 0.4 + Math.sin(s._t * 5) * 0.15;
        }
    });

    tr.questionRings.forEach(qr => {
      qr._t += dt;
      qr.outerRing.material.emissiveIntensity = 1.8 + Math.sin(qr._t * 2.5) * .7;
      qr.outerRing.rotation.z += .018;
      qr.innerRing.rotation.z -= .022;
      qr.pl.intensity = qr.active
        ? 2.0 + Math.sin(qr._t * 6) * .8
        : 1.2 + Math.sin(qr._t * 2) * .4;
    });

    if (!slowMo) {
      tr.movingPlatforms.forEach(mp => {
        mp._t += mp.speed;
        if (mp.axis === "x") {
          const newX = mp.baseX + Math.sin(mp._t) * mp.range;
          mp.mesh.position.x = newX;
          mp.outMesh.position.x = newX;
          if (mp.labelSign) mp.labelSign.position.x = newX;
          if (mp.lightRef) mp.lightRef.position.x = newX;
          const pl = tr.platforms.find(p => p.mesh === mp.mesh);
          if (pl) pl.x = newX;
        }
      });
    }

    for (let i = particlesR.current.length - 1; i >= 0; i--) {
      const p = particlesR.current[i];
      p.mesh.position.x += p.vx; p.mesh.position.y += p.vy; p.vy -= .004;
      p.mesh.position.z += p.vz; p.life -= dt * 2.0;
      p.mesh.material.opacity = Math.max(0, p.life); p.mesh.scale.setScalar(Math.max(.1, p.life));
      if (p.life <= 0) { T.current.scene.remove(p.mesh); particlesR.current.splice(i, 1); }
    }
    
    tr.objects.forEach(o => { if (o instanceof THREE.Points) o.rotation.y += .0002; });
  }, []);

  return { T, trackR, hamR, ballRotX, ballRotZ, buildLevel, buildHamster, animHamster, openGate, tickWorld, spawnParticles };
}