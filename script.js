import * as THREE from "https://cdn.skypack.dev/three@0.125.2";
import { GLTFLoader } from "https://unpkg.com/three@0.125.1/examples/jsm/loaders/GLTFLoader.js";
import { Flow } from "https://unpkg.com/three@0.125.1/examples/jsm/modifiers/CurveModifier.js";
import { OrbitControls } from "https://unpkg.com/three@0.125.1/examples/jsm/controls/OrbitControls.js";

class Scene {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222299);
    this.scene.fog = new THREE.FogExp2(0x222277, 0.2);
    return this.scene;
  }}

class Renderer {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.sketch.sizes.width, this.sketch.sizes.height);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    this.renderer.update = this.update.bind(this.sketch);


    return this.renderer;
  }
  update() {
    this.renderer.render(this.scene, this.camera);
  }}

class Camera {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };

    this.camera = new THREE.PerspectiveCamera(
    75,
    this.sketch.sizes.width / this.sketch.sizes.height,
    0.01,
    200);

    this.camera.position.x = 0;
    this.camera.position.y = 1;
    this.camera.position.z = 2;
    this.camera.lookAt(0, 0, 0);
    this.sketch.scene.add(this.camera);

    return this.camera;
  }}

class Animator {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };

    this.tasks = [];
  }
  /**
   *
   * @param {function} fn
   */
  add(fn) {
    this.tasks.push(fn);
  }
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.tasks.forEach(task => task());

    this.sketch.renderer.update();
  }}

class Controls {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };

    this.controls = new OrbitControls(
    this.sketch.camera,
    this.sketch.renderer.domElement);


    return this.controls;
  }}

class Events {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };

    this.addEvents();
  }
  addEvents() {
    window.addEventListener("resize", this.onWindowResize.bind(this), false);
  }
  onWindowResize() {
    this.sketch.sizes = {
      width: window.innerWidth,
      height: window.innerHeight };


    this.sketch.camera.aspect =
    this.sketch.sizes.width / this.sketch.sizes.height;
    this.sketch.camera.updateProjectionMatrix();
    this.sketch.renderer.setSize(
    this.sketch.sizes.width,
    this.sketch.sizes.height);

    this.sketch.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }}

class Lights {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };

    this.ambient();
    this.directional();
  }
  ambient() {
    let ambLight = new THREE.AmbientLight(0xffffff, 0.6, 100);
    this.sketch.scene.add(ambLight);
  }
  directional() {
    let dirLight = new THREE.DirectionalLight(0xffffff, 1.2, 100);
    dirLight.position.set(-3, 5, -3);
    this.sketch.scene.add(dirLight);
  }}


let flow;
class Sketch {
  constructor() {
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight };

    this.scene = new Scene(this);
    this.renderer = new Renderer(this);
    this.camera = new Camera(this);
    this.lights = new Lights(this);
    this.controls = new Controls(this);
    this.events = new Events(this);
    this.animator = new Animator(this);
    this.clock = new THREE.Clock();
    this.refractor = null;
    // this.gui = new dat.GUI();
  }
  init() {
    this.addObjects();
    document.body.appendChild(this.renderer.domElement);
    this.animator.animate();
  }
  addObjects() {
    const that = this;
    const loader = new GLTFLoader();
    loader.load("https://assets.codepen.io/5946/fish.glb", function (gltf) {
      const fish = gltf.scene.children[0];
      fish.scale.x = 0.01;
      fish.scale.y = 0.01;
      fish.scale.z = 0.01;
      fish.rotation.x = Math.PI * 0.5;
      fish.updateMatrix();
      fish.geometry.applyMatrix4(fish.matrix);

      fish.position.set(0, 0, 0);
      fish.rotation.set(0, 0, 0);
      fish.scale.set(1, 1, 1);
      fish.updateMatrix();

      const initialPoints = [];

      let pointCount = 100;
      for (let i = 0; i < Math.PI * 2; i += Math.PI / pointCount) {
        const dist = 1 + Math.sin(i * 10) / 30;
        initialPoints.push(
        new THREE.Vector3(Math.sin(i) * dist, 0, Math.cos(i) * dist));

      }

      const curve = new THREE.CatmullRomCurve3(initialPoints);

      const points = curve.getPoints(50);
      const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x00ff00 }));


      // that.scene.add(line);

      flow = new Flow(fish);
      flow.updateCurve(0, curve);
      that.scene.add(flow.object3D);

      that.animator.add(() => {
        flow.moveAlongCurve(0.001);
      });
    });

    loader.load("https://assets.codepen.io/5946/landscape.glb", function (gltf) {
      const landscape = gltf.scene;
      landscape.scale.x = 10;
      landscape.scale.y = 10;
      landscape.scale.z = 10;
      landscape.position.x = -1;
      landscape.position.z = -2;
      landscape.rotation.y = 0.0;

      that.scene.add(landscape);
    });
  }}


let sketch = new Sketch();
sketch.init();