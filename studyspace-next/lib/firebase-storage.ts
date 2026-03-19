import { getStorage } from "firebase/storage";

import { app } from "./firebase-auth";

export const storage = getStorage(app);

