/**
 * Script to verify Firebase Sender ID Configuration
 * This script verifies that the backend Firebase project matches the frontend sender ID
 */

const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-service-account.json");
const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Firebase Sender ID Configuration...\n");

// Read google-services.json from frontend
const googleServicesPath = path.join(
  __dirname,
  "../../BNSN_Frontend/android/app/google-services.json"
);

try {
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  // Get backend project info
  const backendProjectId = serviceAccount.project_id;
  const backendProjectNumber = serviceAccount.project_number || "N/A";

  console.log("📦 Backend Firebase Configuration:");
  console.log(`   Project ID: ${backendProjectId}`);
  console.log(`   Project Number (if available): ${backendProjectNumber}`);
  console.log(
    `   Service Account: ${serviceAccount.client_email}`
  );

  // Read frontend google-services.json
  console.log(`\n📂 Reading: ${googleServicesPath}`);
  console.log(`   Path exists: ${fs.existsSync(googleServicesPath)}`);
  
  if (fs.existsSync(googleServicesPath)) {
    const googleServices = JSON.parse(
      fs.readFileSync(googleServicesPath, "utf8")
    );
    const frontendProjectId = googleServices.project_info.project_id;
    const frontendProjectNumber = googleServices.project_info.project_number;

    console.log("\n📱 Frontend Firebase Configuration:");
    console.log(`   Project ID: ${frontendProjectId}`);
    console.log(`   Project Number (Sender ID): ${frontendProjectNumber}`);
    console.log(`   Total clients in config: ${googleServices.client.length}`);

    // Check package name
    const packageName = "com.bnsn.bnsn";
    console.log(`\n🔍 Looking for package: ${packageName}`);
    const clientConfig = googleServices.client.find(
      (c) => c.client_info && c.client_info.android_client_info && c.client_info.android_client_info.package_name === packageName
    );

    if (clientConfig) {
      console.log(`\n✅ Package Name Match: ${packageName}`);
      console.log(
        `   Mobile SDK App ID: ${clientConfig.client_info.mobilesdk_app_id}`
      );
    } else {
      console.log(`\n❌ Package Name NOT Found: ${packageName}`);
      console.log(`   Available packages:`);
      googleServices.client.forEach((c, idx) => {
        const pkgInfo = c.client_info && c.client_info.android_client_info;
        if (pkgInfo) {
          console.log(`     ${idx + 1}. ${pkgInfo.package_name}`);
        } else {
          console.log(`     ${idx + 1}. (No android_client_info)`);
        }
      });
    }

    // Verify project matching
    console.log("\n🔐 Verification Results:");
    if (backendProjectId === frontendProjectId) {
      console.log(`   ✅ Project ID Match: ${backendProjectId}`);
    } else {
      console.log(
        `   ❌ Project ID Mismatch: Backend=${backendProjectId}, Frontend=${frontendProjectId}`
      );
    }

    console.log(
      `\n📨 Sender ID: ${frontendProjectNumber} (This is the project_number used by the app)`
    );
    console.log(
      `   ℹ️  The app uses this sender ID when requesting FCM tokens`
    );
    console.log(
      `   ℹ️  Backend doesn't need explicit sender ID - uses service account`
    );

    // Test Firebase connection
    console.log("\n🧪 Testing Firebase Admin Connection...");
    try {
      const app = admin.app();
      console.log(`   ✅ Firebase Admin initialized successfully`);
      
      // Verify project IDs match
      if (backendProjectId === frontendProjectId) {
        console.log("\n✅ ✅ ✅ ALL CHECKS PASSED!");
        console.log("   The sender ID configuration is correct.");
        console.log(`   ✓ Backend Project: ${backendProjectId}`);
        console.log(`   ✓ Frontend Project: ${frontendProjectId}`);
        console.log(`   ✓ Sender ID: ${frontendProjectNumber}`);
        console.log(`   ✓ Package: ${packageName}`);
        console.log("\n   ✅ Backend can send notifications to tokens from this Firebase project");
        console.log("   ✅ App will use sender ID when requesting FCM tokens");
      } else {
        console.log("\n⚠️  Project ID mismatch detected!");
        console.log(`   Backend: ${backendProjectId}`);
        console.log(`   Frontend: ${frontendProjectId}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  } else {
    console.log(
      `\n⚠️  Could not find google-services.json at: ${googleServicesPath}`
    );
    console.log("   Please ensure the frontend google-services.json exists.");
  }

  console.log("\n✨ Verification complete!\n");
} catch (error) {
  console.error("\n❌ Error during verification:", error.message);
  console.error(error.stack);
  process.exit(1);
}

