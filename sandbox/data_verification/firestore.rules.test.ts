process.env.FIRESTORE_EMULATOR_HOST = "localhost:58080";

import {FirestoreEmulatorClient} from "@mm0202/firestore-client";
import path from "path";
import * as firebase from "@firebase/testing";

describe("データ検証", () => {
    const client = new FirestoreEmulatorClient("my-test-project", path.join(__dirname, "firestore.rules"));
    const collectionPath = "item";
    const item_id = "XXXXXXXXXX";

    const title = "吾輩は犬である";
    const admin_user = "fuyutsuki";
    const initial_data = {
        item_id: item_id,
        title: title,
        admin_user: admin_user,
        price: 1000,
        description: "猫じゃないよ。犬だよ。",
        locked: false,
        sold_out: false
    };
    const valid_data = {
        item_id: item_id,
        title: title,
        admin_user: admin_user,
        price: 12000,
        description: "猫が好きです。でも犬はも～っと好きです。",
        locked: false,
        sold_out: false
    };

    beforeEach(async () => {
        await client.loadRules();
    });

    afterEach(async () => {
        await client.cleanup();
    });

    describe('サンプル：商品データ', () => {
        describe('初期データなしテスト', () => {
            describe('商品データの追加', () => {
                test('要件にあったデータの追加を許可', async () => {
                    const db = client.getFirestoreWithAuth(admin_user);
                    const doc = db.collection(collectionPath).doc(item_id);
                    await firebase.assertSucceeds(doc.set(valid_data))
                });

                test('ユーザが商品管理者と一致しない場合は拒否', async () => {
                    const db = client.getFirestoreWithAuth("other_user");
                    const doc = db.collection(collectionPath).doc(item_id);
                    await firebase.assertFails(doc.set(valid_data))
                });
            });
        });

        describe('初期データありテスト', () => {
            beforeEach(async () => {
                const db = client.getFirestoreWithAuth(admin_user);
                const doc = db.collection(collectionPath).doc(item_id);
                await doc.set(initial_data)
            });

            describe('商品データの更新', () => {
                test('要件にあったデータの更新を許可', async () => {
                    const db = client.getFirestoreWithAuth(admin_user);
                    const doc = db.collection(collectionPath).doc(item_id);
                    await firebase.assertSucceeds(doc.update(valid_data))
                });

                test('ユーザが商品管理者と一致しない場合は拒否', async () => {
                    const db = client.getFirestoreWithAuth("other_user");
                    const doc = db.collection(collectionPath).doc(item_id);
                    await firebase.assertFails(doc.update(valid_data))
                });

                test('管理者の更新を拒否', async () => {
                    const db = client.getFirestoreWithAuth(admin_user);
                    const doc = db.collection(collectionPath).doc(item_id);

                    const bad_data = {...valid_data, admin_user: "other_user"};
                    await firebase.assertFails(doc.update(bad_data))
                });

                test('ロックされたデータの更新を拒否', async () => {
                    const db = client.getFirestoreWithAuth(admin_user);
                    const doc = db.collection(collectionPath).doc(item_id);

                    const locked_data = {...valid_data, locked: true};
                    await firebase.assertSucceeds(doc.update(locked_data));

                    const update_data = {...locked_data, price: 3000};
                    await firebase.assertFails(doc.update(update_data));
                });

                test('商品名の変更を拒否', async () => {
                    const db = client.getFirestoreWithAuth(admin_user);
                    const doc = db.collection(collectionPath).doc(item_id);

                    const bad_data = {...valid_data, title: "吾輩は犬ではない！"};
                    await firebase.assertFails(doc.update(bad_data))
                });
            });

            describe('商品データの取得', () => {
                test('要件にあったデータの取得を許可', async () => {
                    const db = client.getFirestoreWithAuth("any_user");
                    const doc = db.collection(collectionPath).doc(item_id);
                    await firebase.assertSucceeds(doc.get())
                });
                test('認証されていないユーザのデータ取得を拒否', async () => {
                    const db = client.getFirestore();
                    const doc = db.collection(collectionPath).doc(item_id);
                    await firebase.assertFails(doc.get())
                });
                test('売り切れ商品のデータ取得を拒否', async () => {
                    const db = client.getFirestoreWithAuth(admin_user);
                    const doc = db.collection(collectionPath).doc(item_id);
                    const update_data = {...valid_data, sold_out: true};
                    await firebase.assertSucceeds(doc.set(update_data));

                    await firebase.assertFails(doc.get())
                })
            })
        });
    });
});
