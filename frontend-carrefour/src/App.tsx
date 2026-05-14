import { Component, type ErrorInfo, type ReactNode } from "react";
import HeroPanel from "./components/sections/HeroPanel";
import TermometroSection from "./components/sections/TermometroSection";
import OfertasSection from "./components/sections/OfertasSection";
import TopMarcasSection from "./components/sections/TopMarcasSection";
import CarrefourVsLiderSection from "./components/sections/CarrefourVsLiderSection";
import LoQueBajoSection from "./components/sections/LoQueBajoSection";
import Pipeline from "./components/sections/Pipeline";
import Footer from "./components/sections/Footer";
import NavRail from "./components/sections/NavRail";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Lab crash:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center p-8">
          <div className="lab-panel p-8 max-w-xl">
            <div className="lab-tape mb-3">⚠ FALLO DEL INSTRUMENTO</div>
            <h1 className="font-display text-2xl font-bold neon-blood">El laboratorio crasheó</h1>
            <pre className="font-mono text-xs text-[var(--color-mute)] mt-3 whitespace-pre-wrap">
              {String(this.state.error)}
            </pre>
            <button
              onClick={() => location.reload()}
              className="mt-5 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] border border-[var(--color-radio-deep)] hover:lab-panel-glow transition"
            >
              <span className="neon-green">// Reiniciar muestra</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <HeroPanel />
      <NavRail />
      <main className="pb-24 xl:pb-0">
        <TermometroSection />
        <OfertasSection />
        <CarrefourVsLiderSection />
        <TopMarcasSection />
        <LoQueBajoSection />
        <Pipeline />
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
