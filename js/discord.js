// Discord Integration for Heist Game
// Load Discord SDK safely without blocking game

(function() {
    'use strict';
    
    let discordSdk = null;
    let isDiscordEnvironment = false;
    
    // Check if running in Discord environment
    function checkDiscordEnvironment() {
        try {
            isDiscordEnvironment = typeof window.discord !== 'undefined' || 
                                  window.location.search.includes('frame_id') ||
                                  window.parent !== window;
            console.log('Discord environment detected:', isDiscordEnvironment);
            return isDiscordEnvironment;
        } catch (error) {
            console.log('Not in Discord environment');
            return false;
        }
    }
    
    // Initialize Discord SDK
    async function initDiscordSDK() {
        if (!checkDiscordEnvironment()) {
            console.log('Skipping Discord SDK - not in Discord environment');
            return null;
        }
        
        try {
            // Load SDK using dynamic import (ES6 module)
            const module = await import('https://unpkg.com/@discord/embedded-app-sdk@1.1.0/output/index.mjs');
            const DiscordSDK = module.DiscordSDK;
            
            discordSdk = new DiscordSDK("1539281281110507582");
            console.log('Discord SDK initialized');
            
            await discordSdk.ready();
            console.log("Discord Activity ready!");
            
            try {
                const { code } = await discordSdk.commands.authorize({
                    client_id: "1539281281110507582",
                    response_type: "code",
                    state: "",
                    prompt: "none",
                    scope: ["identify", "guilds"]
                });
                console.log("User authorized");
            } catch (authError) {
                console.log("Authorization skipped:", authError.message);
            }
            
            return discordSdk;
        } catch (error) {
            console.error("Discord SDK error:", error);
            return null;
        }
    }
    
    // Set activity presence
    async function setActivityPresence(state) {
        if (!discordSdk) return;
        try {
            await discordSdk.commands.setActivity({
                state: state,
                details: "Đang trốn thoát",
                instance: true
            });
        } catch (error) {
            console.error("Presence error:", error);
        }
    }
    
    // Export to global scope
    window.DiscordIntegration = {
        init: initDiscordSDK,
        setPresence: setActivityPresence,
        isDiscordEnv: () => isDiscordEnvironment,
        getSdk: () => discordSdk
    };
    
    // Auto-init (non-blocking)
    if (checkDiscordEnvironment()) {
        console.log("Initializing Discord integration...");
        initDiscordSDK().then(sdk => {
            if (sdk) {
                console.log("Discord integration ready");
                setActivityPresence("Đang chuẩn bị trộm");
            }
        });
    }
})();