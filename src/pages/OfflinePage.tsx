import React from 'react';

export const OfflinePage: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      textAlign: 'center', 
      padding: '20px',
      backgroundColor: '#0f172a',
      color: 'white'
    }}>
      <h1>Você está sem internet</h1>
      <p>Seus últimos treinos ainda estão disponíveis para visualização.</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.reload()} style={{ 
          padding: '10px 20px', 
          borderRadius: '8px', 
          border: 'none', 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          fontWeight: 'bold', 
          cursor: 'pointer' 
        }}>
          Tentar Novamente
        </button>
      </div>
    </div>
  );
};
