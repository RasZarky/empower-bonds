/* eslint-disable @typescript-eslint/no-explicit-any */
import { DBType } from "@/db/index"; // Adjust the import path as necessary

export declare global {
    // Extend NodeJS.Global to include drizzleDb for proper type checking
    var drizzleDb: DBType | undefined;
    var googleTranslateElementInit: void;
    var google: GoogleNamespace;
}

interface GoogleTranslate {
    TranslateElement: new (
        options: {
            pageLanguage: string;
            includedLanguages?: string;
            autoDisplay?: boolean;
            // Add other options you might use
        },
        elementId: string
    ) => any; // Define the constructor signature for TranslateElement
}

interface GoogleNamespace {
    translate: GoogleTranslate;
    // Add other Google services if needed (e.g., maps, analytics)
}