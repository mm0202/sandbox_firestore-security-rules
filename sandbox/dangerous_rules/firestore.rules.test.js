// エミュレータホストの指定。デフォルトポートの場合は不要。
process.env.FIRESTORE_EMULATOR_HOST = "localhost:58080";

const fs = require("fs");
const firebase = require("@firebase/testing");
const path = require("path");

// 認証なしFirestoreクライアントの取得
function getFirestore() {
    const app = firebase.initializeTestApp({
        projectId: "my-test-project"
    });

    return app.firestore();
}

// 認証付きFirestoreクライアントの取得
function getFirestoreWithAuth(uid = "test_user") {
    const app = firebase.initializeTestApp({
        projectId: "my-test-project",
        auth: {uid: uid, email: "test_user@example.com"}
    });

    return app.firestore();
}

describe("危険なルールチェック", () => {
    beforeEach(async () => {
        // セキュリティルールの読み込み
        await firebase.loadFirestoreRules({
            projectId: "my-test-project",
            rules: fs.readFileSync(path.join(__dirname, "firestore.rules"), "utf8")
        });
    });

    afterEach(async () => {
        // 使用したアプリの削除
        await Promise.all(firebase.apps().map(app => app.delete()))
    });

    describe('デフォルトでアクセス拒否の確認', () => {
        test('読み込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('認証付き読み込み拒否', async () => {
            const db = getFirestoreWithAuth();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.get())
        });

        test('認証付き書き込み拒否', async () => {
            const db = getFirestoreWithAuth();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });

    describe('危険なブログ記事のルールチェック', () => {
        test('読み込み許可', async () => {
            const db = getFirestore();
            const doc = db.collection('articles1').doc('article');
            await firebase.assertSucceeds(doc.get())
        });

        test('書き込み許可', async () => {
            const db = getFirestore();
            const doc = db.collection('articles1').doc('article');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('安全なブログ記事のルールチェック', () => {
        test('読み込み許可', async () => {
            const db = getFirestore();
            const doc = db.collection('articles2').doc('article');
            await firebase.assertSucceeds(doc.get())
        });

        test('認証されていないユーザの書き込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('articles2').doc('article');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('認証されたユーザの書き込み許可', async () => {
            const db = getFirestoreWithAuth();
            const doc = db.collection('articles2').doc('article');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('危険なユーザ情報のルールチェック', () => {
        test('認証されていないユーザの読み込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('users1').doc('user');
            await firebase.assertFails(doc.get())
        });

        test('認証されたユーザの読み込み許可', async () => {
            const db = getFirestoreWithAuth();
            const doc = db.collection('users1').doc('user');
            await firebase.assertSucceeds(doc.get())
        });

        test('認証されていないユーザの書き込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('users1').doc('user');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('認証されたユーザの書き込み許可', async () => {
            const db = getFirestoreWithAuth();
            const doc = db.collection('users1').doc('user');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('安全なユーザ情報のルールチェック', () => {
        test('ユーザ本人以外の読み込み拒否', async () => {
            const db = getFirestoreWithAuth("dummy");
            const doc = db.collection('users2').doc('user');
            await firebase.assertFails(doc.get())
        });

        test('ユーザ本人の読み込み許可', async () => {
            const db = getFirestoreWithAuth("user");
            const doc = db.collection('users2').doc('user');
            await firebase.assertSucceeds(doc.get())
        });

        test('ユーザ本人以外の書き込み拒否', async () => {
            const db = getFirestoreWithAuth("dummy");
            const doc = db.collection('users2').doc('user');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('ユーザ本人の書き込み許可', async () => {
            const db = getFirestoreWithAuth("user");
            const doc = db.collection('users2').doc('user');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('危険なサーバプログラムのログのルールチェック', () => {
        test('読み込み許可', async () => {
            const db = getFirestore();
            const doc = db.collection('server_logs1').doc('log');
            await firebase.assertSucceeds(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('server_logs1').doc('log');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });

    describe('安全なサーバプログラムのログのルールチェック', () => {
        test('読み込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('server_logs2').doc('log');
            await firebase.assertFails(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = getFirestore();
            const doc = db.collection('server_logs2').doc('log');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });
});
