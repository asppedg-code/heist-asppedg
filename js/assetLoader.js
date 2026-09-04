class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    loadJSON(src) {
        return new Promise((resolve, reject) => {
            fetch(src)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load JSON: ${src}`);
                    }
                    return response.json();
                })
                .then(data => resolve(data))
                .catch(error => reject(error));
        });
    }

    async loadAssets(assets) {
        this.totalCount = Object.keys(assets).length;
        this.loadedCount = 0;

        const loadPromises = Object.entries(assets).map(async ([name, src]) => {
            try {
                if (src.endsWith('.json')) {
                    this.assets[name] = await this.loadJSON(src);
                } else {
                    this.assets[name] = await this.loadImage(src);
                }
                this.loadedCount++;
                console.log(`Loaded: ${name}`);
            } catch (error) {
                console.error(`Error loading ${name}:`, error);
                throw error;
            }
        });

        await Promise.all(loadPromises);
        return this.assets;
    }

    get(name) {
        return this.assets[name];
    }

    isLoaded() {
        return this.loadedCount === this.totalCount;
    }

    getProgress() {
        return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
    }
}