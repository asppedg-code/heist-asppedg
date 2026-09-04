class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.isRunning = false;
        this.isGameOver = false;
        this.hasMoney = false;
        this.isAlarmMode = false;
        this.escapeTime = CONFIG.ESCAPE_TIME;
        this.gameTime = 0;
        
        // Vault money system
        this.totalMoney = 0;
        this.vaultTime = 0;
        this.isInVault = false;
        
        // Discord integration
        this.discordSdk = null;
        
        // Game objects
        this.player = null;
        this.mapLoader = null;
        this.cameraManager = new CameraManager();
        this.laserManager = new LaserManager();
        
        // Camera offset for scrolling
        this.cameraOffset = { x: 0, y: 0 };
        
        // Asset loader
        this.assetLoader = new AssetLoader();
        
        // UI elements
        this.timerElement = document.getElementById('timer');
        this.statusElement = document.getElementById('status');
        this.moneyElement = document.getElementById('money');
        this.gameOverScreen = document.getElementById('game-over');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.restartBtn = document.getElementById('restart-btn');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize Discord integration (non-blocking)
        this.initDiscordIntegration();
        
        // Initialize game
        this.init();
    }

    async init() {
        try {
            // Load assets
            const assets = await this.assetLoader.loadAssets({
                map: CONFIG.MAP_FILE,
                tilesheet: CONFIG.TILESHEET_FILE,
                player: CONFIG.PLAYER_FILE
            });

            // Setup canvas
            this.setupCanvas();

            // Parse map
            const mapData = this.assetLoader.get('map');
            const tilesheet = this.assetLoader.get('tilesheet');
            this.mapLoader = new MapLoader(mapData, tilesheet);

            // Initialize entities from map
            this.initializeEntities();

            // Initialize player
            const playerImage = this.assetLoader.get('player');
            const spawn = this.mapLoader.getPlayerSpawn();
            this.player = new Player(spawn.x, spawn.y, playerImage);

            // Start game loop
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();

        } catch (error) {
            console.error('Không thể khởi tạo game:', error);
            alert('Không thể tải tài nguyên game. Vui lòng kiểm tra console để biết chi tiết.');
        }
    }

    setupCanvas() {
        // Set canvas size to match container
        const container = document.getElementById('game-container');
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const newRect = container.getBoundingClientRect();
            this.canvas.width = newRect.width;
            this.canvas.height = newRect.height;
        });
    }

    initializeEntities() {
        // Initialize cameras from map
        const cameras = this.mapLoader.getCameras();
        cameras.forEach(cam => {
            this.cameraManager.addCamera(cam.x, cam.y);
        });

        // Initialize lasers from map
        const lasers = this.mapLoader.getLasers();
        lasers.forEach(laser => {
            this.laserManager.addLaser(laser.x, laser.y, laser.width, laser.height);
        });
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.player) {
                this.player.handleKeyDown(e.key);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.player) {
                this.player.handleKeyUp(e.key);
            }
        });

        // Mouse movement for player rotation
        window.addEventListener('mousemove', (e) => {
            if (this.player && !this.isGameOver) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                this.player.updateRotation(mouseX, mouseY, this.cameraOffset);
            }
        });

        // Virtual D-Pad controls
        const dpadButtons = {
            'dpad-up': 'up',
            'dpad-down': 'down',
            'dpad-left': 'left',
            'dpad-right': 'right'
        };

        Object.entries(dpadButtons).forEach(([id, direction]) => {
            const button = document.getElementById(id);
            
            // Mouse events
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (this.player) {
                    this.player.handleDPad(direction, true);
                }
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                if (this.player) {
                    this.player.handleDPad(direction, false);
                }
            });
            
            button.addEventListener('mouseleave', (e) => {
                e.preventDefault();
                if (this.player) {
                    this.player.handleDPad(direction, false);
                }
            });

            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.player) {
                    this.player.handleDPad(direction, true);
                }
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.player) {
                    this.player.handleDPad(direction, false);
                }
            });
        });

        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.restart();
        });
    }

    initDiscordIntegration() {
        // Initialize Discord SDK if available (non-blocking)
        if (window.DiscordIntegration) {
            window.DiscordIntegration.init().then(sdk => {
                if (sdk) {
                    console.log("Discord SDK initialized in game");
                    this.discordSdk = sdk;
                } else {
                    console.log("Discord SDK not available, game continues normally");
                }
            }).catch(error => {
                console.error("Discord integration error:", error);
                console.log("Game continues without Discord integration");
            });
        } else {
            console.log("Discord integration not available");
        }
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.isGameOver) return;

        // Update game time if in alarm mode
        if (this.isAlarmMode) {
            this.gameTime += deltaTime;
            this.escapeTime = Math.max(0, CONFIG.ESCAPE_TIME - Math.floor(this.gameTime / 1000));
            this.updateUI();
            
            // Check if time ran out
            if (this.escapeTime <= 0) {
                this.gameOver(false, 'Hết thời gian! Bảo vệ đã bắt được bạn.');
                return;
            }
        }

        // Update player
        const mapSize = this.mapLoader.getMapSize();
        const collisionBoxes = this.mapLoader.getCollisionBoxes();
        this.player.update(collisionBoxes, mapSize.width, mapSize.height);

        // Update camera position to follow player
        this.updateCamera();

        // Update cameras
        this.cameraManager.update();

        // Update lasers
        this.laserManager.update(deltaTime);

        // Check game logic
        this.checkGameLogic();
    }

    updateCamera() {
        const mapSize = this.mapLoader.getMapSize();
        
        // Center camera on player
        this.cameraOffset.x = this.player.x + this.player.width / 2 - this.canvas.width / 2;
        this.cameraOffset.y = this.player.y + this.player.height / 2 - this.canvas.height / 2;

        // Clamp camera to map bounds
        this.cameraOffset.x = Math.max(0, Math.min(this.cameraOffset.x, mapSize.width - this.canvas.width));
        this.cameraOffset.y = Math.max(0, Math.min(this.cameraOffset.y, mapSize.height - this.canvas.height));
    }

    checkGameLogic() {
        const playerPos = this.player.getPosition();
        const playerBounds = this.player.getBounds();
        const vault = this.mapLoader.getVault();
        const spawn = this.mapLoader.getPlayerSpawn();

        // Check vault collision and money collection
        const currentlyInVault = this.player.checkVaultCollision(vault);
        
        if (currentlyInVault) {
            if (!this.isInVault) {
                // Just entered vault
                this.isInVault = true;
                this.vaultTime = 0;
            }
            
            // Accumulate time in vault
            this.vaultTime += 16; // Approximately 16ms per frame at 60fps
            
            // Check if it's time to add money (every 10 seconds)
            if (this.vaultTime >= CONFIG.VAULT_MONEY_INTERVAL) {
                this.totalMoney += CONFIG.VAULT_MONEY_AMOUNT;
                this.vaultTime = 0; // Reset timer for next interval
                
                // Set hasMoney and trigger alarm on first money collection
                if (!this.hasMoney) {
                    this.hasMoney = true;
                    this.player.setHasMoney(true);
                    this.triggerAlarm();
                }
                
                // Update money display
                this.updateMoneyDisplay();
            }
        } else {
            // Player left vault
            this.isInVault = false;
            this.vaultTime = 0;
        }

        // Check camera detection
        if (this.cameraManager.checkPlayerDetection(playerPos)) {
            // Trigger alarm instead of instant game over
            if (!this.isAlarmMode) {
                this.triggerAlarm();
            }
            return;
        }

        // Check laser collision
        if (this.laserManager.checkPlayerCollision(playerBounds)) {
            this.gameOver(false, 'Bạn đã kích hoạt bẫy laser!');
            return;
        }

        // Check win condition (return to spawn with money)
        if (this.hasMoney && this.player.checkSpawnCollision(spawn)) {
            this.gameOver(true, 'Bạn đã trốn thoát thành công với số tiền!');
        }
    }

    triggerAlarm() {
        if (this.isAlarmMode) return; // Already in alarm mode
        
        this.isAlarmMode = true;
        this.gameTime = 0;
        
        // Speed up cameras and lasers
        this.cameraManager.setAlarmMode(true);
        this.laserManager.setAlarmMode(true);
        
        // Update UI
        this.statusElement.textContent = 'Trạng thái: TẤN CÔNG!';
        this.statusElement.style.color = '#ff6b6b';
        this.moneyElement.style.display = 'block';
        
        // Update Discord presence
        if (window.DiscordIntegration) {
            window.DiscordIntegration.setPresence("Đang trốn thoát với tiền!");
        }
        
        // Update money display immediately
        this.updateMoneyDisplay();
    }

    updateUI() {
        this.timerElement.textContent = `Thời gian: ${this.escapeTime}s`;
        
        if (this.escapeTime <= 10) {
            this.timerElement.style.color = '#ff0000';
        } else if (this.escapeTime <= 30) {
            this.timerElement.style.color = '#ff6b6b';
        } else {
            this.timerElement.style.color = '#ff6b6b';
        }
    }

    updateMoneyDisplay() {
        // Format money with Vietnamese notation
        const formattedMoney = new Intl.NumberFormat('vi-VN').format(this.totalMoney);
        this.moneyElement.textContent = `Tiền: ${formattedMoney} đ`;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render map
        this.mapLoader.render(this.ctx, this.cameraOffset);

        // Render vault
        this.renderVault();

        // Render lasers
        this.laserManager.render(this.ctx, this.cameraOffset);

        // Render cameras
        this.cameraManager.render(this.ctx, this.cameraOffset);

        // Render player
        this.player.render(this.ctx, this.cameraOffset);

        // Render spawn point indicator
        this.renderSpawnPoint();
    }

    renderVault() {
        const vault = this.mapLoader.getVault();
        const screenX = vault.x - this.cameraOffset.x;
        const screenY = vault.y - this.cameraOffset.y;

        // Draw vault
        this.ctx.fillStyle = this.hasMoney ? '#333' : '#ffd93d';
        this.ctx.fillRect(screenX, screenY, vault.width, vault.height);
        
        // Draw vault details
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(screenX, screenY, vault.width, vault.height);
        
        // Draw vault door
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(screenX + vault.width / 2 - 20, screenY + vault.height / 2 - 30, 40, 60);
        
        // Draw lock
        this.ctx.fillStyle = this.hasMoney ? '#666' : '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(screenX + vault.width / 2, screenY + vault.height / 2, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw label
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        
        if (this.totalMoney > 0) {
            const formattedMoney = new Intl.NumberFormat('vi-VN').format(this.totalMoney);
            this.ctx.fillText(`${formattedMoney} đ`, screenX + vault.width / 2, screenY - 10);
            
            // Show progress to next money
            if (this.isInVault) {
                const progress = this.vaultTime / CONFIG.VAULT_MONEY_INTERVAL;
                const remainingTime = Math.ceil((CONFIG.VAULT_MONEY_INTERVAL - this.vaultTime) / 1000);
                
                this.ctx.fillStyle = '#ffd93d';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`+${remainingTime}s`, screenX + vault.width / 2, screenY + vault.height + 15);
            }
        } else {
            this.ctx.fillText('KÉT SẮT', screenX + vault.width / 2, screenY - 10);
        }
    }

    renderSpawnPoint() {
        const spawn = this.mapLoader.getPlayerSpawn();
        const screenX = spawn.x - this.cameraOffset.x;
        const screenY = spawn.y - this.cameraOffset.y;

        // Draw spawn point indicator
        this.ctx.strokeStyle = this.hasMoney ? '#4ecdc4' : 'rgba(78, 205, 196, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        if (this.hasMoney) {
            this.ctx.fillStyle = '#4ecdc4';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LỐI THOÁT', screenX, screenY - 25);
            
            // Show current money amount
            if (this.totalMoney > 0) {
                const formattedMoney = new Intl.NumberFormat('vi-VN').format(this.totalMoney);
                this.ctx.fillStyle = '#ffd93d';
                this.ctx.font = 'bold 11px Arial';
                this.ctx.fillText(`${formattedMoney} đ`, screenX, screenY + 35);
            }
        }
    }

    gameOver(won, message) {
        this.isGameOver = true;
        this.player.die();

        // Show game over screen
        this.gameOverScreen.style.display = 'block';
        this.gameOverTitle.textContent = won ? 'BẠN THẮNG!' : 'KẾT THÚC';
        this.gameOverTitle.style.color = won ? '#4ecdc4' : '#ff6b6b';
        
        if (won && this.totalMoney > 0) {
            const formattedMoney = new Intl.NumberFormat('vi-VN').format(this.totalMoney);
            this.gameOverMessage.textContent = `${message} Số tiền: ${formattedMoney} đ`;
            
            // Update Discord presence on win
            if (window.DiscordIntegration) {
                window.DiscordIntegration.setPresence(`Đã trốn thoát với ${formattedMoney} đ!`);
            }
        } else {
            this.gameOverMessage.textContent = message;
            
            // Update Discord presence on loss
            if (window.DiscordIntegration) {
                window.DiscordIntegration.setPresence("Đã bị bắt...");
            }
        }
    }

    restart() {
        // Reset game state
        this.isGameOver = false;
        this.hasMoney = false;
        this.isAlarmMode = false;
        this.escapeTime = CONFIG.ESCAPE_TIME;
        this.gameTime = 0;
        
        // Reset vault money system
        this.totalMoney = 0;
        this.vaultTime = 0;
        this.isInVault = false;

        // Reset player
        const spawn = this.mapLoader.getPlayerSpawn();
        this.player.reset(spawn.x, spawn.y);

        // Reset cameras and lasers
        this.cameraManager.setAlarmMode(false);
        this.laserManager.setAlarmMode(false);

        // Reset UI
        this.statusElement.textContent = 'Trạng thái: Lén lút';
        this.statusElement.style.color = '#4ecdc4';
        this.moneyElement.style.display = 'none';
        this.moneyElement.textContent = 'Tiền: $0';
        this.timerElement.textContent = `Thời gian: ${this.escapeTime}s`;
        this.timerElement.style.color = '#ff6b6b';
        this.gameOverScreen.style.display = 'none';

        // Restart game loop
        this.lastTime = performance.now();
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});