import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "jsm/loaders/OBJLoader.js";

//renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

//camera
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;
camera.position.y = 3;
camera.position.x = -9;

//scene
const scene = new THREE.Scene();

//controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;
controls.target.set(0, 0, 0);
controls.update();



//==========================================================================================================//
//SKYBOX
{
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      'resources/skyleftx.png', // positive x
      'resources/skyrightx.png', // negative x
      'resources/skyupy.png', // positive y
      'resources/skydowny.png', // negative y
      'resources/skyfrontz.png', // positive z
      'resources/skybackz.png', // negative z
    ]);
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
}



//==========================================================================================================//
//PLATFORM
function createPlatform(){
    const shape = new THREE.Shape();
    const width = 12;
    const height = 12;
    const radius = 2;

    shape.moveTo(-width/2 + radius, -height/2);
    shape.lineTo(width/2 - radius, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    shape.lineTo(width/2, height/2 - radius);
    shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    shape.lineTo(-width/2 + radius, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    shape.lineTo(-width/2, -height/2 + radius);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);


    // Extrude the shape
    const extrudeSet = {
    steps: 1,
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelOffset: 0,
    bevelSegments: 7
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSet);
    const material = new THREE.MeshStandardMaterial({
        color: 0xFFC2D1,
        roughness: 0.8,
        metalness: 0.1
    });

    const platform = new THREE.Mesh(geometry, material);
    platform.rotation.x = -Math.PI/2;
    platform.position.y = -2;
    platform.castShadow = true;
    platform.receiveShadow = true;

    scene.add(platform);
    return platform;
}

const platform = createPlatform();



//==========================================================================================================//
//STEPING STONE ROAD
function createSteppingStone(position, rotation = { x: 0, y: 0, z: 0 }, size = { width: 1.2, height: 0.1, depth: 0.7 }) {
    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xD4D4D4, // Light concrete color
      roughness: 0.9,
      flatShading: true
    });
    
    //create stone
    const stone = new THREE.Mesh(geometry, material);
    stone.position.set(position.x, position.y, position.z);
    stone.rotation.x = rotation.x;
    stone.rotation.y = rotation.y;
    stone.rotation.z = rotation.z;
    
    stone.castShadow = true;
    stone.receiveShadow = true;
    
    scene.add(stone);
    return stone;
}
  
//create individual stones
const stoneData = [
    [-5, -1.55, 0, Math.PI/2],
    [-4.25, -1.55, 0, Math.PI/2.15],
    [-3.5, -1.55, 0.1, Math.PI/2.25],
    [-2.75, -1.55, 0.3, Math.PI/2.4],
    [-1.95, -1.55, 0.6, Math.PI/2.8],
    [-1.25, -1.55, 1.1, Math.PI/4],
    [0.4, -1.55, 2.75, Math.PI/4],
    [1, -1.55, 3.25, Math.PI/-1.5],
    [1.7, -1.55, 3.5, Math.PI/-1.7]
];
  
//create all the stones
const stones = stoneData.map(data => {
    return createSteppingStone(
      { x: data[0], y: data[1], z: data[2] },
      { x: 0, y: data[3], z: 0 }
    );
});


//PICKING - STONES SELECTION FOR PATH
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selectedStone = null;
let originalStoneColor = null;

window.addEventListener('mousemove', onPointerMove);
window.addEventListener('click', onPointerClick);

//pointer/mouse events
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerClick(event) {
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(stones);

    //clicked on a stone
    if (intersects.length > 0) {
        if (selectedStone && originalStoneColor) {
            selectedStone.material.color.set(originalStoneColor);
            selectedStone.material.emissive = new THREE.Color(0x000000);
            selectedStone = null;
            originalStoneColor = null;
        }

        selectedStone = intersects[0].object;
        originalStoneColor = selectedStone.material.color.clone();
        
        //change its color to highlight it
        selectedStone.material.emissive = new THREE.Color(0xFFEEAA);
        //console.log("Stone selected at position:", selectedStone.position);
    } else {
        //if clicked outside a stone selected deselect it
        if (selectedStone && originalStoneColor) {
            selectedStone.material.color.set(originalStoneColor);
            selectedStone.material.emissive = new THREE.Color(0x000000);
            selectedStone = null;
            originalStoneColor = null;
        }
    }
}

