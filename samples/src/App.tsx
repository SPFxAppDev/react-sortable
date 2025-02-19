import './App.css';
import ExampleOne from './ExampleOne';

function App() {

  if (process.env.REACT_APP_LOAD_PACKAGE_FROM === 'local') { //oder process.env.REACT_APP_MY_VARIABLE bei CRA
    console.log("SSC joa");
  } else {
    console.log("SSC no", process.env);
  }

  return (
    <div className="App">
      <header className="App-header">
        @spfxappdev/sortable
      </header>
      <div className='content'>
        <ExampleOne />
      </div>
    </div>
  );
}

export default App;
