// エミュレータホストの指定。デフォルトポートの場合は不要。
process.env.FIRESTORE_EMULATOR_HOST = "localhost:58080";

import {FirestoreEmulatorClient} from "@mm0202/firestore-client";
import path from "path";
import * as firebase from "@firebase/testing";

describe("全て拒否設定", () => {
    const client = new FirestoreEmulatorClient("my-test-project", path.join(__dirname, "firestore.rules"));

    beforeEach(async () => {
        await client.loadRules();
    });

    afterEach(async () => {
        // 使用したアプリの削除
        await client.cleanup()
    });

    describe('デフォルトでアクセス拒否の確認', () => {
        test('読み込み拒否', async () => {
            const db = client.getFirestore();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = client.getFirestore();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('認証付き読み込み拒否', async () => {
            const db = client.getFirestoreWithAuth();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.get())
        });

        test('認証付き書き込み拒否', async () => {
            const db = client.getFirestoreWithAuth();
            const doc = db.collection('default').doc('dummy');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });
});
