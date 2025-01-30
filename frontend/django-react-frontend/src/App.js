import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import DataPage from './DataPage';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Welcome to My App</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/data">Data Page</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/data" element={<DataPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
