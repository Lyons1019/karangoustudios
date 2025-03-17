// Fichier: components/FilmCard.js
import Link from 'next/link';

const FilmCard = ({ film }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md transition-transform hover:scale-105">
      <div className="relative pb-2/3">
        <Link href={`/films/${film.id}`}>
          <a>
            <img 
              src={film.poster || "/images/placeholder-poster.jpg"} 
              alt={film.title}
              className="absolute h-full w-full object-cover"
            />
          </a>
        </Link>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Link href={`/films/${film.id}`}>
            <a className="block">
              <h3 className="font-bold text-lg leading-tight hover:text-amber-600 transition">{film.title}</h3>
            </a>
          </Link>
          <span className="bg-gray-100 text-xs px-2 py-1 rounded">{film.year}</span>
        </div>
        
        <p className="text-gray-600 text-sm mt-1">{film.director}</p>
        
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <span className="mr-3">{film.genre}</span>
          <span>{Math.floor(film.duration / 60)}h{film.duration % 60 > 0 ? ` ${film.duration % 60}min` : ''}</span>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Link href={`/films/${film.id}`}>
            <a className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium transition">
              Regarder
            </a>
          </Link>
          <Link href={`/projets/${film.associatedProject}`}>
            <a className="text-amber-600 hover:text-amber-700 text-sm underline">
              Voir le projet associé
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FilmCard;

// Fichier: components/ProjectCard.js
import Link from 'next/link';

const ProjectCard = ({ project }) => {
  // Calcul du pourcentage de financement
  const fundingPercentage = Math.min(Math.round((project.raised / project.goal) * 100), 100);
  
  // Calcul du temps restant
  const calculateTimeLeft = () => {
    const endDate = new Date(project.endDate);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Campagne terminée";
    if (diffDays === 1) return "Dernier jour";
    return `${diffDays} jours restants`;
  };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
      <div className="relative">
        <Link href={`/projets/${project.id}`}>
          <a>
            <img 
              src={project.poster || "/images/placeholder-project.jpg"} 
              alt={project.title}
              className="w-full h-64 object-cover"
            />
          </a>
        </Link>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-sm font-medium">{calculateTimeLeft()}</p>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/projets/${project.id}`}>
            <a className="block">
              <h3 className="font-bold text-xl leading-tight hover:text-amber-600 transition">{project.title}</h3>
            </a>
          </Link>
          <span className="bg-gray-100 text-xs px-2 py-1 rounded">{project.genre}</span>
        </div>
        
        <p className="text-gray-600 text-sm">Par {project.director}</p>
        
        <p className="mt-3 text-gray-700 line-clamp-3">{project.synopsis}</p>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{fundingPercentage}% financé</span>
            <span>{project.raised.toLocaleString()} FCFA sur {project.goal.toLocaleString()} FCFA</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-amber-500 h-2.5 rounded-full" 
              style={{ width: `${fundingPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <Link href={`/projets/${project.id}`}>
            <a className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium transition flex-1 text-center">
              Contribuer
            </a>
          </Link>
          <Link href={`/films/${project.associatedFilm}`}>
            <a className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition text-center">
              Film associé
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

// Fichier: components/VideoPlayer.js
import { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ videoUrl, poster, title }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Gérer la lecture/pause
  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // Gérer le changement de temps
  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };
  
  // Gérer le chargement de la métadonnée vidéo
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };
  
  // Gérer la fin de la vidéo
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    videoRef.current.currentTime = 0;
  };
  
  // Gérer le changement de la position
  const handleSeek = (e) => {
    const seekTime = (e.nativeEvent.offsetX / e.currentTarget.clientWidth) * duration;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  // Gérer le plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Gérer le volume
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  // Masquer les contrôles après un délai d'inactivité
  useEffect(() => {
    let timeout;
    
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      setShowControls(true);
      
      if (isPlaying) {
        timeout = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };
    
    const playerElement = videoRef.current;
    if (playerElement) {
      playerElement.addEventListener('mousemove', resetTimeout);
      resetTimeout();
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
      if (playerElement) {
        playerElement.removeEventListener('mousemove', resetTimeout);
      }
    };
  }, [isPlaying]);
  
  return (
    <div 
      className="relative w-full bg-black rounded-lg overflow-hidden"
      onMouseMove={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="w-full"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
      />
      
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Barre de progression */}
        <div 
          className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-amber-500 rounded-full relative"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* Contrôles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={togglePlay}
              className="text-white focus:outline-none"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 accent-amber-500"
              />
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <button 
              onClick={toggleFullscreen}
              className="text-white focus:outline-none"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-1 1H1a1 1 0 010-2h1V5a3 3 0 013-3h3a1 1 0 010 2H5zm10 0a1 1 0 00-1 1v3a1 1 0 002 0V5a1 1 0 00-1-1zM5 16a1 1 0 001-1v-3a1 1 0 10-2 0v3a1 1 0 001 1zm10 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 110 2h-1v3a3 3 0 01-3 3h-3a1 1 0 110-2h3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

// Fichier: components/PaymentForm.js
import { useState } from 'react';

const PaymentForm = ({ projectId, projectTitle, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Validation basique
    if (!amount || parseFloat(amount) <= 0) {
      setError('Veuillez entrer un montant valide.');
      setIsLoading(false);
      return;
    }
    
    if (paymentMethod === 'mobile_money' && !phoneNumber) {
      setError('Veuillez entrer un numéro de téléphone.');
      setIsLoading(false);
      return;
    }
    
    if (!name || !email) {
      setError('Veuillez remplir tous les champs obligatoires.');
      setIsLoading(false);
      return;
    }
    
    try {
      // Simulation d'une requête API pour initier le paiement
      // Dans un environnement réel, appelez votre API backend ici
      setTimeout(() => {
        // Simuler le succès du paiement
        setIsLoading(false);
        if (onSuccess) {
          onSuccess({
            transactionId: 'TR' + Math.floor(Math.random() * 10000000),
            amount: parseFloat(amount),
            paymentMethod,
            date: new Date().toISOString()
          });
        }
      }, 2000);
      
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer plus tard.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Soutenir ce projet</h3>
      
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Montant (FCFA)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Ex: 5000"
            min="100"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Mode de paiement</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`border rounded-lg p-3 flex items-center ${paymentMethod === 'mobile_money' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
              onClick={() => setPaymentMethod('mobile_money')}
            >
              <div className="w-6 h-6 mr-2 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Mobile Money</span>
            </button>
            
            <button
              type="button"
              className={`border rounded-lg p-3 flex items-center ${paymentMethod === 'card' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="w-6 h-6 mr-2 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span>Carte bancaire</span>
            </button>
          </div>
        </div>
        
        {paymentMethod === 'mobile_money' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Opérateur</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                className={`border rounded-lg py-2 px-3 flex items-center justify-center ${selectedProvider === 'mtn' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
                onClick={() => setSelectedProvider('mtn')}
              >
                <span className="font-medium text-yellow-600">MTN</span>
              </button>
              
              <button
                type="button"
                className={`border rounded-lg py-2 px-3 flex items-center justify-center ${selectedProvider === 'moov' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
                onClick={() => setSelectedProvider('moov')}
              >
                <span className="font-medium text-blue-600">Moov</span>
              </button>
              
              <button
                type="button"
                className={`border rounded-lg py-2 px-3 flex items-center justify-center ${selectedProvider === 'flooz' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
                onClick={() => setSelectedProvider('flooz')}
              >
                <span className="font-medium text-green-600">Flooz</span>
              </button>
            </div>
            
            <label className="block text-gray-700 font-medium mb-2">Numéro de téléphone</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: +228 90 12 34 56"
              required={paymentMethod === 'mobile_money'}
            />
          </div>
        )}
        
        {paymentMethod === 'card' && (
          <div className="mb-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-700">Le paiement par carte sera traité de manière sécurisée par notre partenaire de paiement.</p>
            </div>
            
            <label className="block text-gray-700 font-medium mb-2">Numéro de carte</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
              placeholder="•••• •••• •••• ••••"
              required={paymentMethod === 'card'}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Date d'expiration</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="MM/AA"
                  required={paymentMethod === 'card'}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">CVC</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="123"
                  required={paymentMethod === 'card'}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Nom complet</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Ex: Kodjo Amenyo"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Ex: kodjo@exemple.com"
            required
          />
        </div>
        
        <button
          type="submit"
          className={`w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-medium transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Traitement en cours...
            </span>
          ) : (
            `Contribuer ${amount ? Number(amount).toLocaleString() + ' FCFA' : ''}`
          )}
        </button>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          En effectuant ce paiement, vous acceptez nos conditions générales et notre politique de confidentialité.
        </p>
      </form>
    </div>
  );
};

export default PaymentForm;