//==========================================================================================================//
//MOOON - Textured
function createMoon() {
    const moonGeometry = new THREE.SphereGeometry(1, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const moonTexture = textureLoader.load('resources/moonmap4k.jpg');
    
    const moonMaterial = new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 0.8,
        metalness: 0.1
    });
    
    // Create the moon mesh
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(6, 7, -6);
    moon.castShadow = true;
    moon.receiveShadow = true;
    
    scene.add(moon);
    return moon;
}
const moon = createMoon();  
//Animate the moon
function animateMoon(){
    if (moon) {
        moon.rotation.y += 0.005;
    }
}

//==========================================================================================================//
//ROCKS
function createRock(x, z, scale = 1, yPos = -1.5){
    const geometry = new THREE.DodecahedronGeometry(0.2 * scale, 0);
  
    // Random color btw orange and brown
    const rockColor = new THREE.Color(
        0.6 + Math.random() * 0.2,
        0.4 + Math.random() * 0.2,
        0.2 + Math.random() * 0.1
    );
    
    const material = new THREE.MeshStandardMaterial({
        color: rockColor,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: true
    });
    
    const rock = new THREE.Mesh(geometry, material);
    
    rock.scale.x = 0.8 + Math.random() * 0.4;
    rock.scale.y = 0.8 + Math.random() * 0.4;
    rock.scale.z = 0.8 + Math.random() * 0.4;
    
    rock.rotation.x = Math.random() * Math.PI;
    rock.rotation.y = Math.random() * Math.PI;
    rock.rotation.z = Math.random() * Math.PI;
    
    rock.position.set(x, yPos, z);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    scene.add(rock);
    return rock;
}
// Add a few rocks
createRock(2, -3, 1.5);
createRock(-4, 3, 1.2);
createRock(4, -4, 1.0);
createRock(-3, 4, 0.8);
createRock(4, 2, 1.3);



