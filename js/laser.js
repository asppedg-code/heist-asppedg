class Laser {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.isOn = true;
        this.timer = 0;
        this.onTime = CONFIG.LASER_ON_TIME;
        this.offTime = CONFIG.LASER_OFF_TIME;
        this.isAlarmMode = false;
    }

    setAlarmMode(enabled) {
        this.isAlarmMode = enabled;
        if (enabled) {
            this.onTime = CONFIG.LASER_ON_TIME * CONFIG.LASER_ALARM_MULTIPLIER;
            this.offTime = CONFIG.LASER_OFF_TIME * CONFIG.LASER_ALARM_MULTIPLIER;
        } else {
            this.onTime = CONFIG.LASER_ON_TIME;
            this.offTime = CONFIG.LASER_OFF_TIME;
        }
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if (this.isOn) {
            if (this.timer >= this.onTime) {
                this.isOn = false;
                this.timer = 0;
            }
        } else {
            if (this.timer >= this.offTime) {
                this.isOn = true;
                this.timer = 0;
            }
        }
    }

    checkPlayerCollision(playerBounds) {
        if (!this.isOn) return false;

        return this.rectIntersect(playerBounds, {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        });
    }

    rectIntersect(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    render(ctx, cameraOffset) {
        const screenX = this.x - cameraOffset.x;
        const screenY = this.y - cameraOffset.y;

        if (this.isOn) {
            // Draw glowing laser
            ctx.save();
            
            // Outer glow
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.fillStyle = CONFIG.LASER_GLOW_COLOR;
            ctx.fillRect(screenX - 5, screenY - 5, this.width + 10, this.height + 10);
            
            // Inner laser
            ctx.shadowBlur = 10;
            ctx.fillStyle = CONFIG.LASER_COLOR;
            ctx.fillRect(screenX, screenY, this.width, this.height);
            
            ctx.restore();

            // Draw laser endpoints
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(screenX, screenY + this.height / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(screenX + this.width, screenY + this.height / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw dim laser when off
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(screenX, screenY, this.width, this.height);

            // Draw dim endpoints
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(screenX, screenY + this.height / 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(screenX + this.width, screenY + this.height / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class LaserManager {
    constructor() {
        this.lasers = [];
    }

    addLaser(x, y, width, height) {
        this.lasers.push(new Laser(x, y, width, height));
    }

    update(deltaTime) {
        this.lasers.forEach(laser => laser.update(deltaTime));
    }

    checkPlayerCollision(playerBounds) {
        for (const laser of this.lasers) {
            if (laser.checkPlayerCollision(playerBounds)) {
                return true;
            }
        }
        return false;
    }

    setAlarmMode(enabled) {
        this.lasers.forEach(laser => laser.setAlarmMode(enabled));
    }

    render(ctx, cameraOffset) {
        this.lasers.forEach(laser => laser.render(ctx, cameraOffset));
    }
}