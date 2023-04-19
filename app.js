import './main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import { ReflectorForSSRPass } from 'three/addons/objects/ReflectorForSSRPass.js';
import fragment from './shaders/fragment.glsl.js';
import vertex from './shaders/vertex.glsl.js';
import obj1 from './models/geo1.glb';
import obj2 from './models/geo2.glb';
import obj3 from './models/geo3.glb';
import matcap from './textures/matcap.png';
import scan from './textures/scan.png';

export default class Sketch {
  constructor() {
    this.scene = new THREE.Scene();
    this.container = document.getElementById('container');
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.useLegacyLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      25,
      window.innerWidth / window.innerHeight,
      1,
      100
    );

    // const frustrumSize = 10;
    // const aspect = this.width / this.height;
    // this.camera = new THREE.OrthographicCamera(
    //   (frustrumSize * aspect) / -2,
    //   (frustrumSize * aspect) / 2,
    //   frustrumSize / 2,
    //   frustrumSize / -2,
    //   -1000,
    //   1000
    // );

    this.camera.position.set(8, 12, 16);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.gltf = new GLTFLoader();

    this.time = 0;
    this.dummy = new THREE.Object3D();

    this.addMesh();
    this.postProcessing();
    this.setupResize();
    this.resize();
    this.render();
  }

  postProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.ssrPass = new SSRPass({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      width: this.width,
      height: this.height,
      groundReflector: null,
      selects: null,
    });

    this.composer.addPass(this.ssrPass);
    // this.composer.addPass(new ShaderPass(GammaCorrectionShader));
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  async addMesh() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector4() },
        uMatcap: { value: new THREE.TextureLoader().load(matcap) },
        uScan: { value: new THREE.TextureLoader().load(scan) },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
      side: THREE.DoubleSide,
      // wireframe: true,
    });

    const { scene: children1 } = await this.gltf.loadAsync(obj1);
    const geo1 = children1.children[0].geometry;

    const { scene: children2 } = await this.gltf.loadAsync(obj2);
    const geo2 = children2.children[0].geometry;

    const { scene: children3 } = await this.gltf.loadAsync(obj3);
    const geo3 = children3.children[0].geometry;

    let mat = new THREE.MeshMatcapMaterial({
      matcap: new THREE.TextureLoader().load(matcap),
    });

    let index = 0;
    const rows = 20;
    this.count = rows ** 2;

    // Attributes
    const random = new Float32Array(this.count);

    this.instanced = new THREE.InstancedMesh(geo1, this.material, this.count);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < rows; j++) {
        random[index] = Math.random();

        this.dummy.position.set(
          i - rows / 2,
          -10 + Math.random(),
          j - rows / 2
        );
        this.dummy.updateMatrix();
        this.instanced.setMatrixAt(index++, this.dummy.matrix);
      }
    }

    this.instanced.instanceMatrix.needsUpdate = true;
    this.instanced.computeBoundingSphere();

    this.instanced.geometry.setAttribute(
      'aRandom',
      new THREE.InstancedBufferAttribute(random, 1)
    );

    this.scene.add(this.instanced);
  }

  render() {
    this.time += 0.01;
    this.material.uniforms.uTime.value = this.time;
    // this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
    this.composer.render();
  }
}

new Sketch();
