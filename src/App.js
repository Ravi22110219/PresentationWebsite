import Presentation from './components/Presentation.jsx';
import slidesData from './slides.json';

function App() {
  return (
    <div className="App" data-deploy-refresh="2026-06-13-1">
      <Presentation slides={slidesData} slideCount={slidesData.length} />
    </div>
  );
}

export default App;
