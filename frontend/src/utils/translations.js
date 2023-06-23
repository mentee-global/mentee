import esEs from "antd/es/locale/es_ES";
import enUS from "antd/es//locale/en_US";
import ptBR from "antd/es//locale/pt_BR";
import faIR from "antd/es//locale/fa_IR";
import arEG from "antd/es//locale/ar_EG";

export const getAntdLocale = (currentLanguage) => {
  switch (currentLanguage) {
    case "es-US":
      return esEs;
    case "en-US":
      return enUS;
    case "pt-BR":
      return ptBR;
    case "fa-AF":
      return faIR;
    case "ar":
      return arEG;
    default:
      return enUS;
  }
};

export const getTranslatedOptions = (selected, options) => {
  if (!selected || !options) return [];
  if (typeof selected === "string") {
    return (
      options.find((option) => option.value === selected)?.label ?? selected
    );
  }

  const values = options.filter((option) => {
    return selected.includes(option.value);
  });
  return values.map((option) => option.label);
};
