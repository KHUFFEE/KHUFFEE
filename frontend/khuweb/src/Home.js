import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/data');
  };

  return (
    <div>
      <h2>Home Page</h2>
      <button onClick={handleClick}>Fetch Data and Go to Data Page</button>
    </div>
  );
}

export default Home;