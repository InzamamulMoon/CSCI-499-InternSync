from matcher import normalize_text, extract_keywords, match_keywords, score_internships, get_sample_data

print("Test 1: normalize_text")
result = normalize_text("Python and Machine Learning")
print(result)

print("\nTest 2: extract_keywords")
user_profile, _ = get_sample_data()
keywords = extract_keywords(user_profile)
print(keywords)

print("\nTest 3: match_keywords")
user_profile, internships = get_sample_data()
user_keywords = extract_keywords(user_profile)
match_score = match_keywords(user_keywords, internships[0])
print(match_score)

print("\nTest 4: score_internships")
user_profile, internships = get_sample_data()
scored = score_internships(user_profile, internships)
for internship in scored:
    print(internship["company"], internship["role"], internship["score"])
