const CONFIG = {
    TILE_SIZE: 64,
    PLAYER_SPEED: 4,
    PLAYER_SIZE: 48,
    ESCAPE_TIME: 90,
    
    // Camera settings
    CAMERA_VISION_RANGE: 150,
    CAMERA_ROTATION_SPEED: 0.02,
    CAMERA_VISION_RANGE_ANGLE: Math.PI / 3, // 60 degrees field of view
    CAMERA_ALARM_MULTIPLIER: 1.3,
    
    // Laser settings
    LASER_ON_TIME: 2000,
    LASER_OFF_TIME: 1500,
    LASER_ALARM_MULTIPLIER: 0.7,
    
    // Vault settings
    VAULT_MONEY_INTERVAL: 10000, // 10 seconds
    VAULT_MONEY_AMOUNT: 200000000, // 200 million
    
    // Colors
    LASER_COLOR: 'rgba(255, 0, 0, 0.8)',
    LASER_GLOW_COLOR: 'rgba(255, 0, 0, 0.3)',
    CAMERA_CONE_COLOR: 'rgba(255, 0, 0, 0.3)',
    
    // Assets
    MAP_FILE: 'assets/map.json',
    TILESHEET_FILE: 'assets/tilesheet_complete.png',
    PLAYER_FILE: 'assets/Player.png'
};