//==========================================================================================================//
//TREES
function createTree(x, z, scale = 1, yPos = -1.2) {
    const treeGroup = new THREE.Group();
    
    //Trunk(cylinder)
    const trunkGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, 0.8 * scale, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFF1E6,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.1 * scale;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    //Bush
    const bushGeometry = new THREE.DodecahedronGeometry(0.6 * scale, 0);
    const bushMaterial = new THREE.MeshStandardMaterial({
      color: 0xBEE1E6,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.y = 0.9 * scale;
    
    //Bush size
    bush.scale.x = 1.2;
    bush.scale.z = 1.2;
    bush.rotation.y = Math.random() * Math.PI;
    
    bush.castShadow = true;
    treeGroup.add(bush);
    
    //Position tree
    treeGroup.position.set(x, yPos, z);
    
    scene.add(treeGroup);
    return treeGroup;
}
  
// Add a few trees
createTree(-3, 3, 1.2);
createTree(3.5, 0, 1.5);
createTree(0, -3, 1);



//==========================================================================================================//
//SKY BUBBLES 
function createStaticSkyBubbles(count = 1) {
    const bubbleGroup = new THREE.Group();
    
    const pastelColors = [
      0xA2D2FF, // Blue
      0xCDB4DB, // Purple
      0xFFC8DD, // Light pink
      0xBDE0FE, // Light blue
      0xD0F4DE, // Mint
      0xFFF1E6, // Cream
      0xFDE2E4, // Pale pink
      0xE2ECE9, // Pale green
      0xBEE1E6  // Teal
    ];
    
    for (let i = 0; i < count; i++) {
        const size = Math.random() * 0.2 + 0.1;
        
        let geometry;
        geometry = new THREE.SphereGeometry(size, 20, 20);
        const colorIndex = Math.floor(Math.random() * pastelColors.length);
        const color = pastelColors[colorIndex];
        
        //transparency
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: Math.random() * 0.3 + 0.7,
            flatShading: true
        });
      
        const bubble = new THREE.Mesh(geometry, material);
        
        //random position in the sky
        const radius = 20; 
        const theta = Math.random() * Math.PI * 3;
        const minHeight = 1;
        const maxHeight = 10;
        const randomHeight = minHeight + Math.random() * (maxHeight - minHeight);
        
        const horizontalRadius = radius * Math.random();
        bubble.position.x = horizontalRadius * Math.cos(theta);
        bubble.position.y = randomHeight;
        bubble.position.z = horizontalRadius * Math.sin(theta);
        
        bubble.rotation.x = Math.random() * Math.PI;
        bubble.rotation.y = Math.random() * Math.PI;
        bubble.rotation.z = Math.random() * Math.PI;
        
        //glow effect to bubbles
        if (Math.random() > 0.7) {
            const glowGeometry = new THREE.SphereGeometry(size * 1.2, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            bubble.add(glow);
        }
        
        bubbleGroup.add(bubble);
    }
    
    scene.add(bubbleGroup);
    return bubbleGroup;
}
const skyBubbles = createStaticSkyBubbles(30);


//==========================================================================================================//
//LAMP
function createStylizedLamp(x, z, height = 4, postColor = 0xE6D2A8, accentColor = 0xA6B8D4, lightColor = 0xFFEEAA) {
    const lampGroup = new THREE.Group();
    
    //cylindrical post
    const postGeometry = new THREE.CylinderGeometry(0.08, 0.12, height, 8, 1);
    const postMaterial = new THREE.MeshStandardMaterial({
        color: postColor,
        roughness: 0.7,
        metalness: 0.2,
        flatShading: true
    });
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.y = -1.85 + (height / 3) + 0.1;
    post.castShadow = true;
    
    //cone between post and orb
    const coneGeometry = new THREE.ConeGeometry(0.3, 0.3, 8, 1);
    const coneMaterial = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.7,
        metalness: 0.3,
        flatShading: true
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = -1.85 + height + -0.5;
    cone.rotation.x = Math.PI;
    cone.castShadow = true;
    
    //Floating light orb
    const lightGeometry = new THREE.SphereGeometry(0.2, 12, 12);
    const lightMaterial = new THREE.MeshStandardMaterial({
        color: lightColor,
        roughness: 0.2,
        metalness: 0.5,
        emissive: lightColor,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
    });
    
    const lightOrb = new THREE.Mesh(lightGeometry, lightMaterial);
    lightOrb.position.y = -1.85 + height + -0.2;
    lightOrb.castShadow = true;
    
    //light source
    const light = new THREE.PointLight(lightColor, 1, 5);
    light.position.copy(lightOrb.position);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.radius = 2;
    
    //Glow effect
    const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: lightColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(lightOrb.position);
    
    //Store original position for Animation
    lightOrb.userData = {
        originalY: lightOrb.position.y,
        floatSpeed: 0.0015,
        floatAmplitude: 0.08
    };
    glow.userData = { ...lightOrb.userData };
    
    //group components
    lampGroup.add(post);
    lampGroup.add(cone);
    lampGroup.add(lightOrb);
    lampGroup.add(glow);
    lampGroup.add(light);
    
    lampGroup.position.set(x, 0, z);
    scene.add(lampGroup);
    
    return {
        group: lampGroup,
        lightOrb: lightOrb,
        glow: glow
    };
}
const lamp1 = createStylizedLamp(-5, 5, 4);
const lamp2 = createStylizedLamp(5, -5, 4);
const lamp3 = createStylizedLamp(5, 5, 4);
const lamp4 = createStylizedLamp(-5, -5, 4);


//LIGHT ANIMATION
function animateLamps() {
    const time = Date.now();
    
    //animate the light for each lamp
    if (lamp1.lightOrb) { 
        lamp1.lightOrb.position.y = lamp1.lightOrb.userData.originalY + 
                                Math.sin(time * lamp1.lightOrb.userData.floatSpeed) * 
                                lamp1.lightOrb.userData.floatAmplitude;
      
      //animate the glow too
      if (lamp1.glow) {
        lamp1.glow.position.y = lamp1.lightOrb.position.y;
      }
    }
    //lamp2 animation
    if (lamp2.lightOrb) {
        lamp2.lightOrb.position.y = lamp2.lightOrb.userData.originalY + 
                                Math.sin((time + 500) * lamp2.lightOrb.userData.floatSpeed) * 
                                lamp2.lightOrb.userData.floatAmplitude;
      
      if (lamp2.glow) {
        lamp2.glow.position.y = lamp2.lightOrb.position.y;
      }
    }
    //lamp3 animation
    if (lamp3.lightOrb) {
        lamp3.lightOrb.position.y = lamp3.lightOrb.userData.originalY + 
                                Math.sin((time + 500) * lamp3.lightOrb.userData.floatSpeed) * 
                                lamp2.lightOrb.userData.floatAmplitude;
        
        if (lamp3.glow) {
            lamp3.glow.position.y = lamp3.lightOrb.position.y;
        }
    }
    //lamp4 animation
    if (lamp4.lightOrb) {
        lamp4.lightOrb.position.y = lamp4.lightOrb.userData.originalY + 
                                Math.sin((time + 500) * lamp4.lightOrb.userData.floatSpeed) * 
                                lamp4.lightOrb.userData.floatAmplitude;
        
        if (lamp4.glow) {
            lamp4.glow.position.y = lamp4.lightOrb.position.y;
        }
    }
};


//==========================================================================================================//
//LOAD MODELS
const loader = new GLTFLoader();
const objLoader = new OBJLoader();
//MODEL1 - KANGAROO
loader.load( 'resources/Kangaroo.glb', function (gltf) {
    const model1 = gltf.scene;
    model1.scale.set(0.15, 0.15, 0.15);
    model1.position.set(2, -1.5, -1);
    model1.rotation.y = Math.PI/1.5;
    
    model1.traverse(function(node) {
    if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
    }
    });
        
    scene.add(model1);
});

