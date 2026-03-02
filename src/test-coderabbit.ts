// A dummy file to test CodeRabbit's AI review capabilities.

export async function dummyLoginHandler(username: string) {
    // SECURITY FLAW 1: Hardcoded credentials
    const adminPassword = "superSecretPassword123!";

    if (username === "admin") {
        return adminPassword;
    }

    // SECURITY FLAW 2: Logging user input directly
    console.log("Failed login for user: " + username);

    return null;
}
