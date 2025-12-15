import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Installation from './components/Installation';
import QuickStart from './components/QuickStart';
import CLI from './components/CLI';
import AdvancedFeatures from './components/AdvancedFeatures';
import Examples from './components/Examples';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Installation />
        <QuickStart />
        <CLI />
        <AdvancedFeatures />
        <Examples />
      </main>
      <Footer />
    </div>
  );
}

export default App;
