import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';

export default function App() {
  return (
    <BrowserRouter>
      {/* CSS Global untuk Desain Tajam ala TGA Players' Voice */}
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #0b0e14; /* Warna background gelap pekat */
          color: #ffffff;
          font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif;
        }
        .candidate-card {
          transition: opacity 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .candidate-card:hover {
          opacity: 0.8;
        }
        .vote-btn {
          width: 100%;
          padding: 12px;
          background-color: #1e88e5; /* Warna biru khas tombol di gambar */
          color: white;
          border: none;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          text-transform: uppercase;
          font-size: 14px;
        }
        .vote-btn:disabled {
          background-color: #333333;
          color: #888888;
          cursor: not-allowed;
        }
        input, button, type[file] {
          font-family: inherit;
        }
      `}</style>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        <Routes>
          <Route path="/" element={<PublicVotingPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// --- 1. HALAMAN PUBLIK (Desain Tajam TGA Players' Voice) ---
function PublicVotingPage() {
  const [polls, setPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState({});

  useEffect(() => {
    fetchPolls();
    const storedVotes = JSON.parse(localStorage.getItem('votedPolls')) || {};
    setVotedPolls(storedVotes);
  }, []);

  async function fetchPolls() {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        id, title,
        options ( id, name, image_url )
      `);
    if (error) console.error("Error fetching data:", error);
    else setPolls(data);
  }

  async function handleVote(pollId, optionId) {
    if (votedPolls[pollId]) {
      alert("Kamu sudah memberikan suara pada kategori ini.");
      return;
    }

    const { error } = await supabase
      .from('votes')
      .insert([{ poll_id: pollId, option_id: optionId }]);

    if (error) {
      console.error(error);
      alert("Gagal melakukan vote.");
    } else {
      const newVotedPolls = { ...votedPolls, [pollId]: true };
      setVotedPolls(newVotedPolls);
      localStorage.setItem('votedPolls', JSON.stringify(newVotedPolls));
      fetchPolls();
    }
  }

  return (
    <div>
      {/* Header Judul (Kembali seperti semula dengan warna teal) */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0', color: '#4dd0e1' }}>
          Portal Voting Game
        </h1>
        <p style={{ color: '#a0aabf', fontSize: '14px', margin: 0 }}>Silakan Berikan Suaramu untuk Game Favoritmu!</p>
      </div>
      
      {polls.length === 0 ? <p style={{ color: '#8892b0' }}>Belum ada voting saat ini.</p> : null}
      
      {polls.map((poll) => {
        const hasVoted = votedPolls[poll.id];

        return (
          <div key={poll.id} style={{ marginBottom: '60px' }}>
            <div style={{ borderBottom: '1px solid #233546', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>
                {poll.title}
              </h2>
              {hasVoted && (
                <span style={{ color: '#00e676', fontSize: '14px', fontWeight: 'bold' }}>✓ VOTED</span>
              )}
            </div>

            {/* Grid Kartu Kandidat (4 kolom seperti di gambar) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {poll.options.map((option) => (
                <div key={option.id} className="candidate-card">
                  
                  {/* Gambar Tajam Tanpa Lekukan */}
                  {option.image_url ? (
                    <img src={option.image_url} alt={option.name} style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '280px', background: '#1c212b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>NO IMAGE</div>
                  )}
                  
                  {/* Tombol Biru Menempel di Bawah Gambar */}
                  <button 
                    className="vote-btn"
                    onClick={() => handleVote(poll.id, option.id)}
                    disabled={hasVoted}>
                    {hasVoted ? 'Voted' : 'Vote'}
                  </button>

                  {/* Teks Nama Game di Bawah Tombol (Rata Kiri) */}
                  <div style={{ paddingTop: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {option.name}
                    </h3>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- 2. HALAMAN ADMIN (Desain Kotak Tajam Menyesuaikan Tema) ---
function AdminLoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const ADMIN_PASSWORD = 'admin123'; 

  function handleLogin(e) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) setIsAuthenticated(true);
    else { alert('Password salah!'); setPasswordInput(''); }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', background: '#131822', padding: '40px', border: '1px solid #233546', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#4dd0e1' }}>Admin Portal</h2>
        <p style={{ color: '#8892b0', fontSize: '14px', marginBottom: '30px' }}>Masukkan password.</p>
        <form onSubmit={handleLogin}>
          <input 
            type="password" placeholder="Password" 
            value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            style={{ width: '100%', padding: '14px', marginBottom: '20px', border: '1px solid #333', background: '#0b0e14', color: 'white', boxSizing: 'border-box' }}
          />
          <button type="submit" className="vote-btn">ENTER</button>
        </form>
      </div>
    );
  }
  return <AdminDashboard />;
}

function AdminDashboard() {
  const [polls, setPolls] = useState([]);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { fetchAdminPolls(); }, []);

  async function fetchAdminPolls() {
    const { data, error } = await supabase.from('polls').select(`id, title, options ( id, name, image_url, votes (id) )`);
    if (!error) setPolls(data);
  }

  async function uploadImage(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('images').upload(fileName, file);
    if (error) return null;
    return supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
  }

  async function handleCreatePoll(e) {
    e.preventDefault();
    if (!newPollTitle || !option1 || !option2) { alert("Isi judul dan minimal 2 kandidat!"); return; }
    setIsUploading(true);
    const imageUrl1 = await uploadImage(image1);
    const imageUrl2 = await uploadImage(image2);
    const { data: pollData, error: pollError } = await supabase.from('polls').insert([{ title: newPollTitle }]).select();
    if (pollError) { setIsUploading(false); return; }
    
    await supabase.from('options').insert([
      { poll_id: pollData[0].id, name: option1, image_url: imageUrl1 },
      { poll_id: pollData[0].id, name: option2, image_url: imageUrl2 }
    ]);

    setNewPollTitle(''); setOption1(''); setOption2('');
    setImage1(null); setImage2(null); setIsUploading(false);
    alert("Voting dipublish!"); fetchAdminPolls();
  }

  const inputStyle = { width: '100%', marginBottom: '15px', padding: '12px', border: '1px solid #333', background: '#0b0e14', color: '#fff', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #233546', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#4dd0e1' }}>Admin Dashboard</h2>
        <button onClick={() => window.location.href = '/'} style={{ background: '#233546', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>View Public Site</button>
      </div>

      <div style={{ background: '#131822', padding: '30px', border: '1px solid #233546', marginBottom: '40px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Category</h3>
        <form onSubmit={handleCreatePoll}>
          <input type="text" placeholder="Category Title" value={newPollTitle} onChange={(e) => setNewPollTitle(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', background: '#1c212b', padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Nominee 1</h4>
              <input type="text" placeholder="Game Name" value={option1} onChange={(e) => setOption1(e.target.value)} style={inputStyle} />
              <input type="file" accept="image/*" onChange={(e) => setImage1(e.target.files[0])} style={{ color: '#aaa' }} />
            </div>
            <div style={{ flex: 1, minWidth: '250px', background: '#1c212b', padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Nominee 2</h4>
              <input type="text" placeholder="Game Name" value={option2} onChange={(e) => setOption2(e.target.value)} style={inputStyle} />
              <input type="file" accept="image/*" onChange={(e) => setImage2(e.target.files[0])} style={{ color: '#aaa' }} />
            </div>
          </div>
          <button disabled={isUploading} type="submit" className="vote-btn" style={{ background: isUploading ? '#333' : '#1e88e5' }}>
            {isUploading ? 'UPLOADING...' : 'PUBLISH VOTING'}
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ color: '#1e88e5' }}>📊 Live Voting Results</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {polls.map((poll) => (
            <div key={poll.id} style={{ background: '#131822', padding: '20px', border: '1px solid #233546' }}>
              <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>{poll.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {poll.options.map((opt) => (
                  <li key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '15px' }}>
                    <span>{opt.name}</span>
                    <span style={{ color: '#4dd0e1', fontWeight: 'bold' }}>{opt.votes ? opt.votes.length : 0} Votes</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}