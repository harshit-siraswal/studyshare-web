import AgoraRTC from 'agora-rtc-sdk-ng';

// Agora Configuration
export const AGORA_CONFIG = {
  appId: 'c09c0ffe323241adb34572cd0b83c1ef',
  primaryCertificate: '8bca4a44ed894bf5a40e8a0339e1d3f2',
  projectName: 'Studyspace',
};

// Agora RTC Client instance
let rtcClient: AgoraRTC.IAgoraRTCClient | null = null;

// Initialize Agora RTC Client
export const initializeAgoraClient = () => {
  if (!rtcClient) {
    rtcClient = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8' 
    });
  }
  return rtcClient;
};

// Get RTC Client
export const getRTCClient = () => {
  if (!rtcClient) {
    return initializeAgoraClient();
  }
  return rtcClient;
};

// Join channel
export const joinChannel = async (
  channelName: string,
  uid: string | number,
  token?: string
): Promise<void> => {
  const client = getRTCClient();
  
  try {
    await client.join(
      AGORA_CONFIG.appId,
      channelName,
      token || null,
      uid
    );
    console.log('Successfully joined channel:', channelName);
  } catch (error) {
    console.error('Error joining channel:', error);
    throw error;
  }
};

// Leave channel
export const leaveChannel = async (): Promise<void> => {
  if (rtcClient) {
    try {
      await rtcClient.leave();
      console.log('Successfully left channel');
    } catch (error) {
      console.error('Error leaving channel:', error);
      throw error;
    }
  }
};

// Cleanup
export const cleanupAgora = async () => {
  await leaveChannel();
  rtcClient = null;
};

// Generate token (for production, this should be done server-side)
// For now, we'll use tokenless mode which works for development
export const generateToken = async (
  channelName: string,
  uid: string | number
): Promise<string | null> => {
  // In production, call your backend API to generate token
  // For development, return null to use tokenless mode
  return null;
};




