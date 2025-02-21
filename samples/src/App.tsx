import './App.css';
import ExampleOne from './ExampleOne';
import ExampleTwo from './ExampleTwo';
import NestedExample from './NestedExample';
import SharedExample from './SharedExample';

function App() {

  if (process.env.REACT_APP_LOAD_PACKAGE_FROM === 'local') { //oder process.env.REACT_APP_MY_VARIABLE bei CRA
    console.log("IS LOCAL");
  } else {
    console.log("IS NOT LOCAL");
  }

  return (
    <div className="App">
      <header className="App-header">
        @spfxappdev/sortable
      </header>
      <div className='content'>
        <div className="text-h2">Example 1 - Simple List</div>
        <p>A simple example of sorting a list</p>
        <ExampleOne />

        <div className="text-h2">Example 2 - Handle</div>
        <p>A simple example of sorting a list but with its own draggable element. Here you can only sort/drag if you click on this element</p>
        <ExampleTwo />

        <div className="text-h2">Example 3 - Shared Lists</div>
        <p>
          The list in the top left-hand corner cannot be sorted and you cannot move elements from other lists to this list.
          However, you can place the elements in another list and the element will then be cloned.
          The list in the top right-hand corner can be sorted and you can move the elements to the lists below.
          The list in the bottom left-hand corner can be sorted and you can only move the elements to the bottom right-hand list.
          The list in the bottom right-hand corner can be sorted and you can only move the elements to the bottom left-hand list OR to the list in the top right-hand corner.
        </p>
        <SharedExample />

        <div className="text-h2">Example 4 - Nested</div>
        <p>
          Lists can also be nested. Unfortunately, you cannot currently use a state object that also has the items nested,
          which means that a separate state object must be created for each sortable. At least not without doing crazy things.
        </p>
        <NestedExample />
      </div>
    </div>
  );
}

export default App;
