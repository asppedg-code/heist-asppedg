class Camera {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.rotationSpeed = CONFIG.CAMERA_ROTATION_SPEED;
        this.visionRange = CONFIG.CAMERA_VISION_RANGE;
        this.visionAngle = CONFIG.CAMERA_VISION_RANGE_ANGLE; // Field of view angle
        this.isAlarmMode = false;
    }

    setAlarmMode(enabled) {
        this.isAlarmMode = enabled;
        if (enabled) {
            this.rotationSpeed = CONFIG.CAMERA_ROTATION_SPEED * CONFIG.CAMERA_ALARM_MULTIPLIER;
        } else {
            this.rotationSpeed = CONFIG.CAMERA_ROTATION_SPEED;
        }
    }

    update() {
        // Rotate camera continuously 360 degrees
        this.angle += this.rotationSpeed;
        
        // Keep angle in 0-2PI range
        if (this.angle >= Math.PI * 2) {
            this.angle -= Math.PI * 2;
        }
    }

    checkPlayerDetection(playerPos) {
        // Convert player position to camera's local coordinate system
        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if player is within vision range
        if (distance > this.visionRange) {
            return false;
        }

        // Calculate angle to player
        const angleToPlayer = Math.atan2(dy, dx);

        // Normalize angles to be within 0-2PI
        const normalizedCameraAngle = this.angle;
        const normalizedPlayerAngle = angleToPlayer >= 0 ? angleToPlayer : angleToPlayer + Math.PI * 2;

        // Check if player is within the camera's field of view
        const angleDiff = Math.abs(normalizedPlayerAngle - normalizedCameraAngle);
        
        // Account for angle wrapping
        const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);

        // Field of view is half the vision angle (total cone width)
        const fieldOfView = this.visionAngle / 2;

        return normalizedAngleDiff <= fieldOfView;
    }

    render(ctx, cameraOffset) {
        const screenX = this.x - cameraOffset.x;
        const screenY = this.y - cameraOffset.y;

        // Draw camera base
        ctx.fillStyle = this.isAlarmMode ? '#ff6b6b' : '#666';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw camera lens
        ctx.fillStyle = this.isAlarmMode ? '#ff0000' : '#333';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw vision cone
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // Draw semi-transparent red cone
        ctx.fillStyle = this.isAlarmMode ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // Use the vision angle for the cone width
        ctx.arc(0, 0, this.visionRange, -this.visionAngle / 2, this.visionAngle / 2);
        ctx.closePath();
        ctx.fill();

        // Draw cone outline
        ctx.strokeStyle = this.isAlarmMode ? 'rgba(255, 0, 0, 0.9)' : 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw cone edges for better visibility
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.visionRange * Math.cos(-this.visionAngle / 2), this.visionRange * Math.sin(-this.visionAngle / 2));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.visionRange * Math.cos(this.visionAngle / 2), this.visionRange * Math.sin(this.visionAngle / 2));
        ctx.stroke();

        ctx.restore();

        // Draw camera stand
        ctx.fillStyle = '#444';
        ctx.fillRect(screenX - 3, screenY + 10, 6, 10);
    }
}

class CameraManager {
    constructor() {
        this.cameras = [];
    }

    addCamera(x, y) {
        this.cameras.push(new Camera(x, y));
    }

    update() {
        this.cameras.forEach(camera => camera.update());
    }

    checkPlayerDetection(playerPos) {
        for (const camera of this.cameras) {
            if (camera.checkPlayerDetection(playerPos)) {
                return true;
            }
        }
        return false;
    }

    setAlarmMode(enabled) {
        this.cameras.forEach(camera => camera.setAlarmMode(enabled));
    }

    render(ctx, cameraOffset) {
        this.cameras.forEach(camera => camera.render(ctx, cameraOffset));
    }
}