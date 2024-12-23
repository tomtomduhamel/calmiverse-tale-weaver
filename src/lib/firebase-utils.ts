import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  serverTimestamp,
  DocumentData,
  CollectionReference,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Child } from '@/types/child';

const CHILDREN_COLLECTION = 'children';

export const addChild = async (childData: Omit<Child, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, CHILDREN_COLLECTION), {
      ...childData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding child: ", error);
    throw error;
  }
};

export const updateChild = async (childId: string, data: Partial<Omit<Child, 'id'>>) => {
  try {
    const docRef = doc(db, CHILDREN_COLLECTION, childId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating child: ", error);
    throw error;
  }
};

export const deleteChild = async (childId: string) => {
  try {
    const docRef = doc(db, CHILDREN_COLLECTION, childId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting child: ", error);
    throw error;
  }
};

const convertTimestampToDate = (timestamp: Timestamp | null | undefined): Date | null => {
  if (!timestamp || !timestamp.toDate) {
    return null;
  }
  try {
    return timestamp.toDate();
  } catch {
    return null;
  }
};

export const getChildren = async (userId?: string): Promise<Child[]> => {
  try {
    const childrenRef = collection(db, CHILDREN_COLLECTION);
    const baseQuery = userId 
      ? query(childrenRef, where("userId", "==", userId))
      : childrenRef;

    const snapshot = await getDocs(baseQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Create a serializable plain object
      return {
        id: doc.id,
        name: String(data.name || ''),
        age: Number(data.age || 0),
        teddyName: String(data.teddyName || ''),
        teddyDescription: String(data.teddyDescription || ''),
        imaginaryWorld: String(data.imaginaryWorld || ''),
        userId: data.userId ? String(data.userId) : null,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt)
      };
    });
  } catch (error) {
    console.error("Error getting children: ", error);
    throw error;
  }
};