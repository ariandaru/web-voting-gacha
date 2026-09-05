import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';

export default function App() {
  return (
    <BrowserRouter>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #0b0e14;
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
          background-color: #1e88e5;
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

// --- 1. HALAMAN PUBLIK ---
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
      .select(`id, title, options ( id, name, image_url )`)
      .order('id', { ascending: false }); // Menampilkan yang terbaru di atas
    if (!error) setPolls(data);
  }

  async function handleVote(pollId, optionId) {
    if (votedPolls[pollId]) {
      alert("Kamu sudah memberikan suara pada kategori ini.");
      return;
    }
    const { error } = await supabase.from('votes').insert([{ poll_id: pollId, option_id: optionId }]);
    if (!error) {
      const newVotedPolls = { ...votedPolls, [pollId]: true };
      setVotedPolls(newVotedPolls);
      localStorage.setItem('votedPolls', JSON.stringify(newVotedPolls));
      fetchPolls();
    } else {
      alert("Gagal melakukan vote.");
    }
  }

  return (
    <div>
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
              <h2 style={{ fontSize: '20px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{poll.title}</h2>
              {hasVoted && <span style={{ color: '#00e676', fontSize: '14px', fontWeight: 'bold' }}>✓ VOTED</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {poll.options.map((option) => (
                <div key={option.id} className="candidate-card">
                  {option.image_url ? (
                    <img src={option.image_url} alt={option.name} style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '280px', background: '#1c212b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>NO IMAGE</div>
                  )}
                  <button className="vote-btn" onClick={() => handleVote(poll.id, option.id)} disabled={hasVoted}>
                    {hasVoted ? 'Voted' : 'Vote'}
                  </button>
                  <div style={{ paddingTop: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{option.name}</h3>
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

// --- 2. HALAMAN ADMIN ---
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
        <form onSubmit={handleLogin}>
          <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ width: '100%', padding: '14px', marginBottom: '20px', border: '1px solid #333', background: '#0b0e14', color: 'white', boxSizing: 'border-box' }} />
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
  
  // State untuk Fitur Edit
  const [editMode, setEditMode] = useState(false);
  const [editPollId, setEditPollId] = useState(null);
  const [editOpt1Id, setEditOpt1Id] = useState(null);
  const [editOpt2Id, setEditOpt2Id] = useState(null);

  useEffect(() => { fetchAdminPolls(); }, []);

  async function fetchAdminPolls() {
    const { data, error } = await supabase.from('polls').select(`id, title, options ( id, name, image_url, votes (id) )`).order('id', { ascending: false });
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

  // Fungsi Tambah & Edit
  async function handleCreateOrUpdate(e) {
    e.preventDefault();
    if (!newPollTitle || !option1 || !option2) { alert("Isi judul dan minimal 2 kandidat!"); return; }
    setIsUploading(true);
    
    const imageUrl1 = await uploadImage(image1);
    const imageUrl2 = await uploadImage(image2);

    if (editMode) {
      // Proses UPDATE Data
      await supabase.from('polls').update({ title: newPollTitle }).eq('id', editPollId);
      
      let updateData1 = { name: option1 };
      if (imageUrl1) updateData1.image_url = imageUrl1;
      await supabase.from('options').update(updateData1).eq('id', editOpt1Id);

      let updateData2 = { name: option2 };
      if (imageUrl2) updateData2.image_url = imageUrl2;
      await supabase.from('options').update(updateData2).eq('id', editOpt2Id);

      alert("Kategori berhasil diperbarui!");
      cancelEdit();
    } else {
      // Proses CREATE Data Baru
      const { data: pollData, error: pollError } = await supabase.from('polls').insert([{ title: newPollTitle }]).select();
      if (pollError) { setIsUploading(false); return; }
      
      await supabase.from('options').insert([
        { poll_id: pollData[0].id, name: option1, image_url: imageUrl1 },
        { poll_id: pollData[0].id, name: option2, image_url: imageUrl2 }
      ]);
      alert("Voting dipublish!");
      resetForm();
    }
    
    setIsUploading(false);
    fetchAdminPolls();
  }

  // Fungsi Hapus Data
  async function handleDelete(pollId) {
    if (!window.confirm("YAKIN INGIN MENGHAPUS KATEGORI INI?\nSemua data game dan suara akan terhapus permanen.")) return;
    
    // Hapus dari database (Votes -> Options -> Polls) agar aman
    await supabase.from('votes').delete().eq('poll_id', pollId);
    await supabase.from('options').delete().eq('poll_id', pollId);
    const { error } = await supabase.from('polls').delete().eq('id', pollId);
    
    if (error) alert("Gagal menghapus kategori!");
    else fetchAdminPolls();
  }

  // Fungsi Masuk Mode Edit
  function startEdit(poll) {
    setEditMode(true);
    setEditPollId(poll.id);
    setNewPollTitle(poll.title);
    setOption1(poll.options[0]?.name || '');
    setEditOpt1Id(poll.options[0]?.id || null);
    setOption2(poll.options[1]?.name || '');
    setEditOpt2Id(poll.options[1]?.id || null);
    setImage1(null);
    setImage2(null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll otomatis ke atas
  }

  function resetForm() {
    setNewPollTitle(''); setOption1(''); setOption2('');
    setImage1(null); setImage2(null);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditPollId(null);
    resetForm();
  }

  const inputStyle = { width: '100%', marginBottom: '15px', padding: '12px', border: '1px solid #333', background: '#0b0e14', color: '#fff', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #233546', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#4dd0e1' }}>Admin Dashboard</h2>
        <button onClick={() => window.location.href = '/'} style={{ background: '#233546', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>View Public Site</button>
      </div>

      <div style={{ background: '#131822', padding: '30px', border: editMode ? '2px solid #fbc02d' : '1px solid #233546', marginBottom: '40px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: editMode ? '#fbc02d' : '#fff' }}>
          {editMode ? '✏️ Edit Kategori Voting' : '➕ Buat Kategori Baru'}
        </h3>
        <form onSubmit={handleCreateOrUpdate}>
          <input type="text" placeholder="Category Title" value={newPollTitle} onChange={(e) => setNewPollTitle(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', background: '#1c212b', padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Nominee 1</h4>
              <input type="text" placeholder="Game Name" value={option1} onChange={(e) => setOption1(e.target.value)} style={inputStyle} />
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 5px 0' }}>{editMode ? '*Upload foto baru jika ingin mengganti' : '*Upload foto kandidat'}</p>
              <input type="file" accept="image/*" onChange={(e) => setImage1(e.target.files[0])} style={{ color: '#aaa' }} />
            </div>
            <div style={{ flex: 1, minWidth: '250px', background: '#1c212b', padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Nominee 2</h4>
              <input type="text" placeholder="Game Name" value={option2} onChange={(e) => setOption2(e.target.value)} style={inputStyle} />
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 5px 0' }}>{editMode ? '*Upload foto baru jika ingin mengganti' : '*Upload foto kandidat'}</p>
              <input type="file" accept="image/*" onChange={(e) => setImage2(e.target.files[0])} style={{ color: '#aaa' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button disabled={isUploading} type="submit" className="vote-btn" style={{ background: isUploading ? '#333' : (editMode ? '#fbc02d' : '#1e88e5'), color: editMode ? '#000' : '#fff', flex: 1 }}>
              {isUploading ? 'SAVING...' : (editMode ? 'UPDATE KATEGORI' : 'PUBLISH VOTING')}
            </button>
            {editMode && (
              <button type="button" onClick={cancelEdit} className="vote-btn" style={{ background: '#333', flex: 0.3 }}>BATAL</button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h3 style={{ color: '#1e88e5' }}>📊 Live Voting Results & Manajemen</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {polls.map((poll) => (
            <div key={poll.id} style={{ background: '#131822', padding: '20px', border: '1px solid #233546' }}>
              <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>{poll.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '20px' }}>
                {poll.options.map((opt) => (
                  <li key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '15px' }}>
                    <span>{opt.name}</span>
                    <span style={{ color: '#4dd0e1', fontWeight: 'bold' }}>{opt.votes ? opt.votes.length : 0} Votes</span>
                  </li>
                ))}
              </ul>
              
              {/* Tombol Aksi Admin */}
              <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                <button onClick={() => startEdit(poll)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #fbc02d', color: '#fbc02d', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Edit</button>
                <button onClick={() => handleDelete(poll.id)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #d32f2f', color: '#d32f2f', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Hapus</button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}