//MODEL2 - BRIDGE
loader.load('resources/Bridge.glb', function(gltf) {
    const model2 = gltf.scene;
    model2.position.set(-0.5, -0.9, 1.85);
    model2.scale.set(0.4, 0.4, 0.4);
    model2.rotation.y = Math.PI/4;

    // Enable shadows
    model2.traverse(function(node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    
    scene.add(model2);
});

//MODEL3 - BENCH
loader.load('resources/Bench.glb', function(gltf) {
    const bench = gltf.scene;
    bench.position.set(-2.8, -1.3, -4);
    bench.scale.set(0.6, 0.6, 0.6);
    bench.rotation.y = Math.PI
    
    // Enable shadows
    bench.traverse(function(node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    
    scene.add(bench);
});

//MODEL7 - BENCH1
loader.load('resources/Bench.glb', function(gltf) {
    const bench1 = gltf.scene;
    bench1.position.set(-4, -1.3, -2.8);
    bench1.scale.set(0.6, 0.6, 0.6);
    bench1.rotation.y = Math.PI/-2
    
    // Enable shadows
    bench1.traverse(function(node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    
    scene.add(bench1);
});

//MODEL4 - FENCE
function createFencePerimeter() {
    const fencePositions = [
      // Front side
      [-4, -5, 0],
      [-2, -5, 0],
      [0, -5, 0],
      [2, -5, 0],
      [4, -5, 0],
      
      // Right side
      [5, -4, Math.PI/2],
      [5, -2, Math.PI/2],
      [5, 0, Math.PI/2],
      [5, 2, Math.PI/2],
      [5, 4, Math.PI/2],
      
      // Back side
      [4, 5, Math.PI],
      [2, 5, Math.PI],
      [0, 5, Math.PI],
      [-2, 5, Math.PI],
      [-4, 5, Math.PI],
      
      // Left side
      [-5, 4, -Math.PI/2],
      [-5, 2, -Math.PI/2],
      [-5, -2, -Math.PI/2],
      [-5, -4, -Math.PI/2]
    ];
    
    fencePositions.forEach((pos, index) => {
      loader.load('resources/White Picket Fence.glb', function(gltf) {
        const fence = gltf.scene;
        
        fence.position.set(pos[0], -1.15, pos[1]);
        fence.rotation.y = pos[2];
        fence.scale.set(1, 1, 1);

        fence.traverse(function(node) {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        
        scene.add(fence);
      });
    });
}
createFencePerimeter();

//MODEL5 - POND
loader.load('resources/Pond.glb', function(gltf) {
    const model5 = gltf.scene;
    model5.position.set(2.8, -1.45, 4);
    model5.scale.set(1, 1, 1);
    model5.rotation.y = Math.PI/4.6;

    model5.traverse(function(node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    
    scene.add(model5);

    //water platform
    const platformGeometry = new THREE.BoxGeometry(1.1, 0.05, 1.7);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x6b99c9,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.2
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    
    platform.position.set(2.8, -1.55, 3.9);
    platform.rotation.y = Math.PI/-5.7;
    
    platform.castShadow = true;
    platform.receiveShadow = true;
    
    scene.add(platform);
});

//Place Tuplips - MODEL 6 - TULIP
function placedTulips() {
    const tulipPositions = [
        { x: -3, z: -2, scale: 0.4, rotation: 0 },
        { x: -1, z: -3, scale: 0.4, rotation: Math.PI/4 },
        { x: -2.5, z: 3, scale: 0.4, rotation: Math.PI/2 },
        { x: 1, z: -2, scale: 0.4, rotation: Math.PI/6 },
        { x: -1, z: 0, scale: 0.4, rotation: Math.PI/3 },
        { x: 4, z: -1, scale: 0.4, rotation: Math.PI },
        { x: 5, z: 4, scale: 0.4, rotation: Math.PI/8 }
    ];
    
    tulipPositions.forEach(pos => {
        loader.load('resources/Tulip.glb', function(gltf) {
            const tulip = gltf.scene;
            tulip.position.set(pos.x, -1.3, pos.z);
            tulip.scale.set(pos.scale, pos.scale, pos.scale);
            tulip.rotation.y = pos.rotation;
            
            tulip.traverse(function(node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
            });
            
            scene.add(tulip);
        });
    });
}
placedTulips();


//BILLBOARD OBJ- MODEL 7
function loadBillboard() {    
    objLoader.load(
        'resources/Billboard/Billboard.obj',
        function(object) {
          object.traverse(function(child) {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.8,
                metalness: 0.2
              });
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          object.scale.set(0.010, 0.010, 0.001);
          object.position.set(-4, -1.55, -4);
          object.rotation.y = Math.PI / 4;
          scene.add(object);
        }
    );
}
loadBillboard()


function createBillboardSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    
    const context = canvas.getContext('2d');
    context.fillStyle = '#4287f5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.font = 'bold 40px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Welcome to Pastel Park!', canvas.width/2, canvas.height/2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture
    });
    
    const billboard = new THREE.Sprite(material);
    billboard.position.set(-4, 1, -4); 
    billboard.scale.set(2, 1, 1);
    
    scene.add(billboard);
}
createBillboardSprite();



//==========================================================================================================//
//LIGHTING
//Ambient light
const ambientLight = new THREE.AmbientLight(0xfff2e6, 0.5); // Warm tint
scene.add(ambientLight);

//Directional light
const directionalLight = new THREE.DirectionalLight(0xfff0dd, 0.8);
directionalLight.position.set(5, 8, 2); // Coming from top-right
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

//Shadow
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
directionalLight.shadow.bias = -0.0005;
directionalLight.shadow.radius = 2; // Soft shadow edges

scene.add(directionalLight);

//Hemisphere light
const hemisphereLight = new THREE.HemisphereLight(
  0xc2e0ff, // Sky color - slight blue
  0xffe0b3, // Ground color - warm orange/yellow
  0.3
);
scene.add(hemisphereLight);

//Point light
const pointLight = new THREE.PointLight(0xffaa44, 0.6, 20);
pointLight.position.set(-3, 4, 2);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.bias = -0.001;
scene.add(pointLight);

//Spot light
const spotLight = new THREE.SpotLight(0xfff0dd, 0.5);
spotLight.position.set(0, 8, 0);
spotLight.target.position.set(0, 0, 0);
spotLight.angle = Math.PI / 6; // Narrow beam
spotLight.penumbra = 0.2; // Soft edges
spotLight.decay = 1.5; // Light falloff
spotLight.distance = 30;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
scene.add(spotLight.target);

//Renderer for better shadows and color
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;



//==========================================================================================================//
//WINDOW RESIZE
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;
  
  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(newWidth, newHeight);
});



//==========================================================================================================//
//ANIMATION LOOP
//OLD
// function animate() {
//   requestAnimationFrame(animate);

//   animateLamps();

//   controls.update();
//   renderer.render(scene, camera);
// }

function animate() {
    requestAnimationFrame(animate);
  
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(stones);
    
    //default if not selected
    stones.forEach(stone => {
        if (stone !== selectedStone) {
            if (!stone.userData.hoverColor) {
            stone.userData.hoverColor = stone.material.color.clone();
            }
            stone.material.color.copy(stone.userData.hoverColor);
            stone.material.emissive = new THREE.Color(0x000000);
        }
    });
  
    //highlight the hovered stone
    if (intersects.length > 0 && intersects[0].object !== selectedStone) {
        const hoveredStone = intersects[0].object;
        if (!hoveredStone.userData.hoverColor) {
            hoveredStone.userData.hoverColor = hoveredStone.material.color.clone();
        }
        
        hoveredStone.material.emissive = new THREE.Color(0xCDB4DB);
    }
    
    animateLamps();
    animateMoon();
    controls.update();
    renderer.render(scene, camera);
}

animate()