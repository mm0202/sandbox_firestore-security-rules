import * as firebase from "@firebase/testing";
import * as fs from "fs";

export default class FirestoreEmulatorProvider {
    private readonly rules: string;

    constructor(private projectId: string, rulesFilePath: string = 'firestore.rules') {
        this.rules = fs.readFileSync(rulesFilePath, 'utf8')
    }

    protected getProjectID() {
        return this.projectId
    }

    async loadRules() {
        return firebase.loadFirestoreRules({
            projectId: this.getProjectID(),
            rules: this.rules,
        })
    }

    getFirestore() {
        return firebase.initializeTestApp({
            projectId: this.getProjectID(),
        }).firestore()
    }

    getFirestoreWithAuth(uid: string = "test_user", email: string = "test_user@dummy.mail") {
        return firebase.initializeTestApp({
            projectId: this.getProjectID(),
            auth: {uid: uid, email: email},
        }).firestore()
    }

    getAdminFirestore() {
        return firebase.initializeAdminApp({projectId: this.getProjectID()}).firestore()
    }

    async cleanup() {
        return Promise.all(firebase.apps().map(app => app.delete()))
    }
}