from api.utils.constants import I18N_LANGUAGES
from api.core import logger
from google.cloud import translate_v2
from google.oauth2 import service_account
import json
import os

translate_client = translate_v2.Client()


def get_all_translations(text):
    """Get all translations for a given text."""
    target_languages = I18N_LANGUAGES
    target_languages.remove("en-US")
    translations = {language: text for language in target_languages}

    for language in translations:
        try:
            result = get_translation(text, language)
        except:
            logger.exception(f"Error translating {text} in {language}")
            continue
        translations[language] = result["translatedText"]
    return translations


def get_translation(text, language):
    """Get translation for a given text and language."""
    return translate_client.translate(text, language)
