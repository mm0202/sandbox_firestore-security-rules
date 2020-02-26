// エミュレータホストの指定。デフォルトポートの場合は不要。
process.env.FIRESTORE_EMULATOR_HOST = "localhost:58080";

import FirestoreEmulatorProvider from "../../lib/firestore/FirestoreEmulatorProvider";
import * as path from "path";
import * as firebase from "@firebase/testing";


describe("全て拒否設定", () => {
    const provider = new FirestoreEmulatorProvider("my-test-project", path.join(__dirname, "firestore.rules"));

    beforeEach(async () => {
        await provider.loadRules();
    });

    afterEach(async () => {
        // 使用したアプリの削除
        await Promise.all(firebase.apps().map(app => app.delete()))
    });

    describe('デフォルトでアクセス拒否の確認', () => {
        test('読み込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('認証付き読み込み拒否', async () => {
            const db = provider.getFirestoreWithAuth();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.get())
        });

        test('認証付き書き込み拒否', async () => {
            const db = provider.getFirestoreWithAuth();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });
});
