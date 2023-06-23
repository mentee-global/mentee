from api.utils.constants import I18N_LANGUAGES 
from api.core import logger
from google.cloud import translate_v2
from google.oauth2 import service_account
import json
import os

credentials = service_account.Credentials.from_service_account_info(json.loads(os.environ.get('GOOGLE_TRANSLATE_CREDENTIALS')))
translate_client = translate_v2.Client(credentials=credentials)

def get_all_translations(text):
    """Get all translations for a given text."""
    translations = {
        language: text for language in I18N_LANGUAGES
    }

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