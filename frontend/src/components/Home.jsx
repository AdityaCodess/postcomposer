import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const Home = () => {
  // --- Animations ---
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  // Simulated AI Typing Effect (Selling the Product Value)
  const promptString = "> Generating platform-optimized copy...\n\n";
  const postString = "🚀 Just streamlined my entire content workflow!\n\nStop switching tabs and start scaling your audience. Write once, enhance with AI, and publish to Twitter & LinkedIn instantly.\n\n#Productivity #BuildInPublic #SaaS";
  
  const [typedPrompt, setTypedPrompt] = useState('');
  const [typedPost, setTypedPost] = useState('');
  
  useEffect(() => {
    let pIndex = 0;
    const promptInterval = setInterval(() => {
      if (pIndex < promptString.length) {
        setTypedPrompt(prev => prev + promptString.charAt(pIndex));
        pIndex++;
      } else {
        clearInterval(promptInterval);
        
        // Start typing the generated post
        let cIndex = 0;
        const postInterval = setInterval(() => {
          if (cIndex < postString.length) {
            setTypedPost(prev => prev + postString.charAt(cIndex));
            cIndex++;
          } else {
            clearInterval(postInterval);
          }
        }, 20);
      }
    }, 30);
    
    return () => clearInterval(promptInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-indigo-500/30 selection:text-white flex flex-col overflow-x-hidden">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-[#030303]/80 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between px-6 lg:px-12 h-16"
      >
        <div className="flex items-center gap-3">
          <img src="/postifye.svg" alt="Postifye Logo" className="w-6 h-auto" />
          <h1 className="text-lg font-bold text-zinc-100 tracking-wider uppercase">Postifye</h1>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:block">Features</a>
          <a href="#security" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:block">Security</a>
          <Link to="/login" className="text-sm font-semibold text-zinc-900 bg-zinc-100 hover:bg-white px-5 py-2 rounded-md transition-all shadow-sm">
            Start Publishing Free
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 pt-32 pb-20 max-w-7xl mx-auto w-full min-h-[90vh] relative">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Left Column: Product Copy */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:w-1/2 z-10 text-left pt-10 lg:pt-0">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Postifye - automates your social media workflow
          </motion.div>
          
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
            One workspace. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Every network.
            </span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-lg text-zinc-400 mb-10 max-w-lg leading-relaxed">
            The unified command center for modern creators. Overcome writer's block with our AI generation engine, and publish to Twitter and LinkedIn simultaneously from one secure dashboard.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
            <Link to="/login" className="bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-sm px-6 py-3.5 rounded-md transition-all flex items-center justify-center gap-2">
              Launch Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
            <a href="#features" className="bg-transparent border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-bold text-sm px-6 py-3.5 rounded-md transition-all flex items-center justify-center gap-2">
              See How It Works
            </a>
          </motion.div>
        </motion.div>

        {/* Right Column: AI App Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="lg:w-1/2 w-full mt-16 lg:mt-0 z-10"
        >
          <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800 shadow-2xl shadow-indigo-900/20 overflow-hidden text-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-zinc-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 cursor-pointer"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer"></div>
              </div>
              <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">Composer Preview</span>
            </div>
            <div className="p-6 text-zinc-300 h-[280px] flex flex-col">
              <div className="text-zinc-500 font-mono mb-4 whitespace-pre-wrap">{typedPrompt}</div>
              <div className="bg-[#151515] border border-zinc-800/80 p-4 rounded-lg flex-1 text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {typedPost}
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 align-middle"
                />
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={typedPost.length === postString.length ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
                className="mt-6 flex items-center justify-between"
              >
                <div className="flex gap-3">
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-semibold">Twitter</div>
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded text-xs font-semibold">LinkedIn</div>
                </div>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded text-xs font-bold hover:bg-indigo-500 transition-colors">Publish All</button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Benefits Section (Selling the Solution) */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-[#080808] border-y border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} 
            className="mb-16 md:mb-24 text-center"
          >
            <motion.h3 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Focus on content. We handle the rest.</motion.h3>
            <motion.p variants={fadeInUp} className="text-zinc-500 max-w-2xl mx-auto text-lg">Postifye removes the friction between your ideas and your audience. Stop jumping between tabs and fighting algorithms.</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-2xl bg-[#0d0d0d] border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-zinc-100 mb-3">AI Content Generation</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Never stare at a blank screen again. Enter a basic idea, and our integrated Gemini 3.5 engine will draft, optimize, and format your post for maximum reach in seconds.
              </p>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-8 rounded-2xl bg-[#0d0d0d] border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20 text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-zinc-100 mb-3">Publish Everywhere</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Write your draft once and hit publish. Our backend automatically formats and deploys your content directly to your Twitter and LinkedIn feeds simultaneously.
              </p>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="p-8 rounded-2xl bg-[#0d0d0d] border border-zinc-800 hover:border-zinc-700 transition-colors md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-zinc-100 mb-3">Zero-Password Security</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Your credentials are yours alone. Postifye connects to your networks using bank-grade OAuth 2.0 PKCE authentication. We never ask for, or store, your social media passwords.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust / Infrastructure Banner */}
      <section id="security" className="py-20 px-6 bg-[#030303] overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-10">Powered by Enterprise Infrastructure</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['React', 'Node.js', 'MongoDB Cloud', 'Twitter API v2', 'LinkedIn Developer', 'Google Gemini AI'].map((tech, i) => (
              <div key={i} className="text-lg md:text-xl font-bold text-zinc-300">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-12 bg-[#080808] border-t border-zinc-900">
        <div className="max-w-4xl mx-auto bg-[#0d0d0d] border border-zinc-800 rounded-3xl p-12 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">Scale your social presence today.</h3>
          <p className="text-zinc-400 mb-10 max-w-lg mx-auto relative z-10 text-sm md:text-base">Join the modern creators and teams automating their cross-platform workflows with Postifye.</p>
          <Link to="/login" className="inline-block bg-white text-zinc-900 font-bold text-base px-10 py-4 rounded-xl transition-transform hover:scale-105 shadow-xl relative z-10">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-zinc-900 bg-[#030303]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <img src="/postifye.svg" alt="Postifye Logo" className="w-6 h-6 opacity-80" />
            <span className="text-zinc-500 text-sm font-medium">© {new Date().getFullYear()} Postifye Inc. Built by Aditya.</span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium">
            <Link to="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <a href="mailto:support@postifye.com" className="text-zinc-500 hover:text-zinc-300 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;