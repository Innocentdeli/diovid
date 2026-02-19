require('dotenv').config({ path: '.env.local' });
const { generateSceneBackground } = require('./src/app/actions/generateImage');
const { generateSceneVideo } = require('./src/app/actions/generateVideo');

async function debug() {
    console.log("--- DEBUGGING ACTING ENGINE ---");

    try {
        console.log("1. Testing Nano Banana (Image)...");
        const img = await generateSceneBackground("A futuristic director holding a camera, realistic face, cinematic lighting");
        if (img && img.startsWith('data:image')) {
            console.log("✅ Image Generation Success");
        } else {
            console.log("❌ Image Generation Failed/Fallback used:", img.substring(0, 100));
        }

        console.log("\n2. Testing Veo 3.1 (Video)...");
        const vid = await generateSceneVideo("The director nods slowly", img);
        if (vid && vid.startsWith('data:video')) {
            console.log("✅ Video Generation Success");
        } else {
            console.log("❌ Video Generation Failed:", vid);
        }

    } catch (err) {
        console.error("CRITICAL ERROR DURING TEST:", err);
    }
}

debug();
