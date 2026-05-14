import { DBState, Lancamento, Meta, Investimento, Carteira, ShoppingItem, GastoFixo, UserProfile, UserProfileData } from '../types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocFromServer,
  writeBatch,
  getDoc
} from 'firebase/firestore';

enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperationType;
  path: string | null;
  passedUserId?: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: FirestoreOperationType, path: string | null, passedUserId?: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    passedUserId,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // Connection stability check
  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  },

  // Firestore Listeners
  subscribeCarteiras(userId: string, callback: (data: Carteira[]) => void) {
    if (!userId) return () => {};
    const q = query(collection(db, 'carteiras'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Carteira));
      callback(data);
    }, (error) => handleFirestoreError(error, FirestoreOperationType.LIST, 'carteiras', userId));
  },

  subscribeLancamentos(userId: string, carteiraId: string, callback: (data: Lancamento[]) => void) {
    if (!userId || !carteiraId) return () => {};
    const q = query(
      collection(db, 'lancamentos'), 
      where('userId', '==', userId),
      where('carteiraId', '==', carteiraId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Lancamento));
      callback(data);
    }, (error) => handleFirestoreError(error, FirestoreOperationType.LIST, 'lancamentos', userId));
  },

  subscribeMetas(userId: string, carteiraId: string, callback: (data: Meta[]) => void) {
    if (!userId || !carteiraId) return () => {};
    const q = query(
      collection(db, 'metas'), 
      where('userId', '==', userId),
      where('carteiraId', '==', carteiraId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Meta));
      callback(data);
    }, (error) => handleFirestoreError(error, FirestoreOperationType.LIST, 'metas', userId));
  },

  subscribeInvestimentos(userId: string, carteiraId: string, callback: (data: Investimento[]) => void) {
    if (!userId || !carteiraId) return () => {};
    const q = query(
      collection(db, 'investimentos'), 
      where('userId', '==', userId),
      where('carteiraId', '==', carteiraId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Investimento));
      callback(data);
    }, (error) => handleFirestoreError(error, FirestoreOperationType.LIST, 'investimentos', userId));
  },

  subscribeShoppingItems(userId: string, callback: (data: ShoppingItem[]) => void) {
    if (!userId) return () => {};
    const q = query(collection(db, 'shoppingItems'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ShoppingItem));
      callback(data);
    }, (error) => handleFirestoreError(error, FirestoreOperationType.LIST, 'shoppingItems', userId));
  },

  subscribeGastosFixos(userId: string, callback: (data: GastoFixo[]) => void) {
    if (!userId) return () => {};
    const q = query(collection(db, 'gastosFixos'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as GastoFixo));
      callback(data);
    }, (error) => handleFirestoreError(error, FirestoreOperationType.LIST, 'gastosFixos', userId));
  },

  subscribeUserProfile(userId: string, callback: (data: UserProfile | null) => void) {
    if (!userId) return () => {};
    const ref = doc(db, 'userProfiles', userId);
    return onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => handleFirestoreError(error, FirestoreOperationType.GET, 'userProfiles', userId));
  },

  async saveUserProfile(userId: string, data: UserProfileData) {
    try {
      const ref = doc(db, 'userProfiles', userId);
      await setDoc(ref, { ...data, userId }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'userProfiles', userId);
    }
  },

  async saveCarteira(carteira: Carteira, userId: string) {
    try {
      const ref = doc(collection(db, 'carteiras'), carteira.id);
      await setDoc(ref, { ...carteira, userId });
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'carteiras', userId);
    }
  },

  async deleteCarteira(id: string) {
    try {
      await deleteDoc(doc(db, 'carteiras', id));
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.DELETE, 'carteiras');
    }
  },

  async saveLancamento(lanc: Lancamento, userId: string) {
    try {
      const ref = doc(collection(db, 'lancamentos'), lanc.id);
      await setDoc(ref, { ...lanc, userId });
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'lancamentos', userId);
    }
  },

  async saveLancamentoBatch(lancamentos: Lancamento[], userId: string) {
    try {
      const batch = writeBatch(db);
      lancamentos.forEach(l => {
        const ref = doc(collection(db, 'lancamentos'), l.id);
        batch.set(ref, { ...l, userId });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'lancamentos_batch', userId);
    }
  },

  async deleteLancamento(id: string) {
    try {
      await deleteDoc(doc(db, 'lancamentos', id));
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.DELETE, 'lancamentos');
    }
  },

  async saveMeta(meta: Meta, userId: string) {
    try {
      const ref = doc(collection(db, 'metas'), meta.id);
      await setDoc(ref, { ...meta, userId });
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'metas', userId);
    }
  },

  async deleteMeta(id: string) {
    try {
      await deleteDoc(doc(db, 'metas', id));
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.DELETE, 'metas');
    }
  },

  async saveInvestimento(inv: Investimento, userId: string) {
    try {
      const ref = doc(collection(db, 'investimentos'), inv.id);
      await setDoc(ref, { ...inv, userId });
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'investimentos', userId);
    }
  },

  async deleteInvestimento(id: string) {
    try {
      await deleteDoc(doc(db, 'investimentos', id));
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.DELETE, 'investimentos');
    }
  },

  async saveShoppingItem(item: ShoppingItem, userId: string) {
    try {
      const ref = doc(collection(db, 'shoppingItems'), item.id);
      await setDoc(ref, { ...item, userId });
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'shoppingItems', userId);
    }
  },

  async deleteShoppingItem(id: string) {
    try {
      await deleteDoc(doc(db, 'shoppingItems', id));
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.DELETE, 'shoppingItems');
    }
  },

  async saveGastoFixo(gasto: GastoFixo, userId: string) {
    try {
      const ref = doc(collection(db, 'gastosFixos'), gasto.id);
      await setDoc(ref, { ...gasto, userId });
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, 'gastosFixos', userId);
    }
  },

  async deleteGastoFixo(id: string) {
    try {
      await deleteDoc(doc(db, 'gastosFixos', id));
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.DELETE, 'gastosFixos');
    }
  },

  formatCurrency(value: number): string {
    return 'R$ ' + parseFloat(String(value || 0)).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  formatDate(date: string): string {
    if (!date) return '-';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  },

  getMonthKey(date: string): string {
    return date ? date.slice(0, 7) : '';
  },

  getToday(): string {
    return new Date().toISOString().slice(0, 10);
  },

  getCurrentMonth(): string {
    return this.getToday().slice(0, 7);
  },

  getTotais(lancamentos: Lancamento[], month: string | null = null) {
    const ls = month ? lancamentos.filter(l => this.getMonthKey(l.data) === month) : lancamentos;
    let rec = 0, desp = 0, inv = 0;
    ls.forEach(l => {
      if (l.tipo === 'receita') rec += l.valor;
      else if (l.tipo === 'despesa') desp += l.valor;
      else inv += l.valor;
    });
    return { rec, desp, inv, saldo: rec - desp };
  }
};
