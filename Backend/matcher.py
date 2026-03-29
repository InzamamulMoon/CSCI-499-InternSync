import string

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
