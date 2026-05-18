import json
import requests
from bs4 import BeautifulSoup


def get_best_link(links):
    #Skips Simplify redirect links and returns the best direct application link
    #Attempts to extract job description from JSON-LD structured data
    for link in links:
        if 'simplify.jobs' not in link:
            return link
    return links[0] if links else None


def extract_json_ld(soup):
    #Most career pages embed JobPosting schema for Google Jobs indexing
    #Allowing us to get clean descriptions without scraping HTML.
    for script in soup.find_all('script', {'type': 'application/ld+json'}):
        try:
            data = json.loads(script.string)

            if isinstance(data, list):
                data = next((d for d in data if d.get('@type') == 'JobPosting'), None)

            if data and data.get('@type') == 'JobPosting':
                description = data.get('description', '')
                if description:
                    desc_soup = BeautifulSoup(description, 'html.parser')
                    return desc_soup.get_text(strip=True)[:2000]
        except Exception:
            continue
    return None


def detect_platform(url):
    #Identifies which ATS  platform a URL belongs to.
    # gh_jid= means Greenhouse even on custom domains like careers.airbnb.com     
    if 'gh_jid=' in url or 'greenhouse.io' in url:
        return 'greenhouse'
    elif 'myworkdayjobs.com' in url or 'myworkdaysite.com' in url:
        return 'workday'
    elif 'lever.co' in url:
        return 'lever'
    elif 'smartrecruiters.com' in url:
        return 'smartrecruiters'
    elif 'ashbyhq.com' in url:
        return 'ashby'
    elif 'icims.com' in url:
        return 'icims'
    elif 'bamboohr.com' in url:
        return 'bamboohr'
    elif 'amazon.jobs' in url:
        return 'amazon'
    elif 'netflix.net' in url:
        return 'netflix'
    elif 'workable.com' in url:
        return 'workable'
    elif 'apply.careers.microsoft.com' in url:
        return 'microsoft'
    elif 'successfactors' in url or 'jobs2web.com' in url:
        return 'successfactors'
    elif 'oraclecloud.com' in url:
        return 'oracle'
    elif 'jobs.bytedance.com' in url:
        return 'bytedance'
    elif 'lifeattiktok.com' in url:
        return 'tiktok'
    elif 'taleo.net' in url:
        return 'taleo'
    elif 'rippling.com' in url:
        return 'rippling'
    else:
        return 'generic'



PLATFORM_SELECTORS = {
    # Platform-specific CSS selectors used as a fallback when JSON-LD is unavailable.
     # Each platform has known HTML patterns for where they render the job description.
    'workday': [
        {'data-automation-id': 'jobPostingDescription'},
        {'class': 'css-rdyjdf'},
        {'class': 'css-1t6wr2h'},
        {'id': 'job-description'},
    ],
    'greenhouse': [
        {'id': 'content'},
        {'class': 'job__description'},
        {'class': 'section--text'},
        {'class': 'job-description'},
    ],
    'lever': [
        {'class': 'section-wrapper'},
        {'class': 'content'},
        {'class': 'posting-description'},
    ],
    'smartrecruiters': [
        {'class': 'job-sections'},
        {'class': 'job-description'},
        {'itemprop': 'description'},
    ],
    'ashby': [
        {'class': 'ashby-job-posting-brief-description'},
        {'class': 'job-posting-description'},
        {'data-testid': 'job-description'},
    ],
    'icims': [
        {'id': 'jobDescription'},
        {'class': 'iCIMS_InfoMsg_Job'},
        {'class': 'job-description'},
    ],
    'bamboohr': [
        {'class': 'job-description'},
        {'id': 'job-description'},
    ],
    'amazon': [
        {'id': 'job-detail'},
        {'class': 'job-detail-description'},
        {'data-test-id': 'section-team'},
    ],
    'netflix': [
        {'class': 'description'},
        {'data-testid': 'job-description'},
    ],
    'workable': [
        {'class': 'job-description'},
        {'id': 'job-description'},
        {'class': 'description'},
    ],
    'microsoft': [
        {'class': 'job-detail-description'},
        {'data-automationid': 'jobDescription'},
    ],
    'successfactors': [
        {'class': 'jobDescriptionSection'},
        {'id': 'jobDescription'},
    ],
    'oracle': [
        {'data-bind': 'html: jobDescription'},
        {'class': 'job-requisition-description'},
    ],
    'bytedance': [
        {'class': 'job-detail-description'},
        {'class': 'description'},
    ],
    'tiktok': [
        {'class': 'job-detail-description'},
        {'class': 'job-description'},
    ],
    'taleo': [
        {'id': 'requisitionDescriptionInterface'},
        {'class': 'jobDescription'},
    ],
    'rippling': [
        {'class': 'job-description'},
        {'data-testid': 'job-description'},
    ],
    'generic': [
        {'id': 'content'},
        {'class': 'job-description'},
        {'class': 'description'},
        {'class': 'posting-description'},
        {'class': 'section-wrapper'},
    ],
}


def scrape_by_selectors(soup, platform):
    #Fallback scraping using platform-specific CSS selectors.
    #Called only when JSON-LD structured data is not available.
    selectors = PLATFORM_SELECTORS.get(platform, PLATFORM_SELECTORS['generic'])
    for selector in selectors:
        element = soup.find('div', selector)
        if element:
            return element.get_text(strip=True)[:2000]
    return None


def scrape_description(url):
    # Add a description field to every internship
    # Falls back to "role at company" if no links or scraping fails
    # So every internship should have a description 
    try:
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        })
 
        if response.status_code != 200:
            return None
 
        soup = BeautifulSoup(response.text, 'html.parser')
 
        for tag in soup(['script', 'style', 'nav', 'header', 'footer']):
            tag.decompose()
 
        description = extract_json_ld(soup)
        if description:
            return description
 
        platform = detect_platform(url)
        description = scrape_by_selectors(soup, platform)
        if description:
            return description
 
       
        return soup.get_text(strip=True)[:2000]
 
    except requests.exceptions.Timeout:
        print(f"Timeout scraping {url}")
        return None
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return None
 
 
def enrich_with_description(internships):
    for internship in internships:
        links = internship.get('application_links', [])
 
        if not links:
           
            internship['description'] = f"{internship['role']} at {internship['company']}"
            continue
 
       
        best_link = get_best_link(links)
 
        if best_link:
            description = scrape_description(best_link)
            if description:
                internship['description'] = description
            else:
                internship['description'] = f"{internship['role']} at {internship['company']}"
        else:
            internship['description'] = f"{internship['role']} at {internship['company']}"
 
    return internships