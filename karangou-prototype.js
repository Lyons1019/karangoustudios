// Fichier: pages/index.js
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

// Composants
import FilmCard from '../components/FilmCard'
import ProjectCard from '../components/ProjectCard'
import HeroSection from '../components/HeroSection'

// Données fictives pour le prototype
const MOCK_FILMS = [
  {
    id: 1,
    title: "Innocent malgré tout",
    director: "Kouamé Mathurin Samuel CODJOVI",
    duration: 105,
    genre: "Drame",
    poster: "/images/innocent.jpg",
    year: 2022,
    synopsis: "L'histoire d'un homme accusé à tort qui lutte pour rétablir sa vérité dans une société africaine contemporaine.",
    associatedProject: 4
  },
  {
    id: 2,
    title: "Les enfants du soleil",
    director: "Abibou Mouktar",
    duration: 130, 
    genre: "Comédie",
    poster: "/images/soleil.jpg",
    year: 2023,
    synopsis: "Suivez l'aventure de trois enfants des rues qui découvrent un talent caché pour la musique.",
    associatedProject: 5
  },
  {
    id: 3,
    title: "Chemins croisés",
    director: "Aïcha N'Diaye",
    duration: 98,
    genre: "Thriller",
    poster: "/images/chemins.jpg", 
    year: 2021,
    synopsis: "Une rencontre fortuite entre deux étrangers déclenche une série d'événements qui changera leur vie à jamais.",
    associatedProject: 6
  },
  {
    id: 4,
    title: "Retour au village",
    director: "Kwame Mensah",
    duration: 85,
    genre: "Documentaire",
    poster: "/images/village.jpg",
    year: 2023, 
    synopsis: "Un documentaire poignant sur l'exode rural inversé et le renouveau des traditions culturelles.",
    associatedProject: 7
  }
];

