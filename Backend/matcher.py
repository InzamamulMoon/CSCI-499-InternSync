import re
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


def top_matches(scored_internships, n=10):
    return sorted(scored_internships, key=lambda x: x["score"], reverse=True)[:n]


def location_boost(scored_internships, preferred_location):
    boosted = []
    for internship in scored_internships:
        updated = dict(internship)
        if preferred_location.lower() in updated.get("location", "").lower():
            updated["score"] = min(100.0, updated["score"] + 10)
        boosted.append(updated)
    return sorted(boosted, key=lambda x: x["score"], reverse=True)


def embed_text(texts):
    from sentence_transformers import SentenceTransformer
    import numpy as np
    model = SentenceTransformer("all-MiniLM-L6-v2")
    return model.encode(texts)


def embedding_retrieve(user_profile, internships, top_k=100):
    import numpy as np
    user_text = " ".join(
        user_profile.get("languages", []) +
        user_profile.get("courses", []) +
        user_profile.get("interests", [])
    )
    internship_texts = [i["role"] + " " + i["company"] for i in internships]
    all_texts = [user_text] + internship_texts
    embeddings = embed_text(all_texts)
    user_emb = embeddings[0:1]
    internship_embs = embeddings[1:]
    similarities = cosine_similarity(user_emb, internship_embs).flatten()
    scored = [
        {**internship, "embedding_similarity": round(float(sim), 4)}
        for internship, sim in zip(internships, similarities)
    ]
    scored.sort(key=lambda x: x["embedding_similarity"], reverse=True)
    return scored[:top_k]


def embedding_then_score(user_profile, internships, top_k=100):
    top_k_internships = embedding_retrieve(user_profile, internships, top_k=top_k)
    return score_internships(user_profile, top_k_internships)


# Order matters: longer / more specific labels before shorter ones (e.g. JavaScript before Java).
_LISTING_TAG_SPECS = [
    ("JavaScript", re.compile(r"\bjavascript\b|\bjs\b", re.I)),
    ("TypeScript", re.compile(r"\btypescript\b|\bts\b", re.I)),
    ("Node.js", re.compile(r"\bnode\.js\b|\bnodejs\b", re.I)),
    ("C++", re.compile(r"\bc\+\+\b", re.I)),
    ("C#", re.compile(r"\bc#\b", re.I)),
    ("Python", re.compile(r"\bpython\b", re.I)),
    ("Java", re.compile(r"\bjava\b", re.I)),
    ("Kotlin", re.compile(r"\bkotlin\b", re.I)),
    ("Swift", re.compile(r"\bswift\b", re.I)),
    ("Go", re.compile(r"\bgo\b", re.I)),
    ("Rust", re.compile(r"\brust\b", re.I)),
    ("Ruby", re.compile(r"\bruby\b", re.I)),
    ("PHP", re.compile(r"\bphp\b", re.I)),
    ("Scala", re.compile(r"\bscala\b", re.I)),
    ("React", re.compile(r"\breact\b", re.I)),
    ("Frontend", re.compile(r"\bfront[- ]?end\b", re.I)),
    ("Backend", re.compile(r"\bback[- ]?end\b", re.I)),
    ("Full stack", re.compile(r"\bfull[- ]?stack\b", re.I)),
    ("Vue", re.compile(r"\bvue\b", re.I)),
    ("Angular", re.compile(r"\bangular\b", re.I)),
    ("Next.js", re.compile(r"\bnext\.js\b|\bnextjs\b", re.I)),
    ("HTML", re.compile(r"\bhtml\b", re.I)),
    ("CSS", re.compile(r"\bcss\b", re.I)),
    ("SQL", re.compile(r"\bsql\b", re.I)),
    ("PostgreSQL", re.compile(r"\bpostgres(ql)?\b", re.I)),
    ("MongoDB", re.compile(r"\bmongo(db)?\b", re.I)),
    ("Redis", re.compile(r"\bredis\b", re.I)),
    ("AWS", re.compile(r"\baws\b", re.I)),
    ("Azure", re.compile(r"\bazure\b", re.I)),
    ("GCP", re.compile(r"\bgcp\b|\bgoogle cloud\b", re.I)),
    ("Docker", re.compile(r"\bdocker\b", re.I)),
    ("Kubernetes", re.compile(r"\bkubernetes\b|\bk8s\b", re.I)),
    ("TensorFlow", re.compile(r"\btensorflow\b", re.I)),
    ("PyTorch", re.compile(r"\bpytorch\b", re.I)),
    ("Machine Learning", re.compile(r"\bmachine learning\b", re.I)),
    ("Linux", re.compile(r"\blinux\b", re.I)),
    ("Spring", re.compile(r"\bspring\b", re.I)),
    ("Django", re.compile(r"\bdjango\b", re.I)),
    ("Flask", re.compile(r"\bflask\b", re.I)),
    ("GraphQL", re.compile(r"\bgraphql\b", re.I)),
    ("iOS", re.compile(r"\bios\b", re.I)),
    ("Android", re.compile(r"\bandroid\b", re.I)),
    (".NET", re.compile(r"\.net\b|\bdotnet\b", re.I)),
]


def extract_listing_tags(internship, max_tags=12):
    """Lightweight skill/stack hints from role + company text (not from a separate API field)."""
    blob = f"{internship.get('role', '')} {internship.get('company', '')}"
    out = []
    for label, rx in _LISTING_TAG_SPECS:
        if rx.search(blob) and label not in out:
            out.append(label)
        if len(out) >= max_tags:
            break
    return out


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
