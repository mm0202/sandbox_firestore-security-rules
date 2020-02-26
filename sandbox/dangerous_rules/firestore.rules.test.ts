// エミュレータホストの指定。デフォルトポートの場合は不要。
process.env.FIRESTORE_EMULATOR_HOST = "localhost:58080";

import FirestoreEmulatorProvider from "../../lib/firestore/FirestoreEmulatorProvider";
import * as path from "path";
import * as firebase from "@firebase/testing";

describe("危険なルールチェック", () => {
    const provider = new FirestoreEmulatorProvider("my-test-project", path.join(__dirname, "firestore.rules"));

    beforeEach(async () => {
        await provider.loadRules();
    });

    afterEach(async () => {
        // 使用したアプリの削除
        await provider.cleanup();
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

    describe('危険なブログ記事のルールチェック', () => {
        test('読み込み許可', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('articles1').doc('article');
            await firebase.assertSucceeds(doc.get())
        });

        test('書き込み許可', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('articles1').doc('article');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('安全なブログ記事のルールチェック', () => {
        test('読み込み許可', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('articles2').doc('article');
            await firebase.assertSucceeds(doc.get())
        });

        test('認証されていないユーザの書き込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('articles2').doc('article');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('認証されたユーザの書き込み許可', async () => {
            const db = provider.getFirestoreWithAuth();
            const doc = db.collection('articles2').doc('article');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('危険なユーザ情報のルールチェック', () => {
        test('認証されていないユーザの読み込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('users1').doc('user');
            await firebase.assertFails(doc.get())
        });

        test('認証されたユーザの読み込み許可', async () => {
            const db = provider.getFirestoreWithAuth();
            const doc = db.collection('users1').doc('user');
            await firebase.assertSucceeds(doc.get())
        });

        test('認証されていないユーザの書き込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('users1').doc('user');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('認証されたユーザの書き込み許可', async () => {
            const db = provider.getFirestoreWithAuth();
            const doc = db.collection('users1').doc('user');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('安全なユーザ情報のルールチェック', () => {
        test('ユーザ本人以外の読み込み拒否', async () => {
            const db = provider.getFirestoreWithAuth("dummy");
            const doc = db.collection('users2').doc('user');
            await firebase.assertFails(doc.get())
        });

        test('ユーザ本人の読み込み許可', async () => {
            const db = provider.getFirestoreWithAuth("user");
            const doc = db.collection('users2').doc('user');
            await firebase.assertSucceeds(doc.get())
        });

        test('ユーザ本人以外の書き込み拒否', async () => {
            const db = provider.getFirestoreWithAuth("dummy");
            const doc = db.collection('users2').doc('user');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('ユーザ本人の書き込み許可', async () => {
            const db = provider.getFirestoreWithAuth("user");
            const doc = db.collection('users2').doc('user');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('危険なサーバプログラムのログのルールチェック', () => {
        test('読み込み許可', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('server_logs1').doc('log');
            await firebase.assertSucceeds(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('server_logs1').doc('log');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });

    describe('安全なサーバプログラムのログのルールチェック', () => {
        test('読み込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('server_logs2').doc('log');
            await firebase.assertFails(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = provider.getFirestore();
            const doc = db.collection('server_logs2').doc('log');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });
});
