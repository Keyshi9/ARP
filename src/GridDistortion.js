import * as THREE from 'three';

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
}
`;

export class GridDistortion {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            grid: options.grid || 15,
            mouse: options.mouse || 0.1,
            strength: options.strength || 0.15,
            relaxation: options.relaxation || 0.9,
            imageSrc: options.imageSrc || '/background.png'
        };

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0); // Transparent black

        // Clear container and append canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
        this.camera.position.z = 2;

        this.uniforms = {
            time: { value: 0 },
            resolution: { value: new THREE.Vector4() },
            uTexture: { value: null },
            uDataTexture: { value: null }
        };

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(this.options.imageSrc, (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            // Depending on image aspect ratio vs container, you might want to adjust wrapping
            // For now keeping ClampToEdge as per original
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            this.imageAspect = texture.image.width / texture.image.height;
            this.uniforms.uTexture.value = texture;

            this.handleResize();
        });

        // Initialize Data Texture for distortion
        const size = this.options.grid;
        const data = new Float32Array(4 * size * size);
        for (let i = 0; i < size * size; i++) {
            data[i * 4] = Math.random() * 255 - 125;
            data[i * 4 + 1] = Math.random() * 255 - 125;
        }

        this.dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
        this.dataTexture.needsUpdate = true;
        this.uniforms.uDataTexture.value = this.dataTexture;

        const material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader,
            transparent: true
        });

        const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
        this.plane = new THREE.Mesh(geometry, material);
        this.scene.add(this.plane);

        // Mouse State
        this.mouseState = {
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            vX: 0,
            vY: 0
        };

        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.animate = this.animate.bind(this);

        // Event Listeners
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => this.handleResize());
            this.resizeObserver.observe(this.container);
        } else {
            window.addEventListener('resize', this.handleResize);
        }

        this.container.addEventListener('mousemove', this.handleMouseMove);
        this.container.addEventListener('mouseleave', this.handleMouseLeave);

        // Initial Resize
        this.handleResize();

        // Start loop
        this.animate();
    }

    handleResize() {
        if (!this.container || !this.renderer || !this.camera) return;

        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        if (width === 0 || height === 0) return;

        const containerAspect = width / height;

        this.renderer.setSize(width, height);

        // Scale plane to cover container while maintaining aspect ratio if needed
        // The original code scales strictly by container aspect
        if (this.plane) {
            this.plane.scale.set(containerAspect, 1, 1);
        }

        const frustumHeight = 1;
        const frustumWidth = frustumHeight * containerAspect;

        this.camera.left = -frustumWidth / 2;
        this.camera.right = frustumWidth / 2;
        this.camera.top = frustumHeight / 2;
        this.camera.bottom = -frustumHeight / 2;
        this.camera.updateProjectionMatrix();

        this.uniforms.resolution.value.set(width, height, 1, 1);
    }

    handleMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;

        this.mouseState.vX = x - this.mouseState.prevX;
        this.mouseState.vY = y - this.mouseState.prevY;

        Object.assign(this.mouseState, { x, y, prevX: x, prevY: y });
    }

    handleMouseLeave() {
        if (this.dataTexture) {
            this.dataTexture.needsUpdate = true;
        }
        Object.assign(this.mouseState, {
            x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate);

        if (!this.renderer || !this.scene || !this.camera) return;

        this.uniforms.time.value += 0.05;

        const size = this.options.grid;
        const data = this.dataTexture.image.data;

        // Relaxation
        for (let i = 0; i < size * size; i++) {
            data[i * 4] *= this.options.relaxation;
            data[i * 4 + 1] *= this.options.relaxation;
        }

        // Interaction
        const gridMouseX = size * this.mouseState.x;
        const gridMouseY = size * this.mouseState.y;
        const maxDist = size * this.options.mouse;

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
                if (distSq < maxDist * maxDist) {
                    const index = 4 * (i + size * j);
                    const power = Math.min(maxDist / Math.sqrt(distSq), 10);
                    data[index] += this.options.strength * 100 * this.mouseState.vX * power;
                    data[index + 1] -= this.options.strength * 100 * this.mouseState.vY * power;
                }
            }
        }

        this.dataTexture.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        } else {
            window.removeEventListener('resize', this.handleResize);
        }

        this.container.removeEventListener('mousemove', this.handleMouseMove);
        this.container.removeEventListener('mouseleave', this.handleMouseLeave);

        this.renderer.dispose();
        this.scene.clear();
    }
}
