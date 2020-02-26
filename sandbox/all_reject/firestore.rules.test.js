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
function getFirestoreWithAuth() {
    const app = firebase.initializeTestApp({
        projectId: "my-test-project",
        auth: {uid: "test_user", email: "test_user@example.com"}
    });

    return app.firestore();
}

describe("全て拒否設定", () => {
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
});
