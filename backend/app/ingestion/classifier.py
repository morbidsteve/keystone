"""Message classification for incoming logistics data."""

import enum
from typing import Optional


class MessageType(str, enum.Enum):
    SUPPLY = "SUPPLY"
    EQUIPMENT = "EQUIPMENT"
    TRANSPORTATION = "TRANSPORTATION"
    MAINTENANCE = "MAINTENANCE"
    GENERAL = "GENERAL"


# Keyword sets for classification
_KEYWORDS = {
    MessageType.SUPPLY: {
        "supply", "class", "cl ", "resupply", "requisition", "ammo",
        "ammunition", "fuel", "rations", "water", "dos", "days of supply",
        "on hand", "shortage", "logstat", "meals", "mre", "jp-8", "jp8",
        "diesel", "mogas", "5.56", "7.62", "40mm",
    },
    MessageType.EQUIPMENT: {
        "equipment", "readiness", "mission capable", "nmcm", "nmcs",
        "hmmwv", "mtvr", "lav", "aav", "m1a1", "tank", "vehicle",
        "deadline", "tamcn", "possessed", "fmc", "pmc", "nmc",
    },
    MessageType.TRANSPORTATION: {
        "convoy", "movement", "en route", "departure", "arrival",
        "destination", "msr", "route", "transport", "manifest",
        "vehicle count", "eta", "etd", "convoy id", "loading",
    },
    MessageType.MAINTENANCE: {
        "maintenance", "work order", "repair", "parts", "awaiting parts",
        "mechanic", "shop", "niin", "nsn", "depot", "field maintenance",
        "echelon", "2nd echelon", "3rd echelon",
    },
}


def classify_message(text: str) -> MessageType:
    """Classify a message text into a logistics category.

    Uses keyword matching with weighted scoring. Falls back to NLP
    if available and keyword matching is inconclusive.
    """
    text_lower = text.lower()

    scores = {}
    for msg_type, keywords in _KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[msg_type] = score

    max_score = max(scores.values())

    if max_score == 0:
        return _nlp_classify(text) or MessageType.GENERAL

    # Return the highest scoring type
    for msg_type, score in scores.items():
        if score == max_score:
            return msg_type

    return MessageType.GENERAL


def _nlp_classify(text: str) -> Optional[MessageType]:
    """Attempt NLP-based classification using spaCy."""
    try:
        import spacy

        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)

        # Check for military/logistics-related entities
        for ent in doc.ents:
            if ent.label_ == "QUANTITY":
                return MessageType.SUPPLY
            if ent.label_ in ("ORG",) and any(
                kw in ent.text.lower()
                for kw in ["bn", "co", "plt", "regt", "div"]
            ):
                return MessageType.SUPPLY

    except (ImportError, OSError):
        pass

    return None
