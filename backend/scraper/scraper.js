import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export async function scrapeHackerRank(username, password, contestSlug) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });

    try {
        console.log("Opening HackerRank login page...");
        await page.goto("https://www.hackerrank.com/login", { waitUntil: "networkidle2" });

        // Enter username and password
        await page.type('input[name="username"]', username, { delay: 100 });
        await page.type('input[name="password"]', password, { delay: 100 });

        // Click login button and wait for navigation
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: "networkidle2" })
        ]);

        console.log("Login successful!");

        // Navigate to contest challenges page
        console.log(`Navigating to contest challenges: ${contestSlug}`);
        const challengesUrl = `https://www.hackerrank.com/contests/${contestSlug}/challenges`;
        await page.goto(challengesUrl, { waitUntil: "networkidle2" });

        // Fetch all problem slugs from the challenges page
        const problemSlugs = await fetchProblemSlugs(page);
        console.log("Scraped Problem Slugs:", problemSlugs);

        // Navigate to contest leaderboard page
        console.log(`Navigating to contest leaderboard: ${contestSlug}`);
        const leaderboardUrl = `https://www.hackerrank.com/contests/${contestSlug}/leaderboard`;
        await page.goto(leaderboardUrl, { waitUntil: "networkidle2" });

        // Fetch all usernames from the leaderboard
        const usernames = await fetchUsers(page);
        console.log("Scraped Usernames:", usernames);

        // For each problem slug, fetch submission details
        const submissionsData = [];
        for (const problemSlug of problemSlugs) {
            console.log(`Fetching submissions for problem: ${problemSlug}`);
            const problemSubmissions = await fetchSubmissions(page, usernames, contestSlug, problemSlug);
            submissionsData.push({ problemSlug, submissions: problemSubmissions });
        }

        return { problemSlugs, usernames, submissionsData };

    } catch (error) {
        console.error("Error during scraping:", error);
    } finally {
        await browser.close();
        console.log("Browser closed.");
    }
}

async function fetchProblemSlugs(page) {
    let problemSlugs = [];

    await page.waitForSelector(".challengecard-title a", { timeout: 5000 }).catch(() => {
        console.log("No challenges found.");
        return problemSlugs;
    });

    problemSlugs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".challengecard-title a"))
            .map(a => a.href.split("/").pop().trim());
    });

    return problemSlugs;
}

async function fetchUsers(page) {
    let usernames = new Set();
    let currentPage = 1;

    while (true) {
        console.log(`Scraping Page ${currentPage}...`);

        await page.waitForSelector(".leaderboard-row", { timeout: 5000 }).catch(() => {
            console.log("No more pages or users found.");
            return false;
        });

        const users = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".leaderboard-row a"))
                .map(a => a.href.split("/").pop().trim());
        });

        users.forEach(user => usernames.add(user));

        const nextPageButton = await page.$('.pagination-next');
        if (nextPageButton) {
            await Promise.all([
                nextPageButton.click(),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
            currentPage++;
        } else {
            break;
        }
    }

    return Array.from(usernames);
}

async function fetchSubmissions(page, usernames, contestSlug, problemSlug) {
    const submissions = [];
    let currentPage = 1;
    let hasSubmissions = true;

    while (hasSubmissions) {
        console.log(`Fetching submissions for ${problemSlug} - Page ${currentPage}...`);

        const submissionsUrl = `https://www.hackerrank.com/contests/${contestSlug}/judge/submissions/challenge/${problemSlug}/${currentPage}`;
        await page.goto(submissionsUrl, { waitUntil: "networkidle2" });

        const noSubmissions = await page.evaluate(() => {
            const noSubmissionsElement = document.querySelector(".submissions-list-empty");
            return noSubmissionsElement ? noSubmissionsElement.textContent.trim() : null;
        });

        if (noSubmissions && noSubmissions.includes("There are no submissions.")) {
            console.log(`No submissions found on page ${currentPage}. Moving to the next problem.`);
            break;
        }

        const tableExists = await page.waitForSelector(".judge-submissions-list-view", { timeout: 5000 }).catch(() => {
            console.log("Submissions table not found on this page.");
            return false;
        });

        if (!tableExists) {
            console.log("No more submissions found. Stopping.");
            hasSubmissions = false;
            break;
        }

        const submissionsData = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".judge-submissions-list-view")).map(row => {
                const cols = row.querySelectorAll("div");
                if (!cols.length || cols.length < 10) return null;
        
                const srclinkElem = cols[10]?.querySelector("a");
                const srclink = srclinkElem ? srclinkElem.href : "N/A";
                const id = srclink !== "N/A" ? srclink.split("/").pop().trim() : "N/A";
        
                return {
                    username: cols[2]?.innerText.trim() || "N/A",
                    id: id,
                    language: cols[4]?.innerText.trim() || "N/A",
                    time: parseInt(cols[5]?.innerText.trim()) || 0,
                    result: cols[6]?.innerText.trim() || "N/A",
                    score: parseFloat(cols[7]?.innerText.trim()) || 0,
                    duringContest: cols[9]?.innerText.trim() || "N/A",
                    srclink: srclink
                };
            }).filter(submission => submission !== null);
        });

        for (const submission of submissionsData) {
            if (usernames.includes(submission.username) && submission.result === "Accepted") {
                submission.sourceCode = await fetchSourceCode(page, submission.srclink);
                submissions.push(submission);
            }
        }

        currentPage++;
    }

    console.log(`Total accepted submissions found for ${problemSlug}: ${submissions.length}`);
    return submissions;
}

async function fetchSourceCode(page, srclink) {
    if (srclink === "N/A") return "N/A";

    try {
        await page.goto(srclink, { waitUntil: "networkidle2" });

        // **Scroll down first**
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });

        // **Wait for 7 seconds**
        await new Promise(resolve => setTimeout(resolve, 7000));

        const sourceCode = await page.evaluate(() => {
            const lines = document.querySelectorAll(".CodeMirror-scroll .CodeMirror-lines pre");
            return Array.from(lines).map(line => line.innerText.trim()).join("\n") || "N/A";
        });

        return sourceCode;
    } catch (error) {
        console.error("Failed to fetch source code:", error);
        return "N/A";
    }
}

