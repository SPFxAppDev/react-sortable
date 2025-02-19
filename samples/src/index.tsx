// import * as React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import App from './App';

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement
// );
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
import * as React from 'react';
import * as ReactDom from 'react-dom';
import './index.css';
import App from './App';



const element: React.ReactElement<{}> = React.createElement(App, {});
ReactDom.render(element, document.getElementById('root') as HTMLElement);
