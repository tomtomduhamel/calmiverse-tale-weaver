import { db } from './firebase';
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
  Timestamp
} from 'firebase/firestore';
import type { Child } from '@/types/child';

// Collection references
const CHILDREN_COLLECTION = 'children';

// Children CRUD operations
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

export const getChildren = async (userId?: string) => {
  try {
    let q = collection(db, CHILDREN_COLLECTION);
    if (userId) {
      q = query(collection(db, CHILDREN_COLLECTION), where("userId", "==", userId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Child[];
  } catch (error) {
    console.error("Error getting children: ", error);
    throw error;
  }
};