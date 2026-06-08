import Presentation from './components/Presentation.jsx';
import slidesData from './slides.json';

function App() {
  return (
    <div className="App">
      <Presentation slides={slidesData} slideCount={slidesData.length} />
    </div>
  );
}

export default App;
