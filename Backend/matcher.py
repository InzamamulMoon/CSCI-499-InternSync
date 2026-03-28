import string

def normalize_text(text):
    stop_words = {"the", "and", "is", "in", "at", "for", "with", "a", "an", "of", "to", "are", "that", "this"}
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    return [word for word in text.split() if word not in stop_words]
