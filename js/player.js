class Player {
    constructor(x, y, playerImage) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER_SIZE;
        this.height = CONFIG.PLAYER_SIZE;
        this.speed = CONFIG.PLAYER_SPEED;
        this.playerImage = playerImage;
        
        // Movement flags
        this.moving = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Game state
        this.hasMoney = false;
        this.isDead = false;
        
        // Rotation
        this.rotation = 0; // Angle in radians
    }

    handleKeyDown(key) {
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.moving.up = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.moving.down = true;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.moving.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.moving.right = true;
                break;
        }
    }

    handleKeyUp(key) {
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.moving.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.moving.down = false;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.moving.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.moving.right = false;
                break;
        }
    }

    handleDPad(direction, isPressed) {
        switch (direction) {
            case 'up':
                this.moving.up = isPressed;
                break;
            case 'down':
                this.moving.down = isPressed;
                break;
            case 'left':
                this.moving.left = isPressed;
                break;
            case 'right':
                this.moving.right = isPressed;
                break;
        }
    }

    updateRotation(mouseX, mouseY, cameraOffset) {
        // Calculate player center position on screen
        const playerScreenX = this.x + this.width / 2 - cameraOffset.x;
        const playerScreenY = this.y + this.height / 2 - cameraOffset.y;

        // Calculate angle from player to mouse
        const dx = mouseX - playerScreenX;
        const dy = mouseY - playerScreenY;
        
        this.rotation = Math.atan2(dy, dx);
    }

    update(collisionBoxes, mapWidth, mapHeight) {
        if (this.isDead) return;

        let dx = 0;
        let dy = 0;

        if (this.moving.up) dy -= this.speed;
        if (this.moving.down) dy += this.speed;
        if (this.moving.left) dx -= this.speed;
        if (this.moving.right) dx += this.speed;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * this.speed;
            dy = (dy / length) * this.speed;
        }

        // Move and check collision
        this.moveWithCollision(dx, dy, collisionBoxes, mapWidth, mapHeight);
    }

    moveWithCollision(dx, dy, collisionBoxes, mapWidth, mapHeight) {
        // Try moving horizontally
        const newX = this.x + dx;
        if (!this.checkCollision(newX, this.y, collisionBoxes, mapWidth, mapHeight)) {
            this.x = newX;
        }

        // Try moving vertically
        const newY = this.y + dy;
        if (!this.checkCollision(this.x, newY, collisionBoxes, mapWidth, mapHeight)) {
            this.y = newY;
        }
    }

    checkCollision(x, y, collisionBoxes, mapWidth, mapHeight) {
        // Check map boundaries
        if (x < 0 || x + this.width > mapWidth ||
            y < 0 || y + this.height > mapHeight) {
            return true;
        }

        // Check collision with walls
        const playerRect = {
            x: x,
            y: y,
            width: this.width,
            height: this.height
        };

        for (const box of collisionBoxes) {
            if (this.rectIntersect(playerRect, box)) {
                return true;
            }
        }

        return false;
    }

    rectIntersect(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    checkVaultCollision(vault) {
        const playerRect = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };

        return this.rectIntersect(playerRect, vault);
    }

    checkSpawnCollision(spawn) {
        const playerCenter = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };

        const distance = Math.sqrt(
            Math.pow(playerCenter.x - spawn.x, 2) +
            Math.pow(playerCenter.y - spawn.y, 2)
        );

        return distance < 32; // Within 32 pixels of spawn point
    }

    render(ctx, cameraOffset) {
        const screenX = this.x - cameraOffset.x;
        const screenY = this.y - cameraOffset.y;
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.translate(-centerX, -centerY);

        if (this.playerImage) {
            ctx.drawImage(
                this.playerImage,
                screenX,
                screenY,
                this.width,
                this.height
            );
        } else {
            // Fallback: draw a simple rectangle if image not loaded
            ctx.fillStyle = this.hasMoney ? '#ffd93d' : '#4ecdc4';
            ctx.fillRect(screenX, screenY, this.width, this.height);
            
            // Draw directional indicator
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(this.rotation) * 20, centerY + Math.sin(this.rotation) * 20);
            ctx.lineTo(centerX + Math.cos(this.rotation + 2.5) * 8, centerY + Math.sin(this.rotation + 2.5) * 8);
            ctx.lineTo(centerX + Math.cos(this.rotation - 2.5) * 8, centerY + Math.sin(this.rotation - 2.5) * 8);
            ctx.closePath();
            ctx.fill();
            
            // Draw eyes
            ctx.fillStyle = 'white';
            ctx.fillRect(screenX + 8, screenY + 12, 8, 8);
            ctx.fillRect(screenX + 24, screenY + 12, 8, 8);
            
            ctx.fillStyle = 'black';
            ctx.fillRect(screenX + 10, screenY + 14, 4, 4);
            ctx.fillRect(screenX + 26, screenY + 14, 4, 4);
        }

        // Draw money bag if player has money
        if (this.hasMoney) {
            ctx.fillStyle = '#ffd93d';
            ctx.beginPath();
            ctx.arc(screenX + this.width / 2, screenY - 10, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText('$', screenX + this.width / 2 - 4, screenY - 6);
        }

        ctx.restore();
    }

    getPosition() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    setHasMoney(value) {
        this.hasMoney = value;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.hasMoney = false;
        this.isDead = false;
        this.moving = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    }

    die() {
        this.isDead = true;
    }
}