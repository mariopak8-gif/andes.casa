/**
 * Admin Credentials Configuration
 * 
 * Configure admin access using username and secret keys
 * Add your admin users here with credentials
 */

export interface AdminCredential {
  username: string;
  secretKey: string;
  email: string;
  role: string;
  description: string;
  active: boolean;
}

export const ADMIN_CREDENTIALS: AdminCredential[] = [
  {
    username: process.env.ADMIN_USERNAME!,
    secretKey: process.env.SUPER_SCREET_KEY!,
    email: 'admin@andes.com',
    role: process.env.ADMIN_USERNAME!,
    description: 'Super Administrator',
    active: true,
  },
  {
    username: 'admin',
    secretKey: 'admin-secret-key-456',
    email: 'admin@andes.com',
    role: 'admin',
    description: 'Administrator',
    active: true,
  },
  // ADD YOUR ADMIN CREDENTIALS HERE:
  // {
  //   username: 'your-username',
  //   secretKey: 'your-secret-key',
  //   email: 'your-email@example.com',
  //   role: 'admin',
  //   description: 'Your Admin Account',
  //   active: true,
  // },
];

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(
  username: string,
  secretKey: string
): AdminCredential | null {
  const admin = ADMIN_CREDENTIALS.find(
    (cred) =>
      cred.username === username &&
      cred.secretKey === secretKey &&
      cred.active
  );

  return admin || null;
}

/**
 * Get admin by username
 */
export function getAdminByUsername(username: string): AdminCredential | null {
  return ADMIN_CREDENTIALS.find((cred) => cred.username === username) || null;
}

/**
 * Check if credentials are valid
 */
export function isValidAdminCredential(username: string, secretKey: string): boolean {
  return verifyAdminCredentials(username, secretKey) !== null;
}

/**
 * Get all active admins
 */
export function getActiveAdmins(): AdminCredential[] {
  return ADMIN_CREDENTIALS.filter((cred) => cred.active);
}
