import * as firebase from '@firebase/rules-unit-testing';
import * as fs from 'fs';

const PROJECT_ID = 'qiita-demo';
const RULES_PATH = 'firestore.rules';

// ユーザ用Firestore
const createClientFirestore = ((uid: string) => {
  return firebase.initializeTestApp({
    projectId: PROJECT_ID,
    auth: {
      uid: uid
    }
  }).firestore();
});

// 管理者用Firestore
const createAdminFirestore = (() => {
  return firebase.initializeAdminApp({
    projectId: PROJECT_ID
  }).firestore();
});


const correctUserData = {
  name: 'suzuki taro',
  gender: 'male',
  age: 30
};

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

describe('ユーザ認証情報の検証', () => {
  test('自分のuidと等しいIDを持つユーザ情報だけをCRUD可能であること', async () => {
    // taroで認証を持つDBを作成
    const db = createClientFirestore('taro');

    // taroでusersコレクションへの参照を取得
    const userDocumentRef = db.collection('users').doc('taro');
    
    // 自分のuidと等しいIDを持つユーザ情報を追加可能であること
    await firebase.assertSucceeds(userDocumentRef.set(correctUserData));

    // 自分のuidと等しいIDを持つユーザ情報を閲覧可能であること
    await firebase.assertSucceeds(userDocumentRef.get());

    // 自分のuidと等しいIDを持つユーザ情報を編集可能であること
    await firebase.assertSucceeds(
      userDocumentRef.update({
        name: 'suzuki "DA MADAFAKA" taro'
      })
    );

    // 自分のuidと等しいIDを持つユーザ情報を削除可能であること
    await firebase.assertSucceeds(userDocumentRef.delete());
  });

  test('自分のuidと異なるIDを持つユーザ情報はCRUD不可能であること', async () => {
    // 事前にadmin権限で別ユーザデータを準備
    createAdminFirestore()
      .collection('users')
      .doc('taro')
      .set(correctUserData);

    // hanakoで認証を持つDBを作成
    const db = createClientFirestore('hanako');

    // taroでusersコレクションへの参照を取得
    const userDocumentRef = db.collection('users').doc('taro');

    // 自分のuidと異なるIDを持つユーザ情報は追加不可能であること
    await firebase.assertFails(userDocumentRef.set(correctUserData));

    // 自分のuidと異なるIDを持つユーザ情報は閲覧不可能であること
    await firebase.assertFails(userDocumentRef.get());

    // 自分のuidと異なるIDを持つユーザ情報は編集不可能であること
    await firebase.assertFails(
      userDocumentRef.update({
        name: 'suzuki "DA MADAFAKA" taro'
      })
    );

    // 自分のuidと異なるIDを持つユーザ情報は削除不可能であること
    await firebase.assertFails(userDocumentRef.delete());
  });
});

describe('スキーマの検証', () => {
  test('正しくないスキーマの場合は作成できないこと', async () => {
    const db = createClientFirestore('taro');

    const userDocumentRef = db.collection('users').doc('taro');

    // 想定外のプロパティ(ここでは`place`)がある場合はエラーとなること
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, place: 'Japan'
      })
    );

    // プロパティの型が異なる場合はエラーとなること
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, name: 1234
      })
    );
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, gender: true
      })
    );
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, age: '1'
      })
    );
  });

  test('正しくないスキーマの場合は編集できないこと', async () => {
    createAdminFirestore()
      .collection('users')
      .doc('taro')
      .set(correctUserData);

    const db = createClientFirestore('taro');

    const userDocumentRef = db.collection('users').doc('taro');

    // 想定外のプロパティ(ここでは`place`)がある場合はエラーとなること
    await firebase.assertFails(userDocumentRef.update({
      place: 'Japan'
    }));

    // プロパティの型が異なる場合はエラーとなること
    await firebase.assertFails(userDocumentRef.update({
      name: 1234
    }));
    await firebase.assertFails(userDocumentRef.update({
      gender: true
    }));
    await firebase.assertFails(userDocumentRef.update({
      age: '1'
    }));
  });
});

describe('値のバリデーション', () => {
  test('`name`は1文字以上30文字以内であること', async () => {
    const db = createClientFirestore('taro');

    const userDocumentRef = db.collection('users').doc('taro');

    // 正しい値ではデータを作成できること
    await firebase.assertSucceeds(
      userDocumentRef.set({
        ...correctUserData, name: 'a'.repeat(30)
      })
    );

    // 正しくない値ではデータを作成できないこと
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, name: ''
      })
    );
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, name: 'a'.repeat(31)
      })
    );
  });

  test('`gender`は`male`, `female`, `genderDiverse`の3種類だけであること', async () => {
    const db = createClientFirestore('taro');

    const userDocumentRef = db.collection('users').doc('taro');

    // 正しい値ではデータを作成できること
    await firebase.assertSucceeds(
      userDocumentRef.set({
        ...correctUserData, gender: 'male'
      })
    );
    await firebase.assertSucceeds(
      userDocumentRef.set({
        ...correctUserData, gender: 'female'
      })
    );
    await firebase.assertSucceeds(
      userDocumentRef.set({
        ...correctUserData, gender: 'genderDiverse'
      })
    );

    // 正しくない値ではデータを作成できないこと
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, gender: ''
      })
    );
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, gender: '男性'
      })
    );
  });

  test('`age`は0以上150以下の数値であること', async () => {
    const db = createClientFirestore('taro');

    const userDocumentRef = db.collection('users').doc('taro');

    // 正しい値ではデータを作成できること
    await firebase.assertSucceeds(
      userDocumentRef.set({
        ...correctUserData, age: 0
      })
    );
    await firebase.assertSucceeds(
      userDocumentRef.set({
        ...correctUserData, age: 150
      })
    );

    // 正しくない値ではデータを作成できないこと
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, age: -1
      })
    );
    await firebase.assertFails(
      userDocumentRef.set({
        ...correctUserData, age: 151
      })
    );
  });
});
