class Main {
    constructor(renderElement) {
        this.loop = new GameLoop(60, 120);
        this.keyHandler = new KeyHandler(this.loop);
        this.scene = new Scene(renderElement, this);
        this.styleElement = document.body.appendChild(document.createElement('style'));
        this.setKeymap();
    }

    set style(string) {
        this.styleElement.innerHTML = string;
    }
    get style() {
        return this.styleElement.innerHTML;
    }

    startGame(player1, player2) {
        this.game = new Game(player1, player2);
    }

    setKeymap() {
        let main = this;
        this.keyHandler.setSingleKey(' ', 'Shoot cue', function() {
            main.game.shoot();
        });

        this.keyHandler.setSingleKey('c', 'Enable aim line', function() {
            main.scene.children = main.scene.children.filter((child) => child.type !== 'Line');
            main.game.cheatLine = !main.game.cheatLine;
        });

        this.keyHandler.setContinuousKey('ArrowLeft', 'Rotate cue left', function() {
            let rotateSpeed = 3 / MAIN.loop.tps;
            MAIN.scene.cue.rotateY(rotateSpeed);
        });
        this.keyHandler.setContinuousKey('ArrowRight', 'Rotate cue right', function() {
            let rotateSpeed = 3 / MAIN.loop.tps;
            MAIN.scene.cue.rotateY(-rotateSpeed);
        });
        this.keyHandler.setContinuousKey('ArrowUp', 'Cue power up', function() {
            let powerSpeed = 20 / MAIN.loop.tps;
            MAIN.game.cuePower += powerSpeed;
        });
        this.keyHandler.setContinuousKey('ArrowDown', 'Cue power down', function() {
            let powerSpeed = 20 / MAIN.loop.tps;
            MAIN.game.cuePower -= powerSpeed;
        });

        document.addEventListener('keydown', function(e) {
            if (this.katKeys === undefined) {
                this.katKeys = '';
            }
            this.katKeys += e.key;
            if (this.katKeys.includes('kat.gif')) {
                this.katKeys = '';
                for (let ball of MAIN.game.balls) {
                    ball.material = MAIN.katMaterial;
                }
                MAIN.scene.tableFloor.mesh.material = MAIN.katMaterial;
                MAIN.katMaterial.toggle();
            }
        }, false);
    }

    msg(string) {
        let msgBox = document.getElementById('messageBox'),
            progressBar = document.getElementsByTagName('progress')[0],
            cameraButton = document.getElementById('cameraButton');
        msgBox.innerHTML = string;
        msgBox.style.transform = 'translateY(0px)';
        progressBar.style.transform = 'translateY(-60px)';
        cameraButton.style.transform = 'translateY(-60px)';

        if (this.msgTimeout)
            clearTimeout(this.msgTimeout);
        this.msgTimeout = self.setTimeout(function() {
            msgBox.style.transform = 'translateY(60px)';
            progressBar.style.transform = 'translateY(0px)';
            cameraButton.style.transform = 'translateY(0px)';
        }, 3000 + string.length * 100);
    }
}
