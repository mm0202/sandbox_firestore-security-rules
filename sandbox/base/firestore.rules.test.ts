process.env.FIRESTORE_EMULATOR_HOST = "localhost:58080";

import {FirestoreEmulatorClient} from "@mm0202/firestore-client";
import path from "path";
import * as firebase from "@firebase/testing";

describe("fruitsコレクションへの認証付きでのアクセスのみを許可", () => {
    const client = new FirestoreEmulatorClient("my-test-project", path.join(__dirname, "firestore.rules"));

    beforeEach(async () => {
        await client.loadRules();
    });

    afterEach(async () => {
        await client.cleanup()
    });

    describe('基本構成チェック', () => {
        test('読み込み許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('bases').doc('base1');
            await firebase.assertSucceeds(doc.get())
        });

        test('書き込み拒否', async () => {
            const db = client.getFirestore();
            const doc = db.collection('bases').doc('base2');
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });
    });

    describe('database変数チェック', () => {
        test('database変数がdefaultならread許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('variable_checks').doc('variable_check1');
            await firebase.assertSucceeds(doc.get())
        });

        test('database変数がdefaultならwrite許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('variable_checks').doc('variable_check2');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('ワイルドカードチェック', () => {
        test('特定ドキュメントのアクセスを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('specific_docs').doc('specific_doc1');
            await firebase.assertSucceeds(doc.get());
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });

        test('特定ドキュメント以外のアクセスを拒否', async () => {
            const db = client.getFirestore();
            const doc = db.collection('specific_docs').doc('not_allow');
            await firebase.assertFails(doc.get());
            await firebase.assertFails(doc.set({data: 'dummy'}))
        });

        test('ワイルドカード指定のドキュメントのアクセスを許可', async () => {
            const db = client.getFirestore();
            const doc1 = db.collection('wildcard_checks').doc('wildcard_check1');
            await firebase.assertSucceeds(doc1.get());
            await firebase.assertSucceeds(doc1.set({data: 'dummy'}));

            const doc2 = db.collection('wildcard_checks').doc('wildcard_check2');
            await firebase.assertSucceeds(doc2.get());
            await firebase.assertSucceeds(doc2.set({data: 'dummy'}))
        });
    });

    describe('ネストチェック', () => {
        test('ネスト記述で許可したアクセスを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('nest_doc_roots/nest_doc_root/nest_docs').doc('nest_doc');
            await firebase.assertSucceeds(doc.get());
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });

        test('ネスト記述なしで許可したアクセスを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('no_nest_doc_roots/no_nest_doc_root/no_nest_docs').doc('no_nest_doc');
            await firebase.assertSucceeds(doc.get());
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });
    });

    describe('再帰ワイルドカードチェック', () => {
        test('再帰ワイルドカードで許可したアクセスを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('re_wildcard_checks/doc0/col1/doc1/col2').doc('doc2');
            await firebase.assertSucceeds(doc.get());
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });

        // test('規定のパスを許可', async () => {
        //     const db = firestoreTestSupport.getFirestore();
        //     const doc = db.collection('re_wildcard_path_checks/doc0/col1').doc('doc2');
        //     await firebase.assertSucceeds(doc.get());
        //     await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        // });
        //
        // test('規定外のパスを許可', async () => {
        //     const db = firestoreTestSupport.getFirestore();
        //     const doc = db.collection('re_wildcard_path_checks/doc0/col1/rejected_doc1/col2').doc('doc2');
        //     await firebase.assertFails(doc.get());
        //     await firebase.assertFails(doc.set({data: 'dummy'}))
        // });
    });

    describe('allow式のアクセスタイプチェック', () => {
        test('readを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('access_types1').doc('access_type');
            await firebase.assertSucceeds(doc.get());
        });

        test('writeを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('access_types1').doc('access_type');
            await firebase.assertSucceeds(doc.set({data: 'dummy'}))
        });

        test('getを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('access_types2').doc('access_type');
            await firebase.assertSucceeds(doc.get());
        });

        test('listを許可', async () => {
            const db = client.getFirestore();
            const col = db.collection('access_types2');
            await firebase.assertSucceeds(col.get());
        });

        test('createを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('access_types2').doc("new");
            await firebase.assertSucceeds(doc.set({data: "dummy"}))
        });

        test('updateを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('access_types2').doc("old");
            await firebase.assertSucceeds(doc.set({data: "dummy"}));
            await firebase.assertSucceeds(doc.update({data: "dummy2"}))
        });

        test('deleteを許可', async () => {
            const db = client.getFirestore();
            const doc = db.collection('access_types2').doc("old");
            await firebase.assertSucceeds(doc.delete());
        });
    });

    describe('指定の無いアクセスは拒否', () => {
        test('指定の無いアクセスは拒否', async () => {
            const db = client.getFirestore();
            const doc = db.collection('not_exists').doc('not_exist');
            await firebase.assertFails(doc.get());
            await firebase.assertFails(doc.set({data: "dummy"}));
        });
    });

    describe('複数条件一致は許可優先', () => {
        test('複数条件一致は許可優先', async () => {
            const db = client.getFirestore();
            const doc = db.collection('multi_match').doc('multi_match');
            await firebase.assertSucceeds(doc.get());
            await firebase.assertSucceeds(doc.set({data: "dummy"}));
        });
    });
});
