import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';

const Home = () => {
  // Scroll Hooks for Parallax
  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroMockupY = useTransform(scrollY, [0, 500], [0, -50]);
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 300]);

  // Entrance Animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  // Pure Engineering Scenarios (No AI focus in the terminal)
  const scenarios = [
    {
      content: "Pushing a major update to the AegisGRID anomaly detector. SCADA data parsing is now 40% faster on the live dashboard. Next up: integrating the PMU simulation engine.\n\n#CyberSecurity #Python #GridTech",
    },
    {
      content: "Finished wrapping the TerraForge physics engine. The high-resolution 3D planet simulation now handles custom geopolitical JSON boundaries at a stable 60FPS in-browser.\n\n#ThreeJS #WebGL #Simulation",
    },
    {
      content: "Just released Bash & Bet v1.0! A complete command-line casino terminal with progressive game states and ASCII lighting effects. Built entirely in shell.\n\n#Dev #CLI #RetroGaming",
    }
  ];

  const [typedDraft, setTypedDraft] = useState('');
  const [deploymentPhase, setDeploymentPhase] = useState('typing'); // typing | deploying | success
  
  // Async Typing & Deployment Loop
  useEffect(() => {
    let isMounted = true;
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const runSequence = async () => {
      while (isMounted) {
        for (const scenario of scenarios) {
          if (!isMounted) break;
          
          setTypedDraft('');
          setDeploymentPhase('typing');
          
          // 1. Type the draft
          let currentText = '';
          for (let i = 0; i < scenario.content.length; i++) {
            if (!isMounted) break;
            currentText += scenario.content[i];
            setTypedDraft(currentText);
            await sleep(25); 
          }
          
          await sleep(600); // Brief pause before hitting publish
          if (!isMounted) break;
          
          // 2. Deployment Phase (Handshakes)
          setDeploymentPhase('deploying');
          await sleep(1500); // Simulate API latency
          
          if (!isMounted) break;
          
          // 3. Success Phase
          setDeploymentPhase('success');
          await sleep(4000); // Hold for reading
        }
      }
    };

    runSequence();

    return () => { isMounted = false; };
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
          <a href="#advantage" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:block">The Advantage</a>
          <Link to="/login" className="text-sm font-semibold text-zinc-900 bg-zinc-100 hover:bg-white px-5 py-2 rounded-md transition-all shadow-sm">
            Start Publishing Free
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 pt-32 pb-20 max-w-7xl mx-auto w-full min-h-[90vh] relative">
        <motion.div style={{ y: backgroundY }} className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></motion.div>
        <motion.div style={{ y: backgroundY }} className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></motion.div>

        {/* Left Column: Product Copy (Parallax Down) */}
        <motion.div 
          style={{ y: heroTextY }}
          variants={staggerContainer} 
          initial="hidden" 
          animate="visible" 
          className="lg:w-1/2 z-10 text-left pt-10 lg:pt-0"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Postifye Composer v2.0 is Live
          </motion.div>
          
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
            One workspace. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Every network.
            </span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-lg text-zinc-400 mb-10 max-w-lg leading-relaxed">
            The unified command center for modern creators. Write your content once, and publish your posts to Twitter and LinkedIn simultaneously from one secure dashboard.
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

        {/* Right Column: API Deployment Mockup (Parallax Up) */}
        <motion.div 
          style={{ y: heroMockupY }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="lg:w-1/2 w-full mt-16 lg:mt-0 z-10"
        >
          <div className="rounded-xl bg-[#0a0a0a] border border-zinc-800 shadow-2xl shadow-indigo-900/20 overflow-hidden text-sm">
            
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-zinc-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
              </div>
              <span className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">/api/posts/create</span>
            </div>
            
            {/* Terminal Body */}
            <div className="p-6 text-zinc-300 h-[320px] flex flex-col font-mono">
              <div className="text-indigo-400 mb-4 text-xs font-semibold tracking-wider">RAW DRAFT</div>
              
              {/* Draft Box */}
              <div className="bg-[#151515] border border-zinc-800/80 p-4 rounded-lg text-zinc-200 whitespace-pre-wrap leading-relaxed h-[160px] overflow-hidden relative">
                {typedDraft}
                {deploymentPhase === 'typing' && (
                  <motion.span 
                    animate={{ opacity: [1, 0] }} 
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-zinc-400 ml-1 align-middle"
                  />
                )}
                
                {/* Deployment Overlay */}
                {deploymentPhase === 'deploying' && (
                  <div className="absolute inset-0 bg-[#151515]/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 text-indigo-400 text-xs">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Executing OAuth 2.0 Handshakes...
                    </div>
                  </div>
                )}
              </div>

              {/* Status / Success Flags */}
              <div className="mt-auto h-[60px] flex flex-col justify-end">
                {deploymentPhase === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-2 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      [201] Post successfully published to Twitter API v2
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      [201] Post successfully published to LinkedIn UGC API
                    </div>
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-[#080808] border-y border-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.3 }} variants={staggerContainer} 
            className="mb-16 md:mb-24 text-center"
          >
            <motion.h3 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Focus on content. We handle the rest.</motion.h3>
            <motion.p variants={fadeInUp} className="text-zinc-500 max-w-2xl mx-auto text-lg">Postifye removes the friction between your ideas and your audience. Stop jumping between tabs and fighting algorithms.</motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={slideInLeft} className="p-8 rounded-2xl bg-[#0d0d0d] border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-zinc-100 mb-3">AI Content Generation</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Never stare at a blank screen again. Enter a basic idea, and our integrated Gemini 3.5 engine will draft, optimize, and format your post for maximum reach in seconds.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={fadeInUp} className="p-8 rounded-2xl bg-[#0d0d0d] border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20 text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-zinc-100 mb-3">Publish Everywhere</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Write your draft once and hit publish. Our backend automatically formats and deploys your content directly to your Twitter and LinkedIn feeds simultaneously.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={slideInRight} className="p-8 rounded-2xl bg-[#0d0d0d] border border-zinc-800 hover:border-zinc-700 transition-colors md:col-span-2 lg:col-span-1">
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

      {/* NEW: The Advantage (Problem vs Solution) */}
      <section id="advantage" className="py-24 px-6 lg:px-12 bg-[#030303] overflow-hidden border-b border-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h3 
              variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: false }} 
              className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4"
            >
              Eliminate the friction.
            </motion.h3>
            <motion.p 
              variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: false }} 
              className="text-zinc-500 max-w-2xl mx-auto text-lg"
            >
              Why open three different apps to do one job? See how Postifye fundamentally shifts your workflow.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* The Old Way */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.6 }}
              className="bg-[#0a0a0a] border border-zinc-800/60 p-8 md:p-10 rounded-3xl opacity-80"
            >
              <h4 className="text-lg font-mono text-red-400/80 mb-8 border-b border-zinc-800/60 pb-4">✕ THE OLD WAY</h4>
              <ul className="space-y-6">
                {[
                  "Drafting posts in Notes or by Hand.",
                  "Staring at a blank screen with writer's block.",
                  "Manually copying and pasting across different tabs.",
                  "Losing track of past posts and engagement data.",
                  "Risking security by saving passwords in browsers."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-zinc-500">
                    <svg className="w-5 h-5 text-red-500/50 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* The Postifye Way */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-[#121212] to-[#0a0a0a] border border-indigo-500/30 p-8 md:p-10 rounded-3xl shadow-xl shadow-indigo-900/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
              
              <h4 className="text-lg font-mono text-indigo-400 mb-8 border-b border-indigo-500/20 pb-4">✓ THE POSTIFYE WAY</h4>
              <ul className="space-y-6 relative z-10">
                {[
                  "One unified, distraction-free platform.",
                  "LLM instantly optimizes your raw thoughts.",
                  "Deploy to Twitter, Instagram and LinkedIn with a single click.",
                  "Immutable post history securely logged in MongoDB.",
                  "Stateless Authentication—we never see your passwords."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-zinc-300">
                    <svg className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA (Scroll Scaling) */}
      <section className="py-24 px-6 lg:px-12 bg-[#080808] border-t border-zinc-900 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="max-w-4xl w-full bg-[#0d0d0d] border border-zinc-800 rounded-3xl p-12 text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">Scale your social presence today.</h3>
          <p className="text-zinc-400 mb-10 max-w-lg mx-auto relative z-10 text-sm md:text-base">Join the modern creators and teams automating their cross-platform workflows with Postifye.</p>
          <Link to="/login" className="inline-block bg-white text-zinc-900 font-bold text-base px-10 py-4 rounded-xl transition-transform hover:scale-105 shadow-xl relative z-10">
            Create Your Free Account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-zinc-900 bg-[#030303]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <img src="/postifye.svg" alt="Postifye Logo" className="w-6 h-6 opacity-80" />
            <span className="text-zinc-500 text-sm font-medium">© {new Date().getFullYear()} Postifye Inc. Built by Aditya Bhalla Corp.</span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium">
            <Link to="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <a href="mailto:support@aditya.toolchain.com" className="text-zinc-500 hover:text-zinc-300 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;