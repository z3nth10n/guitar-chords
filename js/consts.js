function getAbsolutePath() {
    const domain = window.location.hostname;

    if (domain === "z3nth10n.github.io") {
        return "/music-tools/";
    }

    return "";
}