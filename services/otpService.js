const axios = require("axios");
const crypto = require("crypto");
const logger = require("../utils/logger");  // Assuming you have a logger utility

const TELEGRAM_BOT_TOKEN = "7972112717:AAEc99dO4JxnG_baIiIrUD-o-2Vpf9PxT20";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

const otps = new Map(); // Temporary storage for OTPs (replace with Redis for scalability)

exports.generateAndSendOtp = async (username, phoneNumber) => {
  try {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999); 
    otps.set(username, otp);

    // OTP expires in 5 minutes
    setTimeout(() => {
      otps.delete(username);
      logger.info(`OTP expired and deleted for username: ${username}`);
    }, 300000); // 5 minutes in ms

    logger.info(`OTP generated for username: ${username}: ${otp}`);

    // Send OTP to Telegram
    const apiUrl = "https://gatewayapi.telegram.org/sendVerificationMessage";
    const accessToken = 'AAHJCwAAHuwxWs1hHfx97aOpfRpAIVdx7i0y8uMpL89Zeg';  // Replace with your actual access token
    const checkSendAbilityUrl = "https://gatewayapi.telegram.org/checkSendAbility";

    const reqIdResponse = await axios.post(checkSendAbilityUrl, {
      phone_number: parseInt(phoneNumber), 
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log(reqIdResponse);

    const response = await axios.post(apiUrl, {
      phone_number: parseInt(phoneNumber),
      request_id : reqIdResponse.data.ok.request_id,
      code_length: 6,
      ttl: 600, // Time-to-live in seconds
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data.ok) {
      const requestId = response.data.result.request_id;
      logger.info(`OTP sent to Telegram user ${phoneNumber}`);
      return { requestId };  // Return the requestId for later verification
    } else {
      logger.error(`Failed to send OTP via Telegram: ${response.data.error}`);
      throw new Error(`Telegram OTP send error: ${response.data.error}`);
    }
  } catch (error) {
    logger.error(`Failed to generate and send OTP: ${error.message}`);
    throw new Error(`Failed to generate and send OTP ${error}`);
  }
};

// Verify OTP
exports.verifyOtp = async (requestId, otp) => {
  try {
    const apiUrl = "https://gatewayapi.telegram.org/checkVerificationStatus";
    const accessToken = 'AAHJCwAAHuwxWs1hHfx97aOpfRpAIVdx7i0y8uMpL89Zeg';  // Replace with your actual access token
    
    const response = await axios.post(apiUrl, {
      request_id: requestId,  // The request_id from the previous response
      code: otp,              // The code entered by the user
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.ok) {
      const status = response.data.result.verification_status.status;
      if (status === 'code_valid') {
        logger.info('OTP is valid');
        return true; // OTP is valid
      } else {
        logger.error('Invalid OTP');
        return false; // OTP is invalid
      }
    } else {
      logger.error(`Failed to verify OTP: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    logger.error(`Failed to verify OTP: ${error.message}`);
    return false;
  }
};
