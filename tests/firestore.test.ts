import * as firebase from '@firebase/testing';
import * as fs from 'fs';

const PROJECT_ID = 'qiita-demo';
const RULES_PATH = 'firestore.rules';

// 認証付きのFirestore Appを得る
const createAuthApp = (auth?: object): firebase.firestore.Firestore => {
  return firebase
    .initializeTestApp({
      projectId: PROJECT_ID,
      auth: auth
    })
    .firestore();
};

// 管理者権限で操作可能なFirestore Appを得る
const createAdminApp = (): firebase.firestore.Firestore => {
  return firebase
    .initializeAdminApp({
      projectId: PROJECT_ID
    })
    .firestore();
}

// user情報への参照を作る
const userRef = (db: firebase.firestore.Firestore) => db.collection('user');

describe('Firestoreセキュリティルール', () => {
  // ルールファイルの読み込み
  beforeAll(async () => {
    await firebase.loadFirestoreRules({
      projectId: PROJECT_ID,
      rules: fs.readFileSync(RULES_PATH, 'utf-8')
    });
  });

  // Firestoreデータのクリーンアップ
  afterEach(async () => {
    await firebase.clearFirestoreData({
      projectId: PROJECT_ID
    });
  });

  // 後始末: Firestoreアプリの削除
  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });
});
