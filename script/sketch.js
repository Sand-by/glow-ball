import fragmentShader from "../shader/fragment.js";
const canvas = document.querySelector('#c');
const btn = document.querySelector('#btn');
const btn_stop = document.querySelector('#btn_stop');

let scene,camera,renderer;
let uniforms;
let analyser, dataArray=0;

const mouse = new THREE.Vector2();
function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    uniforms['iMouse'].value = mouse;
}
window.addEventListener( 'mousemove', onMouseMove, false );


btn.onclick = function() {
    btn.disabled = true;
    btn_stop.disabled = false;
    navigator.mediaDevices.getUserMedia( { audio: true, video: false } ).then( handleSuccess );
    var listener = new THREE.AudioListener();
    var audio = new THREE.Audio( listener );
    var fftSize = 2048;

    function handleSuccess( stream ) {
      var context = listener.context;
      var source = context.createMediaStreamSource( stream );
      audio.setNodeSource( source );
    }

    audio.gain.disconnect();//DISABLE FEEDBACK
    analyser = new THREE.AudioAnalyser(audio,fftSize)
    analyser.analyser.maxDecibels = -3;
    analyser.analyser.minDecibels = -100;
    dataArray = analyser.data;
    LowPassSpect(); 
};
btn_stop.onclick = function(){
    document.location.reload();
}
init();
animate();
function init(){
    camera = new THREE.OrthographicCamera(
        -1,1,1,-1,-1,1
    );
    scene = new THREE.Scene();
    const plane = new THREE.PlaneGeometry(2,2);
    uniforms = {
        iResolution: { value: new THREE.Vector2()},
        iTime: { value: 0},
        iMouse:{type:"v2", value: new THREE.Vector2(0,0)},
        iScale:{ value: 0.3}
    }
    const material = new THREE.ShaderMaterial({
        uniforms:uniforms,
        fragmentShader
    });
    const mesh = new THREE.Mesh(plane,material)
    scene.add(mesh);
    renderer = new THREE.WebGLRenderer({canvas});
    renderer.setPixelRatio(window.devicePixelRatio);
    onWindowResize();
    window.addEventListener('resize',onWindowResize);
}
function onWindowResize(){
    renderer.setSize(window.innerWidth/1.2,window.innerHeight/1.2);
  }    
function LowPassSpect(){
    let square = 0;
    let mean = 0, root = 0;
    for (let i = 0; i < 5; i++) {
      if(dataArray!=0)
        square += Math.pow(dataArray[i], 2);
      }
    mean = (square / 5);
    root = Math.sqrt(mean);
    return parseInt(root,10);
}
function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function animate(){
    requestAnimationFrame(animate);
    if(dataArray!=0) analyser.getFrequencyData();
    const lowpass = LowPassSpect();
    const scale = map_range(lowpass,0,160,1.,0.01);
    uniforms['iTime'].value = performance.now()/1000;
    uniforms['iResolution'].value.set(canvas.width,canvas.height);
    uniforms['iScale'].value = scale;
    renderer.render(scene,camera);
}