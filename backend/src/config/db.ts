import mongoose from 'mongoose';

/**
 * Safely parses and normalizes MongoDB URIs where the password may contain
 * unescaped special characters like '@' (e.g., 'password@123' -> 'password%40123')
 */
const sanitizeMongoUri = (rawUri: string): string => {
  if (!rawUri.includes('://')) return rawUri;

  try {
    const [protocol, rest] = rawUri.split('://');
    const lastAtIndex = rest.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const userinfo = rest.substring(0, lastAtIndex);
      const hostAndDb = rest.substring(lastAtIndex + 1);
      const colonIndex = userinfo.indexOf(':');
      if (colonIndex !== -1) {
        const username = userinfo.substring(0, colonIndex);
        const rawPassword = userinfo.substring(colonIndex + 1);
        const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
        return `${protocol}://${username}:${encodedPassword}@${hostAndDb}`;
      }
    }
  } catch (err) {
    // Return original if formatting fails
  }

  return rawUri;
};

export const connectDB = async (): Promise<void> => {
  const rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/upi_tracker';
  const uri = sanitizeMongoUri(rawUri);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.error('❌ MongoDB Connection Error:', error.message || error);
    console.error('👉 TIP: If your MongoDB password has special characters like "@", they must be URL-encoded (e.g. "@" -> "%40").');
    process.exit(1);
  }
};
