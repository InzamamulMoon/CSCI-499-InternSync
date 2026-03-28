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