const MOCK_PROJECTS = [
  {
    id: 5,
    title: "Les héritiers",
    director: "Kouamé Mathurin Samuel CODJOVI",
    genre: "Drame historique",
    poster: "/images/heritiers.jpg",
    synopsis: "Une famille déchirée par les conséquences de la colonisation tente de récupérer son héritage culturel.",
    goal: 35000,
    raised: 12450,
    endDate: "2025-06-15",
    associatedFilm: 1
  },
  {
    id: 6,
    title: "Chroniques d'Abidjan",
    director: "Abibou Mouktar",
    genre: "Comédie dramatique",
    poster: "/images/abidjan.jpg",
    synopsis: "Une série de vignettes interconnectées racontant la vie quotidienne dans la métropole ivoirienne.",
    goal: 28000,
    raised: 9200,
    endDate: "2025-05-30",
    associatedFilm: 2
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('films');

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Karangou Studios - Financement participatif de films africains</title>
        <meta name="description" content="Plateforme de VOD et financement participatif pour films africains" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-2xl font-bold text-amber-500">Karangou Studios</a>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/films">
              <a className="hover:text-amber-400 transition">Films</a>
            </Link>
            <Link href="/projets">
              <a className="hover:text-amber-400 transition">Projets</a>
            </Link>
            <Link href="/communaute">
              <a className="hover:text-amber-400 transition">Communauté</a>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/recherche">
              <a className="text-gray-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </a>
            </Link>
            <Link href="/connexion">
              <a className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-full text-sm font-medium transition">
                Connexion
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gray-900 text-white">
          <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-30"></div>
          <div className="container mx-auto px-4 py-20 relative z-10 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Découvrez et Financez <br/> le Cinéma Africain</h1>
            <p className="text-lg mb-8 max-w-2xl">Regardez gratuitement des films africains tout en contribuant au financement des prochains chefs-d'œuvre du continent.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/films">
                <a className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-full text-lg font-medium transition">
                  Découvrir les films
                </a>
              </Link>
              <Link href="/soumettre-projet">
                <a className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-3 rounded-full text-lg font-medium transition">
                  Soumettre un projet
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Films & Projects Tabs */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex border-b border-gray-200 mb-8">
            <button 
              className={`px-6 py-3 font-medium text-lg ${activeTab === 'films' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('films')}
            >
              Films à l'affiche
            </button>
            <button 
              className={`px-6 py-3 font-medium text-lg ${activeTab === 'projects' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('projects')}
            >
              Projets à financer
            </button>
          </div>

          {activeTab === 'films' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_FILMS.map(film => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {MOCK_PROJECTS.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href={activeTab === 'films' ? "/films" : "/projets"}>
              <a className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center">
                Voir tous les {activeTab === 'films' ? 'films' : 'projets'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </Link>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Étape 1 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-3">Regardez gratuitement</h3>
                <p className="text-gray-600">Profitez de films africains de qualité, entièrement gratuits sur notre plateforme.</p>
              </div>
              
              {/* Étape 2 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-3">Découvrez des projets</h3>
                <p className="text-gray-600">Chaque film est associé à un nouveau projet de film en recherche de financement.</p>
              </div>
              
              {/* Étape 3 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-3">Contribuez facilement</h3>
                <p className="text-gray-600">Soutenez la création avec un don via mobile money, carte bancaire ou autres moyens locaux.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi nous rejoindre */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
              <h2 className="text-3xl font-bold mb-6">Pourquoi rejoindre Karangou Studios ?</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Soutenez directement les talents du cinéma africain</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Accédez gratuitement à des films de qualité</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Participez à l'émergence d'un cinéma africain indépendant</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Contribuez selon vos moyens, sans minimum requis</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link href="/a-propos">
                  <a className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center">
                    En savoir plus sur notre mission
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative rounded-lg overflow-hidden shadow-xl">
                <img 
                  src="/images/african-cinema.jpg" 
                  alt="Cinéastes africains au travail" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6">
                    <p className="text-white text-lg font-medium">Notre communauté compte déjà plus de 200 cinéastes à travers 15 pays d'Afrique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Témoignages */}
        <section className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Ils nous font confiance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Témoignage 1 */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-600 mr-4"></div>
                  <div>
                    <h4 className="font-medium">Aminata Diallo</h4>
                    <p className="text-amber-400 text-sm">Réalisatrice - Sénégal</p>
                  </div>
                </div>
                <p className="text-gray-300">"Grâce à Karangou Studios, j'ai pu lever les fonds nécessaires pour mon premier long-métrage en seulement deux mois. La plateforme m'a permis de toucher un public bien au-delà de mes frontières."</p>
              </div>
              
              {/* Témoignage 2 */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-600 mr-4"></div>
                  <div>
                    <h4 className="font-medium">Emmanuel Osei</h4>
                    <p className="text-amber-400 text-sm">Producteur - Ghana</p>
                  </div>
                </div>
                <p className="text-gray-300">"Le modèle de Karangou est révolutionnaire pour le cinéma africain. Il nous permet enfin de contourner les obstacles traditionnels tout en préservant notre indépendance artistique."</p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Link href="/temoignages">
                <a className="border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white px-6 py-3 rounded-full font-medium transition">
                  Voir tous les témoignages
                </a>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-amber-500 mb-4">Karangou Studios</h3>
              <p className="text-gray-400 mb-4">Plateforme de VOD et de financement participatif dédiée au cinéma africain.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Navigation</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/films"><a className="hover:text-white">Films</a></Link></li>
                <li><Link href="/projets"><a className="hover:text-white">Projets</a></Link></li>
                <li><Link href="/communaute"><a className="hover:text-white">Communauté</a></Link></li>
                <li><Link href="/a-propos"><a className="hover:text-white">À propos</a></Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Cinéastes</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/soumettre-projet"><a className="hover:text-white">Soumettre un projet</a></Link></li>
                <li><Link href="/partenariats"><a className="hover:text-white">Devenir partenaire</a></Link></li>
                <li><Link href="/ressources"><a className="hover:text-white">Ressources</a></Link></li>
                <li><Link href="/faq-cineastes"><a className="hover:text-white">FAQ Cinéastes</a></Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Lomé, Togo</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>contact@karangou-studios.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+228 90 12 34 56</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Karangou Studios. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}