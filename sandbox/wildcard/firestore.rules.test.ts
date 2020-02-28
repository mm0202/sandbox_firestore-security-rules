process.env.FIRESTORE_EMULATOR_HOST = "localhost:58080";

import {FirestoreEmulatorClient} from "@mm0202/firestore-client";
import path from "path";
import * as firebase from "@firebase/testing";

describe("ワイルドカードチェック", () => {
    const client = new FirestoreEmulatorClient("my-test-project", path.join(__dirname, "firestore.rules"));

    beforeEach(async () => {
        await client.loadRules();
    });

    afterEach(async () => {
        // 使用したアプリの削除
        await client.cleanup()
    });

    describe('ワイルドカードの変数利用', () => {
        test('ワイルドカード変数が指定の文字列の場合に成功', async () => {
            const db = client.getFirestore();
            const doc = db.collection('sandbox').doc('success');
            await firebase.assertSucceeds(doc.get())
        });

        test('ワイルドカード変数が指定外の文字列の場合に失敗', async () => {
            const db = client.getFirestore();
            const doc = db.collection('sandbox').doc('fail');
            await firebase.assertFails(doc.get())
        });
    });
});
