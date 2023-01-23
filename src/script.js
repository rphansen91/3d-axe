import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const base = window.location.href.includes('github.io') ? '/3d-axe' : ''

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const cubeTextureLoader = new THREE.CubeTextureLoader()
const textureLoader = new THREE.TextureLoader()

Promise.all([
    promisify(cubeTextureLoader.load.bind(cubeTextureLoader))([
        `${base}/textures/environmentMaps/1/px.jpg`,
        `${base}/textures/environmentMaps/1/nx.jpg`,
        `${base}/textures/environmentMaps/1/py.jpg`,
        `${base}/textures/environmentMaps/1/ny.jpg`,
        `${base}/textures/environmentMaps/1/pz.jpg`,
        `${base}/textures/environmentMaps/1/nz.jpg`
    ]),
    promisify(textureLoader.load.bind(textureLoader))(`${base}/textures/materials/baked.jpg`),
    promisify(gltfLoader.load.bind(gltfLoader))(`${base}/models/axe.glb`)
])
.then(([environmentMap, bakedTexture, gltf]) => {
    const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

    bakedTexture.flipY = false
    bakedTexture.encoding = THREE.sRGBEncoding

    gltf.scene.traverse((child) => {
        child.material = bakedMaterial
    })
    gltf.scene.scale.set(2, 2, 2)

    scene.background = environmentMap
    scene.add(gltf.scene)
})

let mixer = null



/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
// scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera

// const fog = new THREE.Fog('#fff', 1, 15)
// scene.fog = fog

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 8, 4, 8)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1, 0)
controls.enableDamping = true
controls.enableZoom = false
// controls.minZoom = 0
// controls.maxZoom = 0

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0xffffff, 1)
renderer.outputEncoding = THREE.sRGBEncoding

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

function promisify (fn) {
    return (...args) => {
        return new Promise((res, rej) => {
            fn(...args, res, undefined, rej)
        })
    }
}