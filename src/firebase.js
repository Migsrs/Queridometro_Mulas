import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB0AnuLYvxsROdyBY-pr2OMStI7b425rcc',
  authDomain: 'queridometro-mulas.firebaseapp.com',
  projectId: 'queridometro-mulas',
  storageBucket: 'queridometro-mulas.firebasestorage.app',
  messagingSenderId: '190360423225',
  appId: '1:190360423225:web:b29f26c8cb21a2f3cf36e8',
  measurementId: 'G-2ZMZ38WCT6',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
