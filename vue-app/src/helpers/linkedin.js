import * as shared from "@/helpers/shared.js";

export async function doSearch(context, webview, term) {
    // console.log(`linkedin.doSearch "${term}"`);
    await typeSearchTerm(context, webview, term);

    const script = `
   const ele = document.querySelector('${context.linkedInSelectors.applicationOverlayContainer}');
   ele.remove();
 `;

    await webview.executeJavaScript(script).catch((error) => {
        console.error("Script execution failed:", error);
        return false;
    });
    console.log("executing search: ", term);
    await scrollToBottomAndLogLinks(context, webview, term);
}


const scrollToBottomAndLogLinks = async (context, webview, term) => {
    console.log('scrollToBottomAndLogLinks')
    try {
        if (!webview) {
            console.error("Webview is not initialized.");
            throw new Error("Webview is not initialized.");
        }

        const result = await webview.executeJavaScript(`
            (async () => {
  window.continueProcessing = () => {};
  window.autopilotConfig = {
    isPaging: false,
    searchType: null,
    negativeKeywords: ${JSON.stringify(
            context.user.autopilot.negative_keywords
        )},
    companyFilters: ${JSON.stringify(context.companyFilters)},
  };
  // alert(JSON.stringify(window.autopilotConfig.negativeKeywords.length))
  // console.log(window.autopilotConfig,'window.autopilotConfig')

  function smoothScrollToBottom(container) {
    return new Promise(resolve => {
      let lastScrollHeight = container.scrollHeight;
      let currentScrollPosition = container.scrollTop;

      function smoothScroll() {
        const totalHeight = container.scrollHeight;
        const step = totalHeight / 30;
        // alert('smoothScroll ' + totalHeight)

        if (currentScrollPosition < totalHeight) {
          currentScrollPosition += step;
          container.scrollTop = currentScrollPosition;
          setTimeout(smoothScroll, 40);
        } else {
          setTimeout(() => {
            if (container.scrollHeight > lastScrollHeight) {
              lastScrollHeight = container.scrollHeight;
              smoothScroll();
            } else {
              resolve();
            }
          }, 500);
        }
      }
      smoothScroll();
    });
  }

  function getApplicantCount() {
    const jobDetailsDiv = document.querySelectorAll('${context.linkedInSelectors.primaryDescriptionContainer
            }')[0];
    let applicantCount = 0;
    try {
      if (jobDetailsDiv) {
        const spans = jobDetailsDiv.querySelectorAll('span');
        spans.forEach(span => {
          let match;
          if (span.innerText.toLowerCase().includes('applicant')) {
            match = span.innerText.match(/(\\d+)\\s*applicants?/i);
          }
          if (span.innerText.toLowerCase().includes('people clicked apply')) {
            let txt = span.innerText.toLowerCase();
            txt = txt.replace('over', '');
            match = txt.match(/(\\d+)\\s*people clicked apply?/i);
          }

          if (match) {
            applicantCount = parseInt(match[1]);
          } else if (span.innerText.toLowerCase().includes('0 applicants')) {
            applicantCount = 0;
          }
        });
      }

      if (applicantCount >= 0) {
   //      console.log(applicantCount + ' applicants');
      } else {
   //      console.log('No span with "applicants" found');
      }
    } catch (error) {
      console.error('Error:', error);
    }
    return applicantCount;
  }

 const delay = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  function getJobDescription() {
      let description = document.querySelector('${context.linkedInSelectors.jobDetails
            }').innerText;
      const jobDetailsContent = document.querySelector('${context.linkedInSelectors.jobViewLayout
            }');
      const clone = jobDetailsContent.cloneNode(true);
      const elementsToRemove = clone.querySelectorAll('${context.linkedInSelectors.primaryDescriptionContainer
            }, ${context.linkedInSelectors.scaffoldToolbar
            }, .job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight, .job-details-jobs-unified-top-card__job-insight, .coach-mark-list__container, .mt5');
      elementsToRemove.forEach(el => el.parentNode.removeChild(el));
      description = clone.innerText + '\\n\\n' + description;

      const salaryElement = document.querySelector('${context.linkedInSelectors.salary
            }');
      if (salaryElement) {
          const salaryInfo = salaryElement.innerText.trim();
          if (salaryInfo) {
              description += '\\n\\nSalary: ' + salaryInfo;
          }
      }

    return description.replace(/\\s+/g, ' ').trim();
  }

  function stopFilteredCompany(jobData) {
  // console.log('Starting company filter check for job:', jobData.employer);

  const isFiltered = window.autopilotConfig.companyFilters.some(companyFilter => {
      // Check if the job's employer (lowercased) matches any lowercased company names in the filters
      const employerMatches = jobData.employer.toLowerCase() === companyFilter.company_name_lower;

      // console.log('Checking employer: ', jobData.employer, ' against filtered company: ', companyFilter.company_name,'. Match found: ',employerMatches);

      if (employerMatches) {
          console.log(' >> Job from ',  jobData.employer, ' is FILTERED out due to existing company filter');
          return true;  // Stop the job from being processed further
      }

      return false;  // No need to filter this job, continue checking others
  });

  console.log('Filter result for company ' + jobData.employer + ':', isFiltered);
  return isFiltered;
}

   function stopFiltered(jobData) {
      // console.log('Starting filter check for job:', jobData.title);

      const isFiltered = window.autopilotConfig.negativeKeywords.some(keywordObj => {
      // console.log('Checking keyword:', keywordObj.keyword, 'with applies setting:', keywordObj.applies_to);

      if (keywordObj.applies_to === 'both' || keywordObj.applies_to === 'title') {
        const titleContainsKeyword = jobData.title.toLowerCase().includes(keywordObj.keyword.toLowerCase());
        return titleContainsKeyword;
      }

      // Example to extend with 'description' check
      if (keywordObj.applies_to === 'description' && jobData.description) {
        const descriptionContainsKeyword = jobData.description.toLowerCase().includes(keywordObj.keyword.toLowerCase());
        return descriptionContainsKeyword;
      }

      // Log when no applicable condition matches
      console.log('No applicable filter condition met for keyword:', keywordObj.keyword);
      return false;
    });

   console.log('Filter result for job ' + jobData.title + ':', isFiltered);
    return isFiltered;
  }

  function stopDupeJobs(jobData) {
   const existingJobs = window.existingJobs || [];
   const siteIdArray = existingJobs.map((m) => m.siteid);
   const siteIdMatch = siteIdArray.includes(jobData.siteId);

   if (siteIdMatch){
  //   console.log('stopDupe due to siteId', jobData.siteId)
    return true;
   }

  const titleEmployerMatch = existingJobs.some((job) => {
    const jobAddedDate = new Date(job.added);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return job.title === jobData.title &&
          job.employer_name === jobData.employer &&
          jobAddedDate > twentyFourHoursAgo;
  });

   return titleEmployerMatch;
 }

async function clickLinksSequentially(jobCards) {
  console.log(jobCards, 'clickLinksSequentially');
return new Promise(async (resolve) => {
  let jobIndex = 0;
  for (let jobCard of jobCards) {
//      console.log(jobIndex + 1, 'processing job card of: ' + jobCards.length);
    jobIndex++;

    if (window.isPaused) {
      await new Promise((resume) => {
        window.continueProcessing = resume;
      });
    }

 //    console.log(jobCard, 'jobCard')
    const siteId = jobCard.getAttribute('${context.linkedInSelectors.siteIdSelector
            }');
    // alert(siteId);
    const linkElement = jobCard.querySelector('${context.linkedInSelectors.jobCardListTitle
            }');
  //   console.log(jobCard, 'jobCard');
  //   console.log(linkElement, 'linkElement');

    const linkText = linkElement ? linkElement.textContent.trim() : 'No title found';

    if (linkText === 'No title found') {
    //  alert('No title found');
    //   console.log(document.body, 'delaying for 10 minutes so you can inspect');
      await delay(600000);
    }
    // alert(linkText)

    const employerElement = jobCard.querySelector('${context.linkedInSelectors.jobCardPrimaryDescription
            }');
    const employer = employerElement ? employerElement.textContent.trim() : 'No employer found';
    let dupe = false, skipped = false;

    const jobData = {
      title: linkText,
      employer: employer,
      siteId: siteId,
    };
     console.log(jobData, 'jobData');

    const stopDupe = stopDupeJobs(jobData);
     console.log(stopDupe, 'stopDupe');
    if (stopDupe) {
  //     console.log(stopDupeJobs(jobData), 'stopDupeJobs(jobData)');
      dupe = true;
      skipped = true;
      if (window.autopilotConfig.searchType === 'refresh') {
        resolve(true);
        return;
      }
    }

    let isFilteredCompany = false;
    if(!stopDupe) {
      isFilteredCompany = stopFilteredCompany(jobData);
      // console.log(isFilteredCompany, 'isFilteredCompany');
      if (isFilteredCompany) {
        skipped = true;
      }
    }

    if(!isFilteredCompany) {
        let isFiltered = stopFiltered(jobData);
        console.log(isFiltered, 'isFiltered');
        if (isFiltered) {
          skipped = true;
        }
    }

    const url = 'https://www.linkedin.com/jobs/search/?currentJobId=' + siteId;
    const jobDetails = {
      domain: '${context.domain}',
      siteId: siteId,
      title: linkText,
      url: url,
      employer: employer,
      search: '${term}',
      sessionID: '${context.sessionID}',
      status: 'Reviewing',
      skipped: skipped,
      dupe: dupe,
      vote: null,
      vote_feedback: "",
      previous_jobs: ${JSON.stringify(context.filterAndSortJobs())},
    };
     console.log(jobDetails, 'jobDetails');

    if (linkElement && !jobDetails.skipped) {
      if (linkElement.offsetParent === null) {
        window.history.back();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      linkElement.click();
      await new Promise((resolve) => setTimeout(resolve, 4000));

      jobDetails.description = getJobDescription();
      jobDetails.applicantCount = getApplicantCount();
    //   console.log(jobDetails.applicantCount, 'jobDetails.applicantCount');

      isFiltered = stopFiltered(jobDetails);
      // console.log(isFiltered, 'isFiltered2');
      if (isFiltered) {
        jobDetails.skipped = true;
      }
    }
  //   console.log(jobDetails, 'jobDetails');

    try {
     window.electronAPI.jobDiscovered(jobDetails);
    } catch (error) {
      console.error('Error sending job details:', error);
    }
  }
  resolve(false);
});
}

async function processJobPages(container) {
// alert('processJobPages ${context.linkedInSelectors.scaffoldList}')
const maxPages = 3;
let currentPage = 1;

while (currentPage <= maxPages) {
  try {
    await smoothScrollToBottom(container);
    container.scrollTop = 0;
    document.querySelectorAll('${context.linkedInSelectors.msgOverlay
            }').forEach(element => {
      element.remove();
    });

    const jobCards = document.querySelectorAll('${context.linkedInSelectors.scaffoldList
            }');
    const shouldStop = await clickLinksSequentially(jobCards);
     console.log(shouldStop, 'shouldStop');

  //   console.log('Scrolled to bottom and ready to log links.');
  //   console.log(window.autopilotConfig.isPaging, 'window.autopilotConfig.isPaging')

    if (shouldStop) {
 //      console.log('Stopping paging due to duplicate job found.');
      break;
    }

    if (currentPage < maxPages && window.autopilotConfig.isPaging) {
      const nextPageButton = document.querySelector('${context.linkedInSelectors.nextPageButton
            }');
      if (nextPageButton && nextPageButton.offsetParent !== null) {
       //  console.log('clicking next page')
        nextPageButton.click();
        await new Promise(resolve => setTimeout(resolve, 4000));
        currentPage++;
      } else {
        break;
      }
    } else {
      break;
    }
  } catch (err) {
    console.error("Error during scrolling:", err);
    break;
  }
}
return true;
}

const hoursToRefresh = 1;
const hoursInMillis = hoursToRefresh * 60 * 60 * 1000;
if (
    !window.lastSearchCycleCompleted ||
    !(window.lastSearchCycleCompleted instanceof Date) ||
    isNaN(Date.parse(window.lastSearchCycleCompleted))
  ) {
 //    console.log("No last search cycle completed date found.");
    window.autopilotConfig.isPaging = true;
  } else if (window.lastSearchCycleCompleted instanceof Date) {
const timeDifference = new Date() - window.lastSearchCycleCompleted;
const minutes = Math.floor(timeDifference / 60000);
const seconds = ((timeDifference % 60000) / 1000).toFixed(0);
//  console.log('Time since Last Search Cycle:', minutes + ':' + seconds);
window.autopilotConfig.isPaging = timeDifference > hoursInMillis;
//  console.log('Time difference is greater than ' + hoursToRefresh + ' hours:', timeDifference > hoursInMillis);
} else {
//  console.log('Invalid date format for last search cycle completed.');
window.autopilotConfig.isPaging = false;
}

window.autopilotConfig.searchType = window.autopilotConfig.isPaging ? "full" : "refresh";
  console.log(window.autopilotConfig, 'window.autopilotConfig');

try {
  let container = document.querySelector('${context.linkedInSelectors.jobSearchResultsList
            }');            
  container = container?.parentElement;

  if (!container) {
 
    console.error('Container for job listings not found.');
    window.electron.authenticateLinkedIn();
    return false;
  }

  const h1NoJobs = document.querySelector('${context.linkedInSelectors.noResultsBannerImage
            }');
          
  if (h1NoJobs && h1NoJobs.offsetParent !== null) {
   // alert('No Jobs Found for Search!')
     console.log('No Jobs Found for Search!');
    return false;
  } else {
  //  alert('We have jobs!');
     console.log('We have jobs!');
  }

  await processJobPages(container);
  return true;
} catch (err) {
  console.error("Error during job processing:", err);
  return false;
}
})();
        `);

        console.log("Job processing result:", result);
        return result; // Resolves with the value returned from the JavaScript execution
    } catch (error) {
        console.error("scrollToBottomAndLogLinks failed:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

const typeSearchTerm = async (context, webview, term) => {
    term = term.replace(/'/g, "");
    // const webview = context.$refs.jobsiteWebView;
    if (!webview) {
        console.error("Webview is not initialized.");
        return;
    }

    try {
        webview.src = createSearchUrl(context, term);
        await new Promise((resolve) => {
            webview.addEventListener("dom-ready", resolve, { once: true });
        });
    } catch {
        //    console.log("type search term failed");
    }
    const isSignedIn = await shared.checkSignInButton(
        webview,
        context.linkedInSelectors.signInSignals
    );
    //  console.log(isSignedIn, "typeSearchTerm.isSignedIn");
    if (!isSignedIn) {
        context.$emit("auth-required");
    }
    context.updateWebviewJobs();

    await context.waitForElementToDisappear(
        webview,
        context.linkedInSelectors.initialLoadAnimation
    );
    context.updateWebviewLastSearchCycle();
};



const createSearchUrl = (context, term) => {
    const baseUrl = context.url;
    let dateFilter = "f_TPR=r86400";

    if (
        !context.user.last_search_cycle ||
        !(context.user.last_search_cycle instanceof Date) ||
        isNaN(Date.parse(context.user.last_search_cycle))
    ) {
        dateFilter = "f_TPR=r2592000";
    }

    return `${baseUrl}&${dateFilter}&keywords=${term}`;
};

