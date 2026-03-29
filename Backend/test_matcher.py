from matcher import normalize_text, extract_keywords, match_keywords, score_internships, get_sample_data, weighted_score, tfidf_score, filter_by_score, location_boost, skill_gap

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

print("\nTest 5: weighted_score")
user_profile, internships = get_sample_data()
result = weighted_score(user_profile, internships[0])
print(result)

print("\nTest 6: tfidf_score")
user_profile, internships = get_sample_data()
result = tfidf_score(user_profile, internships)
for internship in result:
    print(internship["role"], internship["tfidf_score"])

print("\nTest 7: filter_by_score")
user_profile, internships = get_sample_data()
scored = score_internships(user_profile, internships)
result = filter_by_score(scored, min_score=10.0)
print(result)

print("\nTest 8: location_boost")
user_profile, internships = get_sample_data()
scored = score_internships(user_profile, internships)
result = location_boost(scored, preferred_location="New York")
print(result)

print("\nTest 9: skill_gap")
user_profile, internships = get_sample_data()
result = skill_gap(user_profile, internships[0])
print(result)
