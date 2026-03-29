import string
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def normalize_text(text):
    stop_words = {"the", "and", "is", "in", "at", "for", "with", "a", "an", "of", "to", "are", "that", "this"}
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    return [word for word in text.split() if word not in stop_words]

def extract_keywords(user_profile):
    combined = " ".join(user_profile.get("languages", []) + user_profile.get("courses", []) + user_profile.get("interests", []))
    return normalize_text(combined)

def match_keywords(user_keywords, internship):
    internship_text = internship["role"] + " " + internship["company"]
    internship_keywords = normalize_text(internship_text)
    return sum(1 for word in user_keywords if word in internship_keywords)

def score_internships(user_profile, internships):
    user_keywords = extract_keywords(user_profile)
    total = len(user_keywords) if user_keywords else 1
    scored = []
    for internship in internships:
        matched = match_keywords(user_keywords, internship)
        score = round((matched / total) * 100, 1)
        scored.append({**internship, "score": score})
    return sorted(scored, key=lambda x: x["score"], reverse=True)

def weighted_score(user_profile, internship):
    weights = {"languages": 3, "courses": 2, "interests": 1}
    internship_keywords = normalize_text(internship["role"] + " " + internship["company"])
    total_weight = 0
    earned_weight = 0
    for category, weight in weights.items():
        values = user_profile.get(category, [])
        normalized_values = normalize_text(" ".join(values))
        matches = sum(1 for word in normalized_values if word in internship_keywords)
        earned_weight += matches * weight
        total_weight += len(normalized_values) * weight
    if total_weight == 0:
        return 0.0
    return round((earned_weight / total_weight) * 100, 1)


def explain_match(user_profile, internship):
    internship_keywords = normalize_text(internship["role"] + " " + internship["company"])
    categories = {"languages": "matched_languages", "courses": "matched_courses", "interests": "matched_interests"}
    result = {}
    all_matched = []
    for category, key in categories.items():
        matched = [v for v in user_profile.get(category, []) if any(w in internship_keywords for w in normalize_text(v))]
        result[key] = matched
        all_matched.extend(matched)
    result["suggestion"] = "You match this role because of your experience in: " + ", ".join(all_matched)
    return result


def skill_gap(user_profile, internship):
    internship_keywords = normalize_text(internship["role"] + " " + internship["company"])
    user_keywords = normalize_text(" ".join(
        user_profile.get("languages", []) +
        user_profile.get("courses", []) +
        user_profile.get("interests", [])
    ))
    missing = [kw for kw in internship_keywords if kw not in user_keywords]
    gap_score = round((len(missing) / len(internship_keywords)) * 100, 1) if internship_keywords else 0.0
    return {"missing_skills": missing, "gap_score": gap_score}


def tfidf_score(user_profile, internships):
    user_text = " ".join(
        user_profile.get("languages", []) +
        user_profile.get("courses", []) +
        user_profile.get("interests", [])
    )
    internship_texts = [i["role"] + " " + i["company"] for i in internships]
    all_texts = [user_text] + internship_texts
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    scored = [{**internship, "tfidf_score": round(float(score), 3)} for internship, score in zip(internships, similarities)]
    return sorted(scored, key=lambda x: x["tfidf_score"], reverse=True)


def filter_by_score(scored_internships, min_score=50.0):
    return [i for i in scored_internships if i["score"] >= min_score]


def get_sample_data():
    user_profile = {
        "languages": ["Python", "Java", "SQL"],
        "courses": ["Data Structures", "Algorithms", "Database Systems", "Machine Learning"],
        "interests": ["machine learning", "web development", "data science"]
    }
    internships = [
        {"company": "Google", "role": "Software Engineering Intern", "location": "New York"},
        {"company": "Netflix", "role": "Machine Learning Intern", "location": "Remote"},
        {"company": "JPMorgan", "role": "Data Science Intern", "location": "New York"}
    ]
    return user_profile, internships
