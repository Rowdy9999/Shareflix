import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, Star, Clock, Globe, ArrowRight, ArrowLeft, Check, Loader2, Plus, AlertCircle, Edit3 } from 'lucide-react'
import { supabase, searchTMDB, TMDB_IMG, slugify, normalizeTitle } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function SubmitMovie() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    poster_path: '',
    backdrop_path: '',
    description: '',
    release_date: '',
    release_year: '',
    vote_average: 0,
    genres: [],
    runtime: 0,
    cast: [],
    director: '',
    tmdb_id: null,
    poster_url: '',
    backdrop_url: '',
    language: 'en',
    quality: 'HD',
    subtitles: 'English'
  })

  const [downloadInfo, setDownloadInfo] = useState({
    download_url: '',
    watch_url: '',
    quality: 'HD',
    language: 'en',
    subtitles: 'English'
  })

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await searchTMDB(searchQuery.trim())
      setSearchResults(results)
      if (results.length === 0) {
        toast.info('No results found. Try a different title or add manually.')
      }
    } catch {
      toast.error('Search failed. Try adding manually.')
    }
    setSearching(false)
  }

  function selectResult(movie) {
    setForm({
      title: movie.title || '',
      poster_path: movie.poster_path || '',
      backdrop_path: movie.backdrop_path || '',
      description: movie.overview || '',
      release_date: movie.release_date || '',
      release_year: movie.release_date ? movie.release_date.substring(0, 4) : '',
      vote_average: movie.vote_average || 0,
      genres: movie.genre_ids || [],
      runtime: 0,
      cast: [],
      director: '',
      tmdb_id: movie.id || null,
      poster_url: '',
      backdrop_url: '',
      language: 'en',
      quality: 'HD',
      subtitles: 'English'
    })
    setStep(2)
  }

  function toggleManual() {
    setManualMode(!manualMode)
    if (!manualMode) {
      setForm({
        title: '',
        poster_path: '',
        backdrop_path: '',
        description: '',
        release_date: '',
        release_year: '',
        vote_average: 0,
        genres: [],
        runtime: 0,
        cast: [],
        director: '',
        tmdb_id: null,
        poster_url: '',
        backdrop_url: '',
        language: 'en',
        quality: 'HD',
        subtitles: 'English'
      })
      setStep(2)
    }
  }

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateDownload(field, value) {
    setDownloadInfo(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!user) {
      toast.error('You must be logged in to submit a movie')
      return
    }
    if (!form.title) {
      toast.error('Movie title is required')
      return
    }
    if (!downloadInfo.download_url) {
      toast.error('Download URL is required')
      return
    }

    setSubmitting(true)
    try {
      const { data: cooldown } = await supabase.rpc('check_submission_cooldown', {
        user_id_param: user.id
      })
      if (cooldown === false) {
        toast.error('You can only submit one movie every 24 hours. Please try again later.')
        setSubmitting(false)
        return
      }

      if (form.tmdb_id) {
        const { data: existing } = await supabase
          .from('movies')
          .select('id')
          .eq('tmdb_id', form.tmdb_id)
          .maybeSingle()
        if (existing) {
          toast.error('This movie has already been submitted.')
          setSubmitting(false)
          return
        }
      } else {
        const normalizedTitle = normalizeTitle(form.title)
        const { data: existing } = await supabase
          .from('movies')
          .select('id')
          .eq('normalized_title', normalizedTitle)
          .eq('release_year', parseInt(form.release_year) || 0)
          .maybeSingle()
        if (existing) {
          toast.error('This movie has already been submitted.')
          setSubmitting(false)
          return
        }
      }

      const movieSlug = slugify(form.title)

      const posterUrl = manualMode && form.poster_url ? form.poster_url : form.poster_path
      const backdropUrl = manualMode && form.backdrop_url ? form.backdrop_url : form.backdrop_path

      const movieData = {
        title: form.title,
        slug: movieSlug,
        normalized_title: normalizeTitle(form.title),
        description: form.description,
        poster_path: posterUrl,
        backdrop_path: backdropUrl,
        release_year: parseInt(form.release_year) || 0,
        release_date: form.release_date,
        vote_average: form.vote_average,
        genres: form.genres,
        runtime: form.runtime,
        cast: form.cast,
        director: form.director,
        tmdb_id: form.tmdb_id,
        original_language: form.language,
        quality: form.quality || downloadInfo.quality,
        subtitles: form.subtitles || downloadInfo.subtitles,
        download_url: downloadInfo.download_url,
        watch_url: downloadInfo.watch_url || null,
        owner_id: user.id,
        status: 'pending',
        total_visitors: 0,
        qualified_visitors: 0,
        total_earnings: 0,
        available_earnings: 0,
        pending_earnings: 0
      }

      const { data: movie, error: movieError } = await supabase
        .from('movies')
        .insert(movieData)
        .select()
        .single()

      if (movieError) throw movieError

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          movie_id: movie.id,
          user_id: user.id,
          title: form.title,
          tmdb_id: form.tmdb_id,
          status: 'pending'
        })

      if (submissionError) console.warn('Submission record error:', submissionError)

      toast.success('Movie submitted successfully! It will appear after admin review.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to submit movie. Please try again.')
    }
    setSubmitting(false)
  }

  const genreMap = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
    53: 'Thriller', 10752: 'War', 37: 'Western'
  }

  return (
    <div className="page">
      <Helmet>
        <title>Submit Movie - ShareFlix</title>
      </Helmet>
      <div className="container" style={{ maxWidth: 800, padding: '32px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Submit a Movie</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Share a movie with the community and earn rewards
        </p>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
          {['Search TMDB', 'Movie Details', 'Download Info', 'Review & Submit'].map((label, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: step === i + 1 ? 'var(--accent)' : step > i + 1 ? 'var(--success)' : 'var(--bg-card)',
                color: step === i + 1 ? '#fff' : step > i + 1 ? '#fff' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              {step > i + 1 ? <Check size={14} /> : i + 1}
              <span style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Search */}
        {step === 1 && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Search TMDB</h2>
              <button className="btn btn-outline btn-sm" onClick={toggleManual}>
                <Edit3 size={14} /> Add Manually
              </button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Search movie title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={searching}>
                {searching ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
              </button>
            </form>

            {searching && (
              <div className="grid-3">
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3' }} />
                    <div style={{ padding: 10 }}>
                      <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 6 }} />
                      <div className="skeleton" style={{ width: '50%', height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="grid-3">
                {searchResults.map((movie) => (
                  <div
                    key={movie.id}
                    className="card"
                    style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => selectResult(movie)}
                  >
                    <img
                      src={movie.poster_path ? `${TMDB_IMG}/w300${movie.poster_path}` : '/no-poster.png'}
                      alt={movie.title}
                      style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div style={{ padding: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>
                        {movie.title}
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>{movie.release_date?.substring(0, 4) || 'N/A'}</span>
                        {movie.vote_average > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Star size={11} fill="#f59e0b" stroke="#f59e0b" /> {movie.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {movie.overview || 'No description available.'}
                      </p>
                      <button className="btn btn-primary btn-sm btn-full" style={{ marginTop: 8 }}>
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <Search size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p>Search for a movie to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Movie Details */}
        {step === 2 && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {manualMode ? 'Add Movie Manually' : 'Movie Details'}
              </h2>
              <button className="btn btn-outline btn-sm" onClick={() => { setManualMode(false); setStep(1) }}>
                <ArrowLeft size={14} /> Back to Search
              </button>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  required
                  placeholder="Movie title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Release Year</label>
                <input
                  className="form-input"
                  type="number"
                  min="1900"
                  max="2030"
                  value={form.release_year}
                  onChange={(e) => updateForm('release_year', e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rating (0-10)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={form.vote_average}
                  onChange={(e) => updateForm('vote_average', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Runtime (minutes)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.runtime}
                  onChange={(e) => updateForm('runtime', parseInt(e.target.value) || 0)}
                  placeholder="120"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Director</label>
                <input
                  className="form-input"
                  value={form.director}
                  onChange={(e) => updateForm('director', e.target.value)}
                  placeholder="Director name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  className="form-input"
                  value={form.language}
                  onChange={(e) => updateForm('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="ml">Malayalam</option>
                  <option value="kn">Kannada</option>
                  <option value="bn">Bengali</option>
                  <option value="mr">Marathi</option>
                  <option value="pa">Punjabi</option>
                  <option value="ur">Urdu</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              {manualMode && (
                <>
                  <div className="form-group">
                    <label className="form-label">Poster URL</label>
                    <input
                      className="form-input"
                      value={form.poster_url}
                      onChange={(e) => updateForm('poster_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Backdrop URL</label>
                    <input
                      className="form-input"
                      value={form.backdrop_url}
                      onChange={(e) => updateForm('backdrop_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={4}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Movie description..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Cast (comma separated)</label>
              <input
                className="form-input"
                value={form.cast.join(', ')}
                onChange={(e) => updateForm('cast', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Actor 1, Actor 2, Actor 3"
              />
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Genres</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(genreMap).map(([id, name]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      const numId = parseInt(id)
                      updateForm('genres',
                        form.genres.includes(numId)
                          ? form.genres.filter(g => g !== numId)
                          : [...form.genres, numId]
                      )
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: '1px solid var(--border)',
                      background: form.genres.includes(parseInt(id)) ? 'var(--accent)' : 'var(--bg-card)',
                      color: form.genres.includes(parseInt(id)) ? '#fff' : 'var(--text)',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => {
                if (!form.title) { toast.error('Title is required'); return }
                setStep(3)
              }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Download Info */}
        {step === 3 && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Download Information</h2>

            <div className="form-group">
              <label className="form-label">Download URL *</label>
              <input
                className="form-input"
                value={downloadInfo.download_url}
                onChange={(e) => updateDownload('download_url', e.target.value)}
                required
                placeholder="https://..."
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Link where users can download the movie
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Watch URL (optional)</label>
              <input
                className="form-input"
                value={downloadInfo.watch_url}
                onChange={(e) => updateDownload('watch_url', e.target.value)}
                placeholder="https://..."
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Online streaming link (if available)
              </p>
            </div>

            <div className="grid-3" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Quality</label>
                <select
                  className="form-input"
                  value={downloadInfo.quality}
                  onChange={(e) => updateDownload('quality', e.target.value)}
                >
                  <option value="CAM">CAM</option>
                  <option value="HDRip">HDRip</option>
                  <option value="DVDScr">DVDScr</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4K">4K</option>
                  <option value="HD">HD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  className="form-input"
                  value={downloadInfo.language}
                  onChange={(e) => updateDownload('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="ml">Malayalam</option>
                  <option value="multi">Multi Audio</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subtitles</label>
                <select
                  className="form-input"
                  value={downloadInfo.subtitles}
                  onChange={(e) => updateDownload('subtitles', e.target.value)}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="None">None</option>
                  <option value="Embedded">Embedded</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => {
                if (!downloadInfo.download_url) { toast.error('Download URL is required'); return }
                setStep(4)
              }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Review & Submit</h2>

            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
              {(form.poster_path || form.poster_url) && (
                <img
                  src={manualMode ? form.poster_url : (form.poster_path ? `${TMDB_IMG}/w300${form.poster_path}` : '/no-poster.png')}
                  alt={form.title}
                  style={{ width: 120, borderRadius: 'var(--radius)', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{form.title}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, flexWrap: 'wrap' }}>
                  {form.release_year && <span>{form.release_year}</span>}
                  {form.vote_average > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={13} fill="#f59e0b" stroke="#f59e0b" /> {form.vote_average.toFixed(1)}
                    </span>
                  )}
                  {form.runtime > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={13} /> {Math.floor(form.runtime / 60)}h {form.runtime % 60}m
                    </span>
                  )}
                </div>
                {form.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {form.description.substring(0, 200)}{form.description.length > 200 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              {form.director && (
                <div>
                  <div className="form-label">Director</div>
                  <div style={{ fontSize: 13 }}>{form.director}</div>
                </div>
              )}
              {form.cast.length > 0 && (
                <div>
                  <div className="form-label">Cast</div>
                  <div style={{ fontSize: 13 }}>{form.cast.slice(0, 3).join(', ')}{form.cast.length > 3 ? '...' : ''}</div>
                </div>
              )}
              {form.genres.length > 0 && (
                <div>
                  <div className="form-label">Genres</div>
                  <div style={{ fontSize: 13 }}>{form.genres.map(g => genreMap[g]).filter(Boolean).join(', ')}</div>
                </div>
              )}
              <div>
                <div className="form-label">Quality</div>
                <div style={{ fontSize: 13 }}>{downloadInfo.quality}</div>
              </div>
              <div>
                <div className="form-label">Language</div>
                <div style={{ fontSize: 13 }}>{downloadInfo.language}</div>
              </div>
              <div>
                <div className="form-label">Download URL</div>
                <div style={{ fontSize: 13, color: 'var(--success)', wordBreak: 'break-all' }}>
                  {downloadInfo.download_url.substring(0, 40)}...
                </div>
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertCircle size={16} color="var(--warning)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Before you submit</span>
              </div>
              <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li>You can submit one movie every 24 hours</li>
                <li>Your movie will be reviewed by an admin</li>
                <li>Once approved, you can share it to earn rewards</li>
                <li>Earnings are credited after qualified visits</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setStep(3)} disabled={submitting}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><Loader2 size={18} className="spin" /> Submitting...</>
                ) : (
                  <><Check size={18} /> Submit Movie</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
