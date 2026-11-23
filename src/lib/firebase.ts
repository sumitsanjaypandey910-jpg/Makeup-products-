import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutFirebase() {
  return signOut(auth);
}

export async function ensureParlourInFirestore(
  parlour: {
    id: string;
    name: string;
    city: string;
    plan: 'Boutique' | 'Studio Pro' | 'Enterprise';
    phone: string;
    currency: string;
    taxRate: number;
  },
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  const parlourPath = `parlours/${parlour.id}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'parlours', parlour.id), {
      name: parlour.name.slice(0, 100),
      city: parlour.city.slice(0, 80),
      plan: parlour.plan,
      ownerUid: uid,
      memberUids: [uid],
      ownerEmail: email.slice(0, 160),
      phone: parlour.phone.slice(0, 32),
      currency: parlour.currency.slice(0, 8),
      taxRate: parlour.taxRate,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'parlours', parlour.id, 'members', uid), {
      uid,
      email: email.slice(0, 160),
      displayName: (displayName || email).slice(0, 100),
      role: 'owner',
      status: 'active',
      ownerUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, parlourPath);
  }
}

export async function syncRecordToFirestore(
  parlourId: string,
  subcollection: string,
  docId: string,
  payload: Record<string, unknown>,
  isCreate: boolean
): Promise<void> {
  const path = `parlours/${parlourId}/${subcollection}/${docId}`;
  try {
    if (isCreate) {
      await setDoc(doc(db, 'parlours', parlourId, subcollection, docId), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'parlours', parlourId, subcollection, docId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isCreate ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteRecordFromFirestore(
  parlourId: string,
  subcollection: string,
  docId: string
): Promise<void> {
  const path = `parlours/${parlourId}/${subcollection}/${docId}`;
  try {
    await deleteDoc(doc(db, 'parlours', parlourId, subcollection, docId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fetchUserParlours(uid: string) {
  const path = 'parlours';
  try {
    const q = query(collection(db, path), where('memberUids', 'array-contains', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}
