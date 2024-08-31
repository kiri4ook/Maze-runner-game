const timerElement = document.getElementById('timer');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const modalMessage = document.getElementById('modal-message');
const modalBestTime = document.getElementById('modal-best-time');
const introMessage = document.getElementById('intro-message');

let scene, camera, renderer, controls;
let walls = [];
let moveSpeed = 0.1;
let flyMode = false;
let startTime;
let isTimerActive = false;
let bestTime = null;

const mazeTemplate = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
];

const mazeWidth = mazeTemplate[0].length;
const mazeHeight = mazeTemplate.length;
const exitX = mazeWidth - 1;
const exitY = mazeHeight - 5;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.8;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.PointerLockControls(camera, document.body);
    document.body.addEventListener('click', () => controls.lock());

    const textureLoader = new THREE.TextureLoader();

    const floorTexture = textureLoader.load('./images/floor.jpg');
    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const brickTexture = textureLoader.load('./images/brick_wall.png');
    const wallMaterial = new THREE.MeshBasicMaterial({ map: brickTexture });
    const wallGeometry = new THREE.BoxGeometry(1, 3, 1);
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    scene.add(wallMesh);

    function generateMazeFromTemplate(template) {
        const maze = [];
        for (let x = 0; x < template.length; x++) {
            maze[x] = [];
            for (let y = 0; y < template[x].length; y++) {
                maze[x][y] = template[x][y];
            }
        }
        return maze;
    }

    const maze = generateMazeFromTemplate(mazeTemplate);

    for (let x = 0; x < mazeWidth; x++) {
        for (let y = 0; y < mazeHeight; y++) {
            if (maze[x][y] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x - mazeWidth / 2, 1.5, y - mazeHeight / 2);
                scene.add(wall);
                walls.push(wall);
            }
        }
    }

    camera.position.set(2 - mazeWidth / 2, 1.8, 2 - mazeHeight / 2);

    showIntroMessage();
    updateInstructions();
    startTimer();
    animate();
}

function showIntroMessage() {
    if (introMessage) {
        setTimeout(() => {
            introMessage.style.display = 'none';
        }, 5000);
    }
}


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    if (checkExit() && isTimerActive) {
        isTimerActive = false;
        showModal();
    }
}

function startTimer() {
    startTime = Date.now();
    isTimerActive = true;

    function updateTimer() {
        if (isTimerActive) {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    setInterval(updateTimer, 1000);
}

function checkExit() {
    const exitMarkerPosition = new THREE.Vector3(exitX - mazeWidth / 2, 0.05, exitY - mazeHeight / 2);
    const distance = camera.position.distanceTo(exitMarkerPosition);

    return distance < 1.8;
}

function checkCollision(direction) {
    const raycaster = new THREE.Raycaster(camera.position.clone(), direction.normalize(), 0, 0.3);
    const intersections = raycaster.intersectObjects(walls);
    return intersections.length > 0;
}

function updateInstructions() {
    const instructions = document.getElementById('instructions');
    if (flyMode) {
        instructions.innerHTML = `
            "Q" - get up <br>
            "E" - go down <br>
            Click the gap to move 
        `;
    } else {
        instructions.innerHTML = `
            "W" - forward <br>
            "S"- back <br>
            "A" - left <br>
            "D" - right  <br>
            Click gap to fly

        `;
    }
}

function onKeyDown(event) {
    let direction = new THREE.Vector3();

    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            camera.getWorldDirection(direction);
            direction.y = 0;

            if (!flyMode && !checkCollision(direction)) {
                camera.position.add(direction.multiplyScalar(moveSpeed));
            }
            break;
        case 'ArrowLeft':
        case 'KeyA':
            camera.getWorldDirection(direction);
            direction.cross(camera.up).normalize().multiplyScalar(-moveSpeed);

            if (!flyMode && !checkCollision(direction)) {
                camera.position.add(direction.multiplyScalar(moveSpeed));
            }
            break;
        case 'ArrowDown':
        case 'KeyS':
            camera.getWorldDirection(direction);
            direction.y = 0;
            direction.negate();

            if (!flyMode && !checkCollision(direction)) {
                camera.position.add(direction.multiplyScalar(moveSpeed));
            }
            break;
        case 'ArrowRight':
        case 'KeyD':
            camera.getWorldDirection(direction);
            direction.cross(camera.up).normalize().multiplyScalar(moveSpeed);

            if (!flyMode && !checkCollision(direction)) {
                camera.position.add(direction.multiplyScalar(moveSpeed));
            }
            break;
        case 'Space':
            flyMode = !flyMode;
            updateInstructions();
            break;
        case 'KeyQ':
            if (flyMode) {
                camera.position.y += moveSpeed;
            }
            break;
        case 'KeyE':
            if (flyMode) {
                camera.position.y -= moveSpeed;
            }
            break;
    }
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function showModal() {
    modal.style.display = 'block';
    overlay.style.display = 'block';

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    if (bestTime === null || elapsedTime < bestTime) {
        bestTime = elapsedTime;
    }

    const message = `Greetings! You have reached the exit. Your time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const bestTimeMinutes = Math.floor(bestTime / 60);
    const bestTimeSeconds = bestTime % 60;
    const bestTimeMessage = `Best time: ${bestTimeMinutes.toString().padStart(2, '0')}:${bestTimeSeconds.toString().padStart(2, '0')}`;

    modalMessage.textContent = message;
    modalBestTime.textContent = bestTimeMessage;
}

function closeModal() {
    modal.style.display = 'none';
    overlay.style.display = 'none';
    isTimerActive = true;
    startTime = null;
    startTimer()

}

function restartGame() {
    closeModal();
    camera.position.set(2 - mazeWidth / 2, 1.8, 2 - mazeHeight / 2);
}


window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' && modal.style.display === 'block') {
        restartGame();
    }
});

init();

