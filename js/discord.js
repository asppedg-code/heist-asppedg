// Discord Integration for Heist Game
// This file handles Discord SDK initialization and integration

let discordSdk = null;
let isDiscordEnvironment = false;

// Check if running in Discord environment
function checkDiscordEnvironment() {
    try {
        // Discord Embedded App SDK creates a specific global object
        isDiscordEnvironment = typeof window.discord !== 'undefined' || 
                              window.location.search.includes('frame_id') ||
                              window.parent !== window; // Check if in iframe
        console.log('Discord environment detected:', isDiscordEnvironment);
        return isDiscordEnvironment;
    } catch (error) {
        console.log('Not in Discord environment');
        return false;
    }
}

// Initialize Discord SDK
async function initDiscordSDK() {
    // Always try to initialize, even if not clearly in Discord environment
    // The SDK will handle the environment detection
    
    try {
        // Import Discord SDK dynamically
        const module = await import('https://unpkg.com/@discord/embedded-app-sdk@1.1.0/output/index.mjs');
        const DiscordSDK = module.DiscordSDK;
        
        // Initialize SDK with your Client ID
        discordSdk = new DiscordSDK("1539281281110507582");
        
        console.log('Discord SDK initialized');
        
        // Notify Discord that the app is ready
        await discordSdk.ready();
        console.log("Discord Activity đã khởi chạy thành công!");
        
        // Get user info (optional, for future features)
        try {
            const { code } = await discordSdk.commands.authorize({
                client_id: "1539281281110507582",
                response_type: "code",
                state: "",
                prompt: "none",
                scope: ["identify", "guilds"]
            });
            console.log("User authorized:", code);
        } catch (authError) {
            console.log("Authorization skipped or failed:", authError.message);
            // This is normal in some cases, continue anyway
        }
        
        isDiscordEnvironment = true;
        return discordSdk;
    } catch (error) {
        console.error("Failed to initialize Discord SDK:", error);
        console.log("Game will continue without Discord integration");
        return null;
    }
}

// Set activity presence (optional)
async function setActivityPresence(state = "Đang chơi Heist Game") {
    if (!discordSdk) return;
    
    try {
        await discordSdk.commands.setActivity({
            state: state,
            details: "Đang cố gắng trốn thoát",
            instance: true
        });
    } catch (error) {
        console.error("Failed to set activity presence:", error);
    }
}

// Export functions for use in main game
window.DiscordIntegration = {
    init: initDiscordSDK,
    setPresence: setActivityPresence,
    isDiscordEnv: () => isDiscordEnvironment,
    getSdk: () => discordSdk
};

// Auto-initialize when script loads
console.log("Loading Discord integration...");
initDiscordSDK().then(sdk => {
    if (sdk) {
        console.log("Discord integration ready");
        // Set initial presence
        setActivityPresence("Đang chuẩn bị trộm");
    } else {
        console.log("Discord integration not available, game will work normally");
    }
});