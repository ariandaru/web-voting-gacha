import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <Routes>
          <Route path="/" element={<PublicVotingPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// --- 1. HALAMAN PUBLIK (Bersih tanpa jumlah suara & tanpa menu navigasi) ---
function PublicVotingPage() {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    fetchPolls();
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
    const { error } = await supabase
      .from('votes')
      .insert([{ poll_id: pollId, option_id: optionId }]);

    if (error) {
      console.error(error);
      alert("Gagal melakukan vote.");
    } else {
      alert("Berhasil melakukan vote! Terima kasih suaranya.");
      fetchPolls();
    }
  }

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>🏆 Portal Voting Game</h1>
      <h2 style={{ textAlign: 'center', color: '#555', marginBottom: '30px' }}>Silakan Berikan Suaramu!</h2>
      
      {polls.length === 0 ? <p style={{ textAlign: 'center' }}>Belum ada voting saat ini.</p> : null}
      
      {polls.map((poll) => (
        <div key={poll.id} style={{ border: '2px solid #eee', padding: '20px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', background: 'white' }}>
          <h3 style={{ marginTop: 0, textAlign: 'center', fontSize: '24px' }}>{poll.title}</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            {poll.options.map((option) => (
              <div key={option.id} style={{ flex: 1, textAlign: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                {option.image_url ? (
                  <img src={option.image_url} alt={option.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                ) : (
                  <div style={{ width: '100%', height: '200px', background: '#e9ecef', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                )}
                
                <h4 style={{ margin: '15px 0' }}>{option.name}</h4>
                
                {/* JUMLAH SUARA SENGAJA DIHAPUS DARI SINI AGAR RAHASIA */}
                
                <button 
                  onClick={() => handleVote(poll.id, option.id)}
                  style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', width: '100%' }}>
                  Vote
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- 2. HALAMAN ADMIN DENGAN PROTEKSI PASSWORD & LIHAT HASIL SUARA ---
function AdminLoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // 🔑 PASSWORD ADMIN KAMU (Bisa diubah sesuka hati di sini)
  const ADMIN_PASSWORD = 'admin123'; 

  function handleLogin(e) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Password salah!');
      setPasswordInput('');
    }
  }

  // Jika belum memasukkan password yang benar, tampilkan form login
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', background: '#f8f9fa', padding: '30px', borderRadius: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
        <h2>🔒 Login Admin</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Masukkan password untuk mengakses panel admin.</p>
        <form onSubmit={handleLogin}>
          <input 
            type="password" placeholder="Masukkan Password..." 
            value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer' }}>
            Masuk
          </button>
        </form>
      </div>
    );
  }

  // Jika sudah login, tampilkan Panel Admin (Lengkap dengan Form Buat Voting & Rekap Suara)
  return <AdminDashboard />;
}

// --- KOMPONEN PANEL ADMIN (Tempat Buat Voting & Lihat Jumlah Suara) ---
function AdminDashboard() {
  const [polls, setPolls] = useState([]);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchAdminPolls();
  }, []);

  async function fetchAdminPolls() {
    // Admin mengambil data lengkap BESERTA jumlah suaranya
    const { data, error } = await supabase
      .from('polls')
      .select(`
        id, title,
        options ( id, name, image_url, votes (id) )
      `);
    if (error) console.error(error);
    else setPolls(data);
  }

  async function uploadImage(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    const { error } = await supabase.storage.from('images').upload(fileName, file);
    if (error) {
      alert('Gagal upload gambar!');
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  }

  async function handleCreatePoll(e) {
    e.preventDefault();
    if (!newPollTitle || !option1 || !option2) {
      alert("Harap isi judul dan minimal 2 pilihan!");
      return;
    }

    setIsUploading(true);
    const imageUrl1 = await uploadImage(image1);
    const imageUrl2 = await uploadImage(image2);

    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert([{ title: newPollTitle }])
      .select();

    if (pollError) {
      setIsUploading(false);
      return;
    }
    const newPollId = pollData[0].id;

    await supabase.from('options').insert([
      { poll_id: newPollId, name: option1, image_url: imageUrl1 },
      { poll_id: newPollId, name: option2, image_url: imageUrl2 }
    ]);

    setNewPollTitle(''); setOption1(''); setOption2('');
    setImage1(null); setImage2(null);
    setIsUploading(false);
    alert("Voting baru berhasil dibuat!");
    fetchAdminPolls();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#dc3545', margin: 0 }}>👑 Panel Admin (Rahasia)</h2>
        <button onClick={() => window.location.href = '/'} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>
          Keluar / Lihat Halaman Publik
        </button>
      </div>

      {/* Form Buat Voting */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '40px' }}>
        <h3>Buat Voting Baru</h3>
        <form onSubmit={handleCreatePoll}>
          <input 
            type="text" placeholder="Judul Voting" 
            value={newPollTitle} onChange={(e) => setNewPollTitle(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: '15px', padding: '10px', borderRadius: '6px', boxSizing: 'border-box' }}
          />
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
              <h4>Kandidat 1</h4>
              <input type="text" placeholder="Nama Game" value={option1} onChange={(e) => setOption1(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />
              <input type="file" accept="image/*" onChange={(e) => setImage1(e.target.files[0])} />
            </div>

            <div style={{ flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
              <h4>Kandidat 2</h4>
              <input type="text" placeholder="Nama Game" value={option2} onChange={(e) => setOption2(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />
              <input type="file" accept="image/*" onChange={(e) => setImage2(e.target.files[0])} />
            </div>
          </div>

          <button disabled={isUploading} type="submit" style={{ padding: '10px 20px', background: isUploading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '6px', width: '100%', cursor: 'pointer', fontSize: '16px' }}>
            {isUploading ? 'Sedang Meng-upload...' : '🚀 Publikasikan Voting'}
          </button>
        </form>
      </div>

      {/* Rekap Jumlah Suara (Hanya terlihat di sini) */}
      <div>
        <h3>📊 Rekapitulasi Jumlah Suara (Privat Admin)</h3>
        {polls.map((poll) => (
          <div key={poll.id} style={{ border: '2px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '15px', background: 'white' }}>
            <h4>{poll.title}</h4>
            <ul>
              {poll.options.map((opt) => (
                <li key={opt.id} style={{ marginBottom: '5px', fontSize: '16px' }}>
                  <strong>{opt.name}</strong>: <span style={{ color: 'red', fontWeight: 'bold' }}>{opt.votes ? opt.votes.length : 0} Suara</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}