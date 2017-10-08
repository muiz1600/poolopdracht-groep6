class Ball extends THREE.Mesh {
    constructor(x = 0, z = 0, radius = 0.3075, shadow = true, number = 0, stripe = false) {
        let textureLoader = new THREE.TextureLoader();
        let map = null;
        if (number !== 0)
            map = textureLoader.load(`img/textures/balls/${number}.png`);

        let geometry = new THREE.SphereGeometry(radius, 36, 36),
            material = new THREE.MeshPhongMaterial(number === 0 ? { color: 0xffffff } : {
                map: map
            });
        super(geometry, material);


        this.stripe = stripe;
        this.radius = radius;
        this.position.set(x, radius, z);
        this.castShadow = shadow;
        this.mass = 1;
        this.restitution = {
            ball: 0.95,
            wall: 0.8
        };

        this.number = number;
        this.currentRotation = 0;
        MAIN.scene.add(this);
        this.nextPosition = this.position;
        this.speed = new THREE.Vector3();
        this.rollFriction = 0.6;
        this.getOtherBalls = () => MAIN.game.balls.filter((ball) => ball !== this);
        this.otherBalls = false;
        this.stoppedRolling = function() {};
    }
    setSpeed(speed) {
        this.otherBalls = this.getOtherBalls();

        let ball = this;
        this.speed = speed;
        this.nextPosition = this.position.clone().addVectors(this.speed, this.position);
        if (!this.ballLoop) {
            MAIN.game.movingBalls++;
            this.ballLoop = MAIN.loop.add(function() {
                ball.moveBall();
            });
        }
    }
    moveBall() {
        this.speed.multiplyScalar(1 - this.rollFriction / MAIN.loop.tps);
        let stopThreshold = 0.001;
        if (this.speed.length() < stopThreshold) {
            this.speed.set(0, 0, 0);
            MAIN.game.movingBalls--;
            if(MAIN.game.movingBalls===0)
                this.stoppedRolling();
            this.ballLoop = MAIN.loop.remove(this.ballLoop);
        } else {
            let circumference = this.radius,
                traversedDistance = this.speed.length(),
                addedAngle = traversedDistance / circumference,
                rollDirection = this.speed.clone().normalize(),
                rotateAxis = new THREE.Vector3(0, 1, 0);
            rollDirection.applyAxisAngle(rotateAxis, Math.PI / 2);

            this.currentRotation += addedAngle;
            let quaternion = new THREE.Quaternion().setFromAxisAngle(rollDirection, this.currentRotation);
            this.setRotationFromQuaternion(quaternion);


            this.currentPosition = this.nextPosition.clone();

            let collision = this.willCollideWall(),
                direction = collision.direction,
                distance = collision.distance;

            if (direction) { //Wallhit
                let speedTowardsTarget = this.speed.clone().multiply(direction),
                    speedLength = speedTowardsTarget.length();
                if (speedLength > 0.05) {
                    let frequency = 2 * this.speed.length();
                    frequency = frequency > 0.6 ? 0.6 : frequency;
                    this.speed.multiplyScalar(this.restitution.wall);
                }
                if (distance - this.radius < 0)
                    this.currentPosition.add(direction.clone().multiplyScalar(distance - this.radius));

                direction.reflect(direction).normalize(); //normaal
                let speed = this.speed;

                let outgoingVector = ((d, n) => d.sub(n.multiplyScalar(d.dot(n) * 2))),
                    outgoing = outgoingVector(speed.clone(), direction);

                this.speed = outgoing.clone();
            }

            let scorePocket = false;
            for (let pocket in MAIN.game.pockets) {
                if (this.position.distanceTo(MAIN.game.pockets[pocket].position) < MAIN.game.pockets[pocket].radius) {
                    scorePocket = parseInt(pocket);
                    break;
                }
            }

            if (scorePocket) {
                MAIN.game.movingBalls--;
                console.log('pocketed ', this.number, 'pocket: ' + scorePocket);

                this.speed.set(0, 0, 0);
                this.ballLoop = MAIN.loop.remove(this.ballLoop);
                MAIN.game.score(this.number, scorePocket, this.stripe);
                let downPos = this.position.clone();
                downPos.y -= 0.9;
                MAIN.scene.animateObject(this, downPos, 500);
            }

            this.position.set(this.currentPosition.x, this.currentPosition.y, this.currentPosition.z);
            this.nextPosition = this.currentPosition.addVectors(this.speed, this.position);
        }
    }

    willCollideWall() {
        if (Game.tableSize.x / 2 - Math.abs(this.nextPosition.x) > 4 && Game.tableSize.z / 2 - Math.abs(this.nextPosition.z) > 4)
            return false;

        if (this.nextPosition.x > 7.1)
            return {
                direction: new THREE.Vector3(1, 0, 0),
                distance: 6.7 - this.radius - this.position.x
            };
        if (this.nextPosition.x < -7.1)
            return {
                direction: new THREE.Vector3(-1, 0, 0),
                distance: -6.7 + this.radius - this.position.x
            };

        if (this.nextPosition.z > 13.5)
            return {
                direction: new THREE.Vector3(0, 0, 1),
                distance: 13.45 - this.radius - this.position.z
            };
        if (this.nextPosition.z < -13.5)
            return {
                direction: new THREE.Vector3(0, 0, -1),
                distance: -13.45 + this.radius - this.position.z
            };

        let pX = this.nextPosition.x > 0, //Bal zit in de positieve X helft
            pZ = this.nextPosition.z > 0; //Bal zit in de positieve Z helft
        let directions = [];
        pX && directions.push(new THREE.Vector3(1, 0, 0));
        pZ && directions.push(new THREE.Vector3(0, 0, 1));
        !pX && directions.push(new THREE.Vector3(-1, 0, 0));
        !pZ && directions.push(new THREE.Vector3(0, 0, -1));
        pZ && !pX && directions.push(new THREE.Vector3(-1, 0, 1));
        pZ && !pX && directions.push(new THREE.Vector3(-1, 0, 1));
        !pZ && pX && directions.push(new THREE.Vector3(1, 0, -1));
        !pZ && !pX && directions.push(new THREE.Vector3(-1, 0, -1));

        pX && pZ && directions.push(new THREE.Vector3(1, 0, 2));
        pZ && pX && directions.push(new THREE.Vector3(2, 0, 1));
        !pX && pZ && directions.push(new THREE.Vector3(-1, 0, 2));
        !pZ && pX && directions.push(new THREE.Vector3(2, 0, -1));
        pZ && !pX && directions.push(new THREE.Vector3(-2, 0, 1));
        pZ && !pX && directions.push(new THREE.Vector3(-2, 0, 1));
        !pZ && pX && directions.push(new THREE.Vector3(1, 0, -2));
        !pZ && !pX && directions.push(new THREE.Vector3(-1, 0, -2));

        let startPoint = this.nextPosition,
            ray = new THREE.Raycaster(startPoint),
            closestWall = Infinity,
            dir = false;
        for (let direction of directions) {
            ray.ray.direction = direction;
            let intersects = ray.intersectObjects([MAIN.scene.tableWallMesh]);
            if (intersects.length > 0) {

                if (intersects[0].distance < closestWall) {
                    dir = direction;
                    closestWall = intersects[0].distance;
                }
            }
        }
        if (!dir || closestWall > this.radius)
            return false;
        return {
            direction: dir,
            distance: closestWall
        };
    }

    directionTo(ball) {
        return ball.nextPosition.clone().sub(this.nextPosition).normalize();
    }

    colliding(ball) {
        let distance = this.nextPosition.distanceTo(ball.nextPosition);
        return distance < ball.radius + this.radius;
    }
    resolveCollision(ball) {

        let delta = this.position.clone().sub(ball.position),
            distance = delta.length();
        distance -= this.radius + ball.radius;
        if (distance < 0)
            this.position.sub(delta.clone().normalize().multiplyScalar(distance));

        let dx = this.nextPosition.x - ball.nextPosition.x,
            dy = this.nextPosition.z - ball.nextPosition.z,
            collisionAngle = Math.atan2(dy, dx),
            speed1 = this.speed.length(),
            speed2 = ball.speed.length(),
            direction1 = Math.atan2(this.speed.z, this.speed.x),
            direction2 = Math.atan2(ball.speed.z, ball.speed.x),

            velocityx_1 = speed1 * Math.cos(direction1 - collisionAngle),
            velocityy_1 = speed1 * Math.sin(direction1 - collisionAngle),
            velocityx_2 = speed2 * Math.cos(direction2 - collisionAngle),
            velocityy_2 = speed2 * Math.sin(direction2 - collisionAngle),

            final_velocityx_1 = ((this.mass - ball.mass) * velocityx_1 + (ball.mass + ball.mass) * velocityx_2) / (this.mass + ball.mass),
            final_velocityx_2 = ((this.mass + this.mass) * velocityx_1 + (ball.mass - this.mass) * velocityx_2) / (this.mass + ball.mass),
            final_velocityy_1 = velocityy_1,
            final_velocityy_2 = velocityy_2;

        this.speed.x = Math.cos(collisionAngle) * final_velocityx_1 + Math.cos(collisionAngle + Math.PI / 2) * final_velocityy_1;
        this.speed.z = Math.sin(collisionAngle) * final_velocityx_1 + Math.sin(collisionAngle + Math.PI / 2) * final_velocityy_1;
        ball.speed.x = Math.cos(collisionAngle) * final_velocityx_2 + Math.cos(collisionAngle + Math.PI / 2) * final_velocityy_2;
        ball.speed.z = Math.sin(collisionAngle) * final_velocityx_2 + Math.sin(collisionAngle + Math.PI / 2) * final_velocityy_2;

        this.speed.multiplyScalar(this.restitution.ball);
        ball.speed.multiplyScalar(ball.restitution.ball);

        this.setSpeed(this.speed);
        ball.setSpeed(ball.speed);
    }
}
