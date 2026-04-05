import React, { useState, useRef } from 'react';
import { generateBookRecommendations, Recommendations } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

export default function ShelfExpanderApp() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateBookRecommendations(file);
      if (result.success && result.data) {
        setRecommendations(result.data);
      } else {
        setError(result.error || "An unknown error occurred.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze the bookshelf.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setRecommendations(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-16 selection:bg-ink/10 selection:text-ink max-w-3xl mx-auto">
      <header className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-6xl font-serif text-ink tracking-tight">
            Shelf Expander
          </h1>
          <div className="text-lg md:text-xl opacity-70 font-serif space-y-2 text-ink">
            <p>Upload a picture of your bookshelf and receive curated literary recommendations.</p>
            <p>Expand your horizons, discover lost classics, and explore contrarian viewpoints.</p>
          </div>
        </motion.div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {!preview && !recommendations && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              <div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-4 border border-ink/20 text-sm font-sans tracking-widest uppercase hover:bg-ink/5 transition-colors text-ink"
                >
                  Upload Photograph
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>

              <div className="bg-surface p-6 md:p-8 border border-ink/10 space-y-6">
                <img 
                  src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop" 
                  alt="Example of a good shelfie" 
                  className="w-full h-auto grayscale opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="text-sm opacity-70 font-sans space-y-1 text-ink">
                  <p>Ensure spines are clearly visible.</p>
                  <p>A single well-lit shelf is sufficient for analysis.</p>
                </div>
              </div>
            </motion.div>
          )}

          {preview && !recommendations && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <img src={preview} alt="Bookshelf preview" className="w-full h-auto" />
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-ink text-paper px-6 py-4 text-sm font-sans tracking-widest uppercase hover:bg-ink/90 transition-colors text-center disabled:opacity-50"
                >
                  {loading ? 'Consulting...' : 'Catalogue Collection'}
                </button>
                <button 
                  onClick={reset}
                  disabled={loading}
                  className="px-8 py-4 border border-ink/20 text-sm font-sans tracking-widest uppercase hover:bg-ink/5 transition-colors text-ink disabled:opacity-50"
                >
                  Discard
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-900 text-sm border border-red-100">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {recommendations && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-16"
            >
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-serif text-ink">The Expansion</h2>
                <hr className="border-ink/20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                <CategorySection 
                  title="I. The Latent Space" 
                  description="Between the lines of your library."
                  books={recommendations.latentSpace} 
                />
                
                <CategorySection 
                  title="II. Acid Mode" 
                  description="Hallucinatory thematic extrapolations."
                  books={recommendations.yourBooksOnAcid} 
                />
                
                <CategorySection 
                  title="III. Contrarian Views" 
                  description="Opposing perspectives to challenge your assumptions."
                  books={recommendations.differentViewpoints} 
                />
                
                <CategorySection 
                  title="IV. Forgotten Classics" 
                  description="Lost works that resonate with your collection."
                  books={recommendations.forgottenClassics} 
                />
              </div>

              <div className="pt-12 border-t border-ink/20">
                <button 
                  onClick={reset}
                  className="px-6 py-4 border border-ink/20 text-sm font-sans tracking-widest uppercase hover:bg-ink/5 transition-colors text-ink"
                >
                  Start Anew
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function CategorySection({ title, description, books }: { title: string, description: string, books: { title: string, author: string }[] }) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-2xl font-serif text-ink">{title}</h3>
        <p className="text-sm opacity-60 font-serif italic text-ink">{description}</p>
        <hr className="border-ink/20 mt-4" />
      </div>
      <ul className="space-y-8">
        {books.map((book, idx) => (
          <motion.li 
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="space-y-1.5"
          >
            <h4 className="text-lg font-serif italic text-ink leading-snug">{book.title}</h4>
            <p className="text-xs font-sans uppercase tracking-widest opacity-50 text-ink">By {book.author}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
