module.exports.getGuid = () => {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

module.exports.delay = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
module.exports.sendGA4ScreenView = (context) => {
    console.log(context.user, 'sendGA4ScreenView.user')
    let screen_name = context.$route.path.replace("/", "");
    if (!screen_name) screen_name = "home";
    context.$ga4Event(`screen_view`, {
        screen_name: screen_name,
        screen_class: screen_name,
        userId: context.user ? context.user.userid : undefined,
    });
}
module.exports.transformCompanyFilter = (payload) => {
    payload.company_name = payload.company;
    payload.company_name_lower = payload.company.toLowerCase();
    payload.is_flagged = payload.flagged;
    payload.flag_reason = payload.reason;
    return payload
}
module.exports.processKeywords = (keywords) => {
    const keywordSet = new Set(); // Use a Set to handle duplicates

    return keywords.reduce((acc, keywordObj) => {
        let { keyword, applies_to } = keywordObj;
        keyword = keyword.trim().toLowerCase(); // Trim and lowercase the keyword

        // Validate keyword: discard if it's empty or only special characters or numbers
        if (keyword && /^[a-z0-9]*[a-z][a-z0-9]*$/i.test(keyword)) {
            // Ensure keyword contains at least one alphabet
            if (!keywordSet.has(keyword)) {
                // Check if the keyword has already been added
                keywordSet.add(keyword);
                acc.push({ keyword, applies_to });
            } else {
                // If the keyword exists, update the 'applies' to 'both' if it is not already 'both'
                const existingKeyword = acc.find((kw) => kw.keyword === keyword);
                if (existingKeyword && existingKeyword.applies_to !== "both") {
                    existingKeyword.applies_to = "both";
                }
            }
        }

        return acc;
    }, []);
};

module.exports.lowMidHigh = (strPercent) => {
    if (!strPercent == null) return "high";
    const iPercent = parseInt(strPercent);
    let btnclass = "low";
    if (iPercent >= 90) {
        btnclass = "high";
    } else if (iPercent >= 70) {
        btnclass = "mid";
    }
    return btnclass;
},

    module.exports.getJobStatusClass = (job) => {
        switch (job.status) {
            case "Reviewing":
                return "";
        }

        if (job.skipped) {
            return "skipped";
        }
        else if (job.nopercent) {
            return "nopercent";
        }
        else if (job.percentage) {
            return module.exports.lowMidHigh(job.percentage);
        }
    }


module.exports.checkSignInButton = async (webview, selectors) => {
    // const webview = this.$refs.linkedinWebView;
    // console.log(selectors, 'checkSignInButton')
    if (!webview || typeof webview.executeJavaScript !== "function") {
        console.error(
            "Webview is not initialized or executeJavaScript is not available"
        );
        return false; // Return `false` directly
    }

    try {
        const signInSelectors = selectors;

        const isSignInButtonPresent = await webview.executeJavaScript(`
            (() => {
                const elementVisible = ${JSON.stringify(signInSelectors)}.some(selector => {
                    const element = document.querySelector(selector);
                    return element && element.offsetParent !== null;
                });
                return Boolean(elementVisible);
            })();
        `);
        // console.log(isSignInButtonPresent, 'isSignInButtonPresent')

        return !isSignInButtonPresent;
    } catch (error) {
        console.error("Error executing JavaScript in webview:", error);
        return false;
    }
}


// module.exports.isElementVisible
