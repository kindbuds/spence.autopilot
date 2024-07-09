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


module.exports.checkSignInButton = async (webview) => {
    // const webview = this.$refs.linkedinWebView;
    if (!webview || typeof webview.executeJavaScript !== "function") {
        console.error(
            "Webview is not initialized or executeJavaScript is not available"
        );
        return false; // Return `false` directly
    }

    try {
        const signInSelectors = [
            'button[data-id="sign-in-form__submit-btn"]',
            'button[data-litms-control-urn="login-submit"]',
            'a[data-tracking-control-name="public_jobs_conversion-modal-signin"]',
            '#reset-password-submit-button',
            '#two-step-submit-button',
            '#captcha-internal',
            'a[data-tracking-control-name="public_jobs_nav-header-signin"]',
            'a[data-tracking-control-name="guest_homepage-basic_nav-header-signin"]',
            '#pin-submit-button',
        ];

        const isSignInButtonPresent = await webview.executeJavaScript(`
            (() => {
                const elementVisible = ${JSON.stringify(signInSelectors)}.some(selector => {
                    const element = document.querySelector(selector);
                    return element && element.offsetParent !== null;
                });
                return Boolean(elementVisible);
            })();
        `);
        console.log(isSignInButtonPresent, 'isSignInButtonPresent')

        return !isSignInButtonPresent;
    } catch (error) {
        console.error("Error executing JavaScript in webview:", error);
        return false;
    }
}


// module.exports.isElementVisible
