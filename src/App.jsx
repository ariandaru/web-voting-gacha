import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [polls, setPolls] = useState([]);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');

  // State baru untuk menampung file gambar
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  async function fetchPolls() {
    const { data, error } = await supabase.from('polls').select(`
        id, title,
        options ( id, name, image_url, votes (id) )
      `);
    if (error) console.error('Error fetching data:', error);
    else setPolls(data);
  }

  // Fungsi khusus untuk meng-upload gambar ke Supabase Storage
  async function uploadImage(file) {
    if (!file) return null;

    // Buat nama file unik agar tidak bentrok
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    // Upload ke bucket bernama 'images'
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      alert('Gagal upload gambar!');
      return null;
    }

    // Ambil URL publik dari gambar yang baru di-upload
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  // Fungsi ADMIN yang sudah diperbarui
  async function handleCreatePoll(e) {
    e.preventDefault();
    if (!newPollTitle || !option1 || !option2) {
      alert('Harap isi judul dan minimal 2 pilihan!');
      return;
    }

    setIsUploading(true); // Ubah status tombol loading

    // 1. Upload gambar dulu (jika ada)
    const imageUrl1 = await uploadImage(image1);
    const imageUrl2 = await uploadImage(image2);

    // 2. Masukkan judul ke tabel polls
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert([{ title: newPollTitle }])
      .select();

    if (pollError) {
      console.error(pollError);
      setIsUploading(false);
      return;
    }
    const newPollId = pollData[0].id;

    // 3. Masukkan kandidat beserta URL GAMBARNYA ke tabel options
    const { error: optionsError } = await supabase.from('options').insert([
      { poll_id: newPollId, name: option1, image_url: imageUrl1 },
      { poll_id: newPollId, name: option2, image_url: imageUrl2 },
    ]);

    if (optionsError) console.error(optionsError);

    // Reset form
    setNewPollTitle('');
    setOption1('');
    setOption2('');
    setImage1(null);
    setImage2(null);
    setIsUploading(false);
    fetchPolls();
    alert('Voting baru dengan gambar berhasil dibuat!');
  }

  async function handleVote(pollId, optionId) {
    const { error } = await supabase
      .from('votes')
      .insert([{ poll_id: pollId, option_id: optionId }]);

    if (error) {
      console.error(error);
      alert('Gagal melakukan vote.');
    } else {
      fetchPolls();
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '700px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center' }}>🏆 Portal Voting Game</h1>

      {/* --- BAGIAN ADMIN DASHBOARD --- */}
      <div
        style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #ddd',
          marginBottom: '40px',
        }}
      >
        <h2>👑 Admin: Buat Voting Baru</h2>
        <form onSubmit={handleCreatePoll}>
          <input
            type="text"
            placeholder="Judul Voting (Misal: Game of The Year 2024)"
            value={newPollTitle}
            onChange={(e) => setNewPollTitle(e.target.value)}
            style={{
              display: 'block',
              width: '95%',
              marginBottom: '20px',
              padding: '10px',
              borderRadius: '6px',
            }}
          />

          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div
              style={{
                flex: 1,
                background: 'white',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
              }}
            >
              <h4>Kandidat 1</h4>
              <input
                type="text"
                placeholder="Nama Game"
                value={option1}
                onChange={(e) => setOption1(e.target.value)}
                style={{ width: '90%', marginBottom: '10px', padding: '8px' }}
              />
              <label style={{ fontSize: '14px' }}>Upload Foto:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage1(e.target.files[0])}
              />
            </div>

            <div
              style={{
                flex: 1,
                background: 'white',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
              }}
            >
              <h4>Kandidat 2</h4>
              <input
                type="text"
                placeholder="Nama Game"
                value={option2}
                onChange={(e) => setOption2(e.target.value)}
                style={{ width: '90%', marginBottom: '10px', padding: '8px' }}
              />
              <label style={{ fontSize: '14px' }}>Upload Foto:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage2(e.target.files[0])}
              />
            </div>
          </div>

          <button
            disabled={isUploading}
            type="submit"
            style={{
              padding: '12px 24px',
              background: isUploading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              width: '100%',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            {isUploading ? 'Sedang Meng-upload...' : '🚀 Buat Voting Sekarang!'}
          </button>
        </form>
      </div>

      {/* --- BAGIAN HALAMAN PUBLIK --- */}
      <div>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          🌍 Sedang Berlangsung
        </h2>
        {polls.length === 0 ? (
          <p style={{ textAlign: 'center' }}>Belum ada voting saat ini.</p>
        ) : null}

        {polls.map((poll) => (
          <div
            key={poll.id}
            style={{
              border: '2px solid #eee',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '25px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            }}
          >
            <h3 style={{ marginTop: 0, textAlign: 'center', fontSize: '24px' }}>
              {poll.title}
            </h3>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              {poll.options.map((option) => (
                <div
                  key={option.id}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                  }}
                >
                  {/* Tampilkan gambar jika ada */}
                  {option.image_url ? (
                    <img
                      src={option.image_url}
                      alt={option.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '10px',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '200px',
                        background: '#e9ecef',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      No Image
                    </div>
                  )}

                  <h4 style={{ margin: '10px 0' }}>{option.name}</h4>
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#dc3545',
                    }}
                  >
                    {option.votes ? option.votes.length : 0} Suara
                  </p>

                  <button
                    onClick={() => handleVote(poll.id, option.id)}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      width: '100%',
                    }}
                  >
                    Vote
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
