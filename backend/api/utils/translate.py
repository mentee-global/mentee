from typing import List
from api.utils.constants import TARGET_LANGS
from api.core import logger
from mongoengine import Document
from google.cloud import translate_v2
from google.cloud import translate_v3beta1 as translate_v3
from google.oauth2 import service_account
from io import BytesIO
import json
import os
from api.utils.secure_env import SecureEnvironmentManager

client = translate_v2.Client()
client_v3 = translate_v3.TranslationServiceClient()

location = "us-central1"
project_id = SecureEnvironmentManager.get_optional_env("GOOGLE_PROJECT_ID")
parent = f"projects/{project_id}/locations/{location}" if project_id else None


def get_all_translations(text: str) -> dict:
    """Get all translations for a given text."""
    translations = {language: text for language in TARGET_LANGS}

    for language in translations:
        try:
            result = get_translation(text, language)
        except:
            logger.exception(f"Error translating {text} in {language}")
            continue
        translations[language] = result["translatedText"]
    return translations


def get_translation(text: str, language: str) -> dict:
    """Get translation for a given text and language."""
    return client.translate(text, language)


def document_translate_all_languages(source_file, file_name) -> dict:
    """Get all translations for a given document"""
    source_file.seek(0)
    document_content = source_file.read()
    translations = {language: source_file for language in TARGET_LANGS}

    for target_lang in translations:
        logger.info(f"Translating document to {target_lang}")
        try:
            result = translate_document(target_lang, source_file, document_content)
            pass
        except:
            logger.exception(f"Error translating {file_name} in {target_lang}")
            continue

        # TODO: Figure out the correct way to get the translated document
        # # In case nothing works, this is the code to save the file locally
        # logger.info(f"Saving translated document to {target_lang}_{file_name}")
        # f = open(
        #     f"/Users/leonardogalindo/Code/mentee/backend/{target_lang}_{file_name}",
        #     "wb",
        # )
        # f.write(result.document_translation.byte_stream_outputs[0])
        # f.close()
        # with open(f'/Users/leonardogalindo/Code/mentee/backend/{target_lang}_{source_file.filename}', 'rb') as f:
        #     translations[target_lang] = BytesIO(f.read())
        translations[target_lang] = BytesIO(
            result.document_translation.byte_stream_outputs[0]
        )
    return translations


def translate_document(
    target_language: str, source_file, document_content
) -> client_v3:
    """Translates a document"""
    document_input_config = {
        "content": document_content,
        "mime_type": "application/pdf",
    }

    response = client_v3.translate_document(
        request={
            "parent": parent,
            "target_language_code": target_language,
            "document_input_config": document_input_config,
        }
    )
    return response


def populate_translation_field(mongo_document, translations, file_name):
    """Populates the translations field of a document"""
    for lang in translations:
        if lang == "es-US":
            mongo_document.es_US.put(translations[lang], filename=file_name)
        elif lang == "pt-BR":
            mongo_document.pt_BR.put(translations[lang], filename=file_name)
        elif lang == "ar":
            mongo_document.ar.put(translations[lang], filename=file_name)
        elif lang == "fa-AF":
            mongo_document.fa_AF.put(translations[lang], filename=file_name)
    return mongo_document


def get_translation_document(mongo_document, target_lang):
    """Gets the translation field of a document"""
    if mongo_document is None:
        return None

    if target_lang == "es-US":
        return mongo_document.es_US.read()
    elif target_lang == "pt-BR":
        return mongo_document.pt_BR.read()
    elif target_lang == "ar":
        return mongo_document.ar.read()
    elif target_lang == "fa-AF":
        return mongo_document.fa_AF.read()
    else:
        return None


def get_translated_options(
    target_lang: str, selected_options: List[str], options: Document
):
    """Gets the translated options for a given language"""
    if target_lang == "en-US":
        return selected_options

    option_objects = options.objects.filter(name__in=selected_options)
    translated_options = []
    for cur_option in option_objects:
        translated_options.append(cur_option.translations[target_lang])
    return translated_options
