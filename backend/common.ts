import crypto2 from "crypto";

// Return hashed string using sha256
export const hashed = (s: string): string => {
    return crypto2
        .createHash("sha256")
        .update(s)
        .digest("hex");
};

export const randomUUID = crypto2.randomUUID;