class MapLoader {
    constructor(mapData, tilesheet) {
        this.mapData = mapData;
        this.tilesheet = tilesheet;
        this.tileSize = CONFIG.TILE_SIZE;
        this.width = mapData.width;
        this.height = mapData.height;
        
        // Calculate tilesheet dimensions
        this.tilesheetColumns = Math.floor(tilesheet.width / this.tileSize);
        this.tilesheetRows = Math.floor(tilesheet.height / this.tileSize);
        
        // Collision boxes (solid walls)
        this.collisionBoxes = [];
        
        // Entity positions
        this.playerSpawn = { x: 0, y: 0 };
        this.vault = { x: 0, y: 0, width: 0, height: 0 };
        this.cameras = [];
        this.lasers = [];
        
        this.parseMap();
    }

    getTileSourcePosition(tileId) {
        if (tileId <= 0) return null;
        
        // Handle Tiled tile flags (flip/rotate)
        // Flags are stored in the upper bits of the tile ID
        const FLIPPED_HORIZONTALLY_FLAG = 0x80000000; // 2^31
        const FLIPPED_VERTICALLY_FLAG = 0x40000000;   // 2^30
        const FLIPPED_DIAGONALLY_FLAG = 0x20000000;   // 2^29
        
        // Remove flags to get the actual tile ID
        const cleanTileId = tileId & ~(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG);
        
        // Tiled uses 1-based indexing, so subtract 1
        const tileIndex = cleanTileId - 1;
        
        const column = tileIndex % this.tilesheetColumns;
        const row = Math.floor(tileIndex / this.tilesheetColumns);
        
        return {
            x: column * this.tileSize,
            y: row * this.tileSize,
            flipH: (tileId & FLIPPED_HORIZONTALLY_FLAG) !== 0,
            flipV: (tileId & FLIPPED_VERTICALLY_FLAG) !== 0,
            flipD: (tileId & FLIPPED_DIAGONALLY_FLAG) !== 0
        };
    }

    parseMap() {
        // Parse tile layers
        this.mapData.layers.forEach(layer => {
            if (layer.type === 'tilelayer') {
                this.parseTileLayer(layer);
            } else if (layer.type === 'objectgroup') {
                this.parseObjectLayer(layer);
            }
        });
    }

    parseTileLayer(layer) {
        const data = layer.data;
        const width = layer.width;
        const height = layer.height;

        // Tiled tile flags
        const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        const FLIPPED_VERTICALLY_FLAG = 0x40000000;
        const FLIPPED_DIAGONALLY_FLAG = 0x20000000;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileId = data[y * width + x];
                const worldX = x * this.tileSize;
                const worldY = y * this.tileSize;

                // Clean tile ID by removing flags
                const cleanTileId = tileId & ~(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG);

                if (layer.name === 'Walls' && cleanTileId > 0) {
                    // Register collision box for solid walls
                    this.collisionBoxes.push({
                        x: worldX,
                        y: worldY,
                        width: this.tileSize,
                        height: this.tileSize
                    });
                }
            }
        }
    }

    parseObjectLayer(layer) {
        layer.objects.forEach(obj => {
            switch (obj.name) {
                case 'PlayerSpawn':
                    this.playerSpawn = {
                        x: obj.x,
                        y: obj.y
                    };
                    break;
                    
                case 'Vault':
                    this.vault = {
                        x: obj.x,
                        y: obj.y,
                        width: obj.width,
                        height: obj.height
                    };
                    break;
                    
                case 'Camera':
                    this.cameras.push({
                        x: obj.x,
                        y: obj.y
                    });
                    break;
                    
                case 'Laser':
                    this.lasers.push({
                        x: obj.x,
                        y: obj.y,
                        width: obj.width,
                        height: obj.height
                    });
                    break;
            }
        });
    }

    render(ctx, cameraOffset) {
        this.mapData.layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.visible) {
                this.renderTileLayer(ctx, layer, cameraOffset);
            }
        });
    }

    renderTileLayer(ctx, layer, cameraOffset) {
        const data = layer.data;
        const width = layer.width;
        const height = layer.height;

        // Calculate visible tiles based on camera
        const startX = Math.max(0, Math.floor(cameraOffset.x / this.tileSize));
        const startY = Math.max(0, Math.floor(cameraOffset.y / this.tileSize));
        const endX = Math.min(width, Math.ceil((cameraOffset.x + ctx.canvas.width) / this.tileSize));
        const endY = Math.min(height, Math.ceil((cameraOffset.y + ctx.canvas.height) / this.tileSize));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tileId = data[y * width + x];
                
                if (tileId > 0) {
                    const sourcePos = this.getTileSourcePosition(tileId);
                    if (sourcePos) {
                        const destX = x * this.tileSize - cameraOffset.x;
                        const destY = y * this.tileSize - cameraOffset.y;
                        
                        ctx.save();
                        
                        // Handle tile flipping
                        if (sourcePos.flipH || sourcePos.flipV || sourcePos.flipD) {
                            ctx.translate(destX + this.tileSize / 2, destY + this.tileSize / 2);
                            
                            if (sourcePos.flipD) {
                                ctx.rotate(Math.PI / 2);
                                ctx.scale(1, -1);
                            }
                            
                            if (sourcePos.flipH) {
                                ctx.scale(-1, 1);
                            }
                            
                            if (sourcePos.flipV) {
                                ctx.scale(1, -1);
                            }
                            
                            ctx.translate(-this.tileSize / 2, -this.tileSize / 2);
                            
                            ctx.drawImage(
                                this.tilesheet,
                                sourcePos.x, sourcePos.y, this.tileSize, this.tileSize,
                                0, 0, this.tileSize, this.tileSize
                            );
                        } else {
                            ctx.drawImage(
                                this.tilesheet,
                                sourcePos.x, sourcePos.y, this.tileSize, this.tileSize,
                                destX, destY, this.tileSize, this.tileSize
                            );
                        }
                        
                        ctx.restore();
                    }
                }
            }
        }
    }

    getCollisionBoxes() {
        return this.collisionBoxes;
    }

    getPlayerSpawn() {
        return this.playerSpawn;
    }

    getVault() {
        return this.vault;
    }

    getCameras() {
        return this.cameras;
    }

    getLasers() {
        return this.lasers;
    }

    getMapSize() {
        return {
            width: this.width * this.tileSize,
            height: this.height * this.tileSize
        };
    }
}