var Ball = function (x, y, z, name, color) { //creating balls 
    this.color = typeof color === 'undefined' ? 0xcc0000 : color; //"empty color"
    this.texture = 'images/balls/' + name + '.png'; //grabbing ball image (given name has to be same as the png file)
  
    this.mesh = this.createMesh(x,y,z);
    this.sphere = new THREE.Sphere(this.mesh.position, Ball.RADIUS); //making a sphere for collision detection etc.
    scene.add(this.mesh);
  
    this.rigidBody = this.createBody(x,y,z);
    world.addBody(this.rigidBody);
    this.name = name;
    this.fallen = false; //make sure the ball is in the game when you make it
  };

  Ball.RADIUS = 5.715 / 2; // cm
  Ball.MASS = 0.170; // kg
  Ball.contactMaterial = new CANNON.Material("ballMaterial");
  
  
  Ball.envMapUrls = [
    'images/skybox1/px.png', // positive x
    'images/skybox1/nx.png', // negative x
    'images/skybox1/py.png', // positive y
    'images/skybox1/ny.png', // negative y
    'images/skybox1/pz.png', // positive z
    'images/skybox1/nz.png'  // negative z
  ];

  var cubeTextureLoader = new THREE.CubeTextureLoader();

  Ball.envMap = cubeTextureLoader.load(Ball.envMapUrls, function (tex) {
    Ball.envMap = tex;
  }); 

  Ball.prototype.onEnterHole = function () {  //ball pocketed
    this.rigidBody.velocity = new CANNON.Vec3(0);
    this.rigidBody.angularVelocity = new CANNON.Vec3(0);
    world.removeBody(this.rigidBody);
    eightballgame.coloredBallEnteredHole(this.name); //stops everything ball is doing and removes ball by name 
  };

  Ball.prototype.createBody = function (x,y,z) { //creating a body
    var sphereBody = new CANNON.Body({
      mass: Ball.MASS, // kg
      position: new CANNON.Vec3(x,y,z), // m
      shape: new CANNON.Sphere(Ball.RADIUS),
      material: Ball.contactMaterial
    });

    sphereBody.linearDamping = sphereBody.angularDamping = 0.5; // Hardcoded values
    sphereBody.allowSleep = true; //allows ball to stop moving

    // Sleep parameters
  sphereBody.sleepSpeedLimit = 0.5; 
  sphereBody.sleepTimeLimit = 0.1;  // ball will stop moving once it reaches too low of a speed
  
  return sphereBody;
};

Ball.prototype.createMesh = function (x,y,z) {
    var geometry = new THREE.SphereGeometry(Ball.RADIUS, 16, 16);
    var material = new THREE.MeshPhongMaterial({
      specular: 0xffffff,
      envMap: Ball.envMap,
      combine: THREE.AddOperation,
      shading: false
    });

    if (typeof this.texture === 'undefined') {   //fix in case texture is undefined
        material.color = new THREE.Color(this.color);
      } else {
        textureLoader.load(this.texture, function (tex) {
          material.map = tex;
          material.needsUpdate = true;
        });
      }

      var sphere = new THREE.Mesh(geometry, material);
      
        sphere.position.set(x,y,z);
        
        return sphere;
      };

      Ball.prototype.tick = function (dt) {
        this.mesh.position.copy(this.rigidBody.position);
        this.mesh.quaternion.copy(this.rigidBody.quaternion);
      
        if (this.rigidBody.position.y < -4 * Ball.RADIUS && !this.fallen) {  //check if the ball is still in play
          this.fallen = true;
          this.onEnterHole();
        }
      };
      
  
