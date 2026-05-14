import { useI18n } from "../i18n";
import type { Lang } from "../i18n";

export function LangToggle() {
  const { lang, setLang } = useI18n();

  const handleClick = (e: React.MouseEvent) => {
    const opt = (e.target as HTMLElement).closest("[data-target]") as HTMLElement | null;
    const next = opt?.dataset.target as Lang | undefined;
    if (next && next !== lang) setLang(next);
    else if (!next) setLang(lang === "en" ? "es" : "en");
  };

  return (
    <button
      type="button"
      aria-label="Switch language"
      className="lang-toggle"
      data-lang={lang}
      onClick={handleClick}
    >
      <span className="lang-toggle-thumb" aria-hidden="true" />
      <span className="lang-toggle-option" data-target="es">ES</span>
      <span className="lang-toggle-option" data-target="en">EN</span>
    </button>
  );
}
