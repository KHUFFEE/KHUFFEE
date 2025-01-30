import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function DataPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data || [];  // 전달된 데이터를 받음

  return (
    <div className="DataPage" style={{ padding: '20px' }}>
      <h2>Store Data Table</h2>
      <button onClick={() => navigate('/')}>Go Back</button>
      
      <table border="1" style={{ width: '80%', marginTop: '20px', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {data.map(store => (
            <tr key={store.id}>
              <td>{store.id}</td>
              <td>{store.name}</td>
              <td>{store.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataPage;
