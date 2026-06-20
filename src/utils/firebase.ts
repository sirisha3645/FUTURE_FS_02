import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true }); /* CRITICAL: Handles standard default databases with robust long-polling */
export const auth = getAuth();
export const storage = getStorage(app);

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration (network connection offline).");
    } else {
      console.error("Firestore connection failed:", error);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
          })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message) as FirestoreErrorInfo;
      if (parsed && typeof parsed === 'object' && parsed.error) {
        const rawError = parsed.error.toLowerCase();
        if (rawError.includes('permission') || rawError.includes('missing-permission') || rawError.includes('insufficient permissions') || rawError.includes('unauthorized')) {
          return 'Access Denied: You do not have permission to perform this action. Your session could have expired or your profile does not match the required administrative rank.';
        }
        if (rawError.includes('not-found') || rawError.includes('not found')) {
          return 'Record Not Found: The requested database entry could not be located.';
        }
        if (rawError.includes('invalid data') || rawError.includes('unsupported field value')) {
          return 'Validation / Database Error: The data could not be saved because some of the updated properties contain invalid formats or unsupported values.';
        }
        return parsed.error;
      }
    } catch {
      // Fallback below
    }
    const msg = err.message;
    if (msg.includes('storage/unauthorized')) {
      return 'Storage Access Blocked: Upload could not be completed on primary storage due to unauthorized access. Small files are automatically saved via DB fallback.';
    }
    if (msg.includes('Not authenticated')) {
      return 'Session Expired: You are not authenticated. Please log in again to continue.';
    }
    return msg;
  }
  return String(err);